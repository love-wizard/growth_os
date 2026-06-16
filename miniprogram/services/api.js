/* global wx */
const apiBaseUrl = "https://growth.familylove.space";
const sessionStorageKey = "growth_os_session";
const activeChildStorageKey = "growth_os_active_child_id";
const defaultRequestTimeoutMs = 10000;

function getAuthHeader() {
  const session = wx.getStorageSync(sessionStorageKey);

  if (!session || !session.accessToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${session.accessToken}`
  };
}

function getPathname(path) {
  return path.split("?")[0];
}

function hasQueryParam(path, key, value) {
  const query = path.split("?")[1];
  if (!query) {
    return false;
  }

  return query.split("&").some((part) => {
    const [rawKey, rawValue = ""] = part.split("=");
    if (decodeURIComponent(rawKey) !== key) {
      return false;
    }

    return value === undefined || decodeURIComponent(rawValue) === value;
  });
}

function shouldAppendActiveChild(path) {
  const pathname = getPathname(path);
  if (hasQueryParam(path, "scope", "family")) {
    return false;
  }

  return (
    pathname === "/api/dashboard" ||
    pathname === "/api/weekly-plan/current" ||
    pathname === "/api/growth-records" ||
    pathname === "/api/growth-reports" ||
    pathname === "/api/growth-reports/monthly" ||
    pathname === "/api/interest-participation-records" ||
    pathname === "/api/ai/coach"
  );
}

function appendActiveChildId(path) {
  if (!shouldAppendActiveChild(path) || path.includes("childId=")) {
    return path;
  }

  const childId = getActiveChildId();
  if (!childId) {
    return path;
  }

  return `${path}${path.includes("?") ? "&" : "?"}childId=${encodeURIComponent(childId)}`;
}

function parseUploadResponse(response) {
  let data = response.data;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = { error: "Upload failed" };
    }
  }

  return data;
}

function refreshMiniProgramSession() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(loginResponse) {
        if (!loginResponse.code) {
          reject(new Error("WeChat login code is missing"));
          return;
        }

        wx.request({
          url: `${apiBaseUrl}/api/wechat/login`,
          method: "POST",
          data: { code: loginResponse.code },
          timeout: 10000,
          header: {
            "content-type": "application/json"
          },
          success(response) {
            const data = response.data || {};
            if (response.statusCode && response.statusCode >= 400) {
              reject(new Error(data.error || "Unable to refresh session"));
              return;
            }

            if (data.accessToken) {
              setSession({ accessToken: data.accessToken });
            }

            resolve(data);
          },
          fail: reject
        });
      },
      fail: reject
    });
  });
}

function shouldRetryAuth(response) {
  const errorMessage =
    response &&
    response.data &&
    response.data.error
      ? String(response.data.error).toLowerCase()
      : "";

  return (
    response &&
    response.statusCode === 401 &&
    (errorMessage.includes("authentication is required") ||
      errorMessage.includes("invalid jwt") ||
      errorMessage.includes("token is expired"))
  );
}

function requestJson(method, path, data, options) {
  const retryOnAuth = !options || options.retryOnAuth !== false;
  const requestPath = appendActiveChildId(path);
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${apiBaseUrl}${requestPath}`,
      method,
      data,
      timeout: (options && options.timeoutMs) || defaultRequestTimeoutMs,
      header: {
        "content-type": "application/json",
        ...getAuthHeader()
      },
      success(response) {
        if (shouldRetryAuth(response) && retryOnAuth) {
          refreshMiniProgramSession()
            .then(() =>
              requestJson(method, path, data, {
                retryOnAuth: false,
                timeoutMs: options && options.timeoutMs
              })
            )
            .then(resolve)
            .catch(() => {
              clearSession();
              reject({
                statusCode: response.statusCode,
                data: response.data,
                error:
                  response.data && response.data.error
                    ? response.data.error
                    : "Authentication is required"
              });
            });
          return;
        }

        if (response.statusCode && response.statusCode >= 400) {
          reject({
            statusCode: response.statusCode,
            data: response.data,
            error: response.data && response.data.error ? response.data.error : "Request failed"
          });
          return;
        }
        resolve(response.data);
      },
      fail: reject
    });
  });
}

function postJson(path, data) {
  return requestJson("POST", path, data);
}

function postJsonWithOptions(path, data, options) {
  return requestJson("POST", path, data, options);
}

function patchJson(path, data) {
  return requestJson("PATCH", path, data);
}

function deleteJson(path) {
  return requestJson("DELETE", path);
}

function getJson(path) {
  return requestJson("GET", path);
}

function uploadFile(path, filePath, name, formData) {
  const requestPath = appendActiveChildId(path);
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${apiBaseUrl}${requestPath}`,
      filePath,
      name: name || "file",
      formData,
      timeout: 20000,
      header: getAuthHeader(),
      success(response) {
        const data = parseUploadResponse(response);
        if (response.statusCode && response.statusCode >= 400) {
          reject({
            statusCode: response.statusCode,
            data,
            error: data && data.error ? data.error : "Upload failed"
          });
          return;
        }
        resolve(data);
      },
      fail: reject
    });
  });
}

function getSession() {
  return wx.getStorageSync(sessionStorageKey);
}

function getActiveChildId() {
  return wx.getStorageSync(activeChildStorageKey);
}

function setActiveChildId(childId) {
  wx.setStorageSync(activeChildStorageKey, childId);
}

function clearActiveChildId() {
  wx.removeStorageSync(activeChildStorageKey);
}

function setSession(session) {
  wx.setStorageSync(sessionStorageKey, session);
}

function clearSession() {
  wx.removeStorageSync(sessionStorageKey);
}

function isTimeoutRequestError(error) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errMsg =
    typeof error.errMsg === "string"
      ? error.errMsg
      : typeof error.error === "string"
        ? error.error
        : "";

  return errMsg.toLowerCase().includes("timeout");
}

module.exports = {
  clearActiveChildId,
  clearSession,
  deleteJson,
  getActiveChildId,
  getJson,
  getSession,
  isTimeoutRequestError,
  patchJson,
  postJson,
  postJsonWithOptions,
  setActiveChildId,
  setSession,
  uploadFile
};

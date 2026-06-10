/* global wx */
const apiBaseUrl = "https://growth.familylove.space";
const sessionStorageKey = "growth_os_session";
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
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${apiBaseUrl}${path}`,
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

function getJson(path) {
  return requestJson("GET", path);
}

function uploadFile(path, filePath, name, formData) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${apiBaseUrl}${path}`,
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
  clearSession,
  getJson,
  getSession,
  isTimeoutRequestError,
  patchJson,
  postJson,
  postJsonWithOptions,
  setSession,
  uploadFile
};

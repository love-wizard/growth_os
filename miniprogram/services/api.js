/* global wx */
const apiBaseUrl = "https://growth.familylove.space";
const sessionStorageKey = "growth_os_session";

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

function requestJson(method, path, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${apiBaseUrl}${path}`,
      method,
      data,
      timeout: 10000,
      header: {
        "content-type": "application/json",
        ...getAuthHeader()
      },
      success(response) {
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

module.exports = {
  clearSession,
  getJson,
  getSession,
  patchJson,
  postJson,
  setSession,
  uploadFile
};

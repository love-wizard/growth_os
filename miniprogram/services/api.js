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
          reject(response.data);
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

function getJson(path) {
  return requestJson("GET", path);
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
  postJson,
  setSession
};

/* global wx */
const { clearSession, getSession, postJson, setSession } = require("./api");

function hasMiniProgramSession() {
  const session = getSession();
  return Boolean(session && session.accessToken);
}

function logoutMiniProgram() {
  clearSession();
}

function loginWithWeChat() {
  return new Promise((resolve, reject) => {
    wx.login({
      success({ code }) {
        if (!code) {
          reject(new Error("WeChat login code is missing"));
          return;
        }

        postJson("/api/wechat/login", { code })
          .then((session) => {
            if (session.accessToken) {
              setSession({ accessToken: session.accessToken });
            }
            resolve(session);
          })
          .catch(() => {
            resolve({ requiresBackend: true });
          });
      },
      fail: reject
    });
  });
}

module.exports = {
  hasMiniProgramSession,
  loginWithWeChat,
  logoutMiniProgram
};

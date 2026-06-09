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
  return new Promise((resolve) => {
    wx.login({
      success({ code }) {
        if (!code) {
          resolve({
            requiresBackend: true,
            errorStage: "wx.login",
            errorMessage: "WeChat login code is missing"
          });
          return;
        }

        postJson("/api/wechat/login", { code })
          .then((session) => {
            if (session.accessToken) {
              setSession({ accessToken: session.accessToken });
            }
            resolve(session);
          })
          .catch((error) => {
            resolve({
              requiresBackend: true,
              errorStage: "api.wechat.login",
              errorMessage: error && error.error ? error.error : "Unable to login with backend"
            });
          });
      },
      fail(error) {
        resolve({
          requiresBackend: true,
          errorStage: "wx.login",
          errorMessage: error && error.errMsg ? error.errMsg : "wx.login failed"
        });
      }
    });
  });
}

module.exports = {
  hasMiniProgramSession,
  loginWithWeChat,
  logoutMiniProgram
};

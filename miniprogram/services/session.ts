import { clearSession, getSession, postJson, setSession } from "./api";

type WeChatLoginResponse = {
  accessToken?: string;
  isNewUser?: boolean;
  requiresBackend?: boolean;
  errorStage?: "wx.login" | "api.wechat.login";
  errorMessage?: string;
};

export function hasMiniProgramSession() {
  return Boolean(getSession()?.accessToken);
}

export function logoutMiniProgram() {
  clearSession();
}

export function loginWithWeChat() {
  return new Promise<WeChatLoginResponse>((resolve) => {
    wx.login({
      success: ({ code }) => {
        if (!code) {
          resolve({
            requiresBackend: true,
            errorStage: "wx.login",
            errorMessage: "WeChat login code is missing"
          });
          return;
        }

        void postJson<WeChatLoginResponse>("/api/wechat/login", { code })
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
              errorMessage:
                error && typeof error === "object" && "error" in error
                  ? String(error.error)
                  : "Unable to login with backend"
            });
          });
      },
      fail: (error) => {
        resolve({
          requiresBackend: true,
          errorStage: "wx.login",
          errorMessage: error.errMsg || "wx.login failed"
        });
      }
    });
  });
}

import { clearSession, getSession, postJson, setSession } from "./api";

type WeChatLoginResponse = {
  accessToken?: string;
  isNewUser?: boolean;
  requiresBackend?: boolean;
};

export function hasMiniProgramSession() {
  return Boolean(getSession()?.accessToken);
}

export function logoutMiniProgram() {
  clearSession();
}

export function loginWithWeChat() {
  return new Promise<WeChatLoginResponse>((resolve, reject) => {
    wx.login({
      success: ({ code }) => {
        if (!code) {
          reject(new Error("WeChat login code is missing"));
          return;
        }

        void postJson<WeChatLoginResponse>("/api/wechat/login", { code })
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

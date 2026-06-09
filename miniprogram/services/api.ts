const apiBaseUrl = "http://growth.familylove.space";
const sessionStorageKey = "growth_os_session";

type GrowthOSSession = {
  accessToken?: string;
};

type RequestResponse = {
  statusCode?: number;
  data?: unknown;
};

function getAuthHeader() {
  const session = wx.getStorageSync(sessionStorageKey) as GrowthOSSession | undefined;

  if (!session?.accessToken) {
    return {} as Record<string, string>;
  }

  return {
    authorization: `Bearer ${session.accessToken}`
  } as Record<string, string>;
}

export function postJson<T = unknown>(path: string, data: unknown) {
  return new Promise<T>((resolve, reject) => {
    wx.request({
      url: `${apiBaseUrl}${path}`,
      method: "POST",
      data,
      header: {
        "content-type": "application/json",
        ...getAuthHeader()
      },
      success: (response: RequestResponse) => {
        if (response.statusCode && response.statusCode >= 400) {
          reject(response.data);
          return;
        }
        resolve(response.data as T);
      },
      fail: reject
    });
  });
}

export function getJson<T = unknown>(path: string) {
  return new Promise<T>((resolve, reject) => {
    wx.request({
      url: `${apiBaseUrl}${path}`,
      method: "GET",
      header: {
        "content-type": "application/json",
        ...getAuthHeader()
      },
      success: (response: RequestResponse) => {
        if (response.statusCode && response.statusCode >= 400) {
          reject(response.data);
          return;
        }
        resolve(response.data as T);
      },
      fail: reject
    });
  });
}

export function getSession() {
  return wx.getStorageSync(sessionStorageKey) as GrowthOSSession | undefined;
}

export function setSession(session: GrowthOSSession) {
  wx.setStorageSync(sessionStorageKey, session);
}

export function clearSession() {
  wx.removeStorageSync(sessionStorageKey);
}

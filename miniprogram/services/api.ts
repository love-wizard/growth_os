const apiBaseUrl = "https://growth.familylove.space";
const sessionStorageKey = "growth_os_session";

type GrowthOSSession = {
  accessToken?: string;
};

type RequestResponse = {
  statusCode?: number;
  data?: unknown;
};

type UploadResponse = {
  statusCode?: number;
  data?: unknown;
};

function getAuthHeader() {
  const session = wx.getStorageSync(sessionStorageKey) as GrowthOSSession | undefined;

  if (!session?.accessToken) {
    return {} as Record<string, string>;
  }

  return {
    Authorization: `Bearer ${session.accessToken}`
  } as Record<string, string>;
}

function requestJson<T = unknown>(method: string, path: string, data?: unknown) {
  return new Promise<T>((resolve, reject) => {
    wx.request({
      url: `${apiBaseUrl}${path}`,
      method,
      data,
      timeout: 10000,
      header: {
        "content-type": "application/json",
        ...getAuthHeader()
      },
      success: (response: RequestResponse) => {
        if (response.statusCode && response.statusCode >= 400) {
          const data = response.data as { error?: string } | undefined;
          reject({
            statusCode: response.statusCode,
            data: response.data,
            error: data?.error ?? "Request failed"
          });
          return;
        }
        resolve(response.data as T);
      },
      fail: reject
    });
  });
}

function parseUploadResponse<T>(response: UploadResponse) {
  if (typeof response.data === "string") {
    try {
      return JSON.parse(response.data) as T;
    } catch {
      return { error: "Upload failed" } as T;
    }
  }

  return response.data as T;
}

export function postJson<T = unknown>(path: string, data: unknown) {
  return requestJson<T>("POST", path, data);
}

export function patchJson<T = unknown>(path: string, data: unknown) {
  return requestJson<T>("PATCH", path, data);
}

export function getJson<T = unknown>(path: string) {
  return requestJson<T>("GET", path);
}

export function uploadFile<T = unknown>(
  path: string,
  filePath: string,
  name = "file",
  formData?: Record<string, string>
) {
  return new Promise<T>((resolve, reject) => {
    wx.uploadFile({
      url: `${apiBaseUrl}${path}`,
      filePath,
      name,
      formData,
      timeout: 20000,
      header: getAuthHeader(),
      success: (response: UploadResponse) => {
        const data = parseUploadResponse<T & { error?: string }>(response);
        if (response.statusCode && response.statusCode >= 400) {
          reject({
            statusCode: response.statusCode,
            data,
            error:
              typeof data === "object" && data && "error" in data
                ? data.error
                : "Upload failed"
          });
          return;
        }

        resolve(data as T);
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

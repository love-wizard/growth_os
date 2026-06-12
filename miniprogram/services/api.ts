const apiBaseUrl = "https://growth.familylove.space";
const sessionStorageKey = "growth_os_session";
const activeChildStorageKey = "growth_os_active_child_id";

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

type RequestOptions = {
  retryOnAuth?: boolean;
  timeoutMs?: number;
};

const defaultRequestTimeoutMs = 10000;

function getAuthHeader() {
  const session = wx.getStorageSync(sessionStorageKey) as GrowthOSSession | undefined;

  if (!session?.accessToken) {
    return {} as Record<string, string>;
  }

  return {
    Authorization: `Bearer ${session.accessToken}`
  } as Record<string, string>;
}

function getPathname(path: string) {
  return path.split("?")[0];
}

function hasQueryParam(path: string, key: string, value?: string) {
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

function shouldAppendActiveChild(path: string) {
  const pathname = getPathname(path);
  if (hasQueryParam(path, "scope", "family")) {
    return false;
  }

  return (
    pathname === "/api/dashboard" ||
    pathname === "/api/weekly-plan/current" ||
    pathname === "/api/growth-records" ||
    pathname === "/api/interest-participation-records" ||
    pathname === "/api/ai/coach"
  );
}

function appendActiveChildId(path: string) {
  if (!shouldAppendActiveChild(path) || path.includes("childId=")) {
    return path;
  }

  const childId = getActiveChildId();
  if (!childId) {
    return path;
  }

  return `${path}${path.includes("?") ? "&" : "?"}childId=${encodeURIComponent(childId)}`;
}

function refreshMiniProgramSession() {
  return new Promise<{ accessToken?: string }>((resolve, reject) => {
    wx.login({
      success: ({ code }) => {
        if (!code) {
          reject(new Error("WeChat login code is missing"));
          return;
        }

        wx.request({
          url: `${apiBaseUrl}/api/wechat/login`,
          method: "POST",
          data: { code },
          timeout: 10000,
          header: {
            "content-type": "application/json"
          },
          success: (response: RequestResponse) => {
            const data = (response.data as { accessToken?: string; error?: string } | undefined) ?? {};
            if (response.statusCode && response.statusCode >= 400) {
              reject(new Error(data.error ?? "Unable to refresh session"));
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

function shouldRetryAuth(response: RequestResponse) {
  const data = response.data as { error?: string } | undefined;
  const errorMessage = (data?.error ?? "").toLowerCase();

  return (
    response.statusCode === 401 &&
    (errorMessage.includes("authentication is required") ||
      errorMessage.includes("invalid jwt") ||
      errorMessage.includes("token is expired"))
  );
}

function requestJson<T = unknown>(
  method: string,
  path: string,
  data?: unknown,
  options?: RequestOptions
) {
  const requestPath = appendActiveChildId(path);
  return new Promise<T>((resolve, reject) => {
    wx.request({
      url: `${apiBaseUrl}${requestPath}`,
      method,
      data,
      timeout: options?.timeoutMs ?? defaultRequestTimeoutMs,
      header: {
        "content-type": "application/json",
        ...getAuthHeader()
      },
      success: (response: RequestResponse) => {
        if (shouldRetryAuth(response) && options?.retryOnAuth !== false) {
          void refreshMiniProgramSession()
            .then(() =>
              requestJson<T>(method, path, data, {
                retryOnAuth: false,
                timeoutMs: options?.timeoutMs
              })
            )
            .then(resolve)
            .catch(() => {
              const data = response.data as { error?: string } | undefined;
              reject({
                statusCode: response.statusCode,
                data: response.data,
                error: data?.error ?? "Authentication is required"
              });
            });
          return;
        }

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

export function postJsonWithOptions<T = unknown>(
  path: string,
  data: unknown,
  options?: RequestOptions
) {
  return requestJson<T>("POST", path, data, options);
}

export function patchJson<T = unknown>(path: string, data: unknown) {
  return requestJson<T>("PATCH", path, data);
}

export function deleteJson<T = unknown>(path: string) {
  return requestJson<T>("DELETE", path);
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
  const requestPath = appendActiveChildId(path);
  return new Promise<T>((resolve, reject) => {
    wx.uploadFile({
      url: `${apiBaseUrl}${requestPath}`,
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

export function getActiveChildId() {
  return wx.getStorageSync(activeChildStorageKey) as string | undefined;
}

export function setActiveChildId(childId: string) {
  wx.setStorageSync(activeChildStorageKey, childId);
}

export function clearActiveChildId() {
  wx.removeStorageSync(activeChildStorageKey);
}

export function setSession(session: GrowthOSSession) {
  wx.setStorageSync(sessionStorageKey, session);
}

export function clearSession() {
  wx.removeStorageSync(sessionStorageKey);
}

export function isTimeoutRequestError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errMsg =
    "errMsg" in error && typeof error.errMsg === "string"
      ? error.errMsg
      : "error" in error && typeof error.error === "string"
        ? error.error
        : "";

  return errMsg.toLowerCase().includes("timeout");
}

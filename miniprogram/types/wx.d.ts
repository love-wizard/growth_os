declare const wx: {
  login(options: {
    success?: (response: { code?: string; errMsg?: string }) => void;
    fail?: (error: { errMsg?: string }) => void;
  }): void;
  request(options: {
    url: string;
    method?: string;
    data?: unknown;
    timeout?: number;
    header?: Record<string, string>;
    success?: (response: { statusCode?: number; data?: unknown }) => void;
    fail?: (error: unknown) => void;
  }): void;
  uploadFile(options: {
    url: string;
    filePath: string;
    name: string;
    formData?: Record<string, string>;
    timeout?: number;
    header?: Record<string, string>;
    success?: (response: { statusCode?: number; data?: unknown }) => void;
    fail?: (error: unknown) => void;
  }): void;
  chooseImage(options: {
    count?: number;
    sizeType?: Array<"original" | "compressed">;
    sourceType?: Array<"album" | "camera">;
    success?: (response: {
      tempFilePaths: string[];
      tempFiles?: Array<{ path: string; size: number }>;
    }) => void;
    fail?: (error: { errMsg?: string }) => void;
  }): void;
  previewImage(options: {
    current?: string;
    urls: string[];
  }): void;
  switchTab(options: { url: string }): void;
  navigateTo(options: { url: string }): void;
  showToast(options: { title: string; icon?: "success" | "error" | "loading" | "none" }): void;
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, data: unknown): void;
  removeStorageSync(key: string): void;
};

declare function App(options: any): void;
declare function Page(options: any): void;

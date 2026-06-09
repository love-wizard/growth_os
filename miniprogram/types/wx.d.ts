declare const wx: {
  login(options: {
    success?: (response: { code?: string; errMsg?: string }) => void;
    fail?: (error: unknown) => void;
  }): void;
  request(options: {
    url: string;
    method?: string;
    data?: unknown;
    header?: Record<string, string>;
    success?: (response: { statusCode?: number; data?: unknown }) => void;
    fail?: (error: unknown) => void;
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

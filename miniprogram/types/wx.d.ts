declare const wx: {
  request(options: {
    url: string;
    method?: string;
    data?: unknown;
    header?: Record<string, string>;
    success?: (response: unknown) => void;
    fail?: (error: unknown) => void;
  }): void;
  switchTab(options: { url: string }): void;
  navigateTo(options: { url: string }): void;
  showToast(options: { title: string; icon?: "success" | "error" | "loading" | "none" }): void;
};

declare function App(options: any): void;
declare function Page(options: any): void;

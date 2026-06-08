declare const wx: {
  request(options: {
    url: string;
    method?: string;
    data?: unknown;
    header?: Record<string, string>;
    success?: (response: unknown) => void;
    fail?: (error: unknown) => void;
  }): void;
};

declare function App(options: any): void;
declare function Page(options: any): void;

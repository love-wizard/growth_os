import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/setup.ts"],
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      "tests/integration/**/*.test.ts",
      "tests/integration/**/*.test.tsx"
    ]
  },
  resolve: {
    alias: {
      "server-only": new URL("tests/server-only-stub.ts", import.meta.url).pathname,
      "@": new URL(".", import.meta.url).pathname
    }
  }
});

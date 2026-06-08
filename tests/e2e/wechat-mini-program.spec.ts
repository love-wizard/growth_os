import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";

test("WeChat Mini Program fixtures exist for selected private beta flows", async () => {
  const root = process.cwd();

  expect(existsSync(join(root, "miniprogram/app.json"))).toBe(true);
  expect(existsSync(join(root, "miniprogram/pages/first-guidance/index.wxml"))).toBe(true);
  expect(existsSync(join(root, "miniprogram/pages/invite/index.wxml"))).toBe(true);
  expect(existsSync(join(root, "miniprogram/pages/record-preview/index.wxml"))).toBe(true);
});

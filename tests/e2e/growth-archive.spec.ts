import { expect, test } from "@playwright/test";

test("growth archive shows record form, draft, timeline, month and year views", async ({ page }) => {
  await page.goto("/archive");

  await expect(page.getByRole("heading", { name: "成长时间轴" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "新增成长记录" })).toBeVisible();
  await expect(page.getByRole("button", { name: /保存成长记录/ })).toBeVisible();
  await expect(page.getByText("完成了一项本周成长任务")).toBeVisible();
  await expect(page.getByText("第一次游过25米。")).toBeVisible();
  await expect(page.getByText("2026 年 6 月")).toBeVisible();
  await expect(page.getByText("2026 成长记录")).toBeVisible();
});

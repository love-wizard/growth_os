import { expect, test } from "@playwright/test";

test("first guidance page renders the minimum context form", async ({ page }) => {
  await page.goto("/onboarding");

  await expect(page.getByRole("heading", { name: "先得到今晚能做的一件事" })).toBeVisible();
  await expect(page.getByLabel("孩子昵称")).toBeVisible();
  await expect(page.getByLabel("出生日期")).toBeVisible();
  await expect(page.getByRole("button", { name: "生成今日建议" })).toBeVisible();
});

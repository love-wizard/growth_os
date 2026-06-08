import { expect, test } from "@playwright/test";

test("profile page shows interest participation form and recent history", async ({ page }) => {
  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "家庭设置" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "兴趣参与记录" })).toBeVisible();
  await expect(page.getByRole("button", { name: /保存记录/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "近期兴趣记录" })).toBeVisible();
  await expect(page.getByText("第一次主动练习")).toBeVisible();
});

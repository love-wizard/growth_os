import { expect, test } from "@playwright/test";

test("onboarding page includes full setup and invite forms", async ({ page }) => {
  await page.goto("/onboarding");

  await expect(page.getByRole("heading", { name: "完整孩子档案" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "邀请另一位家长" })).toBeVisible();
});

test("invite page includes accept invitation panel", async ({ page }) => {
  await page.goto("/invite?inviteId=00000000-0000-0000-0000-000000000001");

  await expect(page.getByRole("heading", { name: "加入同一个家庭空间" })).toBeVisible();
  await expect(page.getByLabel("邀请 ID")).toHaveValue(
    "00000000-0000-0000-0000-000000000001"
  );
});

import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("primary app tabs fit mobile viewport with accessible headings", async ({ page }) => {
  for (const path of ["/dashboard", "/weekly-plan", "/archive", "/ai-coach", "/profile"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  }
});

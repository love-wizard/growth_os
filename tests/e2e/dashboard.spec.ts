import { expect, test } from "@playwright/test";

test("dashboard makes today's guidance the primary section", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "今天如何陪伴孩子成长？" })).toBeVisible();
  await expect(page.getByText("今天最重要的一件事")).toBeVisible();
  await expect(page.getByRole("link", { name: /问 AI 成长教练/ })).toBeVisible();
});

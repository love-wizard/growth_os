import { expect, test } from "@playwright/test";
import { signInE2EUser } from "./auth";

test("weekly plan shows role tables and updates visible progress", async ({ page }) => {
  await signInE2EUser(page);
  await page.route("**/api/weekly-plan/tasks/*/progress", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ task: { id: "father-outdoor" } })
    });
  });

  await page.goto("/weekly-plan");

  await expect(page.getByRole("heading", { name: "周计划" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "爸爸任务" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "妈妈任务" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "孩子任务" })).toBeVisible();
  await expect(page.getByText("已完成2次")).toBeVisible();

  await page.getByLabel("增加户外运动完成次数").click();

  await expect(page.getByText("已完成3次")).toBeVisible();
});

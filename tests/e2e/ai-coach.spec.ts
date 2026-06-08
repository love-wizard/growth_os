import { expect, test } from "@playwright/test";
import { signInE2EUser } from "./auth";

test("AI coach page shows quick questions, input, and grounded answer", async ({ page }) => {
  await signInE2EUser(page);
  await page.goto("/ai-coach");

  await expect(page.getByRole("heading", { name: "AI 成长教练" })).toBeVisible();
  await expect(page.getByRole("button", { name: "孩子不想练琴怎么办？" })).toBeVisible();
  await expect(page.getByPlaceholder("请输入育儿问题")).toBeVisible();
  await expect(page.getByText("结合孩子情况")).toBeVisible();
  await expect(page.getByText("专家抽检通过")).toBeVisible();
  await expect(page.getByRole("button", { name: /确认为周计划/ })).toBeVisible();
});

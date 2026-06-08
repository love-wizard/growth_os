import { z } from "zod";
import type { AIContextSnapshot } from "@/lib/ai/context";

const draftTaskSchema = z.object({
  title: z.string().min(1),
  plannedCount: z.number().int().min(0)
});

const taskJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "plannedCount"],
  properties: {
    title: { type: "string" },
    plannedCount: { type: "integer" }
  }
};

export const weeklyPlanDraftResponseSchema = z.object({
  mode: z.literal("weekly_plan_draft"),
  theme: z.string().min(1),
  fatherTasks: z.array(draftTaskSchema),
  motherTasks: z.array(draftTaskSchema),
  childTasks: z.array(draftTaskSchema),
  readingRecommendation: z.string().min(1),
  englishRecommendation: z.string().min(1),
  weekendActivity: z.string().min(1)
});

export type WeeklyPlanDraftResponse = z.infer<
  typeof weeklyPlanDraftResponseSchema
>;

export const weeklyPlanDraftJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "mode",
    "theme",
    "fatherTasks",
    "motherTasks",
    "childTasks",
    "readingRecommendation",
    "englishRecommendation",
    "weekendActivity"
  ],
  properties: {
    mode: { const: "weekly_plan_draft" },
    theme: { type: "string" },
    fatherTasks: { type: "array", items: taskJsonSchema },
    motherTasks: { type: "array", items: taskJsonSchema },
    childTasks: { type: "array", items: taskJsonSchema },
    readingRecommendation: { type: "string" },
    englishRecommendation: { type: "string" },
    weekendActivity: { type: "string" }
  }
};

export function buildWeeklyPlanDraftPrompt(
  context: AIContextSnapshot,
  message: string
) {
  return JSON.stringify({
    task: "生成下周计划草稿。必须轻量、父母分工清楚，等待家长确认后才能生效。",
    message,
    context
  });
}

export function createWeeklyPlanDraftFallback(
  context: AIContextSnapshot
): WeeklyPlanDraftResponse {
  const goal = (context.annualGoals[0] as { title?: string } | undefined)?.title ?? "阅读习惯";

  return {
    mode: "weekly_plan_draft",
    theme: `围绕${goal}建立轻量节奏`,
    fatherTasks: [
      { title: "户外运动或探索", plannedCount: 2 },
      { title: "周末一起完成一次小观察", plannedCount: 1 }
    ],
    motherTasks: [
      { title: "亲子共读10分钟", plannedCount: 3 },
      { title: "英文儿歌或绘本音频", plannedCount: 3 }
    ],
    childTasks: [{ title: "说出今天最喜欢的一件事", plannedCount: 3 }],
    readingRecommendation: "选择孩子愿意重复读的绘本，每次只读10分钟。",
    englishRecommendation: "每天5分钟英文输入，优先保持愉快感。",
    weekendActivity: "去附近公园做一次自然观察，回来讲三个发现。"
  };
}

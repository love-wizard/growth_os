import { z } from "zod";
import type { AIContextSnapshot } from "@/lib/ai/context";

export const activityGenerationResponseSchema = z.object({
  mode: z.literal("activity_generation"),
  activityName: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  materials: z.array(z.string().min(1)),
  steps: z.array(z.string().min(1)).min(1),
  cultivationGoal: z.string().min(1)
});

export type ActivityGenerationResponse = z.infer<
  typeof activityGenerationResponseSchema
>;

export const activityGenerationJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "mode",
    "activityName",
    "estimatedMinutes",
    "materials",
    "steps",
    "cultivationGoal"
  ],
  properties: {
    mode: { const: "activity_generation" },
    activityName: { type: "string" },
    estimatedMinutes: { type: "integer" },
    materials: { type: "array", items: { type: "string" } },
    steps: { type: "array", items: { type: "string" } },
    cultivationGoal: { type: "string" }
  }
};

export function buildActivityGenerationPrompt(
  context: AIContextSnapshot,
  message: string
) {
  return JSON.stringify({
    task: "生成适合今晚或周末的亲子活动，必须结合孩子兴趣、年度目标和最近记录。",
    message,
    context
  });
}

export function createActivityGenerationFallback(
  context: AIContextSnapshot
): ActivityGenerationResponse {
  const goal = (context.annualGoals[0] as { title?: string } | undefined)?.title ?? "表达能力";

  return {
    mode: "activity_generation",
    activityName: "三件小发现",
    estimatedMinutes: 30,
    materials: ["一张纸", "一支笔", "家里或小区里可观察的物品"],
    steps: [
      "父母和孩子各找一件今天看到的小东西。",
      "轮流说出它的颜色、形状和一个有趣细节。",
      "最后让孩子选一个发现画下来或讲给另一位家人听。"
    ],
    cultivationGoal: `服务于“${goal}”，用低压力方式练习观察、表达和亲子连接。`
  };
}

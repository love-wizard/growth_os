import { z } from "zod";
import type { AIContextSnapshot } from "@/lib/ai/context";

export const parentingQAResponseSchema = z.object({
  mode: z.literal("parenting_qa"),
  title: z.string().min(1),
  summary: z.string().min(1),
  analysis: z.array(z.string().min(1)).min(1),
  actions: z.array(z.string().min(1)).min(1),
  followUpQuestion: z.string().min(1)
});

export type ParentingQAResponse = z.infer<typeof parentingQAResponseSchema>;

export const parentingQAJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "title", "summary", "analysis", "actions", "followUpQuestion"],
  properties: {
    mode: { const: "parenting_qa" },
    title: { type: "string" },
    summary: { type: "string" },
    analysis: { type: "array", items: { type: "string" } },
    actions: { type: "array", items: { type: "string" } },
    followUpQuestion: { type: "string" }
  }
};

export function buildParentingQAPrompt(context: AIContextSnapshot, message: string) {
  return JSON.stringify({
    task: "基于孩子真实成长档案回答育儿问题，给出具体、低压力、可执行建议。",
    message,
    context
  });
}

export function createParentingQAFallback(
  context: AIContextSnapshot,
  message: string
): ParentingQAResponse {
  const childName = getChildNickname(context);
  const activeGoal = getFirstGoalTitle(context);

  return {
    mode: "parenting_qa",
    title: `${childName}的陪伴建议`,
    summary: `围绕“${activeGoal}”，先把问题拆成情绪、难度和节奏三件事看待。`,
    analysis: [
      `你的问题是：“${message}”。先判断这是临时情绪，还是任务难度、频率让孩子有压力。`,
      `结合当前目标“${activeGoal}”，本周不需要追求强度，重点是保住兴趣和亲子关系。`
    ],
    actions: [
      "今天只做一个5到10分钟的小版本，结束时由孩子选择一个收尾方式。",
      "父母先描述观察到的事实，再问孩子愿意怎么调整，不用先讲道理。",
      "连续三天记录孩子开始前和结束后的情绪变化，再决定是否调整周计划。"
    ],
    followUpQuestion: "最近一次出现这个情况，是在开始前、过程中，还是快结束时？"
  };
}

function getChildNickname(context: AIContextSnapshot) {
  const profile = context.childProfile as { nickname?: string; name?: string } | null;
  return profile?.nickname ?? profile?.name ?? "孩子";
}

function getFirstGoalTitle(context: AIContextSnapshot) {
  const goal = context.annualGoals[0] as { title?: string } | undefined;
  return goal?.title ?? "稳定成长";
}

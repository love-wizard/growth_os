import { z } from "zod";
import type { AIContextSnapshot } from "@/lib/ai/context";

export const growthAnalysisResponseSchema = z.object({
  mode: z.literal("growth_analysis"),
  title: z.string().min(1),
  sections: z
    .array(
      z.object({
        area: z.string().min(1),
        summary: z.string().min(1),
        evidence: z.array(z.string().min(1))
      })
    )
    .min(1),
  nextActions: z.array(z.string().min(1)).min(1)
});

export type GrowthAnalysisResponse = z.infer<typeof growthAnalysisResponseSchema>;

export const growthAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "title", "sections", "nextActions"],
  properties: {
    mode: { const: "growth_analysis" },
    title: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["area", "summary", "evidence"],
        properties: {
          area: { type: "string" },
          summary: { type: "string" },
          evidence: { type: "array", items: { type: "string" } }
        }
      }
    },
    nextActions: { type: "array", items: { type: "string" } }
  }
};

export function buildGrowthAnalysisPrompt(context: AIContextSnapshot, message: string) {
  return JSON.stringify({
    task:
      context.scope === "family"
        ? "分析最近全家成长情况，必须引用共同成长记录或各孩子成长记录中的真实证据，避免孩子之间的排名和比较。"
        : "分析最近成长情况，必须引用周计划、兴趣班记录或成长记录中的真实证据。",
    message,
    context
  });
}

export function createGrowthAnalysisFallback(
  context: AIContextSnapshot
): GrowthAnalysisResponse {
  const growthEvidence = context.growthRecords
    .slice(0, 2)
    .map((record) => {
      const childNames = record.child_names?.length ? `（${record.child_names.join("、")}）` : "";
      return `${record.happened_on}${childNames}: ${record.text}`;
    });

  if (context.scope === "family") {
    const childNames = context.familyChildren.map((child) => child.nickname).join("、") || "孩子们";
    return {
      mode: "growth_analysis",
      title: "本月家庭成长小结",
      sections: [
        {
          area: "共同陪伴",
          summary: `这个月可以优先看见${childNames}一起参与过的真实瞬间，而不是比较每个孩子完成了多少。`,
          evidence:
            growthEvidence.length > 0
              ? growthEvidence
              : ["最近还没有足够共同成长记录，可以从一次共读、户外或家庭复盘开始。"]
        },
        {
          area: "分别被看见",
          summary: "多孩家庭需要同时保留共同活动和单独陪伴，让每个孩子都有被认真看见的时刻。",
          evidence: context.familyChildren.map((child) => `${child.nickname}: ${child.birth_date}`)
        }
      ],
      nextActions: [
        "下周安排一次共同活动，只记录一个真实画面。",
        "再给每个孩子各留一个10分钟单独陪伴，不做比较，只写下当时的反应。"
      ]
    };
  }

  return {
    mode: "growth_analysis",
    title: "最近一个月成长小结",
    sections: [
      {
        area: "陪伴节奏",
        summary: "当前更适合维持小步稳定，而不是突然加大任务量。",
        evidence:
          growthEvidence.length > 0
            ? growthEvidence
            : ["最近还没有足够成长记录，建议从本周完成情况开始补充。"]
      },
      {
        area: "兴趣培养",
        summary: "兴趣保持需要父母降低进入门槛，让孩子体验到完成感。",
        evidence: context.weeklyPlans
          .slice(0, 2)
          .map((plan) => `${plan.week_start_date}: ${plan.theme}`)
      }
    ],
    nextActions: [
      "本周只选一个最重要目标做稳定记录。",
      "每次完成后记录一句孩子的真实反应，方便下次计划更贴合。"
    ]
  };
}

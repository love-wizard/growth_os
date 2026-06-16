import { z } from "zod";
import type { AIContextSnapshot } from "@/lib/ai/context";

export const growthAnalysisResponseSchema = z.object({
  mode: z.literal("growth_analysis"),
  reportType: z.enum(["monthly", "annual", "none"]),
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
  nextActions: z.array(z.string().min(1))
});

export type GrowthAnalysisResponse = z.infer<typeof growthAnalysisResponseSchema>;

export const growthAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "reportType", "title", "sections", "nextActions"],
  properties: {
    mode: { const: "growth_analysis" },
    reportType: { enum: ["monthly", "annual", "none"] },
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
  const reportType = detectGrowthReportType(message);
  return JSON.stringify({
    task:
      reportType === "monthly"
        ? "生成成长月报。必须是报告体，不是行动建议清单。要基于用户提供的选中记录和真实上下文写出观察、证据与温和小结；可在最后给少量下月温和建议。"
        : reportType === "annual"
          ? "生成成长年报。必须是报告体，不是行动建议清单。要基于用户提供的选中记录和真实上下文写出年度变化、共同瞬间、能力变化与父母寄语。"
          : context.scope === "family"
            ? "分析最近全家成长情况，必须引用共同成长记录或各孩子成长记录中的真实证据，避免孩子之间的排名和比较。"
            : "分析最近成长情况，必须引用周计划、兴趣班记录或成长记录中的真实证据。",
    reportType,
    outputRules:
      reportType === "none"
        ? ["sections 写观察与证据", "nextActions 写下一步低压力建议"]
        : [
            "title 必须像报告标题，例如“本月家庭成长月报”",
            "sections 是报告主体章节，每节 summary 写观察结论，evidence 引用具体记录",
            "如果需要建议，必须作为 sections 中的“下月温和建议”或“下一阶段温和建议”章节出现",
            "nextActions 必须返回空数组，避免旧客户端把月报渲染成建议清单"
          ],
    message,
    context
  });
}

export function createGrowthAnalysisFallback(
  context: AIContextSnapshot,
  message = ""
): GrowthAnalysisResponse {
  const reportType = detectGrowthReportType(message);
  const growthEvidence = context.growthRecords
    .slice(0, 2)
    .map((record) => {
      const childNames = record.child_names?.length ? `（${record.child_names.join("、")}）` : "";
      return `${record.happened_on}${childNames}: ${record.text}`;
    });

  if (context.scope === "family") {
    const childNames = context.familyChildren.map((child) => child.nickname).join("、") || "孩子们";
    const nextActions = [
      "下周安排一次共同活动，只记录一个真实画面。",
      "再给每个孩子各留一个10分钟单独陪伴，不做比较，只写下当时的反应。"
    ];
    return {
      mode: "growth_analysis",
      reportType,
      title:
        reportType === "annual"
          ? "家庭成长年报"
          : reportType === "monthly"
            ? "本月家庭成长月报"
            : "最近家庭成长小结",
      sections: [
        {
          area: "共同陪伴",
          summary: `这个月记录里最值得保留的是${childNames}共同参与和分别被看见的时刻。它们呈现的是家庭关系的积累，而不是完成量的比较。`,
          evidence:
            growthEvidence.length > 0
              ? growthEvidence
              : ["最近还没有足够共同成长记录，可以从一次共读、户外或家庭复盘开始。"]
        },
        {
          area: "分别被看见",
          summary: "记录里同时保留共同活动和单独陪伴，会让每个孩子在家庭叙事里都有自己的位置。",
          evidence: context.familyChildren.map((child) => `${child.nickname}: ${child.birth_date}`)
        },
        ...(reportType === "none"
          ? []
          : [
              {
                area: reportType === "annual" ? "下一阶段温和建议" : "下月温和建议",
                summary: nextActions.join(" "),
                evidence: ["这是基于当前成长记录生成的低压力陪伴建议，不作为必须完成的任务。"]
              }
            ])
      ],
      nextActions: reportType === "none" ? nextActions : []
    };
  }

  const nextActions = [
    "本周只选一个最重要目标做稳定记录。",
    "每次完成后记录一句孩子的真实反应，方便下次计划更贴合。"
  ];

  return {
    mode: "growth_analysis",
    reportType,
    title:
      reportType === "annual"
        ? "成长年报"
        : reportType === "monthly"
          ? "本月成长月报"
          : "最近一个月成长小结",
    sections: [
      {
        area: "陪伴节奏",
        summary: "最近的记录更像是在建立稳定节奏。比起突然增加任务，更重要的是把已经发生的小推进留下来。",
        evidence:
          growthEvidence.length > 0
            ? growthEvidence
            : ["最近还没有足够成长记录，建议从本周完成情况开始补充。"]
      },
      {
        area: "兴趣培养",
        summary: "兴趣相关记录可以用来观察孩子开始前、进行中和结束后的状态变化，帮助下一次安排更贴近真实反应。",
        evidence: context.weeklyPlans
          .slice(0, 2)
          .map((plan) => `${plan.week_start_date}: ${plan.theme}`)
      },
      ...(reportType === "none"
        ? []
        : [
            {
              area: reportType === "annual" ? "下一阶段温和建议" : "下月温和建议",
              summary: nextActions.join(" "),
              evidence: ["这是基于当前成长记录生成的低压力陪伴建议，不作为必须完成的任务。"]
            }
          ])
    ],
    nextActions: reportType === "none" ? nextActions : []
  };
}

function detectGrowthReportType(message: string): GrowthAnalysisResponse["reportType"] {
  if (/年报|年度/.test(message)) {
    return "annual";
  }

  if (/月报|本月|月度/.test(message)) {
    return "monthly";
  }

  return "none";
}

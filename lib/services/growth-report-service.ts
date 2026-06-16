import type { SupabaseClient } from "@supabase/supabase-js";
import { assembleAIContext, type AIContextSnapshot } from "@/lib/ai/context";
import type { GrowthAnalysisResponse } from "@/lib/ai/modes/growth-analysis";
import type { ParentRole, UUID } from "@/lib/domain/types";
import { getGrowthReportForFamily, getGrowthReportForPeriod, listGrowthReportsForFamily, upsertGrowthReport } from "@/lib/repositories/growth-report-repo";
import {
  createAIConversation,
  getAIConversationForFamily,
  listAIConversationsForFamily,
  type AIConversationRecord
} from "@/lib/repositories/ai-repo";
import { resolveActiveChildId } from "@/lib/services/active-child-service";
import { generateAICoachResponse } from "@/lib/services/ai-coach-service";

export class GrowthReportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GrowthReportError";
  }
}

export function getMonthWindow(referenceDate = new Date()) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);

  return {
    periodStart: formatLocalDate(start),
    periodEnd: formatLocalDate(end)
  };
}

export async function generateOrGetMonthlyReport(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    userId: UUID;
    userRole: ParentRole;
    scope: "child" | "family";
    childId?: UUID;
    periodStart?: string;
    periodEnd?: string;
  }
) {
  const period = input.periodStart && input.periodEnd
    ? { periodStart: input.periodStart, periodEnd: input.periodEnd }
    : getMonthWindow();
  const childId =
    input.scope === "family"
      ? null
      : await resolveActiveChildId(supabase, {
          familyId: input.familyId,
          childId: input.childId
        });

  if (input.scope === "child" && !childId) {
    throw new GrowthReportError("Child profile is required");
  }

  const existing = await tryGetGrowthReportForPeriod(supabase, {
    familyId: input.familyId,
    childId,
    scope: input.scope,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd
  });

  if (existing?.status === "ready") {
    return existing;
  }

  const fallback = await getFallbackReportForPeriod(supabase, {
    familyId: input.familyId,
    childId,
    scope: input.scope,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd
  });
  if (fallback) {
    return fallback;
  }

  const context = await assembleAIContext(
    supabase,
    input.familyId,
    new Date(`${period.periodEnd}T12:00:00+08:00`),
    childId ?? undefined,
    input.scope
  );
  const periodContext = filterContextToPeriod(context, period.periodStart, period.periodEnd);
  const sourceRecordCount = periodContext.growthRecords.length;
  const sourceCourseRecordCount = periodContext.interestParticipationRecords.length;

  if (sourceRecordCount + sourceCourseRecordCount < 3) {
    throw new GrowthReportError("至少需要 3 条成长记录或课程记录，才能生成成长月报");
  }

  const response = await generateAICoachResponse(
    "growth_analysis",
    buildMonthlyReportMessage(input.scope, period, sourceRecordCount, sourceCourseRecordCount),
    periodContext
  );

  if (response.mode !== "growth_analysis") {
    throw new GrowthReportError("Unable to generate monthly report");
  }

  const reportInput = {
    familyId: input.familyId,
    childId,
    scope: input.scope,
    reportType: "monthly",
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    title: response.title,
    summary: buildReportSummary(response),
    sections: normalizeReportSections(response),
    sourceRecordCount,
    sourceCourseRecordCount,
    status: "ready",
    generatedByUserId: input.userId
  } as const;

  try {
    return await upsertGrowthReport(supabase, reportInput);
  } catch (error) {
    if (!isMissingGrowthReportsTableError(error)) {
      throw error;
    }

    const conversationId = await createAIConversation(supabase, {
      familyId: input.familyId,
      userId: input.userId,
      userRole: input.userRole,
      mode: "growth_analysis",
      message: `成长月报｜${period.periodStart}｜${period.periodEnd}`,
      response: {
        ...response,
        reportMeta: {
          scope: input.scope,
          childId,
          reportType: "monthly",
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          sourceRecordCount,
          sourceCourseRecordCount
        }
      },
      contextWindowSummary: {
        reportType: "monthly",
        periodStart: period.periodStart,
        periodEnd: period.periodEnd
      }
    });

    return toFallbackGrowthReport({
      id: conversationId,
      familyId: input.familyId,
      childId,
      scope: input.scope,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      response,
      sourceRecordCount,
      sourceCourseRecordCount,
      createdAt: new Date().toISOString(),
      generatedByUserId: input.userId
    });
  }
}

export async function listGrowthReports(
  supabase: SupabaseClient,
  input: { familyId: UUID; scope: "child" | "family"; childId?: UUID; reportType?: "monthly" | "annual" }
) {
  const childId =
    input.scope === "family"
      ? null
      : await resolveActiveChildId(supabase, {
          familyId: input.familyId,
          childId: input.childId
        });

  if (input.scope === "child" && !childId) {
    return [];
  }

  try {
    const [reports, fallbackReports] = await Promise.all([
      listGrowthReportsForFamily(supabase, {
        familyId: input.familyId,
        childId,
        scope: input.scope,
        reportType: input.reportType
      }),
      listFallbackReports(supabase, {
        familyId: input.familyId,
        childId,
        scope: input.scope,
        reportType: input.reportType
      })
    ]);
    const seen = new Set(reports.map((report) => `${report.report_type}:${report.period_start}:${report.period_end}`));
    return [
      ...reports,
      ...fallbackReports.filter((report) => {
        const key = `${report.report_type}:${report.period_start}:${report.period_end}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })
    ].sort((left, right) =>
      `${right.period_end}:${right.created_at}`.localeCompare(`${left.period_end}:${left.created_at}`)
    );
  } catch (error) {
    if (!isMissingGrowthReportsTableError(error)) {
      throw error;
    }

    return listFallbackReports(supabase, {
      familyId: input.familyId,
      childId,
      scope: input.scope,
      reportType: input.reportType
    });
  }
}

export async function getGrowthReportDetail(
  supabase: SupabaseClient,
  input: { familyId: UUID; reportId: UUID }
) {
  if (input.reportId.startsWith("ai-")) {
    const fallback = await getFallbackReportDetail(supabase, {
      familyId: input.familyId,
      conversationId: input.reportId.slice("ai-".length)
    });
    if (!fallback) {
      throw new GrowthReportError("Growth report was not found");
    }

    return fallback;
  }

  const report = await getGrowthReportForFamily(supabase, input);
  if (!report) {
    throw new GrowthReportError("Growth report was not found");
  }

  return report;
}

async function tryGetGrowthReportForPeriod(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    childId: UUID | null;
    scope: "child" | "family";
    periodStart: string;
    periodEnd: string;
  }
) {
  try {
    return await getGrowthReportForPeriod(supabase, {
      familyId: input.familyId,
      childId: input.childId,
      scope: input.scope,
      reportType: "monthly",
      periodStart: input.periodStart,
      periodEnd: input.periodEnd
    });
  } catch (error) {
    if (isMissingGrowthReportsTableError(error)) {
      return null;
    }

    throw error;
  }
}

async function getFallbackReportForPeriod(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    childId: UUID | null;
    scope: "child" | "family";
    periodStart: string;
    periodEnd: string;
  }
) {
  const reports = await listFallbackReports(supabase, {
    familyId: input.familyId,
    childId: input.childId,
    scope: input.scope,
    reportType: "monthly"
  });

  return reports.find(
    (report) => report.period_start === input.periodStart && report.period_end === input.periodEnd
  ) ?? null;
}

async function listFallbackReports(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    childId: UUID | null;
    scope: "child" | "family";
    reportType?: "monthly" | "annual";
  }
) {
  const conversations = await listAIConversationsForFamily(supabase, {
    familyId: input.familyId,
    limit: 100
  });

  return conversations
    .map((conversation) => fallbackReportFromConversation(conversation, input.familyId))
    .filter((report): report is NonNullable<typeof report> => Boolean(report))
    .filter((report) => report.scope === input.scope)
    .filter((report) => !input.reportType || report.report_type === input.reportType)
    .filter((report) => input.scope === "family" || report.child_id === input.childId);
}

async function getFallbackReportDetail(
  supabase: SupabaseClient,
  input: { familyId: UUID; conversationId: UUID }
) {
  const conversation = await getAIConversationForFamily(supabase, input);
  return conversation ? fallbackReportFromConversation(conversation, input.familyId) : null;
}

function filterContextToPeriod(
  context: AIContextSnapshot,
  periodStart: string,
  periodEnd: string
): AIContextSnapshot {
  return {
    ...context,
    growthRecords: context.growthRecords.filter(
      (record) => record.happened_on >= periodStart && record.happened_on <= periodEnd
    ),
    interestParticipationRecords: context.interestParticipationRecords.filter(
      (record) => record.happened_on >= periodStart && record.happened_on <= periodEnd
    ),
    weeklyPlans: context.weeklyPlans.filter(
      (plan) => plan.week_start_date <= periodEnd && plan.week_end_date >= periodStart
    )
  };
}

function buildMonthlyReportMessage(
  scope: "child" | "family",
  period: { periodStart: string; periodEnd: string },
  sourceRecordCount: number,
  sourceCourseRecordCount: number
) {
  const basis = `数据范围：${period.periodStart} 至 ${period.periodEnd}，包含 ${sourceRecordCount} 条成长瞬间和 ${sourceCourseRecordCount} 条课程记录。`;
  return scope === "family"
    ? `请基于本月真实成长档案生成一份家庭成长月报。${basis}重点整理共同陪伴、每个孩子被看见的瞬间、课程/练习状态和下月温和建议；不要排名或比较孩子。`
    : `请基于本月真实成长档案生成一份成长月报。${basis}请按成长变化、兴趣/课程、情绪关系和下月温和建议整理；不要写成行动建议清单。`;
}

function buildReportSummary(response: GrowthAnalysisResponse) {
  return response.sections
    .slice(0, 2)
    .map((section) => section.summary)
    .join(" ");
}

function normalizeReportSections(response: GrowthAnalysisResponse) {
  const sections = response.sections.map((section) => ({
    area: section.area,
    summary: section.summary,
    evidence: section.evidence ?? []
  }));

  if (response.nextActions.length > 0) {
    sections.push({
      area: response.reportType === "annual" ? "下一阶段温和建议" : "下月温和建议",
      summary: response.nextActions.join(" "),
      evidence: ["这是基于当前成长记录生成的低压力陪伴建议，不作为必须完成的任务。"]
    });
  }

  return sections;
}

function fallbackReportFromConversation(
  conversation: AIConversationRecord,
  familyId: UUID
) {
  const response = conversation.response as
    | (GrowthAnalysisResponse & {
        reportMeta?: {
          scope?: "child" | "family";
          childId?: UUID | null;
          reportType?: "monthly" | "annual";
          periodStart?: string;
          periodEnd?: string;
          sourceRecordCount?: number;
          sourceCourseRecordCount?: number;
        };
      })
    | null;
  const meta = response?.reportMeta;

  if (response?.mode !== "growth_analysis" || !meta?.periodStart || !meta.periodEnd) {
    return null;
  }

  return toFallbackGrowthReport({
    id: conversation.id,
    familyId,
    childId: meta.childId ?? null,
    scope: meta.scope ?? "child",
    periodStart: meta.periodStart,
    periodEnd: meta.periodEnd,
    response,
    sourceRecordCount: meta.sourceRecordCount ?? 0,
    sourceCourseRecordCount: meta.sourceCourseRecordCount ?? 0,
    createdAt: conversation.created_at,
    generatedByUserId: conversation.user_id
  });
}

function toFallbackGrowthReport(input: {
  id: UUID;
  familyId: UUID;
  childId: UUID | null;
  scope: "child" | "family";
  periodStart: string;
  periodEnd: string;
  response: GrowthAnalysisResponse;
  sourceRecordCount: number;
  sourceCourseRecordCount: number;
  createdAt: string;
  generatedByUserId: UUID | null;
}) {
  return {
    id: `ai-${input.id}`,
    family_id: input.familyId,
    child_id: input.scope === "family" ? null : input.childId,
    scope: input.scope,
    report_type: input.response.reportType === "annual" ? "annual" : "monthly",
    period_start: input.periodStart,
    period_end: input.periodEnd,
    title: input.response.title,
    summary: buildReportSummary(input.response),
    sections: normalizeReportSections(input.response),
    source_record_count: input.sourceRecordCount,
    source_course_record_count: input.sourceCourseRecordCount,
    status: "ready",
    generated_by_user_id: input.generatedByUserId,
    created_at: input.createdAt,
    updated_at: input.createdAt
  };
}

function isMissingGrowthReportsTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "42P01" ||
    (candidate.code === "PGRST205" && (candidate.message ?? "").includes("growth_reports")) ||
    (candidate.message ?? "").includes("growth_reports") &&
      (candidate.message ?? "").toLowerCase().includes("does not exist")
  );
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

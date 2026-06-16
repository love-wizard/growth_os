import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";

export type GrowthReportScope = "child" | "family";
export type GrowthReportType = "monthly" | "annual";
export type GrowthReportStatus = "generating" | "ready" | "failed";

export interface GrowthReportSection {
  area: string;
  summary: string;
  evidence: string[];
}

export interface GrowthReport {
  id: UUID;
  family_id: UUID;
  child_id: UUID | null;
  scope: GrowthReportScope;
  report_type: GrowthReportType;
  period_start: string;
  period_end: string;
  title: string;
  summary: string;
  sections: GrowthReportSection[];
  source_record_count: number;
  source_course_record_count: number;
  status: GrowthReportStatus;
  generated_by_user_id: UUID | null;
  created_at: string;
  updated_at: string;
}

const reportSelect =
  "id,family_id,child_id,scope,report_type,period_start,period_end,title,summary,sections,source_record_count,source_course_record_count,status,generated_by_user_id,created_at,updated_at";

export async function getGrowthReportForPeriod(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    childId?: UUID | null;
    scope: GrowthReportScope;
    reportType: GrowthReportType;
    periodStart: string;
    periodEnd: string;
  }
) {
  let query = supabase
    .from("growth_reports")
    .select(reportSelect)
    .eq("family_id", input.familyId)
    .eq("scope", input.scope)
    .eq("report_type", input.reportType)
    .eq("period_start", input.periodStart)
    .eq("period_end", input.periodEnd);

  query = input.scope === "family" ? query.is("child_id", null) : query.eq("child_id", input.childId);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return data as GrowthReport | null;
}

export async function getGrowthReportForFamily(
  supabase: SupabaseClient,
  input: { familyId: UUID; reportId: UUID }
) {
  const { data, error } = await supabase
    .from("growth_reports")
    .select(reportSelect)
    .eq("family_id", input.familyId)
    .eq("id", input.reportId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as GrowthReport | null;
}

export async function listGrowthReportsForFamily(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    childId?: UUID | null;
    scope: GrowthReportScope;
    reportType?: GrowthReportType;
    limit?: number;
  }
) {
  let query = supabase
    .from("growth_reports")
    .select(reportSelect)
    .eq("family_id", input.familyId)
    .eq("scope", input.scope)
    .eq("status", "ready")
    .order("period_end", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 12);

  query = input.scope === "family" ? query.is("child_id", null) : query.eq("child_id", input.childId);

  if (input.reportType) {
    query = query.eq("report_type", input.reportType);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as GrowthReport[];
}

export async function upsertGrowthReport(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    childId?: UUID | null;
    scope: GrowthReportScope;
    reportType: GrowthReportType;
    periodStart: string;
    periodEnd: string;
    title: string;
    summary: string;
    sections: GrowthReportSection[];
    sourceRecordCount: number;
    sourceCourseRecordCount: number;
    status?: GrowthReportStatus;
    generatedByUserId?: UUID | null;
  }
) {
  const { data, error } = await supabase
    .from("growth_reports")
    .insert({
      family_id: input.familyId,
      child_id: input.scope === "family" ? null : input.childId,
      scope: input.scope,
      report_type: input.reportType,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      title: input.title,
      summary: input.summary,
      sections: input.sections,
      source_record_count: input.sourceRecordCount,
      source_course_record_count: input.sourceCourseRecordCount,
      status: input.status ?? "ready",
      generated_by_user_id: input.generatedByUserId ?? null
    })
    .select(reportSelect)
    .single();

  if (error) {
    throw error;
  }

  return data as GrowthReport;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { resolveActiveChildId } from "@/lib/services/active-child-service";

export interface AIContextGrowthRecord {
  id: UUID;
  happened_on: string;
  text: string;
  tags?: string[] | null;
  parent_notes?: string | null;
  deleted_at?: string | null;
}

export interface AIContextInterestParticipationRecord {
  id: UUID;
  happened_on: string;
  participation_outcome: string;
  duration_minutes?: number | null;
  count?: number | null;
  notes?: string | null;
  deleted_at?: string | null;
}

export interface AIContextWeeklyPlan {
  id: UUID;
  week_start_date: string;
  week_end_date: string;
  theme: string;
  weekly_tasks?: unknown[];
}

export interface AIContextSnapshot {
  childProfile: unknown | null;
  annualGoals: unknown[];
  weeklyPlans: AIContextWeeklyPlan[];
  interestParticipationRecords: AIContextInterestParticipationRecord[];
  growthRecords: AIContextGrowthRecord[];
}

export function getDateWindowStart(referenceDate: Date, days: number) {
  const date = new Date(referenceDate);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export function filterRecentNonDeletedByDate<
  T extends { happened_on: string; deleted_at?: string | null }
>(records: T[], referenceDate: Date, days: number) {
  const cutoff = getDateWindowStart(referenceDate, days);
  return records.filter((record) => !record.deleted_at && record.happened_on >= cutoff);
}

export function stripGrowthRecordMedia(
  records: AIContextGrowthRecord[]
): AIContextGrowthRecord[] {
  return records.map((record) => ({
    id: record.id,
    happened_on: record.happened_on,
    text: record.text,
    tags: record.tags ?? [],
    parent_notes: record.parent_notes ?? null
  }));
}

export async function assembleAIContext(
  supabase: SupabaseClient,
  familyId: UUID,
  referenceDate = new Date(),
  childId?: UUID
): Promise<AIContextSnapshot> {
  const activeChildId = await resolveActiveChildId(supabase, { familyId, childId });
  const childProfile = activeChildId
    ? await fetchChildProfile(supabase, familyId, activeChildId)
    : null;

  if (!childProfile) {
    return {
      childProfile: null,
      annualGoals: [],
      weeklyPlans: [],
      interestParticipationRecords: [],
      growthRecords: []
    };
  }

  const profileChildId = String(childProfile.id);
  const fourWeekStart = getDateWindowStart(referenceDate, 28);
  const ninetyDayStart = getDateWindowStart(referenceDate, 90);

  const [annualGoals, weeklyPlans, interestRecords, growthRecords] =
    await Promise.all([
      fetchAnnualGoals(supabase, profileChildId),
      fetchWeeklyPlans(supabase, profileChildId, fourWeekStart),
      fetchInterestRecords(supabase, profileChildId, ninetyDayStart),
      fetchGrowthRecords(supabase, profileChildId, ninetyDayStart)
    ]);

  return {
    childProfile,
    annualGoals,
    weeklyPlans,
    interestParticipationRecords: interestRecords,
    growthRecords: stripGrowthRecordMedia(growthRecords)
  };
}

async function fetchChildProfile(
  supabase: SupabaseClient,
  familyId: UUID,
  childId: UUID
) {
  const { data, error } = await supabase
    .from("child_profiles")
    .select("id,family_id,name,nickname,birth_date,gender,child_interests(name)")
    .eq("family_id", familyId)
    .eq("id", childId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function fetchAnnualGoals(supabase: SupabaseClient, childId: string) {
  const { data, error } = await supabase
    .from("annual_goals")
    .select("id,title,category,status")
    .eq("child_id", childId)
    .eq("status", "active");

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function fetchWeeklyPlans(
  supabase: SupabaseClient,
  childId: string,
  weekStartCutoff: string
) {
  const { data, error } = await supabase
    .from("weekly_plans")
    .select(
      "id,week_start_date,week_end_date,theme,reading_recommendation,english_recommendation,weekend_activity,weekly_tasks(id,assignee_type,title,planned_count,completed_count,status)"
    )
    .eq("child_id", childId)
    .gte("week_start_date", weekStartCutoff)
    .order("week_start_date", { ascending: false })
    .limit(4);

  if (error) {
    throw error;
  }

  return (data ?? []) as AIContextWeeklyPlan[];
}

async function fetchInterestRecords(
  supabase: SupabaseClient,
  childId: string,
  happenedOnCutoff: string
) {
  const { data, error } = await supabase
    .from("interest_participation_records")
    .select("id,happened_on,participation_outcome,duration_minutes,count,notes,deleted_at")
    .eq("child_id", childId)
    .is("deleted_at", null)
    .gte("happened_on", happenedOnCutoff)
    .order("happened_on", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AIContextInterestParticipationRecord[];
}

async function fetchGrowthRecords(
  supabase: SupabaseClient,
  childId: string,
  happenedOnCutoff: string
) {
  const { data, error } = await supabase
    .from("growth_records")
    .select("id,happened_on,text,tags,parent_notes,deleted_at")
    .eq("child_id", childId)
    .is("deleted_at", null)
    .gte("happened_on", happenedOnCutoff)
    .order("happened_on", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AIContextGrowthRecord[];
}

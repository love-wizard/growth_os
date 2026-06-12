import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { resolveActiveChildId } from "@/lib/services/active-child-service";
import { listFamilyChildren, type ChildProfileRecord } from "@/lib/repositories/child-repo";

export interface AIContextGrowthRecord {
  id: UUID;
  child_id?: UUID;
  happened_on: string;
  text: string;
  tags?: string[] | null;
  parent_notes?: string | null;
  deleted_at?: string | null;
  child_names?: string[];
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
  scope: "child" | "family";
  familyChildren: Array<{
    id: UUID;
    nickname: string;
    birth_date: string;
    gender: string;
  }>;
  activeChildId: UUID | null;
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
    ...(record.child_id ? { child_id: record.child_id } : {}),
    happened_on: record.happened_on,
    text: record.text,
    tags: record.tags ?? [],
    parent_notes: record.parent_notes ?? null,
    ...(record.child_names?.length ? { child_names: record.child_names } : {})
  }));
}

export async function assembleAIContext(
  supabase: SupabaseClient,
  familyId: UUID,
  referenceDate = new Date(),
  childId?: UUID,
  scope: "child" | "family" = "child"
): Promise<AIContextSnapshot> {
  const [familyChildren, activeChildId] = await Promise.all([
    listFamilyChildren(supabase, familyId),
    resolveActiveChildId(supabase, { familyId, childId })
  ]);
  const childProfile = activeChildId
    ? await fetchChildProfile(supabase, familyId, activeChildId)
    : null;

  if (!childProfile) {
    return {
      scope,
      familyChildren: normalizeFamilyChildren(familyChildren),
      activeChildId: null,
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
      fetchGrowthRecords(supabase, {
        familyId,
        childId: profileChildId,
        scope,
        happenedOnCutoff: ninetyDayStart
      })
    ]);

  return {
    scope,
    familyChildren: normalizeFamilyChildren(familyChildren),
    activeChildId,
    childProfile,
    annualGoals,
    weeklyPlans,
    interestParticipationRecords: interestRecords,
    growthRecords: stripGrowthRecordMedia(growthRecords)
  };
}

function normalizeFamilyChildren(children: ChildProfileRecord[]) {
  return children.map((child) => ({
    id: child.id,
    nickname: child.nickname,
    birth_date: child.birth_date,
    gender: child.gender
  }));
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
  input: {
    familyId: UUID;
    childId: string;
    scope: "child" | "family";
    happenedOnCutoff: string;
  }
) {
  const { data, error } = await supabase
    .from("growth_records")
    .select(
      "id,child_id,happened_on,text,tags,parent_notes,deleted_at,growth_record_children(child_id,child_profiles(nickname)),child_profiles!inner(family_id)"
    )
    .eq("child_profiles.family_id", input.familyId)
    .is("deleted_at", null)
    .gte("happened_on", input.happenedOnCutoff)
    .order("happened_on", { ascending: false })
    .limit(input.scope === "family" ? 80 : 120);

  if (error) {
    throw error;
  }

  const records = (data ?? []).map((record) => {
    const links = Array.isArray(record.growth_record_children)
      ? record.growth_record_children
      : [];
    const childNames = links
      .map((link: { child_profiles?: { nickname?: string } | Array<{ nickname?: string }> }) => {
        const profile = Array.isArray(link.child_profiles)
          ? link.child_profiles[0]
          : link.child_profiles;
        return profile?.nickname ?? "";
      })
      .filter(Boolean);

    return {
      id: record.id,
      child_id: record.child_id,
      happened_on: record.happened_on,
      text: record.text,
      tags: record.tags,
      parent_notes: record.parent_notes,
      deleted_at: record.deleted_at,
      child_names: childNames
    };
  }) as AIContextGrowthRecord[];

  if (input.scope === "family") {
    return records;
  }

  return records.filter((record) => {
    if (record.child_id === input.childId) {
      return true;
    }

    const raw = data?.find((item) => item.id === record.id);
    const links = Array.isArray(raw?.growth_record_children)
      ? raw.growth_record_children
      : [];
    return links.some((link: { child_id?: string }) => link.child_id === input.childId);
  });
}

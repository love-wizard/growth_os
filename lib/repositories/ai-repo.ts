import type { SupabaseClient } from "@supabase/supabase-js";
import type { AICoachMode, ParentRole, UUID } from "@/lib/domain/types";
import type { WeeklyPlanDraftResponse } from "@/lib/ai/modes/weekly-plan-draft";

export interface AIConversationRecord {
  id: UUID;
  family_id: UUID;
  user_id: UUID;
  user_role: ParentRole;
  mode: AICoachMode;
  message: string;
  response: unknown;
  created_at: string;
  ai_weekly_plan_drafts?: Array<{
    id: UUID;
    status: string;
  }>;
}

export async function createAIConversation(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    userId: UUID;
    userRole: ParentRole;
    mode: AICoachMode;
    message: string;
    response: unknown;
    contextWindowSummary: unknown;
  }
) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      family_id: input.familyId,
      user_id: input.userId,
      user_role: input.userRole,
      mode: input.mode,
      message: input.message,
      response: input.response,
      context_window_summary: input.contextWindowSummary
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as UUID;
}

export async function createAIWeeklyPlanDraft(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    childId: UUID;
    aiConversationId: UUID;
    draft: WeeklyPlanDraftResponse;
  }
) {
  const { data, error } = await supabase
    .from("ai_weekly_plan_drafts")
    .insert({
      family_id: input.familyId,
      child_id: input.childId,
      ai_conversation_id: input.aiConversationId,
      theme: input.draft.theme,
      father_tasks: input.draft.fatherTasks,
      mother_tasks: input.draft.motherTasks,
      child_tasks: input.draft.childTasks,
      reading_recommendation: input.draft.readingRecommendation,
      english_recommendation: input.draft.englishRecommendation,
      weekend_activity: input.draft.weekendActivity,
      status: "draft"
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as UUID;
}

export async function listAIConversationsForFamily(
  supabase: SupabaseClient,
  input: { familyId: UUID; limit?: number }
) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .select(
      "id,family_id,user_id,user_role,mode,message,response,created_at,ai_weekly_plan_drafts(id,status)"
    )
    .eq("family_id", input.familyId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 10);

  if (error) {
    throw error;
  }

  return (data ?? []) as AIConversationRecord[];
}

export async function getAIWeeklyPlanDraftForFamily(
  supabase: SupabaseClient,
  input: { familyId: UUID; draftId: UUID }
) {
  const { data, error } = await supabase
    .from("ai_weekly_plan_drafts")
    .select(
      "id,family_id,child_id,ai_conversation_id,theme,father_tasks,mother_tasks,child_tasks,reading_recommendation,english_recommendation,weekend_activity,status"
    )
    .eq("id", input.draftId)
    .eq("family_id", input.familyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as AIWeeklyPlanDraftRecord | null;
}

export async function confirmAIWeeklyPlanDraft(
  supabase: SupabaseClient,
  input: { draft: AIWeeklyPlanDraftRecord; userId: UUID; referenceDate?: Date }
) {
  const weekStart = startOfNextWeek(input.referenceDate ?? new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  const weekStartDate = weekStart.toISOString().slice(0, 10);
  const weekEndDate = weekEnd.toISOString().slice(0, 10);

  const { error: archiveError } = await supabase
    .from("weekly_plans")
    .update({ status: "archived" })
    .eq("child_id", input.draft.child_id)
    .eq("status", "active")
    .eq("week_start_date", weekStartDate);

  if (archiveError) {
    throw archiveError;
  }

  const { data: plan, error: planError } = await supabase
    .from("weekly_plans")
    .insert({
      child_id: input.draft.child_id,
      week_start_date: weekStartDate,
      week_end_date: weekEndDate,
      theme: input.draft.theme,
      source: "ai_confirmed",
      status: "active",
      reading_recommendation: input.draft.reading_recommendation,
      english_recommendation: input.draft.english_recommendation,
      weekend_activity: input.draft.weekend_activity
    })
    .select("id")
    .single();

  if (planError) {
    throw planError;
  }

  const weeklyPlanId = plan.id as UUID;
  const tasks = buildConfirmedWeeklyPlanTasks(weeklyPlanId, input.draft);

  const { error: taskError } = await supabase.from("weekly_tasks").insert(tasks);

  if (taskError) {
    throw taskError;
  }

  const { error: draftError } = await supabase
    .from("ai_weekly_plan_drafts")
    .update({
      status: "confirmed",
      confirmed_by_user_id: input.userId,
      confirmed_at: new Date().toISOString()
    })
    .eq("id", input.draft.id);

  if (draftError) {
    throw draftError;
  }

  return weeklyPlanId;
}

export interface AIWeeklyPlanDraftRecord {
  id: UUID;
  family_id: UUID;
  child_id: UUID;
  ai_conversation_id: UUID | null;
  theme: string;
  father_tasks: DraftTaskRecord[];
  mother_tasks: DraftTaskRecord[];
  child_tasks: DraftTaskRecord[];
  reading_recommendation: string | null;
  english_recommendation: string | null;
  weekend_activity: string | null;
  status: string;
}

interface DraftTaskRecord {
  title: string;
  plannedCount: number;
}

export function buildConfirmedWeeklyPlanTasks(
  weeklyPlanId: UUID,
  draft: Pick<
    AIWeeklyPlanDraftRecord,
    "father_tasks" | "mother_tasks" | "child_tasks" | "weekend_activity"
  >
) {
  return [
    ...toWeeklyTasks(weeklyPlanId, "father", draft.father_tasks),
    ...toWeeklyTasks(weeklyPlanId, "mother", draft.mother_tasks),
    ...toWeeklyTasks(weeklyPlanId, "child", draft.child_tasks),
    ...(draft.weekend_activity
      ? [
          {
            weekly_plan_id: weeklyPlanId,
            assignee_type: "family" as const,
            title: draft.weekend_activity,
            planned_count: 1
          }
        ]
      : [])
  ];
}

function toWeeklyTasks(
  weeklyPlanId: UUID,
  assigneeType: "father" | "mother" | "child",
  tasks: DraftTaskRecord[]
) {
  return tasks.map((task) => ({
    weekly_plan_id: weeklyPlanId,
    assignee_type: assigneeType,
    title: task.title,
    planned_count: task.plannedCount
  }));
}

function startOfNextWeek(date: Date) {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = result.getUTCDay();
  const daysUntilNextMonday = day === 0 ? 1 : 8 - day;
  result.setUTCDate(result.getUTCDate() + daysUntilNextMonday);
  return result;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TaskAssigneeType,
  UUID,
  WeeklyPlanSource,
  WeeklyPlanStatus,
  WeeklyTaskStatus
} from "@/lib/domain/types";

export interface WeeklyTaskRecord {
  id: UUID;
  weekly_plan_id: UUID;
  assignee_type: TaskAssigneeType;
  title: string;
  planned_count: number;
  completed_count: number;
  status: WeeklyTaskStatus;
  created_at?: string;
}

export interface WeeklyPlanRecord {
  id: UUID;
  child_id: UUID;
  week_start_date: string;
  week_end_date: string;
  theme: string;
  source: WeeklyPlanSource;
  status: WeeklyPlanStatus;
  reading_recommendation: string | null;
  english_recommendation: string | null;
  weekend_activity: string | null;
  weekly_tasks: WeeklyTaskRecord[];
}

export async function getFamilyChildId(supabase: SupabaseClient, familyId: UUID) {
  const { data, error } = await supabase
    .from("child_profiles")
    .select("id")
    .eq("family_id", familyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id as UUID | undefined;
}

export async function getCurrentWeeklyPlanWithTasks(
  supabase: SupabaseClient,
  childId: UUID
) {
  const { data, error } = await supabase
    .from("weekly_plans")
    .select(
      "id,child_id,week_start_date,week_end_date,theme,source,status,reading_recommendation,english_recommendation,weekend_activity,weekly_tasks(id,weekly_plan_id,assignee_type,title,planned_count,completed_count,status,created_at)"
    )
    .eq("child_id", childId)
    .eq("status", "active")
    .order("week_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return normalizeWeeklyPlan(data as WeeklyPlanRecord | null);
}

export async function getWeeklyTaskForFamily(
  supabase: SupabaseClient,
  input: { familyId: UUID; taskId: UUID }
) {
  const { data, error } = await supabase
    .from("weekly_tasks")
    .select(
      "id,weekly_plan_id,assignee_type,title,planned_count,completed_count,status,weekly_plans!inner(id,child_id,child_profiles!inner(family_id))"
    )
    .eq("id", input.taskId)
    .eq("weekly_plans.child_profiles.family_id", input.familyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return data as WeeklyTaskRecord;
}

export async function updateWeeklyTaskProgress(
  supabase: SupabaseClient,
  input: { taskId: UUID; completedCount: number; status: WeeklyTaskStatus }
) {
  const { data, error } = await supabase
    .from("weekly_tasks")
    .update({
      completed_count: input.completedCount,
      status: input.status
    })
    .eq("id", input.taskId)
    .select("id,weekly_plan_id,assignee_type,title,planned_count,completed_count,status")
    .single();

  if (error) {
    throw error;
  }

  return data as WeeklyTaskRecord;
}

function normalizeWeeklyPlan(plan: WeeklyPlanRecord | null) {
  if (!plan) {
    return null;
  }

  return {
    ...plan,
    weekly_tasks: [...(plan.weekly_tasks ?? [])].sort((a, b) =>
      taskSortKey(a).localeCompare(taskSortKey(b))
    )
  };
}

function taskSortKey(task: WeeklyTaskRecord) {
  const roleOrder: Record<TaskAssigneeType, string> = {
    father: "1",
    mother: "2",
    child: "3",
    family: "4"
  };

  return `${roleOrder[task.assignee_type]}-${task.created_at ?? ""}-${task.id}`;
}

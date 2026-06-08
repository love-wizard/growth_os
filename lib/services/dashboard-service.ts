import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { getSupportiveProgressCopy } from "@/lib/services/progress-copy-service";

export async function getDashboardData(supabase: SupabaseClient, familyId: UUID) {
  const child = await getChild(supabase, familyId);

  if (!child) {
    return {
      child: null,
      annualGoals: [],
      weeklyPlan: null,
      todayGuidance: null,
      progress: getSupportiveProgressCopy([]),
      todayTasks: []
    };
  }

  const [annualGoals, weeklyPlan] = await Promise.all([
    getAnnualGoals(supabase, child.id),
    getCurrentWeeklyPlan(supabase, child.id)
  ]);
  const todayTasks = weeklyPlan?.weekly_tasks ?? [];

  return {
    child,
    annualGoals,
    weeklyPlan,
    todayGuidance: buildTodayGuidance(weeklyPlan),
    progress: getSupportiveProgressCopy(
      todayTasks.map((task) => ({
        plannedCount: task.planned_count,
        completedCount: task.completed_count
      }))
    ),
    todayTasks
  };
}

function buildTodayGuidance(weeklyPlan: DashboardWeeklyPlan | null) {
  const firstTask = weeklyPlan?.weekly_tasks?.find(
    (task) => task.completed_count < task.planned_count
  );

  if (!firstTask) {
    return {
      title: "今天留一个轻松陪伴时刻",
      description: "如果没有明确任务，可以一起散步、共读或聊一件今天的小发现。"
    };
  }

  return {
    title: firstTask.title,
    description: "把它做小一点，重点是父母和孩子一起完成。"
  };
}

async function getChild(supabase: SupabaseClient, familyId: UUID) {
  const { data, error } = await supabase
    .from("child_profiles")
    .select("id,nickname,birth_date,gender")
    .eq("family_id", familyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as DashboardChild | null;
}

async function getAnnualGoals(supabase: SupabaseClient, childId: UUID) {
  const { data, error } = await supabase
    .from("annual_goals")
    .select("id,title,category,status")
    .eq("child_id", childId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as DashboardAnnualGoal[];
}

async function getCurrentWeeklyPlan(supabase: SupabaseClient, childId: UUID) {
  const { data, error } = await supabase
    .from("weekly_plans")
    .select(
      "id,theme,week_start_date,week_end_date,reading_recommendation,english_recommendation,weekend_activity,weekly_tasks(id,assignee_type,title,planned_count,completed_count,status)"
    )
    .eq("child_id", childId)
    .eq("status", "active")
    .order("week_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as DashboardWeeklyPlan | null;
}

interface DashboardChild {
  id: UUID;
  nickname: string;
  birth_date: string;
  gender: string;
}

interface DashboardAnnualGoal {
  id: UUID;
  title: string;
  category: string | null;
  status: string;
}

interface DashboardTask {
  id: UUID;
  assignee_type: string;
  title: string;
  planned_count: number;
  completed_count: number;
  status: string;
}

interface DashboardWeeklyPlan {
  id: UUID;
  theme: string;
  week_start_date: string;
  week_end_date: string;
  weekly_tasks: DashboardTask[];
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { elapsedMs, logPerf, nowMs } from "@/lib/services/perf-log";
import { getSupportiveProgressCopy } from "@/lib/services/progress-copy-service";
import { getCurrentWeeklyPlanForFamily } from "@/lib/services/weekly-plan-service";

export async function getDashboardData(supabase: SupabaseClient, familyId: UUID) {
  const startedAt = nowMs();
  const childStartedAt = nowMs();
  const child = await getChild(supabase, familyId);
  const childMs = elapsedMs(childStartedAt);

  if (!child) {
    logPerf("service.dashboard", {
      totalMs: elapsedMs(startedAt),
      childMs,
      hasChild: false,
      familyId
    });
    return {
      child: null,
      annualGoals: [],
      weeklyPlan: null,
      todayGuidance: null,
      progress: getSupportiveProgressCopy([]),
      todayTasks: []
    };
  }

  const relatedStartedAt = nowMs();
  const [annualGoals, weeklyPlan] = await Promise.all([
    getAnnualGoals(supabase, child.id),
    getCurrentWeeklyPlanForFamily(supabase, familyId, {
      allowAutoGenerate: false
    })
  ]);
  const relatedMs = elapsedMs(relatedStartedAt);
  const todayTasks = weeklyPlan?.weekly_tasks ?? [];

  logPerf("service.dashboard", {
    totalMs: elapsedMs(startedAt),
    childMs,
    relatedMs,
    hasChild: true,
    familyId,
    goalCount: annualGoals.length,
    taskCount: todayTasks.length
  });

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
  groupedTasks?: unknown;
  weekly_tasks: DashboardTask[];
}

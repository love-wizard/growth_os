import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { resolveActiveChildId } from "@/lib/services/active-child-service";
import { listFamilyChildren } from "@/lib/repositories/child-repo";
import { elapsedMs, logPerf, nowMs } from "@/lib/services/perf-log";
import { getSupportiveProgressCopy } from "@/lib/services/progress-copy-service";
import { getCurrentWeeklyPlanForFamily } from "@/lib/services/weekly-plan-service";

export async function getDashboardData(
  supabase: SupabaseClient,
  familyId: UUID,
  options?: { childId?: UUID }
) {
  const startedAt = nowMs();
  const childStartedAt = nowMs();
  const [children, activeChildId] = await Promise.all([
    listFamilyChildren(supabase, familyId),
    resolveActiveChildId(supabase, { familyId, childId: options?.childId })
  ]);
  const child = activeChildId ? children.find((item) => item.id === activeChildId) ?? null : null;
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
      children,
      childSummaries: [],
      annualGoals: [],
      weeklyPlan: null,
      todayGuidance: null,
      companionshipInsight: null,
      progress: getSupportiveProgressCopy([]),
      todayTasks: []
    };
  }

  const relatedStartedAt = nowMs();
  const [annualGoals, weeklyPlan, childSummaries] = await Promise.all([
    getAnnualGoals(supabase, child.id),
    getCurrentWeeklyPlanForFamily(supabase, familyId, {
      childId: child.id,
      allowAutoGenerate: false
    }),
    getChildSummaries(supabase, familyId, children)
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
    children,
    childSummaries,
    annualGoals,
    weeklyPlan,
    todayGuidance: buildTodayGuidance(weeklyPlan),
    companionshipInsight: buildCompanionshipInsight(children, childSummaries),
    progress: getSupportiveProgressCopy(
      todayTasks.map((task) => ({
        plannedCount: task.planned_count,
        completedCount: task.completed_count
      }))
    ),
    todayTasks
  };
}

async function getChildSummaries(
  supabase: SupabaseClient,
  familyId: UUID,
  children: DashboardChild[]
) {
  const summaries = await Promise.all(
    children.map(async (child) => {
      const weeklyPlan = await getCurrentWeeklyPlanForFamily(supabase, familyId, {
        childId: child.id,
        allowAutoGenerate: false
      });
      const tasks = weeklyPlan?.weekly_tasks ?? [];
      const firstTask = tasks.find((task) => task.completed_count < task.planned_count);

      return {
        id: child.id,
        nickname: child.nickname,
        birth_date: child.birth_date,
        gender: child.gender,
        weeklyTheme: weeklyPlan?.theme ?? "轻松陪伴",
        taskCount: tasks.length,
        completedCount: tasks.reduce((sum, task) => sum + task.completed_count, 0),
        plannedCount: tasks.reduce((sum, task) => sum + task.planned_count, 0),
        todayAction: firstTask
          ? firstTask.title
          : "留一个被看见的小瞬间"
      };
    })
  );

  return summaries;
}

function buildCompanionshipInsight(
  children: DashboardChild[],
  summaries: Awaited<ReturnType<typeof getChildSummaries>>
) {
  if (children.length <= 1) {
    return null;
  }

  const openSummaries = summaries.filter((summary) => summary.completedCount < summary.plannedCount);
  const settledSummaries = summaries.filter(
    (summary) => summary.plannedCount > 0 && summary.completedCount >= summary.plannedCount
  );
  const quietSummaries = summaries.filter((summary) => summary.taskCount === 0);
  const focusNames = (openSummaries.length ? openSummaries : summaries)
    .slice(0, 2)
    .map((summary) => summary.nickname)
    .join("、");

  if (openSummaries.length === 0) {
    return {
      title: "今天适合轻轻收尾",
      description: "本周的小事已经很有节奏了。今天可以少安排一点，把时间留给聊天、拥抱和自由玩。",
      primaryAction: "饭米粒建议：晚饭后问每个孩子一个具体问题，比如“今天哪一刻最开心？”",
      chips: ["不需要补任务", "多留自由时间", "记录一个共同瞬间"]
    };
  }

  if (quietSummaries.length > 0) {
    return {
      title: "先把共同陪伴稳住",
      description: "有的孩子今天还没有明确任务。可以先做一件全家都能加入的小事，再给每个孩子一句单独回应。",
      primaryAction: `饭米粒建议：先安排10分钟共同活动，结束前分别看见${focusNames || "每个孩子"}。`,
      chips: ["共同活动优先", "分别回应一句", "不做进度比较"]
    };
  }

  return {
    title: "今天每个孩子都有一点小推进",
    description: "不用把任务平均分给父母。先做一件共同的小事，再按每个孩子当前主题轻轻推进。",
    primaryAction: `饭米粒建议：今天重点看见${focusNames || "每个孩子"}，每人一个具体反馈就够了。`,
    chips: [
      `${children.length}个孩子一起看见`,
      settledSummaries.length > 0 ? "有人已经很有节奏" : "小步推进就好",
      "不比较完成量"
    ]
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

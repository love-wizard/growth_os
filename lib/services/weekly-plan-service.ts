import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TaskAssigneeType,
  UUID,
  WeeklyTaskStatus
} from "@/lib/domain/types";
import {
  getCurrentWeeklyPlanWithTasks,
  getFamilyChildId,
  getWeeklyTaskForFamily,
  updateWeeklyTaskProgress,
  type WeeklyPlanRecord,
  type WeeklyTaskRecord
} from "@/lib/repositories/weekly-plan-repo";

export class WeeklyPlanNotFoundError extends Error {
  constructor(message = "Weekly plan was not found") {
    super(message);
    this.name = "WeeklyPlanNotFoundError";
  }
}

export class WeeklyTaskProgressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeeklyTaskProgressError";
  }
}

export async function getCurrentWeeklyPlanForFamily(
  supabase: SupabaseClient,
  familyId: UUID
) {
  const childId = await getFamilyChildId(supabase, familyId);

  if (!childId) {
    return null;
  }

  const plan = await getCurrentWeeklyPlanWithTasks(supabase, childId);

  if (!plan) {
    return null;
  }

  return formatWeeklyPlan(plan);
}

export async function updateWeeklyTaskProgressForFamily(
  supabase: SupabaseClient,
  input: { familyId: UUID; taskId: UUID; completedCount: number }
) {
  const task = await getWeeklyTaskForFamily(supabase, input);

  if (!task) {
    throw new WeeklyPlanNotFoundError("Weekly task was not found for this family");
  }

  const progress = buildWeeklyTaskProgressUpdate(task, input.completedCount);
  const updatedTask = await updateWeeklyTaskProgress(supabase, {
    taskId: input.taskId,
    completedCount: progress.completedCount,
    status: progress.status
  });

  return {
    task: updatedTask,
    previousCompletedCount: task.completed_count,
    completedCountIncreased: progress.completedCount > task.completed_count
  };
}

export function buildWeeklyTaskProgressUpdate(
  task: Pick<WeeklyTaskRecord, "planned_count">,
  completedCount: number
) {
  if (completedCount > task.planned_count) {
    throw new WeeklyTaskProgressError("Completed count cannot exceed planned count");
  }

  return {
    completedCount,
    status: deriveWeeklyTaskStatus(task.planned_count, completedCount)
  };
}

export function deriveWeeklyTaskStatus(
  plannedCount: number,
  completedCount: number
): WeeklyTaskStatus {
  if (plannedCount === 0 || completedCount >= plannedCount) {
    return "completed";
  }

  if (completedCount === 0) {
    return "not_started";
  }

  return "in_progress";
}

export function groupWeeklyTasksByAssignee(tasks: WeeklyTaskRecord[]) {
  return {
    father: tasks.filter((task) => task.assignee_type === "father"),
    mother: tasks.filter((task) => task.assignee_type === "mother"),
    child: tasks.filter((task) => task.assignee_type === "child"),
    family: tasks.filter((task) => task.assignee_type === "family")
  } satisfies Record<TaskAssigneeType, WeeklyTaskRecord[]>;
}

function formatWeeklyPlan(plan: WeeklyPlanRecord) {
  return {
    ...plan,
    groupedTasks: groupWeeklyTasksByAssignee(plan.weekly_tasks)
  };
}

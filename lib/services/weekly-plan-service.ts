import type { SupabaseClient } from "@supabase/supabase-js";
import { createWeeklyPlanDraftFallback } from "@/lib/ai/modes/weekly-plan-draft";
import type { WeeklyPlanDraftResponse } from "@/lib/ai/modes/weekly-plan-draft";
import { assembleAIContext } from "@/lib/ai/context";
import type {
  TaskAssigneeType,
  UUID,
  WeeklyTaskStatus
} from "@/lib/domain/types";
import {
  archiveStaleActiveWeeklyPlans,
  createWeeklyPlan,
  getActiveWeeklyPlanForWeekWithTasks,
  getWeeklyTaskForFamily,
  insertWeeklyTasks,
  updateWeeklyTaskProgress,
  type WeeklyPlanRecord,
  type WeeklyTaskInsertInput,
  type WeeklyTaskRecord
} from "@/lib/repositories/weekly-plan-repo";
import { generateAICoachResponse } from "@/lib/services/ai-coach-service";
import { resolveActiveChildId } from "@/lib/services/active-child-service";

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
  familyId: UUID,
  options?: { childId?: UUID; allowAutoGenerate?: boolean; referenceDate?: Date }
) {
  const childId = await resolveActiveChildId(supabase, {
    familyId,
    childId: options?.childId
  });

  if (!childId) {
    return null;
  }

  return ensureCurrentWeeklyPlanForChild(supabase, familyId, childId, options);
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

export function getWeekWindowForDate(referenceDate: Date) {
  const weekStart = startOfWeekUtc(referenceDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

  return {
    weekStart,
    weekEnd,
    weekStartDate: toISODate(weekStart),
    weekEndDate: toISODate(weekEnd)
  };
}

export function isWeeklyPlanActiveForDate(
  plan: Pick<WeeklyPlanRecord, "status" | "week_start_date" | "week_end_date">,
  referenceDate: Date
) {
  const currentDate = toISODate(referenceDate);
  return (
    plan.status === "active" &&
    plan.week_start_date <= currentDate &&
    plan.week_end_date >= currentDate
  );
}

async function ensureCurrentWeeklyPlanForChild(
  supabase: SupabaseClient,
  familyId: UUID,
  childId: UUID,
  options?: { allowAutoGenerate?: boolean; referenceDate?: Date }
) {
  const referenceDate = options?.referenceDate ?? new Date();
  const weekWindow = getWeekWindowForDate(referenceDate);
  const currentWeekPlan = await getActiveWeeklyPlanForWeekWithTasks(supabase, {
    childId,
    weekStartDate: weekWindow.weekStartDate,
    weekEndDate: weekWindow.weekEndDate
  });

  if (currentWeekPlan) {
    return formatWeeklyPlan(currentWeekPlan);
  }

  if (options?.allowAutoGenerate === false) {
    return null;
  }

  await archiveStaleActiveWeeklyPlans(supabase, {
    childId,
    currentWeekStartDate: weekWindow.weekStartDate
  });

  const plan = await createCurrentWeekPlan(supabase, {
    familyId,
    childId,
    weekStartDate: weekWindow.weekStartDate,
    weekEndDate: weekWindow.weekEndDate,
    referenceDate
  });

  return formatWeeklyPlan(plan);
}

async function createCurrentWeekPlan(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    childId: UUID;
    weekStartDate: string;
    weekEndDate: string;
    referenceDate: Date;
  }
) {
  const context = await assembleAIContext(
    supabase,
    input.familyId,
    input.referenceDate,
    input.childId
  );
  const generatedResponse = await generateWeeklyPlanDraft(context, {
    weekStartDate: input.weekStartDate,
    weekEndDate: input.weekEndDate
  });
  const draft = normalizeWeeklyPlanDraft(generatedResponse, context);

  try {
    const createdPlan = await createWeeklyPlan(supabase, {
      childId: input.childId,
      weekStartDate: input.weekStartDate,
      weekEndDate: input.weekEndDate,
      theme: draft.theme,
      source: "system",
      status: "active",
      readingRecommendation: draft.readingRecommendation,
      englishRecommendation: draft.englishRecommendation,
      weekendActivity: draft.weekendActivity
    });

    const tasks = await insertWeeklyTasks(
      supabase,
      buildWeeklyTaskInserts(createdPlan.id, draft)
    );

    return {
      ...createdPlan,
      weekly_tasks: tasks
    } satisfies WeeklyPlanRecord;
  } catch (error) {
    if (isDuplicateCurrentWeekPlanError(error)) {
      const existingPlan = await getActiveWeeklyPlanForWeekWithTasks(supabase, {
        childId: input.childId,
        weekStartDate: input.weekStartDate,
        weekEndDate: input.weekEndDate
      });

      if (existingPlan) {
        return existingPlan;
      }
    }

    throw error;
  }
}

async function generateWeeklyPlanDraft(
  context: Awaited<ReturnType<typeof assembleAIContext>>,
  weekWindow: { weekStartDate: string; weekEndDate: string }
) {
  const response = await generateAICoachResponse(
    "weekly_plan_draft",
    `请基于最近完成情况，为${weekWindow.weekStartDate}到${weekWindow.weekEndDate}这一自然周生成轻量周计划。`,
    context
  );

  if (response.mode === "weekly_plan_draft") {
    return response;
  }

  return createWeeklyPlanDraftFallback(context);
}

function normalizeWeeklyPlanDraft(
  response: WeeklyPlanDraftResponse,
  context: Awaited<ReturnType<typeof assembleAIContext>>
) {
  const fallback = createWeeklyPlanDraftFallback(context);

  return {
    mode: "weekly_plan_draft" as const,
    theme: response.theme || fallback.theme,
    fatherTasks: response.fatherTasks.length > 0 ? response.fatherTasks : fallback.fatherTasks,
    motherTasks: response.motherTasks.length > 0 ? response.motherTasks : fallback.motherTasks,
    childTasks: response.childTasks.length > 0 ? response.childTasks : fallback.childTasks,
    readingRecommendation:
      response.readingRecommendation || fallback.readingRecommendation,
    englishRecommendation:
      response.englishRecommendation || fallback.englishRecommendation,
    weekendActivity: response.weekendActivity || fallback.weekendActivity
  } satisfies WeeklyPlanDraftResponse;
}

export function buildWeeklyTaskInserts(
  weeklyPlanId: UUID,
  draft: WeeklyPlanDraftResponse
) {
  return [
    ...toWeeklyTaskInserts(weeklyPlanId, "father", draft.fatherTasks),
    ...toWeeklyTaskInserts(weeklyPlanId, "mother", draft.motherTasks),
    ...toWeeklyTaskInserts(weeklyPlanId, "child", draft.childTasks),
    {
      weekly_plan_id: weeklyPlanId,
      assignee_type: "family",
      title: draft.weekendActivity,
      planned_count: 1
    }
  ] satisfies WeeklyTaskInsertInput[];
}

function toWeeklyTaskInserts(
  weeklyPlanId: UUID,
  assigneeType: TaskAssigneeType,
  tasks: WeeklyPlanDraftResponse["fatherTasks"]
) {
  return tasks.map(
    (task) =>
      ({
        weekly_plan_id: weeklyPlanId,
        assignee_type: assigneeType,
        title: task.title,
        planned_count: task.plannedCount
      }) satisfies WeeklyTaskInsertInput
  );
}

function startOfWeekUtc(referenceDate: Date) {
  const current = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate()
    )
  );
  const weekday = current.getUTCDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  current.setUTCDate(current.getUTCDate() - daysSinceMonday);
  return current;
}

function toISODate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function isDuplicateCurrentWeekPlanError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function formatWeeklyPlan(plan: WeeklyPlanRecord) {
  return {
    ...plan,
    groupedTasks: groupWeeklyTasksByAssignee(plan.weekly_tasks)
  };
}

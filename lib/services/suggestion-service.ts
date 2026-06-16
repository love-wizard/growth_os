import type { SupabaseClient } from "@supabase/supabase-js";
import type { FirstGuidanceSuggestion } from "@/lib/ai/first-guidance";
import type { TaskAssigneeType, UUID } from "@/lib/domain/types";
import {
  acceptFirstGuidanceSession,
  getFirstGuidanceSessionForUser
} from "@/lib/repositories/first-guidance-repo";
import { insertWeeklyTasks } from "@/lib/repositories/weekly-plan-repo";
import { getCurrentWeeklyPlanForFamily } from "@/lib/services/weekly-plan-service";

export interface AcceptSuggestionInput {
  sessionId: UUID;
  userId: UUID;
  familyId?: UUID;
  addToWeeklyPlan?: boolean;
  taskAssigneeType?: TaskAssigneeType;
}

export interface AcceptSuggestionResult {
  accepted: true;
  addedToWeeklyPlan: boolean;
  weeklyTaskId: UUID | null;
}

export class FirstGuidanceSessionNotFoundError extends Error {
  constructor(message = "First guidance session was not found") {
    super(message);
    this.name = "FirstGuidanceSessionNotFoundError";
  }
}

export class FamilyWorkspaceRequiredError extends Error {
  constructor(message = "Family workspace is required") {
    super(message);
    this.name = "FamilyWorkspaceRequiredError";
  }
}

export async function acceptTodaySuggestion(
  supabase: SupabaseClient,
  input: AcceptSuggestionInput
): Promise<AcceptSuggestionResult> {
  const session = await getFirstGuidanceSessionForUser(supabase, {
    sessionId: input.sessionId,
    userId: input.userId
  });

  if (!session) {
    throw new FirstGuidanceSessionNotFoundError();
  }

  if (!input.addToWeeklyPlan) {
    await acceptFirstGuidanceSession(supabase, {
      sessionId: input.sessionId,
      userId: input.userId
    });

    return {
      accepted: true,
      addedToWeeklyPlan: false,
      weeklyTaskId: null
    };
  }

  if (session.added_to_weekly_plan_task_id) {
    return {
      accepted: true,
      addedToWeeklyPlan: true,
      weeklyTaskId: session.added_to_weekly_plan_task_id
    };
  }

  const weeklyTaskId = await addSuggestionToCurrentWeeklyPlan(supabase, input, session.today_suggestion);
  await acceptFirstGuidanceSession(supabase, {
    sessionId: input.sessionId,
    userId: input.userId,
    weeklyTaskId
  });

  return {
    accepted: true,
    addedToWeeklyPlan: Boolean(weeklyTaskId),
    weeklyTaskId
  };
}

async function addSuggestionToCurrentWeeklyPlan(
  _supabase: SupabaseClient,
  _input: AcceptSuggestionInput,
  _suggestion: FirstGuidanceSuggestion
) {
  if (!_input.familyId) {
    throw new FamilyWorkspaceRequiredError();
  }

  const weeklyPlan = await getCurrentWeeklyPlanForFamily(_supabase, _input.familyId);

  if (!weeklyPlan) {
    throw new FamilyWorkspaceRequiredError("Child profile is required before adding to weekly plan");
  }

  const [task] = await insertWeeklyTasks(_supabase, [
    {
      weekly_plan_id: weeklyPlan.id,
      assignee_type: _input.taskAssigneeType ?? "family",
      title: buildSuggestionTaskTitle(_suggestion),
      planned_count: 1
    }
  ]);

  return task?.id ?? null;
}

export function buildSuggestionTaskTitle(suggestion: FirstGuidanceSuggestion) {
  const actionTitle = suggestion.action
    .replace(/^今晚只做一个\d+分钟的小行动[:：]\s*/, "")
    .replace(/^今晚[:：]?\s*/, "")
    .split(/[，。；]/)[0]
    ?.trim();

  if (actionTitle && actionTitle.length >= 4) {
    return actionTitle.slice(0, 32);
  }

  return suggestion.title.trim().slice(0, 32) || "完成今天的陪伴建议";
}

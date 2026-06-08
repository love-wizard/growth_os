import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskAssigneeType, UUID } from "@/lib/domain/types";
import { acceptFirstGuidanceSession } from "@/lib/repositories/first-guidance-repo";

export interface AcceptSuggestionInput {
  sessionId: UUID;
  addToWeeklyPlan?: boolean;
  taskAssigneeType?: TaskAssigneeType;
}

export interface AcceptSuggestionResult {
  accepted: true;
  addedToWeeklyPlan: boolean;
  weeklyTaskId: UUID | null;
}

export async function acceptTodaySuggestion(
  supabase: SupabaseClient,
  input: AcceptSuggestionInput
): Promise<AcceptSuggestionResult> {
  const weeklyTaskId = input.addToWeeklyPlan
    ? await addSuggestionToCurrentWeeklyPlan(supabase, input)
    : null;

  await acceptFirstGuidanceSession(supabase, input.sessionId, weeklyTaskId);

  return {
    accepted: true,
    addedToWeeklyPlan: Boolean(weeklyTaskId),
    weeklyTaskId
  };
}

async function addSuggestionToCurrentWeeklyPlan(
  _supabase: SupabaseClient,
  _input: AcceptSuggestionInput
) {
  // The full weekly plan service is implemented in US4. US1 records acceptance first.
  return null;
}

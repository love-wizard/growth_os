import type { SupabaseClient } from "@supabase/supabase-js";
import type { FirstGuidanceSuggestion } from "@/lib/ai/first-guidance";
import type { UUID } from "@/lib/domain/types";
import type { FirstGuidanceRequest } from "@/lib/validation/schemas";

export interface CreateFirstGuidanceSessionInput {
  userId: UUID;
  request: FirstGuidanceRequest;
  todaySuggestion: FirstGuidanceSuggestion;
}

export async function createFirstGuidanceSession(
  supabase: SupabaseClient,
  input: CreateFirstGuidanceSessionInput
) {
  const { data, error } = await supabase
    .from("first_guidance_sessions")
    .insert({
      user_id: input.userId,
      child_nickname: input.request.childNickname,
      child_birth_date: input.request.childBirthDate,
      focus_directions: input.request.focusDirections,
      current_challenge: input.request.currentChallenge,
      child_traits: input.request.childTraits,
      today_suggestion: input.todaySuggestion
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as UUID;
}

export async function acceptFirstGuidanceSession(
  supabase: SupabaseClient,
  sessionId: UUID,
  weeklyTaskId?: UUID | null
) {
  const { error } = await supabase
    .from("first_guidance_sessions")
    .update({
      accepted_at: new Date().toISOString(),
      added_to_weekly_plan_task_id: weeklyTaskId ?? null
    })
    .eq("id", sessionId);

  if (error) {
    throw error;
  }
}

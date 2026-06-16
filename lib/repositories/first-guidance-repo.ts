import type { SupabaseClient } from "@supabase/supabase-js";
import type { FirstGuidanceSuggestion } from "@/lib/ai/first-guidance";
import type { UUID } from "@/lib/domain/types";
import type { FirstGuidanceRequest } from "@/lib/validation/schemas";

export interface FirstGuidanceSessionRecord {
  id: UUID;
  user_id: UUID;
  today_suggestion: FirstGuidanceSuggestion;
  accepted_at: string | null;
  added_to_weekly_plan_task_id: UUID | null;
}

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
  input: {
    sessionId: UUID;
    userId: UUID;
    acceptedAt?: string;
    weeklyTaskId?: UUID | null;
  }
) {
  const updates: {
    accepted_at: string;
    added_to_weekly_plan_task_id?: UUID | null;
  } = {
    accepted_at: input.acceptedAt ?? new Date().toISOString()
  };

  if (input.weeklyTaskId !== undefined) {
    updates.added_to_weekly_plan_task_id = input.weeklyTaskId;
  }

  const { error } = await supabase
    .from("first_guidance_sessions")
    .update(updates)
    .eq("id", input.sessionId)
    .eq("user_id", input.userId);

  if (error) {
    throw error;
  }
}

export async function getFirstGuidanceSessionForUser(
  supabase: SupabaseClient,
  input: { sessionId: UUID; userId: UUID }
) {
  const { data, error } = await supabase
    .from("first_guidance_sessions")
    .select("id,user_id,today_suggestion,accepted_at,added_to_weekly_plan_task_id")
    .eq("id", input.sessionId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as FirstGuidanceSessionRecord | null;
}

export async function getFirstGuidanceSessionByWeeklyTaskId(
  supabase: SupabaseClient,
  weeklyTaskId: UUID
) {
  const { data, error } = await supabase
    .from("first_guidance_sessions")
    .select("id,user_id,today_suggestion,accepted_at,added_to_weekly_plan_task_id")
    .eq("added_to_weekly_plan_task_id", weeklyTaskId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as FirstGuidanceSessionRecord | null;
}

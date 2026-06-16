import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeatureEntrySurface, TaskAssigneeType, UUID } from "@/lib/domain/types";
import { recordProductMetricEvent } from "@/lib/metrics/product-events";

export function recordFirstGuidanceGenerated(
  supabase: SupabaseClient,
  input: { familyId?: UUID | null; userId: UUID; sessionId: UUID }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId ?? null,
    userId: input.userId,
    eventName: "first_guidance_generated",
    eventProperties: {
      sessionId: input.sessionId
    }
  });
}

export function recordAISuggestionAdopted(
  supabase: SupabaseClient,
  input: {
    familyId?: UUID | null;
    userId: UUID;
    sessionId: UUID;
    actionType?: "accept_only" | "add_to_weekly_plan";
    weeklyTaskId?: UUID;
    assigneeType?: TaskAssigneeType;
    entrySurface?: FeatureEntrySurface;
  }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId ?? null,
    userId: input.userId,
    eventName: "ai_suggestion_adopted",
    eventProperties: {
      sessionId: input.sessionId,
      ...(input.actionType ? { actionType: input.actionType } : {}),
      ...(input.weeklyTaskId ? { weeklyTaskId: input.weeklyTaskId } : {}),
      ...(input.assigneeType ? { assigneeType: input.assigneeType } : {}),
      ...(input.entrySurface ? { entrySurface: input.entrySurface } : {})
    }
  });
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AICoachMode, UUID } from "@/lib/domain/types";
import { recordProductMetricEvent } from "@/lib/metrics/product-events";

export function recordAICoachModeUsed(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; mode: AICoachMode; conversationId?: UUID }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: "generic_ai_comparison_recorded",
    eventProperties: {
      mode: input.mode,
      conversationId: input.conversationId ?? null,
      comparison: "context_grounded_growth_coach"
    }
  });
}

export function recordAICoachSuggestionAdopted(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; conversationId: UUID; mode: AICoachMode }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: "ai_suggestion_adopted",
    eventProperties: {
      conversationId: input.conversationId,
      mode: input.mode
    }
  });
}

export function recordExpertTrustFeedback(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; conversationId: UUID; trusted: boolean }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: "expert_trust_feedback_recorded",
    eventProperties: {
      conversationId: input.conversationId,
      trusted: input.trusted
    }
  });
}

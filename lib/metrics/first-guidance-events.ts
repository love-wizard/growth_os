import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
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
  input: { familyId?: UUID | null; userId: UUID; sessionId: UUID }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId ?? null,
    userId: input.userId,
    eventName: "ai_suggestion_adopted",
    eventProperties: {
      sessionId: input.sessionId
    }
  });
}

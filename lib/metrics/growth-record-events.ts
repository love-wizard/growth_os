import type { SupabaseClient } from "@supabase/supabase-js";
import type { GrowthRecordDraftSourceType, UUID } from "@/lib/domain/types";
import { recordProductMetricEvent } from "@/lib/metrics/product-events";

export function recordGrowthRecordCreated(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; recordId: UUID }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: "growth_record_created",
    eventProperties: {
      recordId: input.recordId
    }
  });
}

export function recordGrowthRecordDraftCreated(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    userId: UUID;
    recordId: UUID;
    sourceType: GrowthRecordDraftSourceType;
  }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: "growth_record_created",
    eventProperties: {
      recordId: input.recordId,
      draft: true,
      sourceType: input.sourceType
    }
  });
}

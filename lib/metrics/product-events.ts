import type { SupabaseClient } from "@supabase/supabase-js";
import {
  productMetricEventNames,
  type ProductMetricEventName,
  type UUID
} from "@/lib/domain/types";

export const forbiddenProductEventPropertyKeys = [
  "child_rank",
  "childRank",
  "rank",
  "ranking",
  "leaderboard",
  "score_comparison",
  "scoreComparison",
  "peer_comparison",
  "peerComparison",
  "class_ranking",
  "classRanking"
] as const;

export class ProductEventValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductEventValidationError";
  }
}

export interface ProductMetricEventInput {
  familyId?: UUID | null;
  userId?: UUID | null;
  eventName: ProductMetricEventName;
  eventProperties?: Record<string, unknown>;
  occurredAt?: string;
}

export function assertValidProductMetricEventName(
  eventName: string
): asserts eventName is ProductMetricEventName {
  if (!productMetricEventNames.includes(eventName as ProductMetricEventName)) {
    throw new ProductEventValidationError(`Unsupported event name: ${eventName}`);
  }
}

export function assertPrivacySafeEventProperties(
  eventProperties: Record<string, unknown> = {}
) {
  const blockedKey = findForbiddenPropertyKey(eventProperties);

  if (blockedKey) {
    throw new ProductEventValidationError(
      `Product metric events must not include child ranking or comparison property: ${blockedKey}`
    );
  }
}

export async function recordProductMetricEvent(
  supabase: SupabaseClient,
  input: ProductMetricEventInput
) {
  assertValidProductMetricEventName(input.eventName);
  assertPrivacySafeEventProperties(input.eventProperties);

  const { error } = await supabase.from("product_metric_events").insert({
    family_id: input.familyId ?? null,
    user_id: input.userId ?? null,
    event_name: input.eventName,
    event_properties: input.eventProperties ?? {},
    occurred_at: input.occurredAt ?? new Date().toISOString()
  });

  if (error) {
    throw error;
  }
}

function findForbiddenPropertyKey(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findForbiddenPropertyKey(item);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (forbiddenProductEventPropertyKeys.includes(key as never)) {
      return key;
    }

    const nested = findForbiddenPropertyKey(nestedValue);
    if (nested) {
      return nested;
    }
  }

  return null;
}

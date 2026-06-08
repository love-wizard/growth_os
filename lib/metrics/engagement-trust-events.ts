import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReminderType, UUID } from "@/lib/domain/types";
import { recordProductMetricEvent } from "@/lib/metrics/product-events";

export function recordWarmReminderEnabled(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; reminderType: ReminderType }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: "warm_reminder_enabled",
    eventProperties: {
      reminderType: input.reminderType
    }
  });
}

export function recordWarmReminderOpened(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; reminderType: ReminderType }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: "warm_reminder_opened",
    eventProperties: {
      reminderType: input.reminderType
    }
  });
}

export function recordWarmReminderActionCompleted(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; reminderType: ReminderType }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: "warm_reminder_action_completed",
    eventProperties: {
      reminderType: input.reminderType
    }
  });
}

export function recordExpertReviewCompleted(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; conversationId: UUID; reviewId: UUID }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: "expert_review_completed",
    eventProperties: {
      conversationId: input.conversationId,
      reviewId: input.reviewId
    }
  });
}

export function recordExpertTrustFeedbackEvent(
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

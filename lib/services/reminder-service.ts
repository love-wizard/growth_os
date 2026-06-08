import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReminderType, UUID } from "@/lib/domain/types";
import { recordWarmReminderEnabled } from "@/lib/metrics/engagement-trust-events";
import { upsertWarmReminderPreference } from "@/lib/repositories/reminder-repo";
import type { z } from "zod";
import { notificationPreferenceRequestSchema } from "@/lib/validation/schemas";

const blockedReminderCopy = /落后|排名|必须|警告|不完成|输在起跑线/;

export type NotificationPreferenceRequest = z.infer<
  typeof notificationPreferenceRequestSchema
>;

export class ReminderPreferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReminderPreferenceError";
  }
}

export async function updateWarmReminderPreference(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    userId: UUID;
    preference: NotificationPreferenceRequest;
  }
) {
  const preference = normalizeReminderPreference(input.preference);
  const saved = await upsertWarmReminderPreference(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    reminderType: preference.reminderType,
    enabled: preference.enabled,
    preferredWindow: preference.preferredWindow
  });

  if (preference.enabled) {
    await recordWarmReminderEnabled(supabase, {
      familyId: input.familyId,
      userId: input.userId,
      reminderType: preference.reminderType
    });
  }

  return saved;
}

export function normalizeReminderPreference(
  preference: NotificationPreferenceRequest
) {
  if (!preference.enabled) {
    return {
      ...preference,
      preferredWindow: undefined
    };
  }

  return preference;
}

export function assertApprovedReminderCopy(copy: string) {
  if (blockedReminderCopy.test(copy)) {
    throw new ReminderPreferenceError("Reminder copy must stay low pressure");
  }
}

export function getDefaultReminderCopy(reminderType: ReminderType) {
  const copy: Record<ReminderType, string> = {
    evening_companionship: "今晚留10分钟，和孩子完成一件轻松的小事。",
    weekend_planning: "周末前选一个不用准备太多材料的家庭活动。",
    accepted_suggestion_follow_up: "昨天那条陪伴建议，可以用更小的版本再试一次。",
    weekly_reset: "新的一周，从一件最容易开始的小事进入节奏。"
  };

  const value = copy[reminderType];
  assertApprovedReminderCopy(value);
  return value;
}

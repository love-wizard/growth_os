import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReminderType, UUID } from "@/lib/domain/types";
import { recordWeChatMetricEvent } from "@/lib/metrics/wechat-events";
import { updateWarmReminderPreference } from "@/lib/services/reminder-service";

export async function updateWeChatSubscriptionPreference(
  supabase: SupabaseClient,
  input: {
    familyId: UUID;
    userId: UUID;
    reminderType: ReminderType;
    enabled: boolean;
    templateId?: string;
  }
) {
  const preference = await updateWarmReminderPreference(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    preference: {
      reminderType: input.reminderType,
      enabled: input.enabled
    }
  });

  if (input.enabled) {
    await recordWeChatMetricEvent(supabase, {
      familyId: input.familyId,
      userId: input.userId,
      eventName: "wechat_subscription_message_opted_in",
      eventProperties: {
        reminderType: input.reminderType,
        templateId: input.templateId ?? null
      }
    });
  }

  return preference;
}

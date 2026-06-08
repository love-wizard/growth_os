import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductMetricEventName, UUID } from "@/lib/domain/types";
import { recordProductMetricEvent } from "@/lib/metrics/product-events";

export function recordWeChatMetricEvent(
  supabase: SupabaseClient,
  input: {
    familyId?: UUID | null;
    userId?: UUID | null;
    eventName: WeChatMetricEventName;
    eventProperties?: Record<string, unknown>;
  }
) {
  return recordProductMetricEvent(supabase, {
    familyId: input.familyId ?? null,
    userId: input.userId ?? null,
    eventName: input.eventName,
    eventProperties: input.eventProperties ?? {}
  });
}

export type WeChatMetricEventName = Extract<
  ProductMetricEventName,
  | "wechat_mini_program_entry_opened"
  | "wechat_scenario_card_opened"
  | "wechat_family_invite_shared"
  | "wechat_family_invite_accepted"
  | "wechat_subscription_message_opted_in"
  | "wechat_subscription_message_opened"
  | "wechat_record_card_shared"
  | "wechat_private_beta_service_contacted"
  | "wechat_mini_program_code_scanned"
>;

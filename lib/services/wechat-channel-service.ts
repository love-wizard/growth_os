import type { SupabaseClient } from "@supabase/supabase-js";
import type { WeChatChannelEntryType, UUID } from "@/lib/domain/types";
import { recordWeChatMetricEvent, type WeChatMetricEventName } from "@/lib/metrics/wechat-events";
import { createWeChatChannelAttribution } from "@/lib/repositories/wechat-channel-repo";

const eventByEntryType: Record<WeChatChannelEntryType, WeChatMetricEventName> = {
  mini_program_entry: "wechat_mini_program_entry_opened",
  scenario_card: "wechat_scenario_card_opened",
  family_invite_card: "wechat_family_invite_shared",
  subscription_message: "wechat_subscription_message_opened",
  record_share_card: "wechat_record_card_shared",
  mini_program_code: "wechat_mini_program_code_scanned",
  customer_service: "wechat_private_beta_service_contacted",
  enterprise_wechat: "wechat_private_beta_service_contacted"
};

export async function recordWeChatChannelEntry(
  supabase: SupabaseClient,
  input: {
    familyId?: UUID | null;
    userId?: UUID | null;
    entryType: WeChatChannelEntryType;
    sourceContext?: Record<string, unknown>;
    relatedEntityType?: string;
    relatedEntityId?: UUID;
  }
) {
  const attributionId = await createWeChatChannelAttribution(supabase, input);
  await recordWeChatMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: eventByEntryType[input.entryType],
    eventProperties: {
      attributionId,
      entryType: input.entryType,
      ...input.sourceContext
    }
  });

  return attributionId;
}

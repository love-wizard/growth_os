import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { recordWeChatMetricEvent } from "@/lib/metrics/wechat-events";
import { getGrowthRecordForFamily } from "@/lib/repositories/growth-record-repo";

export async function createWeChatRecordSharePreview(
  supabase: SupabaseClient,
  input: { familyId: UUID; userId: UUID; recordId: UUID }
) {
  const record = await getGrowthRecordForFamily(supabase, {
    familyId: input.familyId,
    recordId: input.recordId
  });

  if (!record || record.deleted_at) {
    throw new Error("Growth record was not found");
  }

  await recordWeChatMetricEvent(supabase, {
    familyId: input.familyId,
    userId: input.userId,
    eventName: "wechat_record_card_shared",
    eventProperties: {
      recordId: input.recordId
    }
  });

  return buildPrivacySafeRecordPreview({
    happenedOn: record.happened_on,
    text: record.text,
    tags: record.tags
  });
}

export function buildPrivacySafeRecordPreview(input: {
  happenedOn: string;
  text: string;
  tags?: string[];
}) {
  return {
    happenedOn: input.happenedOn,
    text: input.text.slice(0, 80),
    tags: input.tags ?? []
  };
}

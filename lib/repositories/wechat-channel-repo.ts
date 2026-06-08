import type { SupabaseClient } from "@supabase/supabase-js";
import type { WeChatChannelEntryType, UUID } from "@/lib/domain/types";

export async function createWeChatChannelAttribution(
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
  const { data, error } = await supabase
    .from("wechat_channel_attributions")
    .insert({
      family_id: input.familyId ?? null,
      user_id: input.userId ?? null,
      entry_type: input.entryType,
      source_context: input.sourceContext ?? {},
      related_entity_type: input.relatedEntityType ?? null,
      related_entity_id: input.relatedEntityId ?? null
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as UUID;
}

export async function upsertWeChatIdentityBinding(
  supabase: SupabaseClient,
  input: {
    userId: UUID;
    wechatOpenId: string;
    wechatUnionId?: string | null;
    miniProgramAppId: string;
  }
) {
  const { data, error } = await supabase
    .from("wechat_identity_bindings")
    .upsert(
      {
        user_id: input.userId,
        wechat_open_id: input.wechatOpenId,
        wechat_union_id: input.wechatUnionId ?? null,
        mini_program_app_id: input.miniProgramAppId,
        binding_status: "active",
        last_seen_at: new Date().toISOString()
      },
      { onConflict: "mini_program_app_id,wechat_open_id" }
    )
    .select("id,wechat_open_id,binding_status")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

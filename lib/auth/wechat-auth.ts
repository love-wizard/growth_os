import type { SupabaseClient } from "@supabase/supabase-js";
import type { UUID } from "@/lib/domain/types";
import { upsertWeChatIdentityBinding } from "@/lib/repositories/wechat-channel-repo";

export async function bindWeChatIdentity(
  supabase: SupabaseClient,
  input: { userId: UUID; code: string; miniProgramAppId?: string }
) {
  const identity = exchangeCodeForMockIdentity(input.code);

  return upsertWeChatIdentityBinding(supabase, {
    userId: input.userId,
    wechatOpenId: identity.openId,
    wechatUnionId: identity.unionId,
    miniProgramAppId: input.miniProgramAppId ?? process.env.WECHAT_MINI_PROGRAM_APP_ID ?? "growth-os-dev"
  });
}

export function exchangeCodeForMockIdentity(code: string) {
  return {
    openId: `mock_openid_${code.slice(0, 12)}`,
    unionId: null
  };
}

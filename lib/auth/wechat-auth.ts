import type { SupabaseClient } from "@supabase/supabase-js";
import { createHmac, createHash } from "node:crypto";
import type { UUID } from "@/lib/domain/types";
import { upsertWeChatIdentityBinding } from "@/lib/repositories/wechat-channel-repo";

type WeChatIdentity = {
  openId: string;
  unionId: string | null;
  sessionKey?: string;
};

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

export async function exchangeCodeForWeChatIdentity(
  code: string,
  env: NodeJS.ProcessEnv = process.env
): Promise<WeChatIdentity> {
  const appId = env.WECHAT_MINI_PROGRAM_APP_ID ?? "growth-os-dev";
  const appSecret = env.WECHAT_MINI_PROGRAM_APP_SECRET;

  if (!appSecret || appId === "growth-os-dev") {
    return exchangeCodeForMockIdentity(code);
  }

  const response = await fetch(
    `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(
      appId
    )}&secret=${encodeURIComponent(appSecret)}&js_code=${encodeURIComponent(
      code
    )}&grant_type=authorization_code`
  );
  const data = (await response.json()) as {
    openid?: string;
    unionid?: string;
    session_key?: string;
    errcode?: number;
    errmsg?: string;
  };

  if (!response.ok || data.errcode || !data.openid) {
    throw new Error(data.errmsg ?? "Unable to exchange WeChat login code");
  }

  return {
    openId: data.openid,
    unionId: data.unionid ?? null,
    sessionKey: data.session_key
  };
}

export function buildWeChatSupabaseEmail(input: {
  openId: string;
  miniProgramAppId: string;
}) {
  const hash = createHash("sha256")
    .update(`${input.miniProgramAppId}:${input.openId}`)
    .digest("hex")
    .slice(0, 32);

  return `wechat-${hash}@familylove.space`;
}

export function buildWeChatSupabasePassword(input: {
  openId: string;
  miniProgramAppId: string;
  secret: string;
}) {
  return createHmac("sha256", input.secret)
    .update(`${input.miniProgramAppId}:${input.openId}`)
    .digest("base64url");
}

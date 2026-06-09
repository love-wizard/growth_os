import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildWeChatSupabaseEmail,
  buildWeChatSupabasePassword,
  exchangeCodeForWeChatIdentity
} from "@/lib/auth/wechat-auth";
import { upsertWeChatIdentityBinding } from "@/lib/repositories/wechat-channel-repo";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { wechatIdentityBindingRequestSchema } from "@/lib/validation/schemas";

function isDuplicateUserError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.toLowerCase().includes("already") ||
      error.message.toLowerCase().includes("registered") ||
      error.message.toLowerCase().includes("exists"))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = wechatIdentityBindingRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid WeChat login request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const miniProgramAppId =
      process.env.WECHAT_MINI_PROGRAM_APP_ID ?? "growth-os-dev";
    const identity = await exchangeCodeForWeChatIdentity(parsed.data.code);
    const loginSecret =
      process.env.WECHAT_LOGIN_USER_SECRET ??
      process.env.WECHAT_MINI_PROGRAM_APP_SECRET ??
      "growth-os-dev-login-secret";
    const email = buildWeChatSupabaseEmail({
      openId: identity.openId,
      miniProgramAppId
    });
    const password = buildWeChatSupabasePassword({
      openId: identity.openId,
      miniProgramAppId,
      secret: loginSecret
    });
    const serviceSupabase = createServiceRoleSupabaseClient();

    const { data: created, error: createError } =
      await serviceSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          provider: "wechat_mini_program",
          wechatOpenId: identity.openId,
          wechatUnionId: identity.unionId,
          miniProgramAppId
        }
      });

    if (createError && !isDuplicateUserError(createError)) {
      throw createError;
    }

    const { url, anonKey } = getSupabasePublicEnv();
    const authSupabase = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    const {
      data: { session, user },
      error: signInError
    } = await authSupabase.auth.signInWithPassword({ email, password });

    if (signInError || !session || !user) {
      throw signInError ?? new Error("Unable to create WeChat user session");
    }

    await upsertWeChatIdentityBinding(serviceSupabase, {
      userId: user.id,
      wechatOpenId: identity.openId,
      wechatUnionId: identity.unionId,
      miniProgramAppId
    });

    return NextResponse.json({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at,
      userId: user.id,
      isNewUser: Boolean(created.user)
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("SUPABASE_SERVICE_ROLE_KEY")
    ) {
      return NextResponse.json(
        { error: "WeChat login is not configured" },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Unable to login with WeChat" }, { status: 400 });
  }
}

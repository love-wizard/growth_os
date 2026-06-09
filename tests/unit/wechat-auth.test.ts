import { describe, expect, it } from "vitest";
import {
  buildWeChatSupabaseEmail,
  buildWeChatSupabasePassword,
  exchangeCodeForWeChatIdentity
} from "@/lib/auth/wechat-auth";

describe("WeChat auth helpers", () => {
  it("builds stable Supabase credentials from WeChat identity", () => {
    const input = {
      openId: "openid-123",
      miniProgramAppId: "wx-app"
    };

    expect(buildWeChatSupabaseEmail(input)).toMatch(
      /^wechat-[a-f0-9]{32}@familylove\.space$/
    );
    expect(buildWeChatSupabaseEmail(input)).toBe(buildWeChatSupabaseEmail(input));
    expect(
      buildWeChatSupabasePassword({
        ...input,
        secret: "secret"
      })
    ).toBe(
      buildWeChatSupabasePassword({
        ...input,
        secret: "secret"
      })
    );
  });

  it("uses mock identity when WeChat app secret is not configured", async () => {
    await expect(
      exchangeCodeForWeChatIdentity("test-code", {
        WECHAT_MINI_PROGRAM_APP_ID: "growth-os-dev"
      } as unknown as NodeJS.ProcessEnv)
    ).resolves.toEqual({
      openId: "mock_openid_test-code",
      unionId: null
    });
  });
});

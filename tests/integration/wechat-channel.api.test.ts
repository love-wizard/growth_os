import { describe, expect, it } from "vitest";
import { exchangeCodeForMockIdentity } from "@/lib/auth/wechat-auth";
import { buildPrivacySafeRecordPreview } from "@/lib/services/wechat-record-share-service";

describe("WeChat channel API support logic", () => {
  it("creates deterministic mock identity for local binding", () => {
    const identity = exchangeCodeForMockIdentity("abc123456789xyz");

    expect(identity.openId).toBe("mock_openid_abc123456789");
  });

  it("builds privacy-safe record previews without media", () => {
    const preview = buildPrivacySafeRecordPreview({
      happenedOn: "2026-06-08",
      text: "第一次游过25米，附带一段家庭视频，但是分享卡只展示文字摘要。",
      tags: ["swimming"]
    });

    expect(preview.text).toContain("第一次游过25米");
    expect(preview).not.toHaveProperty("media");
  });
});

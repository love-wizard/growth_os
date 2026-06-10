import { describe, expect, it } from "vitest";
import { stripGrowthRecordMedia } from "@/lib/ai/context";
import { assertPrivacySafeEventProperties } from "@/lib/metrics/product-events";
import { generateInvestmentValidationScorecard } from "@/lib/metrics/scorecard-report";
import { buildPrivacySafeRecordPreview } from "@/lib/services/wechat-record-share-service";

describe("privacy boundaries", () => {
  it("excludes media from AI context", () => {
    const records = stripGrowthRecordMedia([
      {
        id: "record-id",
        happened_on: "2026-06-08",
        text: "第一次游过25米。"
      }
    ]);

    expect(records[0]).not.toHaveProperty("storage_path");
  });

  it("keeps WeChat record share previews scoped to tags, text, and approved photos", () => {
    const preview = buildPrivacySafeRecordPreview({
      happenedOn: "2026-06-08",
      text: "第一次主动练琴20分钟。",
      tags: ["piano"],
      photoUrls: ["https://example.com/photo.jpg"]
    });

    expect(preview).toMatchObject({
      happenedOn: "2026-06-08",
      text: "第一次主动练琴20分钟。",
      tags: ["piano"],
      photoUrls: ["https://example.com/photo.jpg"]
    });
  });

  it("blocks ranking or peer comparison metric properties", () => {
    expect(() =>
      assertPrivacySafeEventProperties({ childRank: 1 })
    ).toThrow(/ranking|comparison/);
  });

  it("reports validation counts without exposing child details", () => {
    const report = generateInvestmentValidationScorecard([
      {
        event_name: "first_guidance_generated",
        family_id: "family-id",
        user_id: "user-id"
      }
    ]);

    expect(report.uniqueFamilies).toBe(1);
    expect(JSON.stringify(report)).not.toContain("child");
  });
});

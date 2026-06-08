import { describe, expect, it } from "vitest";
import { stripGrowthRecordMedia } from "@/lib/ai/context";
import { buildDraftText } from "@/lib/services/growth-record-draft-service";
import { buildRestoreWindow } from "@/lib/services/growth-record-service";
import {
  buildGrowthMediaStoragePath,
  inferGrowthMediaType
} from "@/lib/services/storage-service";

describe("growth records API support logic", () => {
  it("builds a 30 day restore window for soft delete", () => {
    const window = buildRestoreWindow(new Date("2026-06-08T00:00:00.000Z"));

    expect(window.deletedAt).toBe("2026-06-08T00:00:00.000Z");
    expect(window.restoreUntil).toBe("2026-07-08T00:00:00.000Z");
  });

  it("creates draft text from weekly task sources", () => {
    expect(buildDraftText("weekly_task")).toMatch(/本周成长任务/);
    expect(buildDraftText("parent_note", "第一次游过25米。")).toBe("第一次游过25米。");
  });

  it("keeps AI context free of media metadata", () => {
    const records = stripGrowthRecordMedia([
      {
        id: "record-id",
        happened_on: "2026-06-08",
        text: "第一次游过25米。",
        tags: ["swimming"],
        parent_notes: "附带视频"
      }
    ]);

    expect(records[0]).not.toHaveProperty("media");
    expect(records[0].text).toBe("第一次游过25米。");
  });

  it("creates private storage paths and media type", () => {
    const path = buildGrowthMediaStoragePath({
      familyId: "family-id",
      childId: "child-id",
      recordId: "record-id",
      fileName: "first swim.mov"
    });

    expect(path).toBe("family-id/child-id/record-id/first_swim.mov");
    expect(inferGrowthMediaType("video/mp4")).toBe("video");
    expect(inferGrowthMediaType("image/png")).toBe("photo");
  });
});

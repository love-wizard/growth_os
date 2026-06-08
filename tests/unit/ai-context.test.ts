import { describe, expect, it } from "vitest";
import {
  filterRecentNonDeletedByDate,
  getDateWindowStart,
  stripGrowthRecordMedia
} from "@/lib/ai/context";

describe("AI context assembly helpers", () => {
  it("calculates date windows from the reference date", () => {
    expect(getDateWindowStart(new Date("2026-06-08T00:00:00.000Z"), 28)).toBe(
      "2026-05-11"
    );
    expect(getDateWindowStart(new Date("2026-06-08T00:00:00.000Z"), 90)).toBe(
      "2026-03-10"
    );
  });

  it("filters deleted and out-of-window records", () => {
    const records = [
      { id: "1", happened_on: "2026-06-01", deleted_at: null },
      { id: "2", happened_on: "2026-06-02", deleted_at: "2026-06-03" },
      { id: "3", happened_on: "2026-02-01", deleted_at: null }
    ];

    expect(
      filterRecentNonDeletedByDate(
        records,
        new Date("2026-06-08T00:00:00.000Z"),
        90
      )
    ).toEqual([{ id: "1", happened_on: "2026-06-01", deleted_at: null }]);
  });

  it("strips media-shaped data from growth records", () => {
    const records = [
      {
        id: "record-1",
        happened_on: "2026-06-08",
        text: "第一次游过25米。",
        tags: ["swimming"],
        parent_notes: "很开心。",
        deleted_at: null,
        media: [{ storage_path: "private/video.mp4" }]
      }
    ];

    expect(stripGrowthRecordMedia(records)).toEqual([
      {
        id: "record-1",
        happened_on: "2026-06-08",
        text: "第一次游过25米。",
        tags: ["swimming"],
        parent_notes: "很开心。"
      }
    ]);
  });
});

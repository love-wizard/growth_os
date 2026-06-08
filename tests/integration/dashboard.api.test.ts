import { describe, expect, it } from "vitest";
import { getSupportiveProgressCopy } from "@/lib/services/progress-copy-service";

describe("dashboard API support logic", () => {
  it("uses supportive progress copy at zero progress", () => {
    const progress = getSupportiveProgressCopy([
      { plannedCount: 3, completedCount: 0 }
    ]);

    expect(progress.rate).toBe(0);
    expect(progress.description).not.toMatch(/失败|落后|警告/);
  });
});

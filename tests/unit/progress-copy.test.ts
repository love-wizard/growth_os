import { describe, expect, it } from "vitest";
import { getSupportiveProgressCopy } from "@/lib/services/progress-copy-service";

describe("getSupportiveProgressCopy", () => {
  it("does not use punitive wording for low completion", () => {
    const progress = getSupportiveProgressCopy([
      { plannedCount: 5, completedCount: 1 }
    ]);

    expect(`${progress.label}${progress.description}`).not.toMatch(
      /失败|落后|惩罚|警告|不合格/
    );
  });

  it("reports a stable completion label for high completion", () => {
    const progress = getSupportiveProgressCopy([
      { plannedCount: 5, completedCount: 5 }
    ]);

    expect(progress.label).toBe("陪伴很稳定");
  });
});

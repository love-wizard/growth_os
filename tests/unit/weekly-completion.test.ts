import { describe, expect, it } from "vitest";
import { calculateWeeklyCompletionRate } from "@/lib/services/weekly-completion";

describe("calculateWeeklyCompletionRate", () => {
  it("returns completed divided by planned across tasks", () => {
    expect(
      calculateWeeklyCompletionRate([
        { plannedCount: 3, completedCount: 2 },
        { plannedCount: 1, completedCount: 1 },
        { plannedCount: 4, completedCount: 1 }
      ])
    ).toBe(0.5);
  });

  it("returns zero when no work is planned", () => {
    expect(calculateWeeklyCompletionRate([])).toBe(0);
    expect(
      calculateWeeklyCompletionRate([{ plannedCount: 0, completedCount: 0 }])
    ).toBe(0);
  });

  it("caps completed count at planned count for defensive calculation", () => {
    expect(
      calculateWeeklyCompletionRate([{ plannedCount: 2, completedCount: 5 }])
    ).toBe(1);
  });
});

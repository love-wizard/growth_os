import { describe, expect, it } from "vitest";
import {
  buildWeeklyTaskProgressUpdate,
  groupWeeklyTasksByAssignee,
  WeeklyTaskProgressError
} from "@/lib/services/weekly-plan-service";
import type { WeeklyTaskRecord } from "@/lib/repositories/weekly-plan-repo";

describe("weekly plan API support logic", () => {
  it("derives task status from completed count", () => {
    expect(
      buildWeeklyTaskProgressUpdate({ planned_count: 3 }, 0).status
    ).toBe("not_started");
    expect(
      buildWeeklyTaskProgressUpdate({ planned_count: 3 }, 2).status
    ).toBe("in_progress");
    expect(
      buildWeeklyTaskProgressUpdate({ planned_count: 3 }, 3).status
    ).toBe("completed");
  });

  it("rejects completed count above plan", () => {
    expect(() => buildWeeklyTaskProgressUpdate({ planned_count: 2 }, 3)).toThrow(
      WeeklyTaskProgressError
    );
  });

  it("groups weekly tasks by parent and child role", () => {
    const tasks = [
      task("father-task", "father"),
      task("mother-task", "mother"),
      task("child-task", "child"),
      task("family-task", "family")
    ];

    const grouped = groupWeeklyTasksByAssignee(tasks);

    expect(grouped.father).toHaveLength(1);
    expect(grouped.mother).toHaveLength(1);
    expect(grouped.child).toHaveLength(1);
    expect(grouped.family).toHaveLength(1);
  });
});

function task(id: string, assigneeType: WeeklyTaskRecord["assignee_type"]) {
  return {
    id,
    weekly_plan_id: "weekly-plan-id",
    assignee_type: assigneeType,
    title: id,
    planned_count: 1,
    completed_count: 0,
    status: "not_started"
  } satisfies WeeklyTaskRecord;
}

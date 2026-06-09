import { describe, expect, it } from "vitest";
import { calculateWeeklyCompletionRate } from "@/lib/services/weekly-completion";
import {
  buildWeeklyTaskInserts,
  getWeekWindowForDate,
  isWeeklyPlanActiveForDate
} from "@/lib/services/weekly-plan-service";

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

  it("uses Monday to Sunday as the current week window", () => {
    const week = getWeekWindowForDate(new Date("2026-06-10T08:00:00.000Z"));

    expect(week.weekStartDate).toBe("2026-06-08");
    expect(week.weekEndDate).toBe("2026-06-14");
  });

  it("treats only plans covering the reference date as current", () => {
    expect(
      isWeeklyPlanActiveForDate(
        {
          status: "active",
          week_start_date: "2026-06-08",
          week_end_date: "2026-06-14"
        },
        new Date("2026-06-10T12:00:00.000Z")
      )
    ).toBe(true);

    expect(
      isWeeklyPlanActiveForDate(
        {
          status: "active",
          week_start_date: "2026-06-01",
          week_end_date: "2026-06-07"
        },
        new Date("2026-06-10T12:00:00.000Z")
      )
    ).toBe(false);
  });

  it("adds a family task from the weekend activity when building a generated plan", () => {
    const tasks = buildWeeklyTaskInserts("weekly-plan-id", {
      mode: "weekly_plan_draft",
      theme: "建立轻量陪伴节奏",
      fatherTasks: [{ title: "户外活动", plannedCount: 2 }],
      motherTasks: [{ title: "亲子共读", plannedCount: 3 }],
      childTasks: [{ title: "表达今天最喜欢的事", plannedCount: 3 }],
      readingRecommendation: "重复读一本孩子喜欢的绘本。",
      englishRecommendation: "每天5分钟英文输入。",
      weekendActivity: "周末一起去公园观察树叶。"
    });

    expect(tasks).toHaveLength(4);
    expect(tasks.at(-1)).toMatchObject({
      assignee_type: "family",
      title: "周末一起去公园观察树叶。",
      planned_count: 1
    });
  });
});

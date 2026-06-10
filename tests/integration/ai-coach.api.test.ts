import { describe, expect, it } from "vitest";
import type { AIContextSnapshot } from "@/lib/ai/context";
import type { AICoachMode } from "@/lib/domain/types";
import { buildConfirmedWeeklyPlanTasks } from "@/lib/repositories/ai-repo";
import { generateLocalResponse } from "@/lib/services/ai-coach-service";

describe("AI coach API support logic", () => {
  it.each([
    "parenting_qa",
    "activity_generation",
    "growth_analysis",
    "weekly_plan_draft"
  ] satisfies AICoachMode[])("generates grounded response for %s", (mode) => {
    const response = generateLocalResponse(mode, "今晚只有30分钟", sampleContext);

    expect(response.mode).toBe(mode);
    expect(JSON.stringify(response)).toMatch(/阅读习惯|陪伴|成长|表达|活动/);
  });

  it("keeps weekly plan drafts pending parent confirmation", () => {
    const response = generateLocalResponse(
      "weekly_plan_draft",
      "帮我生成下周计划",
      sampleContext
    );

    expect(response.mode).toBe("weekly_plan_draft");
    if (response.mode !== "weekly_plan_draft") {
      throw new Error("Expected weekly plan draft response");
    }
    expect(response.fatherTasks.length).toBeGreaterThan(0);
    expect(response.motherTasks.length).toBeGreaterThan(0);
  });

  it("includes a family task when confirming a weekly plan draft", () => {
    const tasks = buildConfirmedWeeklyPlanTasks("weekly-plan-id", {
      father_tasks: [{ title: "户外探索", plannedCount: 2 }],
      mother_tasks: [{ title: "亲子共读", plannedCount: 3 }],
      child_tasks: [{ title: "表达今天最喜欢的事", plannedCount: 3 }],
      weekend_activity: "周末去公园做一次观察"
    });

    expect(tasks).toHaveLength(4);
    expect(tasks.at(-1)).toMatchObject({
      assignee_type: "family",
      title: "周末去公园做一次观察",
      planned_count: 1
    });
  });
});

const sampleContext: AIContextSnapshot = {
  childProfile: {
    id: "child-id",
    nickname: "小钟",
    birth_date: "2020-06-01",
    gender: "male",
    child_interests: [{ name: "reading" }, { name: "piano" }]
  },
  annualGoals: [{ title: "阅读习惯", status: "active" }],
  weeklyPlans: [
    {
      id: "weekly-plan-id",
      week_start_date: "2026-06-08",
      week_end_date: "2026-06-14",
      theme: "建立阅读习惯"
    }
  ],
  interestParticipationRecords: [],
  growthRecords: [
    {
      id: "growth-record-id",
      happened_on: "2026-06-08",
      text: "第一次主动读完一本绘本"
    }
  ]
};

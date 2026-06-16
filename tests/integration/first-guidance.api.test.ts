import { describe, expect, it } from "vitest";
import {
  buildFirstGuidancePrompt,
  generateFallbackFirstGuidanceSuggestion
} from "@/lib/ai/first-guidance";
import { buildSuggestionTaskTitle } from "@/lib/services/suggestion-service";
import {
  acceptSuggestionRequestSchema,
  firstGuidanceRequestSchema,
  growthRecordDraftRequestSchema,
  updateTaskProgressRequestSchema,
  type FirstGuidanceRequest
} from "@/lib/validation/schemas";

const validRequest: FirstGuidanceRequest = {
  childNickname: "小钟",
  childBirthDate: "2021-06-01",
  focusDirections: ["reading_habit", "english_exposure"],
  currentChallenge: "limited_time_tonight",
  childTraits: ["curious"]
};

describe("first guidance API contract", () => {
  it("accepts the minimum first guidance request", () => {
    expect(firstGuidanceRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("rejects too few focus directions", () => {
    const result = firstGuidanceRequestSchema.safeParse({
      ...validRequest,
      focusDirections: ["reading_habit"]
    });

    expect(result.success).toBe(false);
  });

  it("generates a child-specific fallback suggestion", () => {
    const suggestion = generateFallbackFirstGuidanceSuggestion(validRequest);

    expect(suggestion.childSpecificContext).toContain("小钟");
    expect(suggestion.childSpecificContext).toContain("岁");
    expect(suggestion.action).toContain("今晚");
  });

  it("builds a prompt containing child context", () => {
    const prompt = buildFirstGuidancePrompt(validRequest);

    expect(prompt).toContain("孩子昵称：小钟");
    expect(prompt).toContain("当前挑战");
    expect(prompt).toContain("孩子特质");
  });

  it("requires assignee type when adding a suggestion to weekly plan", () => {
    expect(
      acceptSuggestionRequestSchema.safeParse({
        addToWeeklyPlan: true,
        entrySurface: "web_first_guidance"
      }).success
    ).toBe(false);

    expect(
      acceptSuggestionRequestSchema.safeParse({
        addToWeeklyPlan: true,
        taskAssigneeType: "family",
        entrySurface: "mp_setup"
      }).success
    ).toBe(true);
  });

  it("accepts draft context for growth record conversion surfaces", () => {
    expect(
      growthRecordDraftRequestSchema.safeParse({
        sourceType: "ai_suggestion",
        sourceId: "session-id",
        parentNote: "今晚真的试了一次。",
        entrySurface: "home",
        actionType: "create_record_draft"
      }).success
    ).toBe(true);
  });

  it("accepts completion context for weekly plan progress updates", () => {
    expect(
      updateTaskProgressRequestSchema.safeParse({
        completedCount: 1,
        entrySurface: "weekly_plan"
      }).success
    ).toBe(true);
  });

  it("normalizes suggestion copy into a weekly task title", () => {
    const title = buildSuggestionTaskTitle(
      generateFallbackFirstGuidanceSuggestion(validRequest)
    );

    expect(title).toContain("让孩子选择开始方式");
    expect(title.length).toBeLessThanOrEqual(32);
  });
});

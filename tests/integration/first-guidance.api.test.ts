import { describe, expect, it } from "vitest";
import {
  buildFirstGuidancePrompt,
  generateFallbackFirstGuidanceSuggestion
} from "@/lib/ai/first-guidance";
import {
  firstGuidanceRequestSchema,
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
});

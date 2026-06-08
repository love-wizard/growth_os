import { describe, expect, it } from "vitest";
import { expertReviewRequestSchema } from "@/lib/validation/schemas";

describe("expert review API support logic", () => {
  it("validates quality scores and safety boundary status", () => {
    const request = expertReviewRequestSchema.parse({
      conversationId: "00000000-0000-0000-0000-000000000001",
      reviewStatus: "passed",
      qualityScores: {
        specificity: 5,
        childContext: 5,
        safety: 5
      },
      safetyBoundaryPassed: true,
      reviewNotes: "回答结合孩子近期记录，建议具体。"
    });

    expect(request.qualityScores.specificity).toBe(5);
  });
});

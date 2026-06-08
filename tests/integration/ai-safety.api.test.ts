import { describe, expect, it } from "vitest";
import { classifyAISafetyBoundary } from "@/lib/ai/safety-boundary";

describe("AI safety boundary", () => {
  it("allows ordinary parenting questions", () => {
    const result = classifyAISafetyBoundary("孩子不想练琴怎么办？");

    expect(result.allowed).toBe(true);
  });

  it("routes medical or emergency questions to professional support", () => {
    const result = classifyAISafetyBoundary("孩子高烧不退应该用什么药量？");

    expect(result.allowed).toBe(false);
    expect(result.fallbackResponse?.title).toMatch(/真人专业支持/);
  });
});

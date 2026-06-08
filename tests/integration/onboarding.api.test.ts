import { describe, expect, it } from "vitest";
import { onboardingRequestSchema } from "@/lib/validation/schemas";

describe("onboarding API contract", () => {
  it("accepts complete child profile, interests, and annual goals", () => {
    const result = onboardingRequestSchema.safeParse({
      childProfile: {
        name: "钟小朋友",
        nickname: "小钟",
        birthDate: "2021-06-01",
        gender: "female"
      },
      interests: ["reading", "english"],
      annualGoals: [{ title: "阅读习惯" }, { title: "英语启蒙" }]
    });

    expect(result.success).toBe(true);
  });

  it("requires at least one annual goal", () => {
    const result = onboardingRequestSchema.safeParse({
      childProfile: {
        name: "钟小朋友",
        nickname: "小钟",
        birthDate: "2021-06-01",
        gender: "female"
      },
      interests: ["reading"],
      annualGoals: []
    });

    expect(result.success).toBe(false);
  });
});

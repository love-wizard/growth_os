import { describe, expect, it } from "vitest";
import {
  assertValidActualOutcome,
  InterestParticipationError
} from "@/lib/services/interest-participation-service";

describe("interest participation API support logic", () => {
  it("accepts completed participation with actual duration", () => {
    expect(() =>
      assertValidActualOutcome({
        interestId: "00000000-0000-0000-0000-000000000001",
        happenedOn: "2026-06-08",
        participationOutcome: "completed",
        durationMinutes: 20
      })
    ).not.toThrow();
  });

  it("rejects completed participation without actual outcome", () => {
    expect(() =>
      assertValidActualOutcome({
        interestId: "00000000-0000-0000-0000-000000000001",
        happenedOn: "2026-06-08",
        participationOutcome: "completed"
      })
    ).toThrow(InterestParticipationError);
  });

  it("rejects missed participation with positive duration", () => {
    expect(() =>
      assertValidActualOutcome({
        interestId: "00000000-0000-0000-0000-000000000001",
        happenedOn: "2026-06-08",
        participationOutcome: "missed",
        durationMinutes: 20
      })
    ).toThrow(InterestParticipationError);
  });
});

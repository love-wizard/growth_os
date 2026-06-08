import { describe, expect, it } from "vitest";
import {
  assertPrivacySafeEventProperties,
  assertValidProductMetricEventName,
  ProductEventValidationError
} from "@/lib/metrics/product-events";
import { isInvestmentValidationEvent } from "@/lib/metrics/validation-scorecard";

describe("product event validation", () => {
  it("accepts known product event names", () => {
    expect(() =>
      assertValidProductMetricEventName("first_guidance_generated")
    ).not.toThrow();
  });

  it("rejects unknown event names", () => {
    expect(() => assertValidProductMetricEventName("child_rank_changed")).toThrow(
      ProductEventValidationError
    );
  });

  it("rejects ranking and comparison properties recursively", () => {
    expect(() =>
      assertPrivacySafeEventProperties({
        source: "dashboard",
        nested: {
          child_rank: 1
        }
      })
    ).toThrow(ProductEventValidationError);
  });

  it("maps investment validation events", () => {
    expect(isInvestmentValidationEvent("payment_intent_recorded")).toBe(true);
    expect(isInvestmentValidationEvent("wechat_record_card_shared")).toBe(true);
  });
});

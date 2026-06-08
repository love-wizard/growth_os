import { describe, expect, it } from "vitest";
import {
  assertApprovedReminderCopy,
  getDefaultReminderCopy,
  normalizeReminderPreference,
  ReminderPreferenceError
} from "@/lib/services/reminder-service";

describe("reminder preference API support logic", () => {
  it("suppresses delivery window when reminders are disabled", () => {
    const preference = normalizeReminderPreference({
      reminderType: "evening_companionship",
      enabled: false,
      preferredWindow: "20:00-21:00"
    });

    expect(preference.preferredWindow).toBeUndefined();
  });

  it("keeps default reminder copy low pressure", () => {
    expect(getDefaultReminderCopy("weekly_reset")).toMatch(/小事/);
  });

  it("rejects anxiety-inducing reminder copy", () => {
    expect(() => assertApprovedReminderCopy("本周落后了，必须完成")).toThrow(
      ReminderPreferenceError
    );
  });
});

import type { ProductMetricEventName } from "@/lib/domain/types";
import {
  ahaLoopEventNames,
  reminderValidationEventNames,
  trustValidationEventNames,
  wechatValidationEventNames
} from "@/lib/metrics/validation-scorecard";

export interface ScorecardEvent {
  event_name: ProductMetricEventName;
  user_id?: string | null;
  family_id?: string | null;
}

export function generateInvestmentValidationScorecard(events: ScorecardEvent[]) {
  return {
    totalEvents: events.length,
    ahaLoop: summarizeCategory(events, ahaLoopEventNames),
    reminders: summarizeCategory(events, reminderValidationEventNames),
    trust: summarizeCategory(events, trustValidationEventNames),
    wechat: summarizeCategory(events, wechatValidationEventNames),
    paymentIntentCount: countEvents(events, "payment_intent_recorded"),
    uniqueFamilies: new Set(events.map((event) => event.family_id).filter(Boolean)).size,
    uniqueUsers: new Set(events.map((event) => event.user_id).filter(Boolean)).size
  };
}

function summarizeCategory(
  events: ScorecardEvent[],
  names: readonly ProductMetricEventName[]
) {
  return Object.fromEntries(names.map((name) => [name, countEvents(events, name)]));
}

function countEvents(events: ScorecardEvent[], eventName: ProductMetricEventName) {
  return events.filter((event) => event.event_name === eventName).length;
}

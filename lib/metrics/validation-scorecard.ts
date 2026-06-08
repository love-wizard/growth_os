import type { ProductMetricEventName } from "@/lib/domain/types";

export const ahaLoopEventNames = [
  "first_guidance_generated",
  "ai_suggestion_adopted",
  "companionship_action_completed",
  "growth_record_created",
  "next_week_returned"
] satisfies ProductMetricEventName[];

export const reminderValidationEventNames = [
  "warm_reminder_enabled",
  "warm_reminder_opened",
  "warm_reminder_action_completed",
  "reminder_driven_second_week_returned"
] satisfies ProductMetricEventName[];

export const trustValidationEventNames = [
  "generic_ai_comparison_recorded",
  "expert_trust_feedback_recorded",
  "expert_review_completed",
  "expert_qa_requested"
] satisfies ProductMetricEventName[];

export const wechatValidationEventNames = [
  "wechat_mini_program_entry_opened",
  "wechat_scenario_card_opened",
  "wechat_family_invite_shared",
  "wechat_family_invite_accepted",
  "wechat_subscription_message_opted_in",
  "wechat_subscription_message_opened",
  "wechat_record_card_shared",
  "wechat_private_beta_service_contacted",
  "wechat_mini_program_code_scanned"
] satisfies ProductMetricEventName[];

export const investmentValidationEventNames = [
  ...ahaLoopEventNames,
  "weekly_plan_confirmed",
  "organic_second_week_returned",
  ...reminderValidationEventNames,
  ...trustValidationEventNames,
  "payment_intent_recorded",
  "parent_anxiety_pulse_recorded",
  ...wechatValidationEventNames
] satisfies ProductMetricEventName[];

export function isInvestmentValidationEvent(
  eventName: ProductMetricEventName
) {
  return investmentValidationEventNames.includes(eventName);
}

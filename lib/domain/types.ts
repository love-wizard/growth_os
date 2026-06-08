export type UUID = string;
export type ISODate = string;
export type ISODateTime = string;

export const parentRoles = ["father", "mother"] as const;
export type ParentRole = (typeof parentRoles)[number];

export const familyMemberInvitationStatuses = ["invited", "accepted"] as const;
export type FamilyMemberInvitationStatus =
  (typeof familyMemberInvitationStatuses)[number];

export const internalReviewerTypes = ["parenting_expert", "ops_admin"] as const;
export type InternalReviewerType = (typeof internalReviewerTypes)[number];

export const internalReviewerStatuses = ["active", "disabled"] as const;
export type InternalReviewerStatus = (typeof internalReviewerStatuses)[number];

export const wechatBindingStatuses = ["active", "revoked"] as const;
export type WeChatBindingStatus = (typeof wechatBindingStatuses)[number];

export const presetInterestNames = [
  "piano",
  "swimming",
  "football",
  "basketball",
  "reading",
  "drawing",
  "building_blocks",
  "english"
] as const;
export type PresetInterestName = (typeof presetInterestNames)[number];

export const interestSources = ["preset", "custom"] as const;
export type InterestSource = (typeof interestSources)[number];

export const annualGoalStatuses = ["active", "paused", "completed"] as const;
export type AnnualGoalStatus = (typeof annualGoalStatuses)[number];

export const weeklyPlanSources = ["initial", "system", "ai_confirmed"] as const;
export type WeeklyPlanSource = (typeof weeklyPlanSources)[number];

export const weeklyPlanStatuses = ["active", "archived"] as const;
export type WeeklyPlanStatus = (typeof weeklyPlanStatuses)[number];

export const taskAssigneeTypes = ["father", "mother", "child", "family"] as const;
export type TaskAssigneeType = (typeof taskAssigneeTypes)[number];

export const weeklyTaskStatuses = [
  "not_started",
  "in_progress",
  "completed"
] as const;
export type WeeklyTaskStatus = (typeof weeklyTaskStatuses)[number];

export const participationOutcomes = [
  "completed",
  "missed",
  "cancelled",
  "rescheduled"
] as const;
export type ParticipationOutcome = (typeof participationOutcomes)[number];

export const growthRecordDraftSourceTypes = [
  "weekly_task",
  "ai_suggestion",
  "parent_note",
  "manual"
] as const;
export type GrowthRecordDraftSourceType =
  (typeof growthRecordDraftSourceTypes)[number];

export const growthRecordDraftStatuses = ["draft", "saved", "discarded"] as const;
export type GrowthRecordDraftStatus = (typeof growthRecordDraftStatuses)[number];

export const growthRecordMediaTypes = ["photo", "video"] as const;
export type GrowthRecordMediaType = (typeof growthRecordMediaTypes)[number];

export const aiCoachModes = [
  "parenting_qa",
  "activity_generation",
  "growth_analysis",
  "weekly_plan_draft"
] as const;
export type AICoachMode = (typeof aiCoachModes)[number];

export const aiWeeklyPlanDraftStatuses = [
  "draft",
  "confirmed",
  "discarded"
] as const;
export type AIWeeklyPlanDraftStatus =
  (typeof aiWeeklyPlanDraftStatuses)[number];

export const reminderTypes = [
  "evening_companionship",
  "weekend_planning",
  "accepted_suggestion_follow_up",
  "weekly_reset"
] as const;
export type ReminderType = (typeof reminderTypes)[number];

export const expertReviewStatuses = [
  "passed",
  "needs_revision",
  "safety_boundary_failed"
] as const;
export type ExpertReviewStatus = (typeof expertReviewStatuses)[number];

export const productMetricEventNames = [
  "first_guidance_generated",
  "ai_suggestion_adopted",
  "weekly_plan_confirmed",
  "companionship_action_completed",
  "growth_record_created",
  "next_week_returned",
  "organic_second_week_returned",
  "reminder_driven_second_week_returned",
  "warm_reminder_enabled",
  "warm_reminder_opened",
  "warm_reminder_action_completed",
  "generic_ai_comparison_recorded",
  "payment_intent_recorded",
  "expert_trust_feedback_recorded",
  "expert_review_completed",
  "expert_qa_requested",
  "wechat_mini_program_entry_opened",
  "wechat_scenario_card_opened",
  "wechat_family_invite_shared",
  "wechat_family_invite_accepted",
  "wechat_subscription_message_opted_in",
  "wechat_subscription_message_opened",
  "wechat_record_card_shared",
  "wechat_private_beta_service_contacted",
  "wechat_mini_program_code_scanned",
  "parent_anxiety_pulse_recorded"
] as const;
export type ProductMetricEventName = (typeof productMetricEventNames)[number];

export const wechatChannelEntryTypes = [
  "mini_program_entry",
  "scenario_card",
  "family_invite_card",
  "subscription_message",
  "record_share_card",
  "mini_program_code",
  "customer_service",
  "enterprise_wechat"
] as const;
export type WeChatChannelEntryType = (typeof wechatChannelEntryTypes)[number];

export const firstUseFocusDirections = [
  "reading_habit",
  "english_exposure",
  "physical_activity",
  "outdoor_exploration",
  "music_or_piano_interest",
  "swimming_or_sports",
  "emotional_expression",
  "family_relationship",
  "school_readiness"
] as const;
export type FirstUseFocusDirection = (typeof firstUseFocusDirections)[number];

export const firstUseCurrentChallenges = [
  "interest_resistance",
  "reading_difficulty",
  "unclear_english_exposure",
  "limited_time_tonight",
  "weekend_activity_need",
  "emotional_sensitivity",
  "decreased_physical_activity",
  "recent_growth_review"
] as const;
export type FirstUseCurrentChallenge =
  (typeof firstUseCurrentChallenges)[number];

export const firstUseChildTraits = [
  "active",
  "sensitive",
  "slow_to_warm_up",
  "likes_praise",
  "likes_competition",
  "strong_willed",
  "easily_frustrated",
  "curious",
  "prefers_routines"
] as const;
export type FirstUseChildTrait = (typeof firstUseChildTraits)[number];

export const wechatScenarioTypes = [
  "piano_resistance",
  "limited_evening_time",
  "reading_recovery",
  "english_exposure",
  "weekend_activity"
] as const;
export type WeChatScenarioType = (typeof wechatScenarioTypes)[number];

export interface FamilyMemberAccess {
  familyId: UUID;
  userId: UUID;
  role: ParentRole;
}

export interface InternalReviewerAccess {
  reviewerId: UUID;
  userId: UUID;
  reviewerType: InternalReviewerType;
}

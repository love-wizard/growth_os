import { z } from "zod";
import {
  aiCoachModes,
  expertReviewStatuses,
  firstUseChildTraits,
  firstUseCurrentChallenges,
  firstUseFocusDirections,
  participationOutcomes,
  parentRoles,
  productMetricEventNames,
  reminderTypes,
  taskAssigneeTypes,
  wechatScenarioTypes
} from "@/lib/domain/types";

const nonEmptyText = z.string().trim().min(1);
const uuid = z.string().uuid();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const dateTimeString = z.string().datetime({ offset: true });

export const childProfileInputSchema = z.object({
  name: nonEmptyText,
  nickname: nonEmptyText,
  birthDate: dateString,
  gender: nonEmptyText
});

export const annualGoalInputSchema = z.object({
  title: nonEmptyText,
  category: z.string().trim().optional()
});

export const onboardingRequestSchema = z.object({
  childProfile: childProfileInputSchema,
  interests: z.array(nonEmptyText).min(1),
  annualGoals: z.array(annualGoalInputSchema).min(1)
});

export const firstGuidanceRequestSchema = z.object({
  childNickname: nonEmptyText,
  childBirthDate: dateString,
  focusDirections: z.array(z.enum(firstUseFocusDirections)).min(2).max(3),
  currentChallenge: z.enum(firstUseCurrentChallenges),
  childTraits: z.array(z.enum(firstUseChildTraits)).min(1).max(3)
});

export const firstGuidanceTodaySuggestionSchema = z.object({
  title: nonEmptyText,
  childSpecificContext: nonEmptyText,
  likelyInterpretation: nonEmptyText,
  action: nonEmptyText,
  estimatedMinutes: z.number().int().positive(),
  whyItHelps: nonEmptyText,
  gentleFallback: nonEmptyText
});

export const firstGuidanceResponseSchema = z.object({
  sessionId: uuid,
  todaySuggestion: firstGuidanceTodaySuggestionSchema
});

export const acceptSuggestionRequestSchema = z.object({
  addToWeeklyPlan: z.boolean().optional(),
  taskAssigneeType: z.enum(taskAssigneeTypes).optional()
});

export const inviteParentRequestSchema = z.object({
  email: z.string().email(),
  role: z.enum(parentRoles)
});

export const updateTaskProgressRequestSchema = z.object({
  completedCount: z.number().int().min(0)
});

export const interestParticipationRecordInputSchema = z.object({
  interestId: uuid,
  happenedOn: dateString,
  participationOutcome: z.enum(participationOutcomes),
  durationMinutes: z.number().int().min(0).optional(),
  count: z.number().int().min(0).optional(),
  notes: z.string().trim().optional()
});

export const growthRecordInputSchema = z.object({
  happenedOn: dateString,
  happenedAt: dateTimeString.optional(),
  text: nonEmptyText,
  tags: z.array(nonEmptyText).optional(),
  parentNotes: z.string().trim().optional(),
  childIds: z.array(uuid).min(1).max(6).optional()
});

export const growthRecordDraftRequestSchema = z.object({
  sourceType: z.enum(["weekly_task", "ai_suggestion", "parent_note"]),
  sourceId: nonEmptyText,
  parentNote: z.string().trim().optional()
});

export const aiCoachRequestSchema = z.object({
  mode: z.enum(aiCoachModes),
  message: nonEmptyText
});

export const notificationPreferenceRequestSchema = z.object({
  reminderType: z.enum(reminderTypes),
  enabled: z.boolean(),
  preferredWindow: z.string().trim().optional()
});

export const productMetricEventRequestSchema = z.object({
  eventName: z.enum(productMetricEventNames),
  eventProperties: z.record(z.unknown()).optional()
});

export const expertReviewRequestSchema = z.object({
  conversationId: uuid,
  reviewStatus: z.enum(expertReviewStatuses),
  qualityScores: z.record(z.number().int().min(1).max(5)),
  safetyBoundaryPassed: z.boolean(),
  reviewNotes: z.string().trim().optional()
});

export const wechatIdentityBindingRequestSchema = z.object({
  code: nonEmptyText
});

export const wechatScenarioEntryRequestSchema = z.object({
  scenarioType: z.enum(wechatScenarioTypes),
  sourceContext: z.record(z.unknown()).optional()
});

export const wechatFamilyInviteRequestSchema = z.object({
  familyId: uuid.optional(),
  role: z.enum(parentRoles)
});

export const wechatSubscriptionPreferenceRequestSchema = z.object({
  reminderType: z.enum(reminderTypes),
  enabled: z.boolean(),
  templateId: z.string().trim().optional()
});

export const wechatRecordSharePreviewRequestSchema = z.object({
  recordId: uuid
});

export const parentProfileRequestSchema = z.object({
  displayName: nonEmptyText.max(40)
});

export type ChildProfileInput = z.infer<typeof childProfileInputSchema>;
export type AnnualGoalInput = z.infer<typeof annualGoalInputSchema>;
export type OnboardingRequest = z.infer<typeof onboardingRequestSchema>;
export type FirstGuidanceRequest = z.infer<typeof firstGuidanceRequestSchema>;
export type AcceptSuggestionRequest = z.infer<
  typeof acceptSuggestionRequestSchema
>;
export type AICoachRequest = z.infer<typeof aiCoachRequestSchema>;
export type ProductMetricEventRequest = z.infer<
  typeof productMetricEventRequestSchema
>;

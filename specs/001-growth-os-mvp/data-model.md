# Data Model: Growth OS v0.1 MVP

## Overview

The model supports exactly one family workspace and one child profile in v0.1, while still using family-scoped tables so future multi-family support does not require rewriting every relationship. Supabase Auth owns user identities; application tables store family membership, child data, plans, records, and AI history. A lightweight first-guidance session can exist before full onboarding so parents receive value before completing the full growth system.

## Common Fields

Most domain tables include:

- `id`: UUID primary key
- `family_id`: UUID foreign key when family-scoped
- `created_at`: timestamp
- `updated_at`: timestamp

Restorable records include:

- `deleted_at`: nullable timestamp
- `restore_until`: nullable timestamp, set to 30 days after deletion

Deleted records are hidden from normal reads and excluded from AI context unless restored.

## Entities

### FirstGuidanceSession

Temporary first-use context used to generate today's companionship suggestion before full onboarding is complete.

Fields:

- `id`
- `user_id`
- `child_nickname`
- `child_birth_date`
- `focus_directions`
- `current_challenge`
- `child_traits`
- `today_suggestion`
- `accepted_at`
- `added_to_weekly_plan_task_id`
- `converted_family_id`
- `created_at`

Rules:

- Must generate a useful today's companionship suggestion from child nickname, birth date, 2-3 focus directions, one current challenge, and 1-3 child traits.
- Suggestion should reference child age, current challenge, selected focus direction, and at least one trait when available.
- Must not require full annual goals or second-parent invitation.
- Can be converted into the full family workspace during onboarding.
- Accepted suggestions can become weekly plan tasks or later growth record drafts.
- v0.1 guidance is optimized for the 3-8 beachhead; suggestions outside that range must be conservative and age-aware.

### Family

Represents the single family workspace.

Fields:

- `id`
- `name`
- `created_by_user_id`
- `created_at`
- `updated_at`

Rules:

- v0.1 accepts exactly one active family workspace.
- First parent creates the family.
- Second parent joins through invitation.

### FamilyMember

Connects Supabase Auth users to the family.

Fields:

- `id`
- `family_id`
- `user_id`
- `role`: `father` or `mother`
- `invitation_status`: `invited`, `accepted`
- `invited_by_user_id`
- `invited_at`
- `accepted_at`
- `created_at`

Rules:

- A family can have at most one father role and one mother role in v0.1.
- Both roles can view and manage all child growth data, AI conversations, and insights.
- Invitation join must not create duplicate family or child profile records.

### ChildProfile

The child growth subject.

Fields:

- `id`
- `family_id`
- `name`
- `nickname`
- `birth_date`
- `gender`
- `created_at`
- `updated_at`

Rules:

- Exactly one child profile per family in v0.1.
- Age is derived from `birth_date`.

### ChildInterest

Selected or custom interests.

Fields:

- `id`
- `child_id`
- `name`
- `source`: `preset` or `custom`
- `created_at`

Rules:

- Preset values include piano, swimming, football, basketball, reading, drawing, building blocks, and English.
- Custom interest names are allowed.

### AnnualGoal

Long-term growth direction.

Fields:

- `id`
- `child_id`
- `title`
- `category`
- `status`: `active`, `paused`, `completed`
- `created_at`
- `updated_at`

Rules:

- At least one annual goal is required before generating the growth system.

### MonthlyTheme

A theme derived from annual goals.

Fields:

- `id`
- `child_id`
- `year`
- `month`
- `title`
- `summary`
- `created_at`

Rules:

- Used to guide weekly planning.
- Not a standalone report module.

### WeeklyPlan

Official weekly plan after initial generation or parent-confirmed AI draft.

Fields:

- `id`
- `child_id`
- `week_start_date`
- `week_end_date`
- `theme`
- `source`: `initial`, `system`, `ai_confirmed`
- `status`: `active`, `archived`
- `reading_recommendation`
- `english_recommendation`
- `weekend_activity`
- `created_at`
- `updated_at`

Rules:

- One active official plan per week.
- AI-generated plans require confirmation before replacing or creating official plans.

### WeeklyTask

Role-based task inside a weekly plan.

Fields:

- `id`
- `weekly_plan_id`
- `assignee_type`: `father`, `mother`, `child`, `family`
- `title`
- `planned_count`
- `completed_count`
- `remaining_count` derived as `max(planned_count - completed_count, 0)`
- `status`: `not_started`, `in_progress`, `completed`
- `created_at`
- `updated_at`

Rules:

- `completed_count` cannot exceed `planned_count`.
- Weekly completion rate is `sum(completed_count) / sum(planned_count)` across all tasks.

### InterestParticipationRecord

Actual completed, missed, cancelled, or rescheduled participation/practice history.

Fields:

- `id`
- `child_id`
- `interest_id`
- `happened_on`
- `participation_outcome`: `completed`, `missed`, `cancelled`, `rescheduled`
- `duration_minutes`
- `count`
- `notes`
- `deleted_at`
- `restore_until`
- `created_at`
- `updated_at`

Rules:

- v0.1 records only actual outcomes after they happen.
- No future schedule, recurring rules, leave requests, or make-up management.
- Deleted rows are excluded from AI context unless restored.

### GrowthRecord

Meaningful growth moment.

Fields:

- `id`
- `child_id`
- `happened_on`
- `text`
- `tags`
- `parent_notes`
- `draft_source_type`: nullable `weekly_task`, `ai_suggestion`, `parent_note`, `manual`
- `draft_source_id`
- `draft_status`: nullable `draft`, `saved`, `discarded`
- `deleted_at`
- `restore_until`
- `created_by_user_id`
- `created_at`
- `updated_at`

Rules:

- Text-only records must be supported.
- Editable drafts can be generated from completed weekly tasks, accepted AI suggestions, or short parent notes.
- AI context uses text, date, tags, and notes only.
- Deleted rows are excluded from AI context unless restored.

### GrowthRecordMedia

Photo/video attachments for display only.

Fields:

- `id`
- `growth_record_id`
- `storage_path`
- `media_type`: `photo`, `video`
- `file_name`
- `mime_type`
- `size_bytes`
- `created_at`

Rules:

- Stored in a private Supabase Storage bucket.
- AI must not analyze photo or video content in v0.1.

### AIConversation

AI coach interaction history.

Fields:

- `id`
- `family_id`
- `user_id`
- `user_role`
- `mode`: `parenting_qa`, `activity_generation`, `growth_analysis`, `weekly_plan_draft`
- `message`
- `response`
- `context_window_summary`
- `deleted_at`
- `restore_until`
- `created_at`

Rules:

- Father and mother can view all family AI conversations.
- Deleted conversations are excluded from AI context unless restored.
- Safety boundary responses are stored like other conversations.

### AIWeeklyPlanDraft

Structured draft generated by AI before parent confirmation.

Fields:

- `id`
- `family_id`
- `child_id`
- `ai_conversation_id`
- `theme`
- `father_tasks`
- `mother_tasks`
- `child_tasks`
- `reading_recommendation`
- `english_recommendation`
- `weekend_activity`
- `status`: `draft`, `confirmed`, `discarded`
- `confirmed_by_user_id`
- `confirmed_at`
- `created_at`

Rules:

- Draft cannot become official without parent confirmation.
- Confirming a draft creates or replaces the official `WeeklyPlan`.

### AIInsight

Generated growth observation.

Fields:

- `id`
- `child_id`
- `type`
- `title`
- `content`
- `created_at`

Rules:

- Insights do not trigger automatic high-pressure risk reminders in v0.1.
- Insights must be grounded in available records and plans.

### WarmReminderPreference

Parent-controlled reminder settings for private beta engagement validation.

Fields:

- `id`
- `family_id`
- `user_id`
- `reminder_type`
- `enabled`
- `preferred_window`
- `created_at`
- `updated_at`

Allowed reminder types:

- `evening_companionship`
- `weekend_planning`
- `accepted_suggestion_follow_up`
- `weekly_reset`

Rules:

- Reminders are opt-in by type.
- Disabled reminder types must not be sent.
- Reminder copy must invite companionship and avoid missed-task warnings, streak pressure, red-alert completion drops, comparative child performance, or parent-failure wording.

### ExpertQualityReview

Private beta quality review of sampled AI coach answers by a human parenting expert.

Fields:

- `id`
- `conversation_id`
- `expert_reviewer_id`
- `review_status`
- `quality_scores`
- `safety_boundary_passed`
- `review_notes`
- `created_at`

Rules:

- Expert review evaluates AI answer quality; it does not create medical, psychological, abuse, or safety intervention advice.
- Review dimensions should include child-specific context, age appropriateness, concrete action, gentle fallback, non-pressure language, and safety boundary.
- Real-time expert consulting and guaranteed response times are outside v0.1.

### ProductMetricEvent

Privacy-conscious product learning event used to evaluate the private MVP pilot.

Fields:

- `id`
- `family_id`
- `user_id`
- `event_name`
- `event_properties`
- `occurred_at`

Recommended event names:

- `first_guidance_generated`
- `ai_suggestion_adopted`
- `weekly_plan_confirmed`
- `companionship_action_completed`
- `growth_record_created`
- `next_week_returned`
- `warm_reminder_enabled`
- `warm_reminder_opened`
- `warm_reminder_action_completed`
- `expert_review_completed`
- `expert_qa_requested`
- `parent_anxiety_pulse_recorded`

Rules:

- Events are used for product learning, not child ranking or social comparison.
- `companionship_action_completed` should map to at least one concrete parent-child action, such as a completed weekly task, interest participation record, growth record, or accepted AI suggestion.
- Parent anxiety pulse should be optional and lightweight.

## Relationships

- `Family` has many `FamilyMember`
- `Family` has one `ChildProfile`
- `ChildProfile` has many `ChildInterest`, `AnnualGoal`, `MonthlyTheme`, `WeeklyPlan`, `InterestParticipationRecord`, `GrowthRecord`, `AIInsight`
- `WeeklyPlan` has many `WeeklyTask`
- `GrowthRecord` has many `GrowthRecordMedia`
- `AIConversation` can have one `AIWeeklyPlanDraft`
- `AIConversation` can have many `ExpertQualityReview`
- `Family` has many `WarmReminderPreference`
- `Family` has many `ProductMetricEvent`

## RLS Policy Shape

All family-scoped reads and writes require:

- Authenticated user
- Membership in the row's `family_id`
- Role is `father` or `mother`

Storage object paths should include `family_id` and `growth_record_id`, and Storage policies should only allow reads/writes when the authenticated user belongs to the family that owns the record.

## AI Context Assembly

Server-side context includes:

- Child profile: age, gender, interests
- Active annual goals
- Most recent 4 weeks of weekly plans and tasks
- Most recent 90 days of non-deleted interest participation records
- Most recent 90 days of non-deleted growth records using text, dates, tags, and notes

Context excludes:

- Deleted records and conversations
- Photo/video contents
- Data outside the default context windows unless a future feature explicitly expands it

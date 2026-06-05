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
- `today_suggestion`
- `converted_family_id`
- `created_at`

Rules:

- Must generate a useful today's companionship suggestion from child nickname, birth date, and 2-3 focus directions.
- Must not require full annual goals or second-parent invitation.
- Can be converted into the full family workspace during onboarding.
- Default child age segment is 3-8; suggestions outside that range must be conservative and age-aware.

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
- `deleted_at`
- `restore_until`
- `created_by_user_id`
- `created_at`
- `updated_at`

Rules:

- Text-only records must be supported.
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

- Insights do not trigger proactive reminders in v0.1.
- Insights must be grounded in available records and plans.

## Relationships

- `Family` has many `FamilyMember`
- `Family` has one `ChildProfile`
- `ChildProfile` has many `ChildInterest`, `AnnualGoal`, `MonthlyTheme`, `WeeklyPlan`, `InterestParticipationRecord`, `GrowthRecord`, `AIInsight`
- `WeeklyPlan` has many `WeeklyTask`
- `GrowthRecord` has many `GrowthRecordMedia`
- `AIConversation` can have one `AIWeeklyPlanDraft`

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

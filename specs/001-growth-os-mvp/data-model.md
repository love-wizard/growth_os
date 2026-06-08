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

### InternalReviewer

Internal private-beta reviewer or operations account for expert quality review and validation scorecard access.

Fields:

- `id`
- `user_id`
- `reviewer_type`: `parenting_expert`, `ops_admin`
- `display_name`
- `status`: `active`, `disabled`
- `created_at`
- `updated_at`

Rules:

- Internal reviewers are not family members and must not receive normal family-scoped read/write permissions.
- Admin route handlers must verify active internal reviewer status before allowing expert review or validation scorecard access.
- Parenting experts can review sampled AI answers but must not contact families as real-time consultants through v0.1 product flows.
- Ops admins can view aggregated private-beta metrics for validation, not child-ranking or public comparison dashboards.

### WeChatIdentityBinding

Optional binding between a Supabase Auth user and WeChat identity if the WeChat Mini Program is selected.

Fields:

- `id`
- `user_id`
- `wechat_open_id`
- `wechat_union_id`
- `mini_program_app_id`
- `binding_status`: `active`, `revoked`
- `last_seen_at`
- `created_at`
- `updated_at`

Rules:

- WeChat identity reduces entry friction but does not replace Supabase Auth or family membership checks.
- A WeChat-bound user must still be a father or mother `FamilyMember` before private family data is shown.
- Revoked bindings must not authorize future Mini Program access.
- Store only identity fields needed for login, attribution, invitation, and subscription-message opt-in validation.

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
- `family_id`
- `conversation_id`
- `reviewer_id`
- `review_status`
- `quality_scores`
- `safety_boundary_passed`
- `review_notes`
- `created_at`

Rules:

- Expert review evaluates AI answer quality; it does not create medical, psychological, abuse, or safety intervention advice.
- Review dimensions should include child-specific context, age appropriateness, concrete action, gentle fallback, non-pressure language, and safety boundary.
- Reviews are created through internal reviewer access or server-side service-role workflows, not normal parent routes.
- Parents may see an expert-reviewed label when appropriate, but raw reviewer notes are internal validation data in v0.1.
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
- `organic_second_week_returned`
- `reminder_driven_second_week_returned`
- `warm_reminder_enabled`
- `warm_reminder_opened`
- `warm_reminder_action_completed`
- `generic_ai_comparison_recorded`
- `payment_intent_recorded`
- `expert_trust_feedback_recorded`
- `expert_review_completed`
- `expert_qa_requested`
- `wechat_mini_program_entry_opened`
- `wechat_scenario_card_opened`
- `wechat_family_invite_shared`
- `wechat_family_invite_accepted`
- `wechat_subscription_message_opted_in`
- `wechat_subscription_message_opened`
- `wechat_record_card_shared`
- `wechat_private_beta_service_contacted`
- `wechat_mini_program_code_scanned`
- `parent_anxiety_pulse_recorded`

Rules:

- Events are used for product learning, not child ranking or social comparison.
- `companionship_action_completed` should map to at least one concrete parent-child action, such as a completed weekly task, interest participation record, growth record, or accepted AI suggestion.
- `payment_intent_recorded` captures package and price preference only; it does not imply payment collection or subscription management in v0.1.
- WeChat channel events are used for attribution and validation only; they must not create public sharing, ranking, or social graph behavior in v0.1.
- Parent anxiety pulse should be optional and lightweight.

### WeChatChannelAttribution

Private beta channel attribution signal if WeChat Mini Program is used.

Fields:

- `id`
- `family_id`
- `user_id`
- `entry_type`
- `source_context`
- `related_entity_type`
- `related_entity_id`
- `created_at`

Entry types:

- `mini_program_entry`
- `scenario_card`
- `family_invite_card`
- `subscription_message`
- `record_share_card`
- `mini_program_code`
- `customer_service`
- `enterprise_wechat`

Rules:

- Attribution events must not expose private child records to unauthorized recipients.
- Share-card attribution should store source and flow metadata, not public social graph data.
- WeChat Pay, location, WeChat Sports, and device-data integrations are outside v0.1.

### PaymentIntentSignal

Private beta payment-intent signal collected during interviews or in-product survey.

Fields:

- `id`
- `family_id`
- `package_concept`
- `price_point`
- `intent_level`
- `reason`
- `created_at`

Package concepts:

- `basic_ai_archive`
- `plus_monthly_analysis`
- `high_trust_expert_reviewed`

Price points:

- `rmb_19_month`
- `rmb_29_month`
- `rmb_49_month`

Rules:

- This is a validation signal, not a payment workflow.
- Strong intent requires selecting a package and price the parent says they would realistically pay.
- Do not store payment details in v0.1.

## Relationships

- `Family` has many `FamilyMember`
- `Family` has one `ChildProfile`
- `FamilyMember` can have one or more optional `WeChatIdentityBinding` rows through `user_id`
- `InternalReviewer` can have many `ExpertQualityReview`
- `ChildProfile` has many `ChildInterest`, `AnnualGoal`, `MonthlyTheme`, `WeeklyPlan`, `InterestParticipationRecord`, `GrowthRecord`, `AIInsight`
- `WeeklyPlan` has many `WeeklyTask`
- `GrowthRecord` has many `GrowthRecordMedia`
- `AIConversation` can have one `AIWeeklyPlanDraft`
- `AIConversation` can have many `ExpertQualityReview`
- `Family` has many `WarmReminderPreference`
- `Family` has many `ProductMetricEvent`
- `Family` has many `PaymentIntentSignal`
- `Family` has many `WeChatChannelAttribution`

## RLS Policy Shape

Family-scoped reads and writes require:

- Authenticated user
- Membership in the row's `family_id`
- Role is `father` or `mother`

Storage object paths should include `family_id` and `growth_record_id`, and Storage policies should only allow reads/writes when the authenticated user belongs to the family that owns the record.

Internal reviewer and admin access uses a separate boundary:

- `InternalReviewer` rows are managed by service-role or ops-only tooling.
- Expert quality review reads/writes require either service-role access or an authenticated active `InternalReviewer`.
- Validation scorecard export must aggregate product events and avoid exposing child photos, videos, detailed notes, or public comparison data.
- WeChat identity binding does not grant family access unless a matching `FamilyMember` row exists.

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

# Tasks: Growth OS v0.1 MVP

**Input**: Design documents from `/specs/001-growth-os-mvp/`
**Prerequisites**: `plan.md`, `spec.md`, `data-model.md`, `contracts/openapi.yaml`, `research.md`, `quickstart.md`, `market-validation.md`, `investment-validation-scorecard.md`, `wechat-mini-program-strategy.md`
**Note**: `.specify/scripts/bash/check-prerequisites.sh` and `.specify/templates/tasks-template.md` are not present in this repository, so this file follows the Speckit task structure directly.

## Execution Flow

1. Phase 1: Setup
2. Phase 2: Foundational platform, schema, auth, metrics, AI shell
3. Phase 3: US1 Get Today's Companionship Guidance
4. Phase 4: US2 Configure a Child Growth System
5. Phase 5: US3 See Today's Parent Guidance
6. Phase 6: US4 Manage the Weekly Growth Plan
7. Phase 7: US5 Ask the AI Growth Coach
8. Phase 8: US6 Record Interest Participation
9. Phase 9: US7 Record Growth Moments
10. Phase 10: US8 Receive Warm Reminders and Trust-Calibrated Guidance
11. Phase 11: US9 Use WeChat Mini Program Channel Loops
12. Final Phase: Polish, validation scorecard, privacy, docs

## Phase 1: Setup

**Purpose**: Initialize the Next.js/Supabase/OpenAI workspace described in `plan.md`.

- [X] T001 Create Next.js TypeScript project scaffold with App Router in `package.json`, `next.config.mjs`, `tsconfig.json`, and `app/layout.tsx`
- [X] T002 [P] Configure Tailwind and shadcn/ui foundations in `tailwind.config.ts`, `postcss.config.mjs`, `components.json`, and `app/globals.css`
- [X] T003 [P] Configure linting, formatting, and test scripts in `package.json`, `eslint.config.mjs`, `vitest.config.ts`, and `playwright.config.ts`
- [X] T004 [P] Create environment template for Supabase and OpenAI settings in `.env.example`
- [X] T005 Create application route groups and module directories in `app/(app)/dashboard/page.tsx`, `app/(app)/weekly-plan/page.tsx`, `app/(app)/archive/page.tsx`, `app/(app)/ai-coach/page.tsx`, `app/(app)/profile/page.tsx`, `app/onboarding/page.tsx`, and `app/invite/page.tsx`
- [X] T006 [P] Create shared source directories in `components/app-shell/.gitkeep`, `components/dashboard/.gitkeep`, `components/weekly-plan/.gitkeep`, `components/growth-archive/.gitkeep`, `components/ai-coach/.gitkeep`, `components/onboarding/.gitkeep`, `components/profile/.gitkeep`, `lib/ai/.gitkeep`, `lib/auth/.gitkeep`, `lib/domain/.gitkeep`, `lib/metrics/.gitkeep`, `lib/repositories/.gitkeep`, `lib/services/.gitkeep`, `lib/supabase/.gitkeep`, `lib/validation/.gitkeep`, and `lib/dates/.gitkeep`
- [X] T007 [P] Create Supabase migration and test directories in `supabase/migrations/.gitkeep`, `supabase/tests/.gitkeep`, and `supabase/seed.sql`

## Phase 2: Foundational

**Purpose**: Build the shared platform every user story depends on. Complete before any story implementation.

- [X] T008 Define shared TypeScript domain enums and IDs in `lib/domain/types.ts`
- [X] T009 Create Supabase browser and server clients in `lib/supabase/client.ts` and `lib/supabase/server.ts`
- [X] T010 Implement family membership authorization helpers in `lib/auth/family-access.ts`
- [X] T011 Implement authenticated app proxy middleware in `proxy.ts`
- [X] T012 [P] Add Zod schemas for onboarding, first guidance, weekly plans, records, reminders, product events, and WeChat events in `lib/validation/schemas.ts`
- [X] T013 Create initial Supabase tables for families, family members, internal reviewers, WeChat identity bindings, child profiles, interests, goals, monthly themes, weekly plans, weekly tasks, records, AI history, reminders, expert reviews, payment intent, WeChat attribution, and product events in `supabase/migrations/001_initial_schema.sql`
- [X] T014 Add Row Level Security policies for family-scoped reads/writes, internal reviewer access, and WeChat identity binding checks in `supabase/migrations/002_rls_policies.sql`
- [X] T015 Add private storage bucket and policies for growth media in `supabase/migrations/003_storage_policies.sql`
- [X] T016 [P] Add database tests for family membership isolation and duplicate-family prevention in `supabase/tests/family_access.test.sql`
- [X] T017 [P] Add database tests for soft deletion, restore window, and AI context exclusion in `supabase/tests/soft_delete_restore.test.sql`
- [X] T018 Implement product metric event service with no child ranking or social comparison in `lib/metrics/product-events.ts`
- [X] T019 Implement investment validation event names and property helpers in `lib/metrics/validation-scorecard.ts`
- [X] T020 Implement OpenAI Responses API client wrapper and structured-output parser in `lib/ai/openai-client.ts`
- [X] T021 Implement server-side AI context assembly with 4-week plan and 90-day record windows in `lib/ai/context.ts`
- [X] T022 [P] Add unit tests for AI context assembly, deleted-record filtering, and media exclusion in `tests/unit/ai-context.test.ts`
- [X] T023 [P] Add unit tests for weekly completion calculation in `tests/unit/weekly-completion.test.ts`
- [X] T024 [P] Add unit tests for product event property validation in `tests/unit/product-events.test.ts`
- [X] T025 Create app shell, bottom navigation, and protected layout in `components/app-shell/AppShell.tsx`, `components/app-shell/BottomNav.tsx`, and `app/(app)/layout.tsx`
- [X] T026 Create shared UI primitives for cards, forms, empty states, and loading states in `components/ui/card.tsx`, `components/ui/form.tsx`, `components/ui/empty-state.tsx`, and `components/ui/loading.tsx`

## Phase 3: User Story 1 - Get Today's Companionship Guidance (P1)

**Goal**: A first parent enters minimal child context and receives today's actionable companionship suggestion within 3 minutes.

**Independent Test**: Start from an empty account, enter nickname, birth date, 2-3 focus directions, one current challenge, and 1-3 traits, then verify the generated suggestion references age, challenge, focus direction, and trait.

- [X] T027 [P] [US1] Add first-guidance API contract tests in `tests/integration/first-guidance.api.test.ts`
- [X] T028 [P] [US1] Add Playwright first-guidance journey test in `tests/e2e/first-guidance.spec.ts`
- [X] T029 [US1] Implement first guidance session repository in `lib/repositories/first-guidance-repo.ts`
- [X] T030 [US1] Implement first guidance prompt builder and structured response schema in `lib/ai/first-guidance.ts`
- [X] T031 [US1] Implement today's suggestion acceptance service in `lib/services/suggestion-service.ts`
- [X] T032 [US1] Implement `POST /api/first-guidance` route handler in `app/api/first-guidance/route.ts`
- [X] T033 [US1] Implement `POST /api/first-guidance/[sessionId]/accept` route handler in `app/api/first-guidance/[sessionId]/accept/route.ts`
- [X] T034 [US1] Build first-use flow component with focus direction, current challenge, and trait inputs in `components/onboarding/FirstGuidanceFlow.tsx`
- [X] T035 [US1] Build today's suggestion result component with child-specific context and accept action in `components/onboarding/TodaySuggestionResult.tsx`
- [X] T036 [US1] Wire first-use page to first-guidance flow in `app/onboarding/page.tsx`
- [X] T037 [US1] Record `first_guidance_generated` and `ai_suggestion_adopted` events from first guidance flow in `lib/metrics/first-guidance-events.ts`

## Phase 4: User Story 2 - Configure a Child Growth System (P1)

**Goal**: A first parent creates one family, one child profile, interests, annual goals, second-parent invitation, and the initial growth system.

**Independent Test**: Complete onboarding for one child and verify annual goals, current theme, supportive progress signal, today tasks, and second-parent invitation.

- [X] T038 [P] [US2] Add onboarding API contract tests in `tests/integration/onboarding.api.test.ts`
- [X] T039 [P] [US2] Add family invite API contract tests in `tests/integration/family-invite.api.test.ts`
- [X] T040 [P] [US2] Add Playwright onboarding and invite journey test in `tests/e2e/onboarding-invite.spec.ts`
- [X] T041 [US2] Implement family, member, child profile, interest, and annual goal repositories in `lib/repositories/family-repo.ts`, `lib/repositories/child-repo.ts`, and `lib/repositories/goals-repo.ts`
- [X] T042 [US2] Implement initial growth system generator for annual plan, monthly themes, and current-week tasks in `lib/services/growth-system-service.ts`
- [X] T043 [US2] Implement second-parent invite service with father/mother role assignment in `lib/services/invite-service.ts`
- [X] T044 [US2] Implement `POST /api/onboarding` route handler in `app/api/onboarding/route.ts`
- [X] T045 [US2] Implement `POST /api/family/invite` route handler in `app/api/family/invite/route.ts`
- [X] T046 [US2] Implement invite acceptance page and handler in `app/invite/page.tsx` and `app/api/family/invite/[inviteId]/accept/route.ts`
- [X] T047 [US2] Build full child profile, interests, annual goals, and invitation forms in `components/onboarding/FullOnboardingForm.tsx` and `components/onboarding/InviteSecondParentForm.tsx`
- [X] T048 [US2] Prevent duplicate family or child profile creation in onboarding service in `lib/services/onboarding-service.ts`

## Phase 5: User Story 3 - See Today's Parent Guidance (P1)

**Goal**: Father and mother can open the dashboard and quickly identify today's most important companionship action.

**Independent Test**: After onboarding, open dashboard and identify today's guidance, annual goals, weekly theme, supportive progress, AI coach entry, and father/mother/family tasks.

- [X] T049 [P] [US3] Add dashboard API integration tests in `tests/integration/dashboard.api.test.ts`
- [X] T050 [P] [US3] Add Playwright dashboard primary-guidance test in `tests/e2e/dashboard.spec.ts`
- [X] T051 [US3] Implement dashboard query service in `lib/services/dashboard-service.ts`
- [X] T052 [US3] Implement supportive weekly progress calculation and wording in `lib/services/progress-copy-service.ts`
- [X] T053 [US3] Implement `GET /api/dashboard` route handler in `app/api/dashboard/route.ts`
- [X] T054 [US3] Build primary today's guidance section in `components/dashboard/TodayGuidancePanel.tsx`
- [X] T055 [US3] Build annual goals, weekly theme, progress, AI coach entry, and today task sections in `components/dashboard/AnnualGoalCards.tsx`, `components/dashboard/WeeklyThemePanel.tsx`, `components/dashboard/SupportiveProgress.tsx`, `components/dashboard/AICoachEntry.tsx`, and `components/dashboard/TodayTasks.tsx`
- [X] T056 [US3] Compose dashboard page in `app/(app)/dashboard/page.tsx`
- [X] T057 [US3] Add non-punitive progress language tests in `tests/unit/progress-copy.test.ts`

## Phase 6: User Story 4 - Manage the Weekly Growth Plan (P1)

**Goal**: Parents view and update weekly theme, father/mother/child tasks, weekend activity, reading recommendation, and English recommendation.

**Independent Test**: Open weekly plan, update completed counts, verify statuses and completion rate update accurately.

- [X] T058 [P] [US4] Add weekly plan API integration tests in `tests/integration/weekly-plan.api.test.ts`
- [X] T059 [P] [US4] Add Playwright weekly plan progress test in `tests/e2e/weekly-plan.spec.ts`
- [X] T060 [US4] Implement weekly plan repository and task progress repository in `lib/repositories/weekly-plan-repo.ts`
- [X] T061 [US4] Implement weekly plan service with completed count validation in `lib/services/weekly-plan-service.ts`
- [X] T062 [US4] Implement `GET /api/weekly-plan/current` route handler in `app/api/weekly-plan/current/route.ts`
- [X] T063 [US4] Implement `PATCH /api/weekly-plan/tasks/[taskId]/progress` route handler in `app/api/weekly-plan/tasks/[taskId]/progress/route.ts`
- [X] T064 [US4] Build weekly theme, task table, recommendations, and weekend activity components in `components/weekly-plan/WeeklyTheme.tsx`, `components/weekly-plan/TaskTable.tsx`, `components/weekly-plan/Recommendations.tsx`, and `components/weekly-plan/WeekendActivity.tsx`
- [X] T065 [US4] Compose weekly plan page in `app/(app)/weekly-plan/page.tsx`
- [X] T066 [US4] Record `weekly_plan_confirmed` and progress-related companionship action events in `lib/metrics/weekly-plan-events.ts`

## Phase 7: User Story 5 - Ask the AI Growth Coach (P1)

**Goal**: Parents use the AI coach for parenting Q&A, activity generation, recent growth analysis, and weekly plan drafts grounded in family data.

**Independent Test**: Use each AI mode and verify child-specific context, concrete action, safety boundaries, and parent confirmation before weekly plan draft activation.

- [X] T067 [P] [US5] Add AI coach API integration tests for all four modes in `tests/integration/ai-coach.api.test.ts`
- [X] T068 [P] [US5] Add AI safety-boundary tests in `tests/integration/ai-safety.api.test.ts`
- [X] T069 [P] [US5] Add Playwright AI coach journey test in `tests/e2e/ai-coach.spec.ts`
- [X] T070 [US5] Implement AI conversation and weekly plan draft repositories in `lib/repositories/ai-repo.ts`
- [X] T071 [US5] Implement parenting Q&A prompt and response validation in `lib/ai/modes/parenting-qa.ts`
- [X] T072 [US5] Implement activity generation prompt and response validation in `lib/ai/modes/activity-generation.ts`
- [X] T073 [US5] Implement growth analysis prompt and response validation in `lib/ai/modes/growth-analysis.ts`
- [X] T074 [US5] Implement weekly plan draft prompt and response validation in `lib/ai/modes/weekly-plan-draft.ts`
- [X] T075 [US5] Implement AI safety boundary classifier and fallback copy in `lib/ai/safety-boundary.ts`
- [X] T076 [US5] Implement AI coach orchestrator in `lib/services/ai-coach-service.ts`
- [X] T077 [US5] Implement `POST /api/ai/coach` route handler in `app/api/ai/coach/route.ts`
- [X] T078 [US5] Implement `POST /api/ai/weekly-plan-drafts/[draftId]/confirm` route handler in `app/api/ai/weekly-plan-drafts/[draftId]/confirm/route.ts`
- [X] T079 [US5] Build AI coach quick questions, chat input, response renderer, and draft confirmation UI in `components/ai-coach/QuickQuestions.tsx`, `components/ai-coach/CoachInput.tsx`, `components/ai-coach/CoachResponse.tsx`, and `components/ai-coach/WeeklyPlanDraftConfirm.tsx`
- [X] T080 [US5] Compose AI coach page in `app/(app)/ai-coach/page.tsx`
- [X] T081 [US5] Record AI mode, suggestion adoption, generic-AI comparison, and expert trust feedback events in `lib/metrics/ai-coach-events.ts`

## Phase 8: User Story 6 - Record Interest Participation (P2)

**Goal**: Parents record actual interest classes or practices that happened so AI and weekly planning can use recent patterns.

**Independent Test**: Create an interest participation record, review it, and verify it is available as AI context and weekly planning context.

- [X] T082 [P] [US6] Add interest participation API integration tests in `tests/integration/interest-participation.api.test.ts`
- [X] T083 [P] [US6] Add Playwright interest participation test in `tests/e2e/interest-participation.spec.ts`
- [X] T084 [US6] Implement interest participation repository in `lib/repositories/interest-participation-repo.ts`
- [X] T085 [US6] Implement interest participation service with actual-outcome rules in `lib/services/interest-participation-service.ts`
- [X] T086 [US6] Implement `POST /api/interest-participation-records` route handler in `app/api/interest-participation-records/route.ts`
- [X] T087 [US6] Implement delete and restore route handlers in `app/api/interest-participation-records/[recordId]/route.ts` and `app/api/interest-participation-records/[recordId]/restore/route.ts`
- [X] T088 [US6] Build interest participation form and recent history components in `components/profile/InterestParticipationForm.tsx` and `components/profile/InterestParticipationHistory.tsx`
- [X] T089 [US6] Integrate interest participation records into profile page in `app/(app)/profile/page.tsx`

## Phase 9: User Story 7 - Record Growth Moments (P2)

**Goal**: Parents capture meaningful growth moments and create editable drafts from completed tasks, accepted suggestions, or short notes.

**Independent Test**: Create text/media growth records, generate drafts from tasks and AI suggestions, and verify timeline month/year display while AI excludes media.

- [X] T090 [P] [US7] Add growth record API integration tests in `tests/integration/growth-records.api.test.ts`
- [X] T091 [P] [US7] Add Playwright growth archive and draft test in `tests/e2e/growth-archive.spec.ts`
- [X] T092 [US7] Implement growth record and media repositories in `lib/repositories/growth-record-repo.ts`
- [X] T093 [US7] Implement storage upload service for private media in `lib/services/storage-service.ts`
- [X] T094 [US7] Implement growth record service with soft delete and restore rules in `lib/services/growth-record-service.ts`
- [X] T095 [US7] Implement growth record draft service for weekly task, AI suggestion, and parent note sources in `lib/services/growth-record-draft-service.ts`
- [X] T096 [US7] Implement `POST /api/growth-records` route handler in `app/api/growth-records/route.ts`
- [X] T097 [US7] Implement `POST /api/growth-record-drafts` route handler in `app/api/growth-record-drafts/route.ts`
- [X] T098 [US7] Implement delete and restore route handlers in `app/api/growth-records/[recordId]/route.ts` and `app/api/growth-records/[recordId]/restore/route.ts`
- [X] T099 [US7] Build growth record form, draft editor, timeline, month view, and year view components in `components/growth-archive/GrowthRecordForm.tsx`, `components/growth-archive/GrowthRecordDraftEditor.tsx`, `components/growth-archive/GrowthTimeline.tsx`, `components/growth-archive/MonthView.tsx`, and `components/growth-archive/YearView.tsx`
- [X] T100 [US7] Compose growth archive page in `app/(app)/archive/page.tsx`
- [X] T101 [US7] Record growth record creation and draft creation events in `lib/metrics/growth-record-events.ts`

## Phase 10: User Story 8 - Receive Warm Reminders and Trust-Calibrated Guidance (P2)

**Goal**: Parents can opt into low-pressure reminders and the product team can review AI answer quality with human experts during private beta.

**Independent Test**: Enable/disable reminder types, record reminder conversion events, and mark sampled AI answers as expert-reviewed against the quality and safety bar.

- [X] T102 [P] [US8] Add reminder preference API integration tests in `tests/integration/reminders.api.test.ts`
- [X] T103 [P] [US8] Add expert review API integration tests in `tests/integration/expert-review.api.test.ts`
- [X] T104 [US8] Implement warm reminder preference repository in `lib/repositories/reminder-repo.ts`
- [X] T105 [US8] Implement reminder service with opt-in, suppression, and approved copy rules in `lib/services/reminder-service.ts`
- [X] T106 [US8] Implement expert quality review repository and service in `lib/repositories/expert-review-repo.ts` and `lib/services/expert-review-service.ts`
- [X] T107 [US8] Implement `PATCH /api/notification-preferences` route handler in `app/api/notification-preferences/route.ts`
- [X] T108 [US8] Implement expert review admin route handler with active internal reviewer authorization in `app/api/admin/expert-reviews/route.ts`
- [X] T109 [US8] Build reminder preference settings and expert-reviewed label UI in `components/profile/ReminderPreferences.tsx` and `components/ai-coach/ExpertReviewedLabel.tsx`
- [X] T110 [US8] Record `warm_reminder_enabled`, `warm_reminder_opened`, `warm_reminder_action_completed`, `expert_review_completed`, and `expert_trust_feedback_recorded` events in `lib/metrics/engagement-trust-events.ts`

## Phase 11: User Story 9 - Use WeChat Mini Program Channel Loops (P2, Optional If WeChat Is Selected)

**Goal**: Parents enter through WeChat scenario cards, invite the second parent, opt into subscription messages, and share privacy-safe family record previews.

**Independent Test**: Scenario card opens matching first-guidance flow, invite card joins the same family, subscription events remain separate from organic return, and record previews are privacy-safe.

- [ ] T111 [P] [US9] Add WeChat channel attribution integration tests in `tests/integration/wechat-channel.api.test.ts`
- [ ] T112 [P] [US9] Add WeChat Mini Program flow test fixtures in `tests/e2e/wechat-mini-program.spec.ts`
- [ ] T113 [US9] Implement WeChat channel attribution repository and service in `lib/repositories/wechat-channel-repo.ts` and `lib/services/wechat-channel-service.ts`
- [ ] T114 [US9] Implement WeChat parent identity binding service and route handler in `lib/auth/wechat-auth.ts` and `app/api/wechat/identity-bindings/route.ts`
- [ ] T115 [US9] Implement WeChat scenario-card entry route handler in `app/api/wechat/scenario-entry/route.ts`
- [ ] T116 [US9] Implement WeChat family invite share and accept route handlers in `app/api/wechat/family-invite/route.ts` and `app/api/wechat/family-invite/[inviteId]/accept/route.ts`
- [ ] T117 [US9] Implement WeChat subscription message preference route and event adapter in `app/api/wechat/subscription-preferences/route.ts` and `lib/services/wechat-subscription-service.ts`
- [ ] T118 [US9] Implement privacy-safe growth record share preview route and service in `app/api/wechat/record-share-preview/route.ts` and `lib/services/wechat-record-share-service.ts`
- [ ] T119 [US9] Create optional Mini Program setup, first-guidance page, and service adapter in `miniprogram/app.ts`, `miniprogram/app.json`, `miniprogram/app.wxss`, `miniprogram/project.config.json`, `miniprogram/pages/first-guidance/index.ts`, `miniprogram/pages/first-guidance/index.wxml`, and `miniprogram/services/api.ts`
- [ ] T120 [US9] Create optional Mini Program family invite page in `miniprogram/pages/invite/index.ts` and `miniprogram/pages/invite/index.wxml`
- [ ] T121 [US9] Create optional Mini Program record preview page in `miniprogram/pages/record-preview/index.ts` and `miniprogram/pages/record-preview/index.wxml`
- [ ] T122 [US9] Record WeChat scenario, invite, subscription, mini-program code, private beta service, and record share events in `lib/metrics/wechat-events.ts`

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, scorecard reporting, privacy checks, and documentation before implementation handoff.

- [ ] T123 [P] Add investment validation scorecard report generator in `lib/metrics/scorecard-report.ts`
- [ ] T124 [P] Add payment intent signal recording service and survey schema in `lib/services/payment-intent-service.ts` and `components/profile/PaymentIntentSurvey.tsx`
- [ ] T125 [P] Add privacy review tests for media exclusion, share card previews, and unauthorized family access in `tests/integration/privacy-boundaries.test.ts`
- [ ] T126 Add `POST /api/product-events` route handler and validation in `app/api/product-events/route.ts`
- [ ] T127 Add internal-reviewer-only product event dashboard export for private beta review in `app/api/admin/validation-scorecard/route.ts`
- [ ] T128 [P] Add accessibility and mobile viewport Playwright coverage for primary flows in `tests/e2e/mobile-accessibility.spec.ts`
- [ ] T129 [P] Update quickstart implementation notes and test commands in `specs/001-growth-os-mvp/quickstart.md`
- [ ] T130 Run and document full validation test suite results in `specs/001-growth-os-mvp/implementation-validation.md`

## Dependencies

### Phase Dependencies

- Setup (Phase 1) must complete before Foundational.
- Foundational (Phase 2) blocks all user stories.
- US1 is the MVP slice and should complete before broad onboarding polish.
- US2 and US3 depend on foundational family and first-guidance infrastructure, but can proceed after US1 service boundaries are stable.
- US4 depends on US2 initial growth system and weekly plan schema.
- US5 depends on foundational AI context assembly and benefits from US2/US4 data.
- US6 and US7 can proceed after foundational schema and auth are complete.
- US8 depends on product events, AI conversation storage, and reminder preferences.
- US9 depends on family invite, first guidance, reminder, growth record, and product event foundations; implement only if WeChat Mini Program is selected for private beta.
- Final Phase depends on all selected user stories.

### Story Completion Order

1. US1: Get Today's Companionship Guidance
2. US2: Configure a Child Growth System
3. US3: See Today's Parent Guidance
4. US4: Manage the Weekly Growth Plan
5. US5: Ask the AI Growth Coach
6. US7: Record Growth Moments
7. US6: Record Interest Participation
8. US8: Receive Warm Reminders and Trust-Calibrated Guidance
9. US9: Use WeChat Mini Program Channel Loops, if selected

## Parallel Execution Examples

### US1

- T027 and T028 can run in parallel before T029-T037.
- T034 and T035 can run in parallel after T032 is stubbed.

### US2

- T038, T039, and T040 can run in parallel.
- T041 and T043 can run in parallel after schema is ready.

### US5

- T071, T072, T073, T074, and T075 can run in parallel because they are separate AI modes.
- T067, T068, and T069 can run in parallel before route implementation.

### US6 and US7

- US6 record forms and US7 growth archive components can run in parallel after shared auth and repositories are stable.

### US8 and US9

- T102, T103, T111, and T112 can run in parallel.
- T113, T114, T117, and T118 can run in parallel because they touch separate WeChat services.

## Implementation Strategy

### MVP First

Complete Phase 1, Phase 2, and Phase 3 (US1) first. This creates the core Aha path:

1. Minimal child context
2. AI suggestion
3. Suggestion acceptance
4. Product event tracking

### Validation Slice

After US1, complete US2, US3, US5, US7, and the scorecard-related parts of the Final Phase. This supports the 30-family/14-day validation loop.

### Incremental Delivery

- Release 1: US1 only, internal test of first guidance quality
- Release 2: US1 + US2 + US3, private beta onboarding and dashboard
- Release 3: US5 + US7, AI coach and growth record drafts
- Release 4: US8, warm reminders and expert review labels
- Release 5: US9, only if WeChat Mini Program is selected for the private beta

## Summary

- Total tasks: 130
- Setup tasks: 7
- Foundational tasks: 19
- US1 tasks: 11
- US2 tasks: 11
- US3 tasks: 9
- US4 tasks: 9
- US5 tasks: 15
- US6 tasks: 8
- US7 tasks: 12
- US8 tasks: 9
- US9 tasks: 12
- Polish tasks: 8
- Suggested MVP scope: Phase 1 + Phase 2 + US1
- Format validation: All tasks use `- [ ] T###`, parallel markers where applicable, story labels for user-story phases, and explicit file paths.

# Suggestion Action Loop Brief

Created: 2026-06-15
Status: Proposed
Priority: P0

## Goal

Turn GrowthOS's current "AI gives a suggestion" experience into a real action loop:

1. Parent gets a suggestion.
2. Parent chooses to try it now or add it to the weekly plan.
3. Parent completes the action.
4. Parent converts the action into a growth record draft with one tap.

This is the narrowest feature that strengthens the core product wedge and directly improves the main validation funnel.

## Why Now

The repo already has most of the backend pieces, but the loop is still broken in production paths:

- First-guidance acceptance exists, but adding to weekly plan is still stubbed in `lib/services/suggestion-service.ts`.
- Growth record draft creation already supports `weekly_task` and `ai_suggestion`.
- Weekly plan task completion already records companionship completion events.
- Dashboard, AI coach, and archive are already connected enough to support a lightweight end-to-end loop.

The current gap is not model capability. It is flow completion.

## Current Product Reality

### Backend readiness

- `/api/first-guidance` creates a session and suggestion.
- `/api/first-guidance/[sessionId]/accept` records acceptance.
- `/api/growth-record-drafts` can create draft records from `weekly_task` or `ai_suggestion`.
- Weekly task progress updates already exist.

### Frontend gap

- Web first-guidance only supports "accept suggestion"; it always sends `addToWeeklyPlan: false`.
- Mini program first-use path does not yet call `/api/first-guidance`; setup still shows a static local suggestion.
- No page currently offers a dedicated "mark this suggestion as completed and generate a record draft" action.

## Scope

### In scope

- Add suggestion acceptance modes:
  - accept only
  - accept and add to weekly plan
- Allow assignee selection when adding to weekly plan:
  - father
  - mother
  - family
- Create a real weekly task when a suggestion is added to the current week.
- Add a post-action CTA that creates a growth record draft from:
  - accepted AI suggestion
  - completed weekly task derived from a suggestion
- Add explicit product events for:
  - suggestion accepted only
  - suggestion added to weekly plan
  - suggestion completed
  - growth record draft created from suggestion

### Out of scope

- Full suggestion editing before acceptance
- Reminder delivery
- Multi-child shared suggestion generation changes
- Complex weekly task deduplication across historical weeks
- Large visual redesign

## User Flows

### Flow A: First-use suggestion -> accept only

1. Parent completes first-guidance inputs.
2. Product shows today's suggestion.
3. Parent taps `先试试看`.
4. System records adoption.
5. Product shows follow-up CTA:
   - `做完了，记录一下`
   - `加入本周计划`

Use when the parent wants flexibility and may act immediately.

### Flow B: First-use suggestion -> add to weekly plan

1. Parent completes first-guidance inputs.
2. Product shows today's suggestion.
3. Parent taps `加入本周计划`.
4. Product asks who this belongs to:
   - 爸爸
   - 妈妈
   - 全家
5. System creates a weekly task under the current active weekly plan.
6. Product confirms with a direct jump:
   - `去周计划看看`
   - `先留在首页`

Use when the parent wants the suggestion to become part of family rhythm.

### Flow C: Suggested action completed -> growth record draft

1. Parent completes a weekly task that came from a suggestion, or confirms they completed a suggestion directly.
2. Product immediately offers:
   - `生成成长记录草稿`
3. Draft is created with source type `ai_suggestion` or `weekly_task`.
4. Parent lands in archive with the draft prefilled for editing.

Use when the parent has real behavior to capture and the product should reduce recording friction.

## Proposed UX Entry Points

### Web

- `components/onboarding/TodaySuggestionResult.tsx`
  - Replace single `接受建议` button with two primary outcomes:
    - `先试试看`
    - `加入本周计划`
  - If parent chooses add-to-plan, show lightweight assignee picker inline.

### Mini Program

- `miniprogram/pages/setup/index.ts`
  - Replace static step-4 suggestion with real `/api/first-guidance` output.
  - After suggestion generation, support the same two actions as web.
- `miniprogram/pages/home/index.ts`
  - If today's task came from a suggestion or there is a recently accepted suggestion, show a direct completion/record CTA.
- `miniprogram/pages/weekly-plan/index.ts`
  - After task completion succeeds, if the task originated from a suggestion, show `记录这个陪伴瞬间`.

## Backend Changes

### 1. Make suggestion acceptance actually add a weekly task

Update `lib/services/suggestion-service.ts`:

- Resolve the current family and active child from the first-guidance session.
- Find or create the current week's active weekly plan for that child.
- Insert a weekly task with:
  - `assignee_type` from request
  - `planned_count = 1`
  - `title` derived from suggestion title/action
- Store the created `weeklyTaskId` back on `first_guidance_sessions.added_to_weekly_plan_task_id`.

### 2. Improve first-guidance session readback

Add a repository helper to fetch first-guidance session details by `sessionId`:

- `user_id`
- `today_suggestion`
- optionally `converted_family_id`

This avoids guessing suggestion text later when generating the weekly task.

### 3. Preserve suggestion source context for downstream use

Prefer adding lightweight event properties first instead of schema expansion:

- sessionId
- weeklyTaskId if created
- assigneeType if added to plan

Schema change is optional in v1. If needed later, add a direct source link table or task metadata field in a follow-up.

## API Changes

### Existing endpoint to extend

`POST /api/first-guidance/[sessionId]/accept`

Current body:

```json
{
  "addToWeeklyPlan": true,
  "taskAssigneeType": "family"
}
```

V1 behavior:

- If `addToWeeklyPlan !== true`, record acceptance only.
- If `addToWeeklyPlan === true`, require `taskAssigneeType` and create a weekly task.

### Existing endpoint to reuse

`POST /api/growth-record-drafts`

Use cases:

```json
{
  "sourceType": "ai_suggestion",
  "sourceId": "session-or-conversation-id",
  "parentNote": "今晚一起做了一个10分钟共读小游戏。"
}
```

or

```json
{
  "sourceType": "weekly_task",
  "sourceId": "weekly-task-id"
}
```

## Metrics

### Must-track events

- `first_guidance_generated`
- `ai_suggestion_adopted`
- `companionship_action_completed`
- `growth_record_created`

### Recommended event properties

- `sessionId`
- `weeklyTaskId`
- `sourceType`
- `assigneeType`
- `entrySurface`: `web_first_guidance`, `mp_setup`, `home`, `weekly_plan`
- `actionType`: `accept_only`, `add_to_weekly_plan`, `create_record_draft`

## Delivery Plan

### Phase 1: Backend completion

- Implement real `addSuggestionToCurrentWeeklyPlan`
- Add session lookup helper if needed
- Ensure cache invalidation after suggestion-to-task conversion

### Phase 2: Web first-guidance

- Upgrade `TodaySuggestionResult.tsx`
- Allow add-to-plan flow with assignee choice
- Show clear success state

### Phase 3: Mini program first-use flow

- Replace static setup suggestion with real `/api/first-guidance`
- Reuse same two suggestion outcomes

### Phase 4: Record conversion CTA

- After task completion or accepted suggestion follow-up, expose one-tap draft creation
- Deep-link to archive editor state

## Validation

Success means this feature improves the real loop, not just button clicks.

Primary checks:

- Suggestion acceptance rate increases
- At least some accepted suggestions are converted into weekly tasks
- Weekly task completion from suggestion-driven tasks is measurable
- Growth record draft creation rate rises after suggestion adoption

Suggested first report:

- `generated -> adopted`
- `adopted -> added_to_weekly_plan`
- `adopted/added -> companionship_action_completed`
- `completed -> growth_record_created`

## Risks

### Risk: Task duplication

Parents may accept the same suggestion multiple times.

Mitigation:

- v1 only blocks duplicate add-to-plan if the same session already has `added_to_weekly_plan_task_id`.

### Risk: Suggestion titles are too chat-like for task lists

Mitigation:

- Normalize suggestion text into a short task title when inserting weekly tasks.

### Risk: Mini program and web drift further apart

Mitigation:

- Use the same backend acceptance contract and similar CTA vocabulary on both surfaces.

## Recommended Start

Start with:

1. `lib/services/suggestion-service.ts`
2. `components/onboarding/TodaySuggestionResult.tsx`
3. `app/api/first-guidance/[sessionId]/accept/route.ts`

Then move to mini program once the backend contract is proven.

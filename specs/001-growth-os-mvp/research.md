# Research: Growth OS v0.1 MVP

## Decision: Use Next.js App Router as the single application surface

**Rationale**: Growth OS v0.1 is a responsive parent-facing web app with authenticated dashboards, forms, timeline views, and server-only AI operations. A single Next.js App Router application keeps routing, server rendering, route handlers, and UI composition in one deployable unit.

**Alternatives considered**:

- Separate frontend/backend services: rejected for v0.1 because Supabase already provides auth, database, storage, and generated APIs.
- Mobile-first native app: rejected for v0.1 because the product needs fast iteration and can work well as a responsive web app.

## Decision: Treat ages 3-8 as the v0.1 beachhead, not the long-term product boundary

**Rationale**: The long-term product opportunity includes early childhood companionship, school-age companionship, and adolescent companionship. v0.1 focuses on ages 3-8 because parent involvement is high, daily companionship decisions are frequent, and the current use cases, including reading habits, English exposure, piano interest, swimming, emotional expression, family relationship, and school readiness, are most coherent in this first segment. This beachhead reduces AI advice ambiguity while preserving room to expand.

**Alternatives considered**:

- All child ages in v0.1: rejected because weekly plan intensity, parent involvement, and AI advice would become too broad.
- Infants/toddlers only: rejected because interest participation, reading habit, and early English/piano goals would be less central.
- Adolescents first: rejected for v0.1 because adolescent companionship involves different privacy, autonomy, identity, and parent-control boundaries.

## Decision: Deliver today's companionship suggestion before full setup

**Rationale**: The product's first value should be concrete guidance, not completion of a planning system. A lightweight first-guidance flow using nickname, birth date, and 2-3 focus directions lets parents experience the core promise within 3 minutes.

**Alternatives considered**:

- Require full annual goals before any useful output: rejected because it delays perceived value.
- Let users browse an empty dashboard first: rejected because it fails the "what should I do today?" promise.

## Decision: Optimize first-use flow for Aha moment, not just setup completion

**Rationale**: Market pull depends on the parent feeling the product understands their child. First-use input should include current challenge and child traits, not only static profile fields, so the first suggestion can reference the child's age, challenge, focus direction, and personality pattern.

**Alternatives considered**:

- Static profile-only first guidance: rejected because it risks generic advice.
- Full diagnostic assessment: rejected because it delays the first useful suggestion.

## Decision: Let AI suggestions become plan actions or growth record drafts

**Rationale**: The system should not rely on parents manually copying AI advice into plans or records. Accepted suggestions can become weekly plan tasks, and completed tasks or suggestions can generate editable growth record drafts, lowering recording friction and turning AI value into long-term memory.

**Alternatives considered**:

- AI chat only: rejected because it creates insight without follow-through.
- Manual records only: rejected because recording effort is a major retention risk.

## Decision: Use Supabase Auth, Postgres, RLS, and private Storage

**Rationale**: The data model is relational and centered on one family, parent membership, child records, weekly plans, and AI history. Supabase Row Level Security can enforce family membership at the database boundary, and Supabase Storage uses RLS-backed policies for media access. Supabase documentation recommends enabling RLS on exposed tables and notes that rows are inaccessible through public clients until policies exist.

**Alternatives considered**:

- Application-only authorization: rejected because child and family data should have database-level defense in depth.
- Public media URLs: rejected because growth photos/videos are private child data.

## Decision: Use server-side AI context assembly

**Rationale**: The AI coach must be grounded in child data without exposing broad database access to the model or client. Server-side context assembly can filter by family membership, deletion state, 4-week/90-day windows, and media exclusion before calling AI.

**Alternatives considered**:

- Client sends context directly: rejected because it can leak or omit data and makes permissions harder to enforce.
- Store long model memory as source of truth: rejected because product truth must remain in canonical family records and plans.

## Decision: Use a server-side configurable LLM provider layer with JSON outputs

**Rationale**: AI coach modes have structured outputs: parenting advice, activity suggestions, growth analysis, and weekly plan drafts. The app should not couple product logic to one model vendor. The server-side LLM layer supports DeepSeek, Qwen/DashScope, OpenAI, and generic OpenAI-compatible Chat Completions endpoints. The app prompts for schema-conformant JSON and validates every response with Zod before display or plan confirmation.

**Alternatives considered**:

- Free-form chat-only responses: rejected because weekly plans and activity suggestions need predictable sections.
- Rule-only plan generation: rejected because plan generation should adapt to child context and parent questions.

## Decision: Store AI-generated weekly plans as drafts until parent confirmation

**Rationale**: The spec requires AI-generated weekly plans to remain drafts until a parent confirms them. This prevents accidental replacement of official family plans and keeps parents in control.

**Alternatives considered**:

- Auto-apply AI plan: rejected by clarification.
- Never save plan drafts: rejected because parents need to review and confirm a concrete output.

## Decision: Soft delete restorable family records

**Rationale**: Growth records, interest participation records, and AI conversations have a 30-day restore window. Use `deleted_at` and `restore_until` to remove them from normal views and AI context while allowing restoration.

**Alternatives considered**:

- Hard delete immediately: rejected by clarification.
- Hide only: rejected because users explicitly need delete and restore behavior.

## Decision: Do not analyze photos or videos with AI in v0.1

**Rationale**: Photos and videos are private child data and v0.1 only needs them for archive display. AI context uses text, dates, tags, and notes, which reduces privacy risk and implementation complexity.

**Alternatives considered**:

- Image-only analysis: rejected by clarification.
- Image and video analysis: rejected by clarification.

## Decision: Testing split by risk

**Rationale**: Unit tests should cover calculation and context assembly; integration tests should cover Supabase RLS and soft deletion; Playwright should cover onboarding, dashboard, weekly plan, growth archive, and AI coach draft confirmation.

**Alternatives considered**:

- E2E-only testing: rejected because RLS/context logic needs faster targeted tests.
- Unit-only testing: rejected because auth and cross-record flows are core risks.

## Source Notes

- DeepSeek API reference: https://api-docs.deepseek.com/
- DeepSeek JSON output guide: https://api-docs.deepseek.com/guides/json_mode
- Alibaba Cloud DashScope OpenAI-compatible usage: https://www.alibabacloud.com/help/en/model-studio/developer-reference/use-qwen-by-calling-api
- Supabase Row Level Security guide: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage access control guide: https://supabase.com/docs/guides/storage/security/access-control

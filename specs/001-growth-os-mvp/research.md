# Research: Growth OS v0.1 MVP

## Decision: Use Next.js App Router as the single application surface

**Rationale**: Growth OS v0.1 is a responsive parent-facing web app with authenticated dashboards, forms, timeline views, and server-only AI operations. A single Next.js App Router application keeps routing, server rendering, route handlers, and UI composition in one deployable unit.

**Alternatives considered**:

- Separate frontend/backend services: rejected for v0.1 because Supabase already provides auth, database, storage, and generated APIs.
- Mobile-first native app: rejected for v0.1 because the product needs fast iteration and can work well as a responsive web app.

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

## Decision: Use OpenAI Responses API with structured outputs

**Rationale**: AI coach modes have structured outputs: parenting advice, activity suggestions, growth analysis, and weekly plan drafts. The OpenAI Responses API supports model responses, tool/function patterns, and structured outputs with JSON schemas, making outputs easier to validate before display or plan confirmation.

**Alternatives considered**:

- Free-form chat-only responses: rejected because weekly plans and activity suggestions need predictable sections.
- Rule-only plan generation: rejected because plan generation should adapt to child context and parent questions.

## Decision: Store AI-generated weekly plans as drafts until parent confirmation

**Rationale**: The spec requires AI-generated weekly plans to remain drafts until a parent confirms them. This prevents accidental replacement of official family plans and keeps parents in control.

**Alternatives considered**:

- Auto-apply AI plan: rejected by clarification.
- Never save plan drafts: rejected because parents need to review and confirm a concrete output.

## Decision: Soft delete restorable family records

**Rationale**: Growth records, interest class records, and AI conversations have a 30-day restore window. Use `deleted_at` and `restore_until` to remove them from normal views and AI context while allowing restoration.

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

- OpenAI Responses API reference: https://platform.openai.com/docs/api-reference/responses
- Supabase Row Level Security guide: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage access control guide: https://supabase.com/docs/guides/storage/security/access-control

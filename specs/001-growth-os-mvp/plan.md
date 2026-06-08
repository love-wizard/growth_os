# Implementation Plan: Growth OS v0.1 MVP

**Branch**: `001-growth-os-mvp` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-growth-os-mvp/spec.md`

**Setup Note**: `.specify/scripts/bash/setup-plan.sh` and `.specify/memory/constitution.md` are not present in this repository. This plan uses the existing feature directory as the active feature and applies the product principles captured in the spec as the constitution gates.

## Summary

Build Growth OS v0.1 as the first beachhead of a broader family companionship system. The long-term product can support early childhood, school-age, and adolescent companionship; v0.1 focuses on parents of 3-8 year-old children with one family, one child, two parent accounts, weekly growth planning, interest participation records, growth archive, and an AI growth coach. The implementation will use a Next.js TypeScript app backed by Supabase Auth, Postgres, Row Level Security, Supabase Storage, and server-side OpenAI Responses API calls with structured outputs for AI coach modes and weekly plan drafts.

The core architecture keeps family data private by default, enforces father/mother access through family membership rows, stores photos/videos for display only, excludes deleted records and media contents from AI context, and requires parent confirmation before AI-generated weekly plan drafts become official plans. The product experience prioritizes getting parents to a useful "what should I do today?" answer before full setup is complete, uses current challenge and child traits to create an Aha moment, then measures whether families complete at least one high-quality companionship action per week.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20 LTS  
**Primary Dependencies**: Next.js App Router, React, Tailwind CSS, shadcn/ui, Supabase JS/SSR client, OpenAI SDK, Zod, React Hook Form, date-fns  
**Storage**: Supabase Postgres for structured data; Supabase Storage private bucket for growth photos/videos  
**Testing**: Vitest for unit tests, React Testing Library for component tests, Playwright for primary user journeys, Supabase local CLI for database/RLS integration tests  
**Target Platform**: Responsive web app, deployed as a server-rendered Next.js application with Supabase managed backend  
**Project Type**: Web application with integrated frontend, route handlers, server actions, and Supabase backend  
**Performance Goals**: First today's companionship suggestion generated within 3 minutes of first use; first suggestion references child age, current challenge, focus direction, and child trait in at least 90% of acceptance tests; dashboard primary guidance identifiable within 10 seconds; dashboard and weekly plan p95 under 1.5s after auth; AI non-streaming first useful response target under 8s; non-AI mutations visible after refresh or navigation within 1s  
**Constraints**: v0.1 beachhead is ages 3-8; one family and one child in v0.1; two parent accounts; no child account; AI context limited to 4 weeks of weekly plans and 90 days of interest/growth records; AI does not analyze media; deleted records excluded from AI context; 30-day restore window; progress language must be supportive and non-punitive; product metrics must avoid child ranking or comparative scoring  
**Scale/Scope**: v0.1 private household MVP for high-engagement early-childhood parents, roughly 20-30 app screens/states, low concurrency, designed to support later school-age, adolescent, and multi-family generalization without adding those workflows now

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Implementation Response |
|------|--------|-------------------------|
| Help parents accompany child growth | PASS | Dashboard, weekly plan, and AI coach all center parent actions rather than child-facing learning flows; the first useful guidance path answers what to do today. |
| Long-termism over score pressure | PASS | Completion is operational progress only; copy and AI prompts must avoid punitive language. |
| Record growth, do not manufacture anxiety | PASS | Growth archive and AI analyses summarize evidence and state gaps instead of inventing milestones. |
| Less check-in, more companionship | PASS | Tasks use simple count progress; no gamified streaks, rankings, or social comparison. |
| First value before full setup | PASS | First-guidance flow generates today's companionship suggestion from minimal child context before full annual planning. |
| Measurable product learning without pressure | PASS | Product events measure adoption and companionship actions without exposing child rankings or competitive analytics. |
| Child privacy and family control | PASS | Supabase Auth + RLS + private Storage; AI excludes deleted data and media contents. |

**Post-Design Recheck**: PASS. Phase 1 artifacts preserve the same constraints through data model deletion states, RLS policies, private media bucket, and AI context assembly rules.

## Project Structure

### Documentation (this feature)

```text
specs/001-growth-os-mvp/
├── plan.md
├── research.md
├── market-validation.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
├── checklists/
│   └── requirements.md
└── spec.md
```

### Source Code (repository root)

```text
app/
├── (app)/
│   ├── dashboard/
│   ├── weekly-plan/
│   ├── archive/
│   ├── ai-coach/
│   └── profile/
├── onboarding/
├── invite/
└── api/
    ├── first-guidance/
    ├── ai/
    ├── weekly-plans/
    ├── growth-records/
    ├── interest-participation/
    └── storage/

components/
├── app-shell/
├── dashboard/
├── weekly-plan/
├── growth-archive/
├── ai-coach/
└── ui/

lib/
├── ai/
├── auth/
├── metrics/
├── supabase/
├── validation/
└── dates/

supabase/
├── migrations/
├── seed.sql
└── tests/

tests/
├── unit/
├── integration/
└── e2e/
```

**Structure Decision**: Use a single Next.js app with server-side Supabase access and Route Handlers for AI/server-only operations. Keep domain logic in `lib/` and UI-specific code in `components/`. Use Supabase migrations and tests for schema/RLS behavior.

## Phase 0: Research

Completed in [research.md](./research.md).

Key decisions:

- Use Next.js App Router with server-side Supabase access for authenticated data reads/mutations.
- Use Supabase RLS on every exposed table and private Storage policies for growth media.
- Use OpenAI Responses API with structured JSON schemas for AI coach outputs.
- Use structured first-guidance and AI coach outputs that make child-specific context, interpretation, action, and fallback reviewable.
- Store AI conversations and generated insights, but assemble AI context server-side from canonical child/family data.
- Use soft deletion with `deleted_at` and `restore_until` for restorable records.
- Generate editable growth record drafts from completed tasks, accepted AI suggestions, and short parent notes to lower recording cost.

## Phase 1: Design & Contracts

Generated artifacts:

- [data-model.md](./data-model.md)
- [market-validation.md](./market-validation.md)
- [contracts/openapi.yaml](./contracts/openapi.yaml)
- [quickstart.md](./quickstart.md)

Agent context update:

- Skipped because `.specify/scripts/bash/update-agent-context.sh` is not present in this repository.

## Complexity Tracking

No constitution violations requiring justification.

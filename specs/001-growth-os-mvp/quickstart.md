# Quickstart: Growth OS v0.1 MVP

## Prerequisites

- Node.js 20 LTS
- npm, pnpm, or bun
- Supabase project or local Supabase CLI
- Server-side LLM API key. v0.1 supports `deepseek`, `qwen`, `openai`, and generic `openai_compatible` providers.

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LLM_PROVIDER=deepseek
LLM_API_KEY=
LLM_MODEL=deepseek-v4-flash
LLM_BASE_URL=https://api.deepseek.com
LLM_JSON_MODE=true
```

Rules:

- `SUPABASE_SERVICE_ROLE_KEY` must only be used on the server.
- AI route handlers must assemble context server-side.
- Browser clients must rely on Supabase Auth and RLS.

## Planned Setup Commands

```bash
npx create-next-app@latest . --ts --tailwind --eslint --app
npx shadcn@latest init
npm install @supabase/supabase-js @supabase/ssr openai zod react-hook-form date-fns
npm install -D vitest @testing-library/react @testing-library/jest-dom playwright
```

## Database Setup

1. Create Supabase migrations under `supabase/migrations/`.
2. Enable RLS on all app tables.
3. Add membership-based policies for family data.
4. Create a private Storage bucket for growth media.
5. Add Storage policies for authenticated family members.

## Local Run

```bash
npm install
npm run dev
```

Open the app at `http://localhost:3000`.

## Primary Manual Verification Flow

1. Sign in as first parent.
2. Enter child nickname, birth date, 2-3 focus directions, one current challenge, and 1-3 child traits.
3. Verify today's companionship suggestion is generated within 3 minutes and references child age, current challenge, focus direction, and at least one trait.
4. Open dashboard and verify today's companionship suggestion is the primary visible action.
5. Accept the suggestion and verify it can be added to the current weekly plan.
6. Complete full child profile, interests, and annual goals.
7. Generate initial growth system.
8. Invite second parent and verify the same family workspace is used.
9. Verify dashboard annual goals, weekly theme, supportive progress signal, AI coach entry, and today tasks.
10. Open weekly plan and update completed counts.
11. Create an editable growth record draft from a completed task or accepted AI suggestion.
12. Create interest participation records for actual completed/missed/cancelled activity.
13. Create growth records with text, tags, notes, and optional media.
14. Ask AI coach each mode:
    - Parenting Q&A
    - Activity generation
    - On-demand growth analysis
    - Weekly plan draft generation
15. Confirm an AI weekly plan draft and verify it becomes official only after confirmation.
16. Enable and disable one warm reminder type, then verify the preference is saved and reminder-related product events can be recorded.
17. Verify sampled AI answers can be marked as expert-reviewed against the quality and safety bar during private beta validation.
18. Record validation events for organic second-week return, reminder-driven return, generic-AI comparison, expert trust feedback, payment intent, and parent pressure sentiment.
19. Verify the product event set can populate the investment validation scorecard without child ranking or social comparison.
20. If WeChat Mini Program is used, verify a scenario card opens the matching first-guidance flow and records channel attribution.
21. If WeChat Mini Program is used, verify a WeChat family invite joins the second parent to the existing family workspace without duplicate family or child profile creation.
22. If WeChat Mini Program is used, verify WeChat subscription-message opt-in/open events are separated from organic return.
23. If WeChat Mini Program is used, verify growth-record share previews are privacy-safe for unauthorized recipients.
24. Delete and restore a growth record, interest participation record, and AI conversation.
25. Verify deleted items are excluded from AI context while deleted.

## Test Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

Implementation notes:

- `npm run test:e2e` requires Playwright browsers to be installed with `npx playwright install chromium`.
- Local builds can run without Supabase/OpenAI credentials; protected API flows still require real Supabase Auth and project env vars.
- AI coach uses the server-side LLM provider configured by `LLM_PROVIDER` and falls back to deterministic structured guidance in local test environments. Use `LLM_PROVIDER=deepseek` for DeepSeek, `LLM_PROVIDER=qwen` for Alibaba Qwen/DashScope, or `LLM_PROVIDER=openai_compatible` for another compatible endpoint.
- WeChat Mini Program files under `miniprogram/` are channel fixtures for private beta validation and reuse the same server API contracts.

Expected test coverage:

- Weekly completion calculation
- First guidance generation within 3 minutes
- First guidance child-specific context and trait reference
- Suggestion acceptance and add-to-plan flow
- Growth record draft creation from task or accepted AI suggestion
- Dashboard primary guidance hierarchy
- Non-punitive progress language review
- AI context window and deletion filtering
- AI media exclusion
- RLS family membership access
- Parent invitation flow
- Weekly plan draft confirmation
- Growth archive month/year views
- Warm reminder opt-in, suppression, and conversion events
- Expert review quality bar and bounded asynchronous Q&A labeling
- Investment validation scorecard event coverage
- Payment-intent signal recording without payment workflow implementation
- WeChat channel attribution for scenario cards, family invites, subscription messages, mini-program codes, and private beta service contacts
- WeChat privacy-safe share card behavior
- Mobile viewport coverage for primary tabs

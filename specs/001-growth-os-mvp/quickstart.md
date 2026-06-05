# Quickstart: Growth OS v0.1 MVP

## Prerequisites

- Node.js 20 LTS
- npm, pnpm, or bun
- Supabase project or local Supabase CLI
- OpenAI API key

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
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
16. Delete and restore a growth record, interest participation record, and AI conversation.
17. Verify deleted items are excluded from AI context while deleted.

## Test Commands

```bash
npm run test
npm run test:e2e
```

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

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
2. Create family and child profile.
3. Select interests and annual goals.
4. Generate initial growth system.
5. Invite second parent and verify the same family workspace is used.
6. Open dashboard and verify annual goals, weekly theme, completion rate, and today tasks.
7. Open weekly plan and update completed counts.
8. Create interest class records for actual completed/missed/cancelled activity.
9. Create growth records with text, tags, notes, and optional media.
10. Ask AI coach each mode:
    - Parenting Q&A
    - Activity generation
    - On-demand growth analysis
    - Weekly plan draft generation
11. Confirm an AI weekly plan draft and verify it becomes official only after confirmation.
12. Delete and restore a growth record, interest class record, and AI conversation.
13. Verify deleted items are excluded from AI context while deleted.

## Test Commands

```bash
npm run test
npm run test:e2e
```

Expected test coverage:

- Weekly completion calculation
- AI context window and deletion filtering
- AI media exclusion
- RLS family membership access
- Parent invitation flow
- Weekly plan draft confirmation
- Growth archive month/year views

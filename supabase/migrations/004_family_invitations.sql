create table public.family_invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  email text not null,
  role text not null check (role in ('father', 'mother')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by_user_id uuid not null references auth.users(id) on delete cascade,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (family_id, email)
);

alter table public.family_invitations enable row level security;

create policy "family invitations family manage"
on public.family_invitations for all
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

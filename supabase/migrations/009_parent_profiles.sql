create table public.parent_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create trigger parent_profiles_set_updated_at
before update on public.parent_profiles
for each row execute function public.set_updated_at();

alter table public.parent_profiles enable row level security;

create policy "parent profiles self manage"
on public.parent_profiles for all
using (public.is_family_member(family_id) and user_id = auth.uid())
with check (public.is_family_member(family_id) and user_id = auth.uid());

alter table public.child_profiles
add column if not exists archived_at timestamptz;

create index if not exists child_profiles_family_active_created_idx
on public.child_profiles(family_id, archived_at, created_at asc);


alter table public.child_profiles
drop constraint if exists child_profiles_family_id_key;

create index if not exists child_profiles_family_created_idx
on public.child_profiles(family_id, created_at asc);

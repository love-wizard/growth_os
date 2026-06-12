alter table public.child_profiles
add column if not exists profile_color text not null default '#E7F3EC';


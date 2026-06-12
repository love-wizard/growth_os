alter table public.interest_participation_records
add column if not exists happened_at timestamptz;

update public.interest_participation_records
set happened_at = coalesce(created_at, happened_on::timestamptz)
where happened_at is null;

create index if not exists interest_participation_child_happened_at_idx
on public.interest_participation_records(child_id, happened_at desc);

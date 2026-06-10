alter table public.growth_records
add column if not exists happened_at timestamptz;

update public.growth_records
set happened_at = coalesce(created_at, happened_on::timestamptz)
where happened_at is null;

create index if not exists growth_records_child_happened_at_idx
on public.growth_records(child_id, happened_at desc);

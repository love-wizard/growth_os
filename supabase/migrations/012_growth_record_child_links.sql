create table if not exists public.growth_record_children (
  growth_record_id uuid not null references public.growth_records(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (growth_record_id, child_id)
);

insert into public.growth_record_children (growth_record_id, child_id)
select id, child_id
from public.growth_records
on conflict do nothing;

create index if not exists growth_record_children_child_idx
on public.growth_record_children(child_id, created_at desc);

alter table public.growth_record_children enable row level security;

drop policy if exists "growth record children family manage"
on public.growth_record_children;

create policy "growth record children family manage"
on public.growth_record_children for all
using (
  public.is_family_member(public.family_id_for_growth_record(growth_record_id))
  and public.is_family_member(public.family_id_for_child(child_id))
)
with check (
  public.is_family_member(public.family_id_for_growth_record(growth_record_id))
  and public.is_family_member(public.family_id_for_child(child_id))
);

create table if not exists public.growth_reports (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid references public.child_profiles(id) on delete cascade,
  scope text not null check (scope in ('child', 'family')),
  report_type text not null check (report_type in ('monthly', 'annual')),
  period_start date not null,
  period_end date not null,
  title text not null,
  summary text not null,
  sections jsonb not null default '[]'::jsonb,
  source_record_count integer not null default 0 check (source_record_count >= 0),
  source_course_record_count integer not null default 0 check (source_course_record_count >= 0),
  status text not null default 'ready' check (status in ('generating', 'ready', 'failed')),
  generated_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (scope = 'family' and child_id is null) or
    (scope = 'child' and child_id is not null)
  )
);

create unique index if not exists growth_reports_unique_period_idx
on public.growth_reports(
  family_id,
  coalesce(child_id, '00000000-0000-0000-0000-000000000000'::uuid),
  scope,
  report_type,
  period_start,
  period_end
);

create index if not exists growth_reports_family_period_idx
on public.growth_reports(family_id, period_end desc, created_at desc);

create trigger growth_reports_set_updated_at
before update on public.growth_reports
for each row execute function public.set_updated_at();

alter table public.growth_reports enable row level security;

create policy "growth reports family manage"
on public.growth_reports for all
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

grant select, insert, update, delete on public.growth_reports to authenticated;
grant select, insert, update, delete on public.growth_reports to service_role;

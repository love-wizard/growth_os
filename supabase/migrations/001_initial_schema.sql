create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('father', 'mother')),
  invitation_status text not null default 'accepted' check (invitation_status in ('invited', 'accepted')),
  invited_by_user_id uuid references auth.users(id) on delete set null,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (family_id, user_id),
  unique (family_id, role)
);

create table public.internal_reviewers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  reviewer_type text not null check (reviewer_type in ('parenting_expert', 'ops_admin')),
  display_name text not null,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wechat_identity_bindings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wechat_open_id text not null,
  wechat_union_id text,
  mini_program_app_id text not null,
  binding_status text not null default 'active' check (binding_status in ('active', 'revoked')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mini_program_app_id, wechat_open_id)
);

create table public.first_guidance_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  child_nickname text not null,
  child_birth_date date not null,
  focus_directions text[] not null check (array_length(focus_directions, 1) between 2 and 3),
  current_challenge text not null check (current_challenge in ('interest_resistance', 'reading_difficulty', 'unclear_english_exposure', 'limited_time_tonight', 'weekend_activity_need', 'emotional_sensitivity', 'decreased_physical_activity', 'recent_growth_review')),
  child_traits text[] not null check (array_length(child_traits, 1) between 1 and 3),
  today_suggestion jsonb not null default '{}'::jsonb,
  accepted_at timestamptz,
  added_to_weekly_plan_task_id uuid,
  converted_family_id uuid references public.families(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade unique,
  name text not null,
  nickname text not null,
  birth_date date not null,
  gender text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.child_interests (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  name text not null,
  source text not null check (source in ('preset', 'custom')),
  created_at timestamptz not null default now(),
  unique (child_id, name)
);

create table public.annual_goals (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  title text not null,
  category text,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.monthly_themes (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  year integer not null check (year >= 2020),
  month integer not null check (month between 1 and 12),
  title text not null,
  summary text,
  created_at timestamptz not null default now(),
  unique (child_id, year, month)
);

create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  week_start_date date not null,
  week_end_date date not null,
  theme text not null,
  source text not null check (source in ('initial', 'system', 'ai_confirmed')),
  status text not null default 'active' check (status in ('active', 'archived')),
  reading_recommendation text,
  english_recommendation text,
  weekend_activity text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (week_end_date >= week_start_date)
);

create unique index weekly_plans_one_active_per_week
on public.weekly_plans (child_id, week_start_date)
where status = 'active';

create table public.weekly_tasks (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  assignee_type text not null check (assignee_type in ('father', 'mother', 'child', 'family')),
  title text not null,
  planned_count integer not null check (planned_count >= 0),
  completed_count integer not null default 0 check (completed_count >= 0),
  remaining_count integer generated always as (greatest(planned_count - completed_count, 0)) stored,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_count <= planned_count)
);

create table public.interest_participation_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  interest_id uuid references public.child_interests(id) on delete set null,
  happened_on date not null,
  participation_outcome text not null check (participation_outcome in ('completed', 'missed', 'cancelled', 'rescheduled')),
  duration_minutes integer check (duration_minutes >= 0),
  count integer check (count >= 0),
  notes text,
  deleted_at timestamptz,
  restore_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.growth_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  happened_on date not null,
  text text not null,
  tags text[] not null default '{}',
  parent_notes text,
  draft_source_type text check (draft_source_type in ('weekly_task', 'ai_suggestion', 'parent_note', 'manual')),
  draft_source_id uuid,
  draft_status text check (draft_status in ('draft', 'saved', 'discarded')),
  deleted_at timestamptz,
  restore_until timestamptz,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.growth_record_media (
  id uuid primary key default gen_random_uuid(),
  growth_record_id uuid not null references public.growth_records(id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('photo', 'video')),
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now()
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_role text not null check (user_role in ('father', 'mother')),
  mode text not null check (mode in ('parenting_qa', 'activity_generation', 'growth_analysis', 'weekly_plan_draft')),
  message text not null,
  response jsonb not null default '{}'::jsonb,
  context_window_summary jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  restore_until timestamptz,
  created_at timestamptz not null default now()
);

create table public.ai_weekly_plan_drafts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  ai_conversation_id uuid references public.ai_conversations(id) on delete set null,
  theme text not null,
  father_tasks jsonb not null default '[]'::jsonb,
  mother_tasks jsonb not null default '[]'::jsonb,
  child_tasks jsonb not null default '[]'::jsonb,
  reading_recommendation text,
  english_recommendation text,
  weekend_activity text,
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'discarded')),
  confirmed_by_user_id uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  type text not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.warm_reminder_preferences (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('evening_companionship', 'weekend_planning', 'accepted_suggestion_follow_up', 'weekly_reset')),
  enabled boolean not null default false,
  preferred_window text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, user_id, reminder_type)
);

create table public.expert_quality_reviews (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  reviewer_id uuid not null references public.internal_reviewers(id) on delete restrict,
  review_status text not null check (review_status in ('passed', 'needs_revision', 'safety_boundary_failed')),
  quality_scores jsonb not null default '{}'::jsonb,
  safety_boundary_passed boolean not null,
  review_notes text,
  created_at timestamptz not null default now()
);

create table public.product_metric_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  event_properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.wechat_channel_attributions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  entry_type text not null check (entry_type in ('mini_program_entry', 'scenario_card', 'family_invite_card', 'subscription_message', 'record_share_card', 'mini_program_code', 'customer_service', 'enterprise_wechat')),
  source_context jsonb not null default '{}'::jsonb,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default now()
);

create table public.payment_intent_signals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  package_concept text not null check (package_concept in ('basic_ai_archive', 'plus_monthly_analysis', 'high_trust_expert_reviewed')),
  price_point text not null check (price_point in ('rmb_19_month', 'rmb_29_month', 'rmb_49_month')),
  intent_level text not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.first_guidance_sessions
add constraint first_guidance_added_task_fk
foreign key (added_to_weekly_plan_task_id) references public.weekly_tasks(id) on delete set null;

create index child_profiles_family_id_idx on public.child_profiles(family_id);
create index weekly_plans_child_week_idx on public.weekly_plans(child_id, week_start_date desc);
create index weekly_tasks_plan_idx on public.weekly_tasks(weekly_plan_id);
create index interest_participation_child_date_idx on public.interest_participation_records(child_id, happened_on desc);
create index growth_records_child_date_idx on public.growth_records(child_id, happened_on desc);
create index ai_conversations_family_created_idx on public.ai_conversations(family_id, created_at desc);
create index product_metric_events_family_event_idx on public.product_metric_events(family_id, event_name, occurred_at desc);

create trigger families_set_updated_at before update on public.families for each row execute function public.set_updated_at();
create trigger internal_reviewers_set_updated_at before update on public.internal_reviewers for each row execute function public.set_updated_at();
create trigger wechat_identity_bindings_set_updated_at before update on public.wechat_identity_bindings for each row execute function public.set_updated_at();
create trigger child_profiles_set_updated_at before update on public.child_profiles for each row execute function public.set_updated_at();
create trigger annual_goals_set_updated_at before update on public.annual_goals for each row execute function public.set_updated_at();
create trigger weekly_plans_set_updated_at before update on public.weekly_plans for each row execute function public.set_updated_at();
create trigger weekly_tasks_set_updated_at before update on public.weekly_tasks for each row execute function public.set_updated_at();
create trigger interest_records_set_updated_at before update on public.interest_participation_records for each row execute function public.set_updated_at();
create trigger growth_records_set_updated_at before update on public.growth_records for each row execute function public.set_updated_at();
create trigger reminder_preferences_set_updated_at before update on public.warm_reminder_preferences for each row execute function public.set_updated_at();

create or replace function public.is_family_member(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members
    where family_id = target_family_id
      and user_id = auth.uid()
      and invitation_status = 'accepted'
  );
$$;

create or replace function public.is_internal_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.internal_reviewers
    where user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.family_id_for_child(target_child_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id
  from public.child_profiles
  where id = target_child_id;
$$;

create or replace function public.family_id_for_weekly_plan(target_weekly_plan_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select child_profiles.family_id
  from public.weekly_plans
  join public.child_profiles on child_profiles.id = weekly_plans.child_id
  where weekly_plans.id = target_weekly_plan_id;
$$;

create or replace function public.family_id_for_growth_record(target_growth_record_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select child_profiles.family_id
  from public.growth_records
  join public.child_profiles on child_profiles.id = growth_records.child_id
  where growth_records.id = target_growth_record_id;
$$;

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.internal_reviewers enable row level security;
alter table public.wechat_identity_bindings enable row level security;
alter table public.first_guidance_sessions enable row level security;
alter table public.child_profiles enable row level security;
alter table public.child_interests enable row level security;
alter table public.annual_goals enable row level security;
alter table public.monthly_themes enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.weekly_tasks enable row level security;
alter table public.interest_participation_records enable row level security;
alter table public.growth_records enable row level security;
alter table public.growth_record_media enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_weekly_plan_drafts enable row level security;
alter table public.ai_insights enable row level security;
alter table public.warm_reminder_preferences enable row level security;
alter table public.expert_quality_reviews enable row level security;
alter table public.product_metric_events enable row level security;
alter table public.wechat_channel_attributions enable row level security;
alter table public.payment_intent_signals enable row level security;

create policy "families insert own"
on public.families for insert
with check (created_by_user_id = auth.uid());

create policy "families member select"
on public.families for select
using (public.is_family_member(id));

create policy "families member update"
on public.families for update
using (public.is_family_member(id))
with check (public.is_family_member(id));

create policy "family members readable by family"
on public.family_members for select
using (public.is_family_member(family_id) or user_id = auth.uid());

create policy "family members insert by inviter or self"
on public.family_members for insert
with check (user_id = auth.uid() or invited_by_user_id = auth.uid());

create policy "family members update by family or invited user"
on public.family_members for update
using (public.is_family_member(family_id) or user_id = auth.uid())
with check (public.is_family_member(family_id) or user_id = auth.uid());

create policy "internal reviewers self select"
on public.internal_reviewers for select
using (user_id = auth.uid() or public.is_internal_reviewer());

create policy "wechat bindings self manage"
on public.wechat_identity_bindings for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "first guidance self manage"
on public.first_guidance_sessions for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "child profiles family manage"
on public.child_profiles for all
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

create policy "child interests family manage"
on public.child_interests for all
using (public.is_family_member(public.family_id_for_child(child_id)))
with check (public.is_family_member(public.family_id_for_child(child_id)));

create policy "annual goals family manage"
on public.annual_goals for all
using (public.is_family_member(public.family_id_for_child(child_id)))
with check (public.is_family_member(public.family_id_for_child(child_id)));

create policy "monthly themes family manage"
on public.monthly_themes for all
using (public.is_family_member(public.family_id_for_child(child_id)))
with check (public.is_family_member(public.family_id_for_child(child_id)));

create policy "weekly plans family manage"
on public.weekly_plans for all
using (public.is_family_member(public.family_id_for_child(child_id)))
with check (public.is_family_member(public.family_id_for_child(child_id)));

create policy "weekly tasks family manage"
on public.weekly_tasks for all
using (public.is_family_member(public.family_id_for_weekly_plan(weekly_plan_id)))
with check (public.is_family_member(public.family_id_for_weekly_plan(weekly_plan_id)));

create policy "interest participation family manage"
on public.interest_participation_records for all
using (public.is_family_member(public.family_id_for_child(child_id)))
with check (public.is_family_member(public.family_id_for_child(child_id)));

create policy "growth records family manage"
on public.growth_records for all
using (public.is_family_member(public.family_id_for_child(child_id)))
with check (public.is_family_member(public.family_id_for_child(child_id)));

create policy "growth media family manage"
on public.growth_record_media for all
using (public.is_family_member(public.family_id_for_growth_record(growth_record_id)))
with check (public.is_family_member(public.family_id_for_growth_record(growth_record_id)));

create policy "ai conversations family manage"
on public.ai_conversations for all
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

create policy "ai weekly plan drafts family manage"
on public.ai_weekly_plan_drafts for all
using (public.is_family_member(family_id))
with check (public.is_family_member(family_id));

create policy "ai insights family select"
on public.ai_insights for select
using (public.is_family_member(public.family_id_for_child(child_id)));

create policy "ai insights family insert"
on public.ai_insights for insert
with check (public.is_family_member(public.family_id_for_child(child_id)));

create policy "warm reminders family manage"
on public.warm_reminder_preferences for all
using (public.is_family_member(family_id) and user_id = auth.uid())
with check (public.is_family_member(family_id) and user_id = auth.uid());

create policy "expert reviews internal manage"
on public.expert_quality_reviews for all
using (public.is_internal_reviewer())
with check (public.is_internal_reviewer());

create policy "product events family insert"
on public.product_metric_events for insert
with check (family_id is null or public.is_family_member(family_id));

create policy "product events family or internal select"
on public.product_metric_events for select
using (public.is_internal_reviewer() or family_id is null or public.is_family_member(family_id));

create policy "wechat attribution family insert"
on public.wechat_channel_attributions for insert
with check (family_id is null or public.is_family_member(family_id));

create policy "wechat attribution family or internal select"
on public.wechat_channel_attributions for select
using (public.is_internal_reviewer() or family_id is null or public.is_family_member(family_id));

create policy "payment intent family insert"
on public.payment_intent_signals for insert
with check (public.is_family_member(family_id));

create policy "payment intent family or internal select"
on public.payment_intent_signals for select
using (public.is_internal_reviewer() or public.is_family_member(family_id));

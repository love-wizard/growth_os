begin;

select plan(8);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000011', 'father-soft@example.com');

insert into public.families (id, name, created_by_user_id)
values ('10000000-0000-0000-0000-000000000011', 'Soft Delete Family', '00000000-0000-0000-0000-000000000011');

insert into public.family_members (family_id, user_id, role, invitation_status, accepted_at)
values ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', 'father', 'accepted', now());

insert into public.child_profiles (id, family_id, name, nickname, birth_date, gender)
values ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000011', 'Kid Soft', 'Soft', '2021-01-01', 'male');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000011';

insert into public.growth_records (
  id,
  child_id,
  happened_on,
  text,
  tags,
  parent_notes,
  created_by_user_id,
  deleted_at,
  restore_until
)
values (
  '30000000-0000-0000-0000-000000000011',
  '20000000-0000-0000-0000-000000000011',
  '2026-06-08',
  '第一次游过25米。',
  array['swimming'],
  '孩子很开心。',
  '00000000-0000-0000-0000-000000000011',
  now(),
  now() + interval '30 days'
);

insert into public.interest_participation_records (
  id,
  child_id,
  happened_on,
  participation_outcome,
  duration_minutes,
  deleted_at,
  restore_until
)
values (
  '40000000-0000-0000-0000-000000000011',
  '20000000-0000-0000-0000-000000000011',
  '2026-06-08',
  'completed',
  30,
  now(),
  now() + interval '30 days'
);

insert into public.ai_conversations (
  id,
  family_id,
  user_id,
  user_role,
  mode,
  message,
  response,
  deleted_at,
  restore_until
)
values (
  '50000000-0000-0000-0000-000000000011',
  '10000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000011',
  'father',
  'parenting_qa',
  '孩子不想练琴怎么办？',
  '{"answer":"先降低冲突。"}',
  now(),
  now() + interval '30 days'
);

select ok(
  exists (
    select 1 from public.growth_records
    where id = '30000000-0000-0000-0000-000000000011'
      and restore_until > now()
  ),
  'deleted growth record keeps restore window'
);

select is(
  (
    select count(*)::int
    from public.growth_records
    where deleted_at is null
      and child_id = '20000000-0000-0000-0000-000000000011'
  ),
  0,
  'deleted growth record is excluded from normal AI context query'
);

select is(
  (
    select count(*)::int
    from public.interest_participation_records
    where deleted_at is null
      and child_id = '20000000-0000-0000-0000-000000000011'
  ),
  0,
  'deleted interest participation is excluded from normal AI context query'
);

select is(
  (
    select count(*)::int
    from public.ai_conversations
    where deleted_at is null
      and family_id = '10000000-0000-0000-0000-000000000011'
  ),
  0,
  'deleted AI conversation is excluded from future context'
);

update public.growth_records
set deleted_at = null, restore_until = null
where id = '30000000-0000-0000-0000-000000000011';

update public.interest_participation_records
set deleted_at = null, restore_until = null
where id = '40000000-0000-0000-0000-000000000011';

update public.ai_conversations
set deleted_at = null, restore_until = null
where id = '50000000-0000-0000-0000-000000000011';

select is(
  (select count(*)::int from public.growth_records where deleted_at is null),
  1,
  'restored growth record returns to normal reads'
);

select is(
  (select count(*)::int from public.interest_participation_records where deleted_at is null),
  1,
  'restored interest participation returns to normal reads'
);

select is(
  (select count(*)::int from public.ai_conversations where deleted_at is null),
  1,
  'restored AI conversation returns to normal reads'
);

select ok(
  not exists (
    select 1 from public.growth_record_media
    where growth_record_id = '30000000-0000-0000-0000-000000000011'
  ),
  'AI context has no media rows to analyze by default'
);

select finish();

rollback;

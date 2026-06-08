begin;

select plan(9);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-000000000001', 'father-a@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'mother-a@example.com'),
  ('00000000-0000-0000-0000-000000000003', 'father-b@example.com'),
  ('00000000-0000-0000-0000-000000000004', 'duplicate-father@example.com');

insert into public.families (id, name, created_by_user_id)
values
  ('10000000-0000-0000-0000-000000000001', 'Family A', '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'Family B', '00000000-0000-0000-0000-000000000003');

insert into public.family_members (family_id, user_id, role, invitation_status, accepted_at)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'father', 'accepted', now()),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'mother', 'accepted', now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'father', 'accepted', now());

select ok(public.is_family_member('10000000-0000-0000-0000-000000000001') = false, 'anonymous user is not a family member');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

select ok(public.is_family_member('10000000-0000-0000-0000-000000000001'), 'father can access own family');
select ok(not public.is_family_member('10000000-0000-0000-0000-000000000002'), 'father cannot access another family');

select is(
  (select count(*)::int from public.families),
  1,
  'RLS exposes only the authenticated parent family'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';

select throws_ok(
  $$insert into public.family_members (family_id, user_id, role, invitation_status)
    values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'mother', 'accepted')$$,
  '23505',
  'duplicate key value violates unique constraint "family_members_family_id_user_id_key"',
  'duplicate parent membership is prevented'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000004';

select throws_ok(
  $$insert into public.family_members (family_id, user_id, role, invitation_status)
    values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'father', 'invited')$$,
  '23505',
  'duplicate key value violates unique constraint "family_members_family_id_role_key"',
  'duplicate father role is prevented'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

insert into public.child_profiles (id, family_id, name, nickname, birth_date, gender)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Kid A', 'A', '2021-01-01', 'female');

select is(
  (select family_id::text from public.child_profiles where id = '20000000-0000-0000-0000-000000000001'),
  '10000000-0000-0000-0000-000000000001',
  'family member can read child profile'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';

select is(
  (select count(*)::int from public.child_profiles),
  0,
  'other family cannot read child profile'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';

select is(
  (select count(*)::int from public.child_profiles),
  1,
  'mother can read same family child profile'
);

select finish();

rollback;

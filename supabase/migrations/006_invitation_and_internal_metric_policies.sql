create policy "family invitations invited email select"
on public.family_invitations for select
using (
  status = 'pending'
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "product events internal reviewer insert"
on public.product_metric_events for insert
with check (public.is_internal_reviewer());

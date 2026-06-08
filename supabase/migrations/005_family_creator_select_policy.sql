create policy "families creator select"
on public.families for select
using (created_by_user_id = auth.uid());

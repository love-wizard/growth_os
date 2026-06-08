insert into storage.buckets (id, name, public)
values ('growth-media', 'growth-media', false)
on conflict (id) do update
set public = excluded.public;

create policy "growth media family read"
on storage.objects for select
using (
  bucket_id = 'growth-media'
  and public.is_family_member(((storage.foldername(name))[1])::uuid)
);

create policy "growth media family insert"
on storage.objects for insert
with check (
  bucket_id = 'growth-media'
  and public.is_family_member(((storage.foldername(name))[1])::uuid)
);

create policy "growth media family update"
on storage.objects for update
using (
  bucket_id = 'growth-media'
  and public.is_family_member(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'growth-media'
  and public.is_family_member(((storage.foldername(name))[1])::uuid)
);

create policy "growth media family delete"
on storage.objects for delete
using (
  bucket_id = 'growth-media'
  and public.is_family_member(((storage.foldername(name))[1])::uuid)
);

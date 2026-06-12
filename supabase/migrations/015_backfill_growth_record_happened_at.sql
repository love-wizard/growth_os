update public.growth_records
set happened_at = created_at
where happened_at is not null
  and created_at is not null
  and happened_at::date = happened_on
  and extract(hour from happened_at) = 0
  and extract(minute from happened_at) = 0
  and extract(second from happened_at) = 0;

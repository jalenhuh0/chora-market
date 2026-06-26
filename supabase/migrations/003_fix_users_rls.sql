-- Fix: "new row violates row-level security policy for table users"
-- Profile rows must be created by a security definer function, not the browser client.

create or replace function public.ensure_user_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.users (id, email, display_name)
  select
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
  from auth.users u
  where u.id = v_uid
  on conflict (id) do update set
    email = coalesce(excluded.email, public.users.email),
    updated_at = now();
end;
$$;

grant execute on function public.ensure_user_profile() to authenticated;

-- Belt-and-suspenders: allow authenticated users to insert their own row
drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert to authenticated
  with check (auth.uid() = id);

-- Backfill: create profile rows for anyone who already signed up
insert into public.users (id, email, display_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.users p where p.id = u.id)
on conflict (id) do nothing;

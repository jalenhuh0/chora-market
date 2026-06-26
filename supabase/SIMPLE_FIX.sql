-- ============================================================
-- Tab Market: SIMPLE_FIX.sql (safe to re-run)
-- Run ONLY this file — do not re-run 001_initial.sql
-- Copy ALL → Supabase SQL Editor → Run
-- ============================================================

-- Drop EVERY policy on public.users (avoids "already exists" errors)
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'users'
  loop
    execute format('drop policy if exists %I on public.users', pol.policyname);
  end loop;
end $$;

-- One policy: you can only access your own profile row
create policy "users_own_row" on public.users
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Read profiles of people in the same group (App Accounts & Roles)
drop policy if exists "users_select_groupmates" on public.users;
create policy "users_select_groupmates" on public.users
  for select to authenticated
  using (
    exists (
      select 1
      from public.group_members me
      join public.group_members them on them.group_id = me.group_id
      where me.user_id = auth.uid() and them.user_id = users.id
    )
  );

-- Link groups/members to auth.users (not public.users)
alter table public.groups drop constraint if exists groups_created_by_fkey;
alter table public.groups
  add constraint groups_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table public.group_members drop constraint if exists group_members_user_id_fkey;
alter table public.group_members
  add constraint group_members_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- Backfill profile rows for anyone who already signed up
insert into public.users (id, email, display_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.users p where p.id = u.id)
on conflict (id) do nothing;

-- Creator can read group right after insert
drop policy if exists "groups_select_creator" on public.groups;
create policy "groups_select_creator" on public.groups
  for select using (created_by = auth.uid());

-- Invite lookup: id, name, code only (no IOU data)
drop view if exists public.groups_public;
create view public.groups_public as
  select id, name, invite_code from public.groups;

grant select on public.groups_public to authenticated;

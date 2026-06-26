-- ============================================================
-- Tab Market: run this ENTIRE file in Supabase SQL Editor
-- (Safe to re-run — uses IF NOT EXISTS / OR REPLACE / DROP IF EXISTS)
-- ============================================================

-- 1) Profile helper (bypasses users RLS)
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

-- 2) Users insert policy + backfill existing auth users
drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert to authenticated
  with check (auth.uid() = id);

insert into public.users (id, email, display_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from public.users p where p.id = u.id)
on conflict (id) do nothing;

-- 3) Group creator can read group right after insert
drop policy if exists "groups_select_creator" on public.groups;
create policy "groups_select_creator" on public.groups
  for select using (created_by = auth.uid());

-- 4) Create group + owner in one secure step
-- Parameter order: alphabetical (p_ledger_name before p_name) for PostgREST
create or replace function public.create_group_with_owner(
  p_ledger_name text,
  p_name text
)
returns table (id uuid, name text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_group_id uuid;
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
  on conflict (id) do nothing;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.groups (name, invite_code, created_by, app_state)
  values (p_name, v_code, v_uid, '{}'::jsonb)
  returning groups.id into v_group_id;

  insert into public.group_members (group_id, user_id, ledger_name, role)
  values (
    v_group_id,
    v_uid,
    coalesce(nullif(trim(p_ledger_name), ''), p_name),
    'owner'
  );

  return query
  select g.id, g.name, g.invite_code
  from public.groups g
  where g.id = v_group_id;
end;
$$;

grant execute on function public.create_group_with_owner(text, text) to authenticated;

-- 5) Join by invite code (if not already created)
create or replace function public.find_group_by_invite(p_code text)
returns table (id uuid, name text, invite_code text)
language sql
security definer
set search_path = public
as $$
  select g.id, g.name, g.invite_code
  from public.groups g
  where g.invite_code = upper(trim(p_code))
  limit 1;
$$;

grant execute on function public.find_group_by_invite(text) to authenticated;

-- Reload PostgREST schema cache so new functions are visible immediately
notify pgrst, 'reload schema';

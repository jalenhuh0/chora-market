-- ============================================================
-- Tab Market: JOIN_FIX.sql (safe to re-run)
-- Fixes: "new row violates row-level security policy for table group_members"
-- when friends join via invite link.
-- Copy ALL → Supabase SQL Editor → Run
-- ============================================================

-- Allow members to read the roster
drop policy if exists "group_members_select" on public.group_members;
create policy "group_members_select" on public.group_members
  for select to authenticated
  using (public.is_group_member(group_id));

-- Allow users to add themselves to a group (invite join)
drop policy if exists "group_members_insert_self" on public.group_members;
create policy "group_members_insert_self" on public.group_members
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "group_members_insert_owner" on public.group_members;
create policy "group_members_insert_owner" on public.group_members
  for insert to authenticated
  with check (
    auth.uid() = user_id
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'owner'
    )
  );

-- Allow users to update their own ledger name (rename player)
drop policy if exists "group_members_update_self" on public.group_members;
create policy "group_members_update_self" on public.group_members
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reliable invite join (bypasses RLS timing issues)
create or replace function public.join_group_by_invite(
  p_code text,
  p_ledger_name text default null
)
returns table (id uuid, name text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_group_id uuid;
  v_group_name text;
  v_group_code text;
  v_ledger text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select g.id, g.name, g.invite_code
  into v_group_id, v_group_name, v_group_code
  from public.groups g
  where g.invite_code = upper(trim(p_code))
  limit 1;

  if v_group_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.users (id, email, display_name)
  select
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
  from auth.users u
  where u.id = v_uid
  on conflict (id) do nothing;

  v_ledger := coalesce(
    nullif(trim(p_ledger_name), ''),
    (select u.display_name from public.users u where u.id = v_uid),
    (select split_part(u.email, '@', 1) from auth.users u where u.id = v_uid),
    'Player'
  );

  insert into public.group_members (group_id, user_id, ledger_name, role)
  values (v_group_id, v_uid, v_ledger, 'member')
  on conflict (group_id, user_id) do update set
    ledger_name = coalesce(excluded.ledger_name, public.group_members.ledger_name);

  return query
  select v_group_id, v_group_name, v_group_code;
end;
$$;

grant execute on function public.join_group_by_invite(text, text) to authenticated;

notify pgrst, 'reload schema';

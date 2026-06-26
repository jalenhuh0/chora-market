-- ============================================================
-- Chora Market: LAUNCH_SECURITY_FIX.sql (safe to re-run)
-- Run in Supabase SQL Editor before public MVP launch.
--
-- Fixes:
-- 1. Remove open self-join on group_members (invite RPC only)
-- 2. Replace groups_public view with invite-only lookup RPC
-- ============================================================

-- ---- group_members: no arbitrary self-insert ----
drop policy if exists "group_members_insert_self" on public.group_members;

drop policy if exists "group_members_insert_owner" on public.group_members;
create policy "group_members_insert_owner" on public.group_members
  for insert to authenticated
  with check (
    auth.uid() != user_id
    and exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'owner'
    )
  );

drop policy if exists "group_members_insert_creator" on public.group_members;
create policy "group_members_insert_creator" on public.group_members
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.groups g
      where g.id = group_members.group_id
        and g.created_by = auth.uid()
    )
  );

-- ---- invite lookup: one group by code, not full table scan ----
drop view if exists public.groups_public;

create or replace function public.lookup_group_by_invite(p_code text)
returns table (id uuid, name text, invite_code text)
language sql
security definer
set search_path = public
stable
as $$
  select g.id, g.name, g.invite_code
  from public.groups g
  where g.invite_code = upper(trim(p_code))
  limit 1;
$$;

grant execute on function public.lookup_group_by_invite(text) to authenticated;

notify pgrst, 'reload schema';

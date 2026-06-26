-- Fix: App Accounts & Roles shows empty
-- Run in Supabase SQL Editor (safe to re-run)

drop policy if exists "users_select_groupmates" on public.users;
create policy "users_select_groupmates" on public.users
  for select to authenticated
  using (
    auth.uid() = id
    or exists (
      select 1
      from public.group_members me
      join public.group_members them on them.group_id = me.group_id
      where me.user_id = auth.uid() and them.user_id = users.id
    )
  );

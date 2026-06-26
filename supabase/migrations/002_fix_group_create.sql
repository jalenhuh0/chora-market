-- Fix: group creation fails because SELECT after INSERT is blocked by RLS
-- (creator is not a member until group_members row exists)
-- Also ensures public.users row exists for auth users who signed up before the trigger.

-- Allow users to create their own profile row if the trigger missed them
drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

-- Allow creator to read group immediately after insert
drop policy if exists "groups_select_creator" on public.groups;
create policy "groups_select_creator" on public.groups
  for select using (created_by = auth.uid());

-- Reliable group creation in one transaction (bypasses RLS timing issues)
-- Parameter order alphabetical for PostgREST (p_ledger_name, p_name)
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

-- ============================================================
-- Chora Market: INVITE_PREVIEW.sql (safe to re-run)
-- Public invite preview for logged-out landing page.
-- Run in Supabase SQL Editor.
-- ============================================================

create or replace function public.lookup_group_invite_preview(p_code text)
returns table (
  id uuid,
  name text,
  invite_code text,
  member_count bigint,
  resolved_bets bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    g.id,
    g.name,
    g.invite_code,
    (
      select count(*)
      from public.group_members gm
      where gm.group_id = g.id
    ) as member_count,
    (
      select count(*)
      from public.markets m
      where m.group_id = g.id
        and m.status = 'resolved'
    ) as resolved_bets
  from public.groups g
  where g.invite_code = upper(trim(p_code))
  limit 1;
$$;

grant execute on function public.lookup_group_invite_preview(text) to anon;
grant execute on function public.lookup_group_invite_preview(text) to authenticated;

notify pgrst, 'reload schema';

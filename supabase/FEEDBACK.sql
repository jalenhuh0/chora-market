-- ============================================================
-- Chora Market: FEEDBACK.sql (safe to re-run)
-- User feedback form storage. Run in Supabase SQL Editor.
-- ============================================================

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  reply_email text,
  category text not null default 'other',
  message text not null,
  page_url text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

drop policy if exists "feedback_insert_authenticated" on public.feedback;
create policy "feedback_insert_authenticated" on public.feedback
  for insert to authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "feedback_insert_anon" on public.feedback;
create policy "feedback_insert_anon" on public.feedback
  for insert to anon
  with check (user_id is null);

-- No select/ update / delete for app users — read via Supabase dashboard only.

notify pgrst, 'reload schema';

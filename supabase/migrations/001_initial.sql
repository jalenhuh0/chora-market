-- Tab Market: users, groups, markets, predictions
-- Run in Supabase SQL Editor or via supabase db push

create extension if not exists "pgcrypto";

-- Users (profiles linked to Supabase Auth)
create table if not exists public.users (
  id uuid primary key references auth.users on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  notify_enabled boolean not null default true,
  notify_bets boolean not null default true,
  notify_ious boolean not null default true,
  notify_invites boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Private friend groups
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  app_state jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists groups_invite_code_idx on public.groups (invite_code);

-- Group membership
create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  ledger_name text,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Bet markets
create table if not exists public.markets (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  external_id text not null,
  title text not null,
  side_a_user text,
  side_b_user text,
  side_a_take text,
  side_b_take text,
  creator text,
  stake numeric not null default 20,
  notes text,
  status text not null default 'open',
  winner text,
  live jsonb,
  double_downs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, external_id)
);

create index if not exists markets_group_id_idx on public.markets (group_id);

-- Predictions (odds votes on markets)
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  voter_name text not null,
  prob_a numeric not null check (prob_a >= 1 and prob_a <= 99),
  pick text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_id, voter_name)
);

create index if not exists predictions_market_id_idx on public.predictions (market_id);
create index if not exists predictions_group_id_idx on public.predictions (group_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.markets enable row level security;
alter table public.predictions enable row level security;

create or replace function public.is_group_member(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

-- Users: read/update own profile
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- Groups: members can read; any member can update (rename, etc.)
create policy "groups_select_member" on public.groups for select using (public.is_group_member(id));
create policy "groups_insert_authenticated" on public.groups for insert with check (auth.uid() = created_by);
create policy "groups_update_member" on public.groups for update using (public.is_group_member(id));

-- Group members
create policy "group_members_select" on public.group_members for select using (public.is_group_member(group_id));
create policy "group_members_insert_self" on public.group_members for insert with check (auth.uid() = user_id);
create policy "group_members_insert_owner" on public.group_members for insert with check (
  exists (select 1 from public.group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid())
  or auth.uid() = user_id
);

-- Markets: group members full access
create policy "markets_select" on public.markets for select using (public.is_group_member(group_id));
create policy "markets_insert" on public.markets for insert with check (public.is_group_member(group_id));
create policy "markets_update" on public.markets for update using (public.is_group_member(group_id));
create policy "markets_delete" on public.markets for delete using (public.is_group_member(group_id));

-- Predictions: group members full access
create policy "predictions_select" on public.predictions for select using (public.is_group_member(group_id));
create policy "predictions_insert" on public.predictions for insert with check (public.is_group_member(group_id));
create policy "predictions_update" on public.predictions for update using (public.is_group_member(group_id));
create policy "predictions_delete" on public.predictions for delete using (public.is_group_member(group_id));

-- Join helper: look up group by invite code without being a member yet
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

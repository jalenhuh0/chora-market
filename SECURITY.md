# Security

This document describes how Chora Market handles auth, data access, and secrets — for reviewers and self-hosters.

## Secrets and environment variables

| Variable | Where used | Safe in git? |
|----------|------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | Yes (project URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Yes (designed to be public) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Not used** | Never commit |

Copy `.env.local.example` → `.env.local` and fill in your project values. `.env.local` is listed in `.gitignore` and must not be pushed.

If a secret was ever committed by mistake, rotate keys in the Supabase dashboard and rewrite git history before making the repo public.

## Authentication

- Supabase Auth (email/password)
- Next.js middleware refreshes sessions via `@supabase/ssr`
- Password reset flows through `/auth/callback` → `/auth/reset-password`

## Database access (RLS)

All application tables have **Row Level Security** enabled:

- **`users`** — read/update own row; read profiles of groupmates only
- **`groups`** — members can read/update their groups; creators can read immediately after insert
- **`group_members`** — visible to group members; users can join via invite RPC
- **`markets` / `predictions`** — full CRUD limited to group members

Helper `is_group_member(group_id)` gates policies. Unauthenticated users cannot read group ledger or bet data.

The **`groups_public`** view (see `supabase/SIMPLE_FIX.sql`) exposes only `id`, `name`, and `invite_code` for invite-link join flows — not `app_state` or financial data.

## Client-side data model

Group IOUs, bets, and stats are stored in Supabase (`groups.app_state` JSON + normalized `markets` / `predictions` rows). Any **group member** can update shared state — appropriate for a trusted friend-group app, not for adversarial multi-tenant use.

## Storage

Avatar uploads go to Supabase Storage (`avatars` bucket). Client validates image type and 5 MB max before upload; bucket policies should restrict writes to the authenticated user's folder.

## Deployment checklist

- [ ] RLS policies applied (`001_initial.sql` + project-specific fixes in `supabase/`)
- [ ] Auth **Site URL** and **Redirect URLs** include production domain and `/auth/callback`
- [ ] Vercel env vars set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] No service-role key in frontend or repo
- [ ] Email confirmation setting matches your onboarding flow (see `SETUP.md`)

## Reporting issues

For this private deployment, contact the repository owner directly.

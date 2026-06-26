# Tab Market — Next.js + Supabase

Your Tab Market HTML app, converted to a **Next.js** web app with **Supabase** auth and cloud sync.

## What's included

| Piece | Purpose |
|-------|---------|
| **Next.js 15** | Phone + desktop web app |
| **Supabase Auth** | Sign up / sign in |
| **users** | Profiles, avatar, notification prefs |
| **groups** | Private friend groups + invite codes |
| **markets** | Bet markets (synced from the app) |
| **predictions** | Odds votes on each market |
| **TabMarketApp** | Your full original UI (dashboard, IOUs, bets, people, settings) |

## Prerequisites

1. **Node.js 20+** — [https://nodejs.org](https://nodejs.org)
2. **Supabase account** — [https://supabase.com](https://supabase.com) (free tier works)

---

## Step 1 — Install Node.js

Download and install Node.js LTS, then open a new terminal and verify:

```bash
node -v
npm -v
```

---

## Step 2 — Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Pick a name and password, wait for it to finish provisioning
3. Open **Project Settings → API**
4. Copy:
   - **Project URL**
   - **anon public** key

---

## Step 3 — Run the database migration

1. In Supabase, open **SQL Editor**
2. Paste the contents of `supabase/migrations/001_initial.sql`
3. Click **Run**

This creates `users`, `groups`, `markets`, `predictions`, and security policies.

---

## Step 4 — Configure environment variables

```bash
cd C:\Users\Jalen Huh\Projects\tab-market-app
copy .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Step 5 — Install and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 6 — First use

1. **Sign up** with email + password
2. **Create a group** (or join with invite code)
3. Use Tab Market as before — data saves to Supabase automatically
4. **Share invite link** from the header (`/join/YOURCODE`)

---

## Deploy to the internet (Vercel)

1. Push this folder to GitHub
2. Go to [vercel.com](https://vercel.com) → **Import project**
3. Add the same env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy — you get a URL like `https://tab-market.vercel.app`

In Supabase → **Authentication → URL Configuration**, add your Vercel URL to **Site URL** and **Redirect URLs**.

---

## Project structure

```
src/
  app/              Next.js pages + layout
  components/       TabMarketApp, AuthForm, GroupGate
  hooks/            useTabMarket (all app logic)
  lib/market/       Types, calculations, Supabase sync
  lib/supabase/     Auth client helpers
supabase/
  migrations/       Database schema
source-index.html   Your original file (reference)
```

---

## Permissions (your spec)

All group members can:

- Rename the group
- Create / resolve bets (markets)
- Generate / share invite links
- Add IOUs, vote, tag friends, edit settings

---

## Next steps (optional)

- [ ] Enable **Realtime** in Supabase for live sync across devices
- [ ] Add **avatar upload** to Supabase Storage (currently URL field)
- [ ] Add **email notifications** via Supabase Edge Functions
- [ ] Add **PWA** manifest for “Add to Home Screen” on phones
- [ ] Custom domain

---

## Troubleshooting

**"Invalid API key"** — double-check `.env.local` values and restart `npm run dev`

**Can't sign up / email verification** — In [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Providers** → **Email**, turn **off** “Confirm email”. Save, then new signups go straight in with no verification email. (The app auto-signs you in when that setting is off.)

To unblock accounts already stuck waiting on email, run in **SQL Editor**:

```sql
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;
```

Also ensure **Email** provider is enabled and redirect URLs include your site plus `/auth/callback`.

**RLS errors** — Re-run the migration SQL; policies require you to be logged in and a group member.

**Blank page** — Open browser DevTools → Console for errors; ensure Node 20+ and `npm install` completed.

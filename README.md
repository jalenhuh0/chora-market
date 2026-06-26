# Chora Market

**Live demo:** [https://chora-market-app.vercel.app](https://chora-market-app.vercel.app)

Private friend-group app for **IOUs**, **head-to-head bets**, and **community odds markets** — with reputation leaderboards (alpha, calibration, accuracy) built on top.

Sign up, create or join a group via invite link, then track debts and run prediction markets among people you know.

---

## What it does

- **IOU ledger** — record who owes whom, settle debts, net balances by person
- **Bet markets** — create A vs B bets; the group submits probability votes; community odds drive settlement
- **Reputation** — Elo-style scores, Brier calibration, market alpha (edge vs the group), streaks, verdicts/tags
- **Groups** — invite-only private groups; each member has a ledger name synced into the app
- **Auth** — email/password sign-up, forgot password, in-app password change, Supabase session handling

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, React 19, TypeScript |
| Backend / DB | Supabase (Postgres, Auth, Storage) |
| Deploy | Vercel |
| Tests | Vitest (calculation unit tests) |

---

## Project structure

```
src/
  app/                    Next.js routes (home, auth, join)
  components/
    ChoraMarketApp.tsx    App shell + tab navigation
    chora-market/         Screens, bet cards, leaderboards
  hooks/
    useChoraMarket.ts     Composes domain hooks
    chora-market/         Core, bets, debts, people, settings
  lib/market/             Types, calculations, Supabase sync
  lib/supabase/           Auth client, middleware
supabase/migrations/      Database schema + RLS policies
```

Domain logic (odds, alpha, settlement) lives in `src/lib/market/calculations.ts` as pure functions.

---

## Run locally

**Prerequisites:** Node.js 20+, a [Supabase](https://supabase.com) project

```bash
git clone https://github.com/jalenhuh0/chora-market.git
cd chora-market
npm install
cp .env.local.example .env.local   # Windows: copy .env.local.example .env.local
```

1. Add your Supabase **Project URL** and **anon public key** to `.env.local`
2. Run `supabase/migrations/001_initial.sql` in the Supabase SQL Editor (see [SETUP.md](./SETUP.md) for follow-up fixes if needed)
3. Configure Auth redirect URLs (site URL + `/auth/callback`)

```bash
npm run dev      # http://localhost:3000
npm test         # unit tests
npm run build    # production build
```

**Full setup guide:** [SETUP.md](./SETUP.md)

---

## Security

- **Row Level Security (RLS)** on all app tables — users only read/write data for groups they belong to
- **Client uses the Supabase anon key only** (public by design); no service-role key in this repo
- **Secrets stay local** — `.env.local` is gitignored; never commit real keys
- **Invite lookup** exposes only group id, name, and invite code (not ledger/bet data)

Details: [SECURITY.md](./SECURITY.md)

---

## License

Private / all rights reserved (adjust if you open-source later).

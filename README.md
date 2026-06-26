# Chora Market

Friend-group IOU and bet tracker — converted from your HTML app to **Next.js + Supabase**.

**Full setup instructions:** see [SETUP.md](./SETUP.md)

## Quick start

```bash
npm install
cp .env.local.example .env.local   # add Supabase URL + anon key
# Run supabase/migrations/001_initial.sql in Supabase SQL Editor
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database tables

- **users** — profiles, avatars, notification prefs
- **groups** — private groups with invite codes
- **markets** — bet markets
- **predictions** — odds votes on markets

Your original UI is preserved in `src/components/TabMarketApp.tsx`.

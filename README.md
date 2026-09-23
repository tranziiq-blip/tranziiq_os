# TranziIQ

Fleet intelligence SaaS platform, running on Supabase (database, auth, storage,
edge functions) with a React + Vite frontend.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## Backend

Database schema, RLS policies, and the customs clearance workflow live in
the `supabase/` folder setup files. Edge functions are in `supabase/functions/`.

## Deployment

Frontend deploys via Vercel (connected to this repo). Backend runs on
Supabase — see project dashboard for database, auth, storage and edge
function management.

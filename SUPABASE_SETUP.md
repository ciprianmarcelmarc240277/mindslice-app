## Supabase Setup

Pentru integrarea cu utilizatori și momente salvate:

1. Adaugă în `mindslice-app/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

2. În Supabase SQL Editor rulează schema din:

`mindslice-app/supabase/schema.sql`

3. Repornește aplicația:

```bash
npm run dev
```

`SUPABASE_SERVICE_ROLE_KEY` este necesar pentru route-urile server-side care scriu date pentru utilizatorii autentificați prin Clerk.

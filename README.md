# MindSlice App

MindSlice este o aplicație Next.js pentru explorare vizuală și salvată a unor "live artistic moments". Interfața afișează direcții conceptuale, fragmente de gândire, palette vizuale și prompturi generate dintr-o bibliotecă de slice-uri, iar utilizatorii autentificați pot salva momentele în Supabase.

## Ce face

- afișează stări artistice live pornind dintr-o bibliotecă locală de slice-uri
- construiește prompturi vizuale pe baza direcției curente
- încarcă imagini de referință din API-ul aplicației
- permite autentificare cu Clerk
- salvează momentele utilizatorului în Supabase

## Stack

- Next.js 16
- React 19
- TypeScript
- Clerk pentru autentificare
- Supabase pentru persistență

## Rulare locală

1. Instalează dependențele:

```bash
npm install
```

2. Creează fișierul `.env.local` pe baza exemplului:

```bash
cp .env.example .env.local
```

3. Completează variabilele de mediu necesare:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. Pornește aplicația:

```bash
npm run dev
```

Aplicația va fi disponibilă la `http://localhost:3000`.

## Setup Supabase

Schema bazei de date se află în [`supabase/schema.sql`](./supabase/schema.sql).

Pașii rapizi sunt descriși în [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).

## Structură utilă

- `src/app/page.tsx` - interfața principală
- `src/app/api/slices/route.ts` - construiește biblioteca de slice-uri
- `src/app/api/reference-images` - expune imaginile de referință
- `src/app/api/user-state/route.ts` - citește și salvează momentele utilizatorului
- `src/lib/supabase/server.ts` - clientul server-side pentru Supabase
- `supabase/schema.sql` - schema tabelelor necesare

## GitHub Readiness

Înainte de publicare:

- nu urca `.env.local`
- folosește doar `.env.example` cu valori goale
- dacă ai folosit chei reale local, rotește `CLERK_SECRET_KEY` și `SUPABASE_SERVICE_ROLE_KEY` înainte de un repo public

## Status

Repo-ul este potrivit pentru GitHub ca aplicație separată, în folderul `mindslice-app`, nu ca întregul director de lucru `MindSlice`.

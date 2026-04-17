# MindSlice App

[![CI](https://github.com/ciprianmarcelmarc240277/mindslice-app/actions/workflows/ci.yml/badge.svg)](https://github.com/ciprianmarcelmarc240277/mindslice-app/actions/workflows/ci.yml)

MindSlice este o aplicație Next.js pentru explorare vizuală, prompting și salvare de "live artistic moments". Interfața combină o bibliotecă de slice-uri conceptuale, imagini de referință, autentificare cu Clerk și persistență în Supabase.

![MindSlice cover](./public/readme/mindslice-cover.jpg)

## Ce oferă

- un flux vizual live bazat pe direcții artistice și fragmente conceptuale
- prompturi construite din starea curentă a momentului
- imagini de referință servite prin API routes
- autentificare și stare de utilizator prin Clerk
- salvare de momente și profiluri în Supabase

## Stack

- Next.js 16
- React 19
- TypeScript
- Clerk
- Supabase
- GitHub Actions pentru CI
- Vercel pentru deploy

## Rulare locală

1. Instalează dependențele:

```bash
npm ci
```

2. Creează fișierul `.env.local`:

```bash
cp .env.example .env.local
```

3. Completează variabilele:

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

Aplicația rulează la `http://localhost:3000`.

## CI

Workflow-ul din [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) rulează automat pe `push` și `pull_request` și verifică:

- instalarea dependențelor cu `npm ci`
- lint cu `npm run lint`
- build cu `npm run build`

CI folosește valori placeholder pentru variabilele de mediu, astfel încât pipeline-ul să valideze build-ul fără a expune chei reale.

## Deploy Pe Vercel

Repo-ul este pregătit pentru deploy din GitHub în Vercel.

1. Importă repository-ul `ciprianmarcelmarc240277/mindslice-app` în Vercel.
2. Confirmă framework-ul `Next.js`.
3. Adaugă aceste environment variables în Vercel:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. Lasă `Install Command` pe `npm ci` și `Build Command` pe `npm run build`.

Config-ul de bază este deja definit în [`vercel.json`](./vercel.json).

## Supabase

- schema bazei de date: [`supabase/schema.sql`](./supabase/schema.sql)
- ghid rapid: [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)

## Structură Utilă

- `src/app/page.tsx` - experiența principală din UI
- `src/app/api/slices/route.ts` - generează biblioteca de slice-uri
- `src/app/api/reference-images` - expune imaginile de referință
- `src/app/api/user-state/route.ts` - citește și salvează momentele utilizatorului
- `src/lib/supabase/server.ts` - clientul Supabase pentru route-uri server-side
- `supabase/schema.sql` - schema tabelelor și indecșilor

## GitHub Hygiene

- `.env.local` rămâne local și este ignorat de Git
- `.env.example` trebuie păstrat fără chei reale
- issue templates și PR template sunt în `.github/`
- pentru protecție de branch, recomand activarea după ce confirmi dacă vrei workflow bazat pe PR-uri sau push direct

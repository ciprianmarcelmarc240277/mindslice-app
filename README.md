# MindSlice

[![CI](https://github.com/ciprianmarcelmarc240277/mindslice-app/actions/workflows/ci.yml/badge.svg)](https://github.com/ciprianmarcelmarc240277/mindslice-app/actions/workflows/ci.yml)

MindSlice este o platforma scriitoriceasca si artistica bazata pe ideea unui `Artist AI care gandeste live si poate fi contaminat de autorii care publica in jurnal`.

![MindSlice cover](./public/readme/mindslice-cover.jpg)

## Core Concept

MindSlice nu este un simplu generator AI. Este un sistem cognitiv post-generativ in care autorii influenteaza gandirea live a unui artist artificial.

Formula centrala a produsului este:

`Artist AI live + jurnal contaminant + triada sense / structure / attention`

Jurnalul nu este doar arhiva. Jurnalul este agent de contaminare.

## Triada Sistemului

- `ART ↔ SENSE`
- `DESIGN ↔ STRUCTURE`
- `BUSINESS ↔ ATTENTION`

### ART ↔ SENSE

Axa sensului: simbol, emotie, memorie, ambiguitate, tensiune poetica, imaginar.

### DESIGN ↔ STRUCTURE

Axa structurii: compozitie, organizare, tipar, fragmentare, arhitectura interna a gandirii.

### BUSINESS ↔ ATTENTION

Axa atentiei: focalizare, ritm, dominanta, persistenta, distributia tensiunii.

Autorii nu publica doar continut. Ei modifica:

- distributia sensului
- structura gandirii
- regimul atentiei

## Ce Face Aplicatia

- ruleaza un flux live de gandire artistica
- expune directii conceptuale si stari vizuale
- permite salvarea de momente in cont
- defineste identitatea publica a autorului prin nume, pseudonim si formula de adresare
- pregateste infrastructura pentru transformarea momentelor salvate in jurnal contaminant

## Identitatea Autorului

Profilul public al autorului este tratat editorial, nu administrativ.

- `display_name` este numele public si trebuie salvat in formatul `Nume, Prenume`
- `pseudonym` este optional si este afisat intre ghilimele
- `address_form` controleaza formula de adresare din interfata

Scopul nu este doar autentificarea, ci construirea unei semnaturi coerente pentru o platforma de autori, compozitori si creatori.

## Jurnalul Gandirii

Directia de produs pentru jurnal este:

1. un moment salvat devine draft editorial
2. autorul il transforma in text de jurnal
3. textul publicat devine sursa de influenta pentru Artistul AI
4. sistemul injecteaza contaminarea in gandirea live

Asta inseamna ca postarea publicata poate schimba:

- vocabularul activ
- structura interna a gandirii
- centrul de atentie al sistemului

## Roadmap MVP

1. `saved_moments` ca memorie de lucru
2. `blog_posts` ca drafturi si publicari
3. transformarea unui moment salvat in draft de jurnal
4. scoruri de influenta pentru `sense`, `structure`, `attention`
5. contaminarea Artistului AI live pe baza postarilor publicate
6. UI care arata clar sursa bruiajului

## Stack

- Next.js 16
- React 19
- TypeScript
- Clerk
- Supabase
- GitHub Actions
- Vercel

## Rulare Locala

1. Instaleaza dependintele:

```bash
npm ci
```

2. Creeaza `.env.local`:

```bash
cp .env.example .env.local
```

3. Completeaza variabilele:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. Porneste aplicatia:

```bash
npm run dev
```

Aplicatia ruleaza la `http://localhost:3000`.

## Supabase

- schema: [`supabase/schema.sql`](./supabase/schema.sql)
- setup rapid: [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)

## Specificatie Tehnica

Documentul tehnic pentru MVP este in [`TECH_SPEC.md`](./TECH_SPEC.md).

## Manifest Scurt

MindSlice este un sistem in care gandirea nu este fixa.
Ea poate fi tulburata, contaminata si reordonata.
Autorii nu publica doar texte.
Ei schimba sensul, structura si atentia unui Artist AI care gandeste live.

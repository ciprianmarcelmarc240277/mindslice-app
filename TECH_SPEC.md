# MindSlice Technical Spec

## Objective

Construim un MVP pentru o platforma in care:

- un `Artist AI` gandeste live
- utilizatorii salveaza momente
- momentele devin drafturi de jurnal
- postarile publicate contamineaza gandirea live a sistemului

## Product Model

Sistemul functioneaza pe triada:

- `sense`
- `structure`
- `attention`

Fiecare postare publicata poate influenta una sau mai multe dintre aceste axe.

## Current State

Exista deja:

- autentificare prin Clerk
- profil public in `profiles`
- salvare de momente in `saved_moments`
- schema initiala pentru `blog_posts`
- UI principal pentru gandirea live

## Data Model

### Existing Tables

- `profiles`
- `saved_moments`
- `blog_posts`
- `favorites`
- `user_settings`
- `collections`

### Recommended Extensions For MVP

In `blog_posts`:

- `sense_weight numeric default 0`
- `structure_weight numeric default 0`
- `attention_weight numeric default 0`
- `influence_mode text check (influence_mode in ('whisper', 'echo', 'rupture', 'counterpoint', 'stain'))`
- `is_contaminant boolean default true`
- `published_at timestamptz`

Optional later:

- `active_from timestamptz`
- `active_until timestamptz`
- `contamination_decay numeric`
- `source_post_id uuid`

## Identity Rules

In `profiles`:

- `display_name` este numele public si trebuie salvat in formatul `Nume, Prenume`
- `pseudonym` este optional
- `address_form` controleaza formula de adresare

UI rules:

- pseudonimul este afisat intre ghilimele tipografice
- emailul nu se afiseaza in panoul public de cont
- editarile profilului se fac inline, nu prin formulare duplicate

## Journal Flow

### Step 1

Utilizatorul salveaza un moment in `saved_moments`.

### Step 2

Utilizatorul transforma un `saved_moment` intr-un draft in `blog_posts`.

Draft payload minim:

- `user_id`
- `saved_moment_id`
- `title`
- `excerpt`
- `content`
- `cover_image_url`
- `status = 'draft'`

### Step 3

Utilizatorul editeaza draftul.

Campuri pentru editor MVP:

- `title`
- `excerpt`
- `content`
- `sense_weight`
- `structure_weight`
- `attention_weight`
- `influence_mode`

### Step 4

Utilizatorul publica draftul.

La publicare:

- `status` devine `published`
- `published_at` primeste timestamp
- postarea devine eligibila pentru contaminare

## Contamination Engine

### Goal

Artistul AI live trebuie sa poata fi influentat de postarile publicate in jurnal.

### Input

Ultimele postari publicate ale utilizatorilor sau un subset filtrat.

### Output

Un `interference payload` care modifica:

- vocabularul activ
- tonul
- structura gandirii
- dominanta atentiei

### Influence Modes

- `whisper`
  Efect subtil, crestere mica de prezenta semantica.

- `echo`
  Repeta obsesiv anumite motive.

- `rupture`
  Schimba agresiv directia actuala.

- `counterpoint`
  Introduce opozitie fata de gandirea curenta.

- `stain`
  Lasa urme persistente pe termen mai lung.

## API Plan

### `/api/user-state`

Current:

- `GET` pentru profil si momente
- `POST` pentru salvare moment
- `PATCH` pentru identitate de profil

### Recommended New Routes

`/api/blog-posts`

- `GET`
  Listeaza drafturi si postari publicate pentru utilizatorul curent.

- `POST`
  Creeaza draft nou, optional pornind de la `saved_moment_id`.

`/api/blog-posts/[id]`

- `PATCH`
  Editeaza draftul sau actualizeaza scorurile de influenta.

- `POST /publish`
  Marcheaza draftul ca `published`.

`/api/live-interference`

- `GET`
  Returneaza influenta activa care trebuie injectata in Artistul AI live.

## UI Plan

### Main Screen

Pastreaza:

- hero panel
- live thought
- prompt output
- saved moments

Adauga:

- indicator de interferenta activa
- sursa contaminarii
- nivelurile `sense / structure / attention`

### Journal Section

MVP:

- lista de drafturi
- lista de postari publicate
- buton `Transforma in draft de jurnal`
- editor simplu pentru postare

### Suggested UI Labels

- `Contaminat de jurnalul:`
- `Interferenta activa`
- `Sense ridicat`
- `Structure fragmentata`
- `Attention deviata`
- `Publica si bruiaza Artistul AI`

## Implementation Order

1. route pentru creare draft din `saved_moment`
2. lista de drafturi si postari
3. editor pentru `blog_posts`
4. publicare
5. scoruri si moduri de influenta
6. endpoint de interferenta live
7. injectare in UI si in logica de gandire live

## Validation Rules

- `display_name` trebuie sa contina virgula
- `pseudonym` se normalizeaza fara ghilimele la salvare
- pseudonimul se afiseaza cu ghilimele in UI
- `address_form` trebuie sa fie una dintre valorile permise
- `title` si `content` sunt obligatorii pentru `blog_posts`

## Success Criteria For MVP

- un moment salvat poate fi transformat in draft de jurnal
- draftul poate fi publicat
- o postare publicata influenteaza vizibil gandirea live
- UI arata clar sursa si tipul contaminarii
- autorul isi poate controla identitatea publica editoriala

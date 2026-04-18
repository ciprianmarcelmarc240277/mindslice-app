# MindSlice Alpha Plan

Acest document fixeaza faza actuala a proiectului:

`0-10 utilizatori`

si defineste MindSlice ca:

`laborator personal / alpha`

Scopul fazei alpha nu este scala. Scopul este adevarul conceptului.

## Alpha Thesis

In aceasta faza, MindSlice trebuie sa raspunda convingator la 4 intrebari:

1. Poate genera o `felie de gandire` care sa para vie, distincta si inteligenta?
2. Poate jurnalul sa functioneze ca agent real de contaminare, nu doar ca arhiva?
3. Poate tipografia sa fie tratata ca structura cognitiva, nu ca ornament?
4. Poate produsul sa-si sustina propria formula:

```text
Conceptual Art
+ Systems Aesthetics
+ Post-Generative Logic
+ Experimental Typography
+ Deconstruction / Text Theory
+ Media Theory
+ Atlas / Memory Thinking
+ Attention Theory
= MINDSLICE
```

## Scope

Faza alpha inseamna:

- dezvoltare centrata pe motorul live
- cost minim, controlat
- utilizatori putini, atent selectati
- feedback calitativ, nu metrica de scala
- experimente rapide cu prompturi, jurnal si scena tipografica

Nu inseamna:

- optimizare pentru crestere mare
- infrastructura grea
- realtime agresiv
- evaluare automata continua pe fiecare output
- complexitate prematura

## Target Stack

Stack-ul alpha este:

- `Vercel Hobby`
- `Supabase Free`
- `Clerk Free`
- `OpenAI` cu model ieftin pentru generare structurata
- fara `realtime` agresiv
- fara `semantic memory` mare
- fara `eval layer` continuu

Buget tinta:

- `~$5 - $15 / luna`

## What We Build Now

In alpha construim doar ceea ce sustine direct motorul:

### 1. Structured slice generation

Motorul trebuie sa produca:

- `direction`
- `thought`
- `fragments`
- `keywords`
- `mood`
- `motion`
- `visual`
- `triad`

Obiectiv:
- `api/slices` sa devina sursa reala a feliei de gandire
- prompt charter-ul sa influenteze direct comportamentul

### 2. Journal contamination

Jurnalul trebuie sa functioneze ca:

- `whisper`
- `echo`
- `rupture`
- `counterpoint`
- `stain`

Obiectiv:
- postarea publicata sa schimbe efectiv slice-ul
- contaminarea sa se vada in text, compozitie si ritm

### 3. Live typographic scene

Scena live trebuie sa puna accent pe:

- text animat
- fragmente
- camp tipografic
- tensiune intre axa dominanta si urme periferice

Obiectiv:
- imaginea sa nu fie centrul experientei
- tipografia sa poarte gandirea

### 4. Author identity

Alpha pastreaza:

- `display_name`
- `pseudonym`
- `address_form`

Obiectiv:
- produsul sa trateze autorul editorial, nu administrativ

## What We Delay

In alpha amanam intentionat:

### 1. Realtime intens

Nu implementam inca:

- broadcast dens
- update-uri foarte dese
- sincronizare live multi-user complexa

Motiv:
- nu avem nevoie de asta pentru validarea conceptului
- ar creste costul si complexitatea prea devreme

### 2. Semantic memory serioasa

Nu implementam inca:

- `pgvector` complet
- embeddings pe toate posturile si momentele
- retrieval semantic sofisticat

Motiv:
- mai intai validam daca motorul si jurnalul functioneaza conceptual

### 3. Evals automate continue

Nu implementam inca:

- scoring automat pe fiecare output
- pipeline de evaluare permanent
- infrastructura de judging continua

Motiv:
- deocamdata evaluam prin lectura critica, sampling si iteratie

### 4. Scale-oriented infrastructure

Nu implementam inca:

- queue-uri complexe
- workflow orchestration
- multi-agent setup
- cost engineering avansat

Motiv:
- alpha este pentru adevarul formal, nu pentru throughput

## Alpha Constraints

Pentru a pastra faza alpha coerenta, aplicam urmatoarele reguli:

1. Orice tehnologie noua trebuie sa serveasca direct motorul sau jurnalul.
2. Daca o functionalitate este utila doar la scala, o amanam.
3. Daca un output pare generic, il tratam ca esec conceptual.
4. Daca tipografia devine decorativa, revenim la structura.
5. Daca jurnalul nu produce contaminare recognoscibila, refacem motorul.
6. Costul lunar trebuie tinut in zona `~$5 - $15` cat timp suntem in alpha.

## Alpha Success Criteria

Consideram alpha reusit daca:

- `felia de gandire` are voce proprie
- contaminarea jurnalului este recognoscibila
- scena live tipografica sustine conceptul
- produsul poate fi aratat public unui cerc mic fara sa para generic
- costul ramane mic si controlabil

## Exit Conditions

Iesim din alpha doar cand apar simultan urmatoarele:

- motorul live produce rezultate bune in mod repetat
- jurnalul contamineaza sistemul intr-un mod clar si interesant
- avem feedback bun de la primii utilizatori
- simtim limite reale ale stack-ului gratuit

Abia atunci trecem la:

- `10-100 utilizatori`
- `public beta`
- `semantic memory` mai serioasa
- `realtime` mai bogat
- infrastructura platita minima

## Immediate Next Steps

Pasii imediati pentru repo sunt:

1. consolidarea `api/slices` ca motor principal al feliei de gandire
2. rafinarea scenei tipografice live
3. clarificarea relatiei dintre jurnal si contaminare
4. pastrarea costului low-cost si evitarea complexitatii premature

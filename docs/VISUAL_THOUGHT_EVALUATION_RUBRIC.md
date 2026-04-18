# MindSlice Visual Thought Evaluation Rubric

Acest document defineste modul in care evaluam MindSlice in faza alpha.

Obiectul evaluarii nu este `slice-ul` ca set de date brute.

Obiectul evaluarii este:

`construirea gandului ca output vizual`

Adica relatia dintre:

- `thought`
- `fragments`
- `keywords`
- `motion`
- `visual state`
- centru si periferie
- ritm si tensiune
- lizibilitatea contaminarii

Aceasta rubrica este un instrument de calibrare umana pentru alpha.

## Evaluation Object

Cand evaluam MindSlice, nu intrebam:

- cat de frumos este textul?
- cat de interesanta este lista de keywords?
- cat de poetic este un fragment?

Intrebam:

- cat de bine este construit gandul in scena?
- cat de inteligent este organizata tipografia?
- cat de clar este regimul atentiei?
- cat de bine se simte tensiunea dintre centru, fragment si contaminare?

## Core Axes

Rubrica principala are 3 axe:

### 1. Sense

Ce masoara:

- incarcatura semantica
- tensiunea poetica
- densitatea imaginara
- memoria activa
- forta simbolica a campului

Intrebari:

- scena produce sens sau doar text?
- exista reverberatie semantica?
- gandul lasa urme sau trece repede?
- exista tensiune intre fragmente si thought?

### 2. Structure

Ce masoara:

- organizarea campului tipografic
- coerenta sau fractura controlata
- raportul dintre axa dominanta si periferie
- inteligenta compozitionala
- arhitectura vizibila a gandului

Intrebari:

- exista o structura recognoscibila?
- scena pare construita sau doar aglomerata?
- fractura este productiva sau arbitrara?
- tipografia gandeste sau doar decoreaza?

### 3. Attention

Ce masoara:

- distributia focalizarii
- centrul de greutate perceptiv
- ritmul de lectura
- persistenta elementelor
- capacitatea scenei de a conduce privirea

Intrebari:

- stie scena unde sa te duca?
- exista o ordine a atentiei?
- unele elemente domina prea mult sau dispar prea repede?
- atentia este compusa sau doar risipita?

## Secondary Alpha Signals

In alpha, urmarim si cateva semnale secundare:

### Typographic Intelligence

Ce verificam:

- textul functioneaza ca structura cognitiva
- spatierea, relatiile si fragmentarea au rol
- nu exista ornament gratuit

### Contamination Readability

Ce verificam:

- contaminarea se simte
- contaminarea schimba gandul, nu doar adauga un ecou superficial
- modurile `whisper`, `echo`, `rupture`, `counterpoint`, `stain` sunt recognoscibile

### System Identity

Ce verificam:

- output-ul pare MindSlice
- nu suna generic
- nu seamana cu un demo AI standard
- isi sustine propria genealogie

## Scoring Scale

Folosim o scara continua intre:

- `0.00`
- `1.00`

Interpretarea de baza:

- `0.00 - 0.20`
  aproape absent

- `0.20 - 0.35`
  slab, difuz, fragil

- `0.35 - 0.55`
  emergent, prezent partial

- `0.55 - 0.75`
  clar, sustinut, convingator

- `0.75 - 1.00`
  puternic, dominant, memorabil

## Axis Labels

Pentru lectura umana, scorurile pot fi insotite de etichete:

### Sense

- `0.00 - 0.35` -> `faint`
- `0.35 - 0.55` -> `emergent`
- `0.55 - 0.75` -> `present`
- `0.75 - 1.00` -> `charged`

### Structure

- `0.00 - 0.35` -> `fragile`
- `0.35 - 0.55` -> `elastic`
- `0.55 - 0.75` -> `anchored`
- `0.75 - 1.00` -> `structured`

### Attention

- `0.00 - 0.35` -> `diffuse`
- `0.35 - 0.55` -> `emergent`
- `0.55 - 0.75` -> `retained`
- `0.75 - 1.00` -> `focused`

## Alpha Evaluation Protocol

Pentru fiecare output vizual, evaluatorul face urmatoarele:

1. Citeste thought-ul
2. Priveste campul de fragmente si keywords
3. Evalueaza relatia dintre centru si periferie
4. Noteaza:
   - `sense`
   - `structure`
   - `attention`
5. Noteaza optional:
   - `typographic_intelligence`
   - `contamination_readability`
   - `system_identity`
6. Adauga o observatie scurta de 1-3 propozitii

## Evaluation Sheet

Format scurt recomandat:

```yaml
slice_id: ""
direction: ""
mode: ""
contamination_mode: none

sense:
  score: 0.00
  note: ""

structure:
  score: 0.00
  note: ""

attention:
  score: 0.00
  note: ""

typographic_intelligence:
  score: 0.00
  note: ""

contamination_readability:
  score: 0.00
  note: ""

system_identity:
  score: 0.00
  note: ""

overall_note: ""
```

## Failure Conditions

Un output este slab daca:

- pare generic
- pare doar poetic, fara structura
- tipografia este doar decor
- atentia nu are centru de greutate
- contaminarea nu este recognoscibila
- sistemul nu pare MindSlice, ci un demo AI standard

## Success Conditions

Un output este bun daca:

- gandul are forta semantica
- campul este compus inteligent
- atentia este dirijata clar
- tipografia functioneaza cognitiv
- contaminarea este lizibila
- output-ul are identitate proprie

## Alpha Use

In alpha, aceasta rubrica se foloseste pentru:

- selectie de exemple bune
- detectarea output-urilor slabe
- comparatia dintre motorul local si refinement-ul structurat
- calibrarea euristicilor interne
- construirea unui prim set de exemple etalon

Primul set etalon este in:

- [visual-thought-calibration-dataset.yaml](./visual-thought-calibration-dataset.yaml)

Formularul scurt, repetabil, pentru review manual este in:

- [visual-thought-review-form.yaml](./visual-thought-review-form.yaml)

## Important

Scorurile actuale din produs sunt:

- `heuristic`
- utile pentru introspectie
- dar inca nevalidate empiric

Aceasta rubrica este pasul prin care trecem de la:

- `heuristic score`

spre:

- `calibrated visual thought evaluation`

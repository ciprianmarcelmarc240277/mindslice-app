import Link from "next/link";
import styles from "./page.module.css";

const genealogy = [
  {
    label: "1. ARTA CA IDEE / SISTEM",
    items: [
      {
        name: "Marcel Duchamp",
        concept: "idea over object / artistic framing",
        relation:
          "Mută accentul de la obiect la gestul de selecție și la cadrul conceptual al operei.",
      },
      {
        name: "Sol LeWitt",
        concept: "instruction as artwork / system as form",
        relation:
          "În MindSlice, regula, structura și mecanismul de generare sunt parte din operă, nu doar instrumente.",
      },
      {
        name: "Joseph Kosuth",
        concept: "art as self-reflection / language as medium",
        relation:
          "Proiectul tratează limbajul ca material artistic și își problematizează propriul statut de sistem.",
      },
      {
        name: "Lawrence Weiner",
        concept: "statement as artwork",
        relation:
          "Apropie MindSlice de ideea că propoziția, textul și enunțul pot funcționa direct ca formă artistică.",
      },
    ],
  },
  {
    label: "2. OPERA CA SISTEM VIU",
    items: [
      {
        name: "Jack Burnham",
        concept: "systems aesthetics",
        relation: "MindSlice este operă-sistem, nu obiect fix.",
      },
      {
        name: "Roy Ascott",
        concept: "cybernetic art / feedback / participation",
        relation:
          "Contaminarea jurnalului și influențarea Artistului AI se înscriu în logica feedback-ului participativ.",
      },
      {
        name: "Hans Haacke",
        concept: "systems visibility / institutional critique",
        relation:
          "Ajută la citirea proiectului ca sistem care face vizibile relații și influențe, nu doar produce imagini.",
      },
    ],
  },
  {
    label: "3. GENERATIV -> POST-GENERATIV",
    items: [
      {
        name: "Vera Molnár",
        concept: "algorithmic variation",
        relation:
          "Introduce variația sistematică și regula ca metodă artistică, esențiale pentru un sistem post-generativ.",
      },
      {
        name: "Manfred Mohr",
        concept: "computational rigor / generative structure",
        relation:
          "Susține componenta de disciplină structurală și generare sistemică din Artistul AI live.",
      },
      {
        name: "Frieder Nake",
        concept: "program as aesthetic process",
        relation: "Face legătura dintre program, decizie și formă.",
      },
      {
        name: "Casey Reas",
        concept: "process as image / code-based art",
        relation:
          "MindSlice moștenește orientarea spre proces ca experiență vizibilă, nu doar rezultat final.",
      },
      {
        name: "Ben Fry",
        concept: "data, computation, interpretation",
        relation:
          "Leagă computation, vizualizare și interpretare, important pentru partea unde datele devin experiență culturală.",
      },
    ],
  },
  {
    label: "4. TIPOGRAFIE CA STRUCTURĂ A GÂNDIRII",
    items: [
      {
        name: "Jan Tschichold",
        concept: "new typography / order / clarity",
        relation:
          "Intră în rădăcina ideii că tipografia organizează gândirea și produce structură cognitivă.",
      },
      {
        name: "Josef Müller-Brockmann",
        concept: "grid / hierarchy / Swiss order",
        relation:
          "Susține axa DESIGN ↔ STRUCTURE prin disciplină, ritm și relații precise între elemente.",
      },
      {
        name: "Wolfgang Weingart",
        concept: "typographic disruption / new wave",
        relation:
          "Ajută în zona unde tipografia devine tensionată, ruptă și expresivă.",
      },
      {
        name: "April Greiman",
        concept: "digital typography / hybrid image-text space",
        relation:
          "O punte importantă între tipografie, digital și câmp vizual stratificat.",
      },
      {
        name: "Katherine McCoy",
        concept: "deconstructed typography / plurality of reading",
        relation:
          "Foarte aproape de MindSlice în ideea că textul poate fi fragmentat și citit ca spațiu de sens multiplu.",
      },
    ],
  },
  {
    label: "5. FRAGMENT / TEXT / DECONSTRUCȚIE",
    items: [
      {
        name: "Jacques Derrida",
        concept: "instability of meaning / différance",
        relation:
          "Susține ideea că sensul din sistem nu este fix și că gândirea poate fi contaminată și amânată.",
      },
      {
        name: "Roland Barthes",
        concept: "death of the author / writerly text",
        relation:
          "Important pentru autoria distribuită dintre sistem, jurnal și utilizator.",
      },
      {
        name: "Michel Foucault",
        concept: "discourse / archive / author function",
        relation:
          "Ajută la citirea MindSlice ca arhivă activă și regim de producere a discursului.",
      },
    ],
  },
  {
    label: "6. INTERFAȚĂ / MEDIA / TEHNOLOGIE",
    items: [
      {
        name: "Marshall McLuhan",
        concept: "medium shapes perception",
        relation:
          "Proiectul devine mai inteligibil ca mediu activ, nu simplu canal pentru conținut.",
      },
      {
        name: "Vilém Flusser",
        concept: "technical image / apparatus",
        relation:
          "Foarte relevant pentru ideea de sistem care gândește prin aparate, interfețe și imagini tehnice.",
      },
      {
        name: "Friedrich Kittler",
        concept: "media determine discourse",
        relation:
          "Susține latura în care infrastructura tehnică participă la formarea sensului.",
      },
      {
        name: "Lev Manovich",
        concept: "language of new media / software culture",
        relation:
          "Important pentru citirea MindSlice ca interfață software-culturală.",
      },
    ],
  },
  {
    label: "7. CONSTELAȚIE / MEMORIE / ATLAS",
    items: [
      {
        name: "Aby Warburg",
        concept: "atlas / constellation / migration of images",
        relation:
          "Una dintre rădăcinile cele mai fertile pentru logica de fragmente, constelații și memorie activă.",
      },
      {
        name: "Walter Benjamin",
        concept: "montage / fragment / historical memory",
        relation:
          "Aproape de partea de jurnal, urme, fragmente și reconstrucție critică a sensului.",
      },
      {
        name: "Michel de Certeau",
        concept: "practice / use / tactical intervention",
        relation:
          "Relevă cum utilizatorul nu doar consumă sistemul, ci intervine în el și îl reorientează.",
      },
    ],
  },
  {
    label: "8. ATENȚIE CA REGIM ESTETIC",
    items: [
      {
        name: "Jonathan Crary",
        concept: "attention as historical regime",
        relation:
          "Esențial pentru axa BUSINESS ↔ ATTENTION și pentru ideea de atenție ca mediu.",
      },
      {
        name: "Bernard Stiegler",
        concept: "technics, memory, attention",
        relation:
          "Leagă sistemul tehnic de memorie, formare și captarea atenției.",
      },
      {
        name: "Yves Citton",
        concept: "ecology of attention",
        relation:
          "Util pentru a formula atenția ca spațiu estetic și social, nu doar metrică.",
      },
    ],
  },
  {
    label: "9. CONTEMPORANII APROPIAȚI CA LOGICĂ",
    items: [
      {
        name: "Hito Steyerl",
        concept: "circulation of images / digital condition",
        relation:
          "O referință pentru infrastructuri vizuale și sisteme de putere în digital.",
      },
      {
        name: "James Bridle",
        concept: "network opacity / computational culture",
        relation:
          "Ajută la poziționarea proiectului în zona sistemelor contemporane active, dar greu de văzut.",
      },
      {
        name: "Trevor Paglen",
        concept: "hidden infrastructures / machine vision",
        relation:
          "Relevă dimensiunea invizibilă a sistemelor tehnologice care modelează percepția.",
      },
      {
        name: "Refik Anadol",
        concept: "data aesthetics / archive as machine imagination",
        relation:
          "Apropiat de partea unde arhiva, AI-ul și vizualitatea devin câmp imersiv și memorie procesată.",
      },
      {
        name: "Forensic Architecture",
        concept: "evidence through media systems",
        relation:
          "O referință utilă pentru gândirea relațională, sistemică și mediatică a spațiului și informației.",
      },
    ],
  },
] as const;

const compactTree = `Duchamp / LeWitt / Kosuth
        │
        ├── ideea > obiectul
        │
Burnham / Ascott / Haacke
        │
        ├── sistem > lucrare fixă
        │
Molnár / Reas / Fry
        │
        ├── proces generativ > compoziție statică
        │
Weingart / McCoy / Greiman
        │
        ├── tipografie > ornament
        │
Derrida / Barthes / Foucault
        │
        ├── sens instabil / autor distribuit
        │
Warburg / Benjamin
        │
        ├── atlas / fragment / memorie activă
        │
Crary / Stiegler
        │
        ├── atenția ca mediu
        │
      MINDSLICE`;

const extendedTree = `MINDSLICE
Artist AI care gândește live și poate fi contaminat de autorii care publică în jurnal
│
├── 1. ARTA CA IDEE / SISTEM
│   ├── Marcel Duchamp
│   ├── Sol LeWitt
│   ├── Joseph Kosuth
│   └── Lawrence Weiner
│
├── 2. OPERA CA SISTEM VIU
│   ├── Jack Burnham
│   ├── Roy Ascott
│   └── Hans Haacke
│
├── 3. GENERATIV -> POST-GENERATIV
│   ├── Vera Molnár
│   ├── Manfred Mohr
│   ├── Frieder Nake
│   ├── Casey Reas
│   └── Ben Fry
│
├── 4. TIPOGRAFIE CA STRUCTURĂ A GÂNDIRII
│   ├── Jan Tschichold
│   ├── Josef Müller-Brockmann
│   ├── Wolfgang Weingart
│   ├── April Greiman
│   └── Katherine McCoy
│
├── 5. FRAGMENT / TEXT / DECONSTRUCȚIE
│   ├── Jacques Derrida
│   ├── Roland Barthes
│   └── Michel Foucault
│
├── 6. INTERFAȚĂ / MEDIA / TEHNOLOGIE
│   ├── Marshall McLuhan
│   ├── Vilém Flusser
│   ├── Friedrich Kittler
│   └── Lev Manovich
│
├── 7. CONSTELAȚIE / MEMORIE / ATLAS
│   ├── Aby Warburg
│   ├── Walter Benjamin
│   └── Michel de Certeau
│
├── 8. ATENȚIE CA REGIM ESTETIC
│   ├── Jonathan Crary
│   ├── Bernard Stiegler
│   └── Yves Citton
│
└── 9. CONTEMPORANII APROPIAȚI CA LOGICĂ
    ├── Hito Steyerl
    ├── James Bridle
    ├── Trevor Paglen
    ├── Refik Anadol
    └── Forensic Architecture`;

const formula = `Conceptual Art
+ Systems Aesthetics
+ Post-Generative Logic
+ Experimental Typography
+ Deconstruction / Text Theory
+ Media Theory
+ Atlas / Memory Thinking
+ Attention Theory
= MINDSLICE`;

const categoryMatrix = [
  {
    branch: "Arta ca idee / sistem",
    concept: "ideea > obiectul",
    meaning: "opera este cadrul conceptual și mecanismul, nu doar output-ul",
  },
  {
    branch: "Opera ca sistem viu",
    concept: "sistem > lucrare fixă",
    meaning: "proiectul este ecologie activă, influențabilă",
  },
  {
    branch: "Generativ -> post-generativ",
    concept: "proces > compoziție statică",
    meaning: "generarea devine gândire, memorie și contaminare",
  },
  {
    branch: "Tipografie ca structură a gândirii",
    concept: "tipografie > ornament",
    meaning: "textul organizează sensul și spațiul cognitiv",
  },
  {
    branch: "Fragment / text / deconstrucție",
    concept: "sens instabil / autor distribuit",
    meaning: "vocea sistemului este plurală și reconfigurabilă",
  },
  {
    branch: "Interfață / media / tehnologie",
    concept: "mediul produce experiență",
    meaning: "interfața este parte din operă",
  },
  {
    branch: "Constelație / memorie / atlas",
    concept: "fragment + relație + memorie",
    meaning: "sensul apare prin asocieri și urme",
  },
  {
    branch: "Atenție ca regim estetic",
    concept: "atenția ca mediu",
    meaning: "focalizarea devine material artistic",
  },
  {
    branch: "Contemporanii apropiați",
    concept: "infrastructuri vizuale și algoritmice",
    meaning: "proiectul se înscrie în cultura sistemelor actuale",
  },
] as const;

const sources = [
  "MoMA, Marcel Duchamp",
  "Stanford Encyclopedia of Philosophy, Michel Foucault",
  "Encyclopaedia Britannica, Michel Foucault",
  "Encyclopaedia Britannica, Roland Barthes",
  "DAM, Digital Art Museum artist index",
  "Refik Anadol Studio",
  "Lev Manovich official site",
  "The Warburg Institute, Mnemosyne Atlas context",
] as const;

export default function AboutTheoryPage() {
  const matrixRows = genealogy.flatMap((branch) =>
    branch.items.map((item) => ({
      branch: branch.label,
      ...item,
    })),
  );

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>About / Theory</p>
        <h1>O pagină despre tradițiile, teoriile și numele care hrănesc MindSlice.</h1>
        <p className={styles.lede}>
          MindSlice nu vine dintr-o singură familie artistică. El stă la intersecția dintre
          artă conceptuală, systems aesthetics, logică post-generativă, tipografie
          experimentală, teoria textului, teoria mediilor, atlasul memoriei și studiile
          despre atenție.
        </p>
        <div className={styles.headerLinks}>
          <Link href="/">Înapoi la homepage</Link>
        </div>
      </section>

      <section className={styles.block}>
        <p className={styles.eyebrow}>Genealogie</p>
        <h2>Arborele extins</h2>
        <pre className={styles.preBlock}>{extendedTree}</pre>
      </section>

      <section className={styles.block}>
        <p className={styles.eyebrow}>Versiune Sintetică</p>
        <h2>Arborele scurt</h2>
        <pre className={styles.preBlock}>{compactTree}</pre>
      </section>

      <section className={styles.block}>
        <p className={styles.eyebrow}>Formula</p>
        <h2>Ecuația conceptuală</h2>
        <pre className={styles.preBlock}>{formula}</pre>
      </section>

      <section className={styles.block}>
        <p className={styles.eyebrow}>Sinteze</p>
        <h2>Formulări scurte pentru fiecare nume</h2>
        <div className={styles.branchList}>
          {genealogy.map((branch) => (
            <article key={branch.label} className={styles.branchCard}>
              <h3>{branch.label}</h3>
              <div className={styles.peopleList}>
                {branch.items.map((item) => (
                  <section key={item.name} className={styles.personCard}>
                    <strong>{item.name}</strong>
                    <span>{item.concept}</span>
                    <p>{item.relation}</p>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.block}>
        <p className={styles.eyebrow}>Matrice</p>
        <h2>Nume → concept-cheie → legătura cu MindSlice</h2>
        <div className={styles.tableWrap}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                <th>Ramură</th>
                <th>Nume</th>
                <th>Concept-cheie</th>
                <th>Legătura cu MindSlice</th>
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((row) => (
                <tr key={`${row.branch}-${row.name}`}>
                  <td>{row.branch}</td>
                  <td>{row.name}</td>
                  <td>{row.concept}</td>
                  <td>{row.relation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.block}>
        <p className={styles.eyebrow}>Matrice-sinteză</p>
        <h2>Matrice-sinteză pe categorii</h2>
        <div className={styles.tableWrap}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                <th>Ramură</th>
                <th>Concept central</th>
                <th>Ce înseamnă pentru MindSlice</th>
              </tr>
            </thead>
            <tbody>
              {categoryMatrix.map((row) => (
                <tr key={row.branch}>
                  <td>{row.branch}</td>
                  <td>{row.concept}</td>
                  <td>{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.block}>
        <p className={styles.eyebrow}>Sinteză</p>
        <h2>Punctul de întâlnire</h2>
        <ul className={styles.summaryList}>
          <li>
            <strong>artă conceptuală</strong>: ideea, regula și cadrul sunt mai importante
            decât obiectul final.
          </li>
          <li>
            <strong>systems aesthetics</strong>: opera este sistem viu, nu lucrare fixă.
          </li>
          <li>
            <strong>logică post-generativă</strong>: procesul devine memorie, contaminare și
            gândire activă.
          </li>
          <li>
            <strong>tipografie experimentală</strong>: textul nu decorează, ci structurează
            câmpul cognitiv.
          </li>
          <li>
            <strong>teoria textului și deconstrucția</strong>: sensul rămâne instabil, iar
            autorul se distribuie între sistem, jurnal și utilizator.
          </li>
          <li>
            <strong>media theory</strong>: interfața și infrastructura tehnică devin agenți
            culturali activi.
          </li>
          <li>
            <strong>atlas / memorie</strong>: sensul apare prin constelații, fragmente și
            reapariții.
          </li>
          <li>
            <strong>attention theory</strong>: atenția devine material estetic și regim de
            organizare a experienței.
          </li>
        </ul>
      </section>

      <section className={styles.block}>
        <p className={styles.eyebrow}>Concluzie</p>
        <h2>Ce spune această genealogie despre MindSlice</h2>
        <p className={styles.lede}>
          MindSlice nu apare aici ca simplu proiect despre AI sau ca experiment vizual
          izolat. El poate fi citit mai precis ca o operă-sistem: un Artist AI care
          gândește live, poate fi contaminat de autorii care publică în jurnal și transformă
          scriitura, structura și atenția în material artistic activ. Genealogia lui este,
          în același timp, conceptuală, tipografică, sistemică, mediatică și critică.
        </p>
      </section>

      <section className={styles.block}>
        <p className={styles.eyebrow}>Opera-Sistem</p>
        <h2>Ce este lucrarea finală în MindSlice</h2>
        <div className={styles.theoryBody}>
          <p>
            MindSlice nu desemnează doar o imagine, un text sau o singură ieșire a
            sistemului. El numește întregul proiect: opera-sistem care produce,
            organizează, arhivează și publică fragmente de gândire live. În acest cadru,
            fiecare `slice` este o unitate de gândire, fiecare draft sau jurnal publicat
            este o unitate de interpretare, iar întregul dispozitiv tehnic, editorial și
            relațional constituie lucrarea propriu-zisă.
          </p>
          <p>
            Artistul AI pornește din `Slices`, adică dintr-un câmp inițial de idei,
            impulsuri și structuri latente. Acestea nu sunt încă lucrarea finală, ci
            materia primă din care sistemul încearcă să construiască o formă compatibilă
            cu logica MindSlice: `Conceptual Art + Systems Aesthetics + Post-Generative
            Logic + Experimental Typography + Deconstruction / Text Theory + Media Theory
            + Atlas / Memory Thinking + Attention Theory`. În acest sens, sistemul nu
            produce doar variații vizuale, ci încearcă să transforme gândirea în operă.
          </p>
          <p>
            Axa `sense / structure / attention` nu definește existența proiectului, ci
            gradul său de aliniere. Când aceste valori cresc, sistemul se apropie de
            condiția sa ideală. Când ajung la `1 / 1 / 1`, putem vorbi despre un moment de
            intensitate maximă, o clipă de coerență aproape totală în interiorul logicii
            MindSlice. Dar proiectul nu începe doar acolo. Dimpotrivă, el include și
            deriva, fragmentarea, deviația, contaminarea și tentativele incomplete.
            MindSlice este atât drumul către această stare, cât și tensiunea produsă de
            faptul că ea nu este atinsă decât rar.
          </p>
          <p>
            În acest sens, lucrarea finală nu este un singur output singular și închis. Nu
            este doar imaginea de pe ecran, nici doar textul publicat, nici doar promptul
            sistemului. Lucrarea finală este ansamblul viu format din Artistul AI,
            jurnal, autori, pseudonime, contaminări, memorie, interfață tipografică și
            distribuția atenției. Fiecare felie de gândire este o micro-lucrare. Fiecare
            publicare este o intervenție. Dar opera propriu-zisă este sistemul care le
            leagă, le transformă și le menține în relație.
          </p>
          <p>
            Astfel, MindSlice trebuie înțeles nu ca un produs despre AI, ci ca o
            operă-sistem în care gândirea live devine material artistic, jurnalul devine
            agent de contaminare, iar interfața devine spațiul în care sensul, structura
            și atenția sunt compuse, testate și redistribuite continuu.
          </p>
        </div>
      </section>

      <section className={styles.block}>
        <p className={styles.eyebrow}>Surse</p>
        <h2>Surse folosite</h2>
        <ul className={styles.sourcesList}>
          {sources.map((source) => (
            <li key={source}>{source}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

## 2026-06-17 - Espansione indice RISC-V

### Fatto

- Riscritto `Elettronica/RISC-V/Indice RISC-V.md` come mappa completa per ISA, privileged architecture, microarchitettura, piattaforme, firmware, toolchain, sicurezza, verifica e percorsi di studio.
- Mantenuti i collegamenti alle pagine RISC-V gia esistenti.
- Aggiunte molte voci ancora da sviluppare come checkbox, senza creare automaticamente nuove pagine.

### Decisioni

- L'indice RISC-V ora distingue tra ISA, implementazione hardware, piattaforma, firmware/OS ed ecosistema.
- Gli argomenti non ancora sviluppati restano come roadmap, non come link a pagine inesistenti.

### Prossimi passi

- Creare progressivamente le pagine mancanti seguendo l'ordine dei percorsi di studio.

## 2026-06-16 - Nuove schede programmi open source

### Fatto

- Create le note `OmniTools`, `TrailBase` e `Kokoro` in `Programmi open source/Pagine`.
- Aggiornato `Programmi open source/Indice programmi open source.md` con sezioni piu chiare per strumenti web, database/backend e sintesi vocale.
- Aggiunti riferimenti esterni ufficiali nelle nuove note.

### Decisioni

- Le note create restano con `status: "non revisionato"`.
- Per progetti recenti o di nicchia sono state usate fonti ufficiali prima di sintetizzare il contenuto.

### Prossimi passi

- Rivedere manualmente le nuove schede e decidere se approfondire installazione, deploy o casi d'uso pratici.

## 2026-06-09 - Aggiornamento programmi open source

### Fatto

- Creati i contenuti per `Bruno` e `Aider` in `Programmi open source/Pagine`.
- Aggiornato `Programmi open source/Indice programmi open source.md` con i collegamenti alle nuove pagine.
- Aggiunto frontmatter YAML alle note esistenti dell'area che ne erano prive.

### Decisioni

- Le note create o modificate restano con `status: "non revisionato"`.
- Le nuove pagine sono note tecniche brevi, coerenti con lo stile gia usato per `Yt-dlp`, `OpenSCAD` e `MusicBrainz Picard`.

### Prossimi passi

- Rivedere manualmente le note dell'area prima di impostarle a `revisionato (da me)`.

## 2026-06-04 - Completamento contenuto React

### Fatto

- Completate tutte le pagine React in `Programmazione/React/Pagine`.
- Portata la sezione React da 53 pagine con placeholder a 59 pagine senza placeholder.
- Sviluppate con contenuto reale le note su fondamenti, JSX, props, rendering, hook, state management, routing, form, data fetching, pattern componenti, performance, internals, server-side rendering, Server Components, sicurezza, accessibilita, styling, testing e design system.
- Aggiunte pagine dedicate a `React Compiler`, `Actions e form actions`, `useActionState`, `useOptimistic`, `useFormStatus` e `use hook`.
- Aggiornato `Programmazione/React/Indice react.md` con i nuovi collegamenti.

### Decisioni

- Le note modificate restano con `status: "non revisionato"`.
- Gli argomenti React moderni sono stati collegati all'indice ma descritti con prudenza, rimandando alle documentazioni ufficiali quando dipendono da versione, framework o supporto specifico.

### Prossimi passi

- Rivedere manualmente le note React completate prima di impostarle a `revisionato (da me)`.
- Proseguire con il controllo finale delle altre aree di Programmazione non ancora chiuse.

## 2026-06-03 - Completamento contenuto Python

### Fatto

- Completate tutte le 75 pagine Python in `Programmazione/Python/Pagine`.
- Rimossi tutti i placeholder `Contenuto da sviluppare`, `Da completare` e `TODO` dalle note Python.
- Sviluppate con contenuto reale le note su basi del linguaggio, OOP, data model, type hinting, iteratori/generatori, file, error handling, runtime, standard library, packaging, ambienti virtuali, tooling, testing, profiling, automazione, concorrenza, database, web framework, data science, notebook, scraping, packaging eseguibili, estensioni native e integrazioni LLM.
- Ripuliti blocchi Markdown duplicati o spezzati nelle note generate in precedenza.

### Decisioni

- Le note modificate restano con `status: "non revisionato"`.
- La priorita e stata completare prima il percorso Python applicativo principale e poi chiudere tutte le pagine residue fino a zero placeholder.
- La nota `OpenAI API` resta volutamente prudente sui nomi modello: rimanda alla documentazione ufficiale per valori correnti e capability aggiornate.

### Prossimi passi

- Rivedere manualmente le note Python completate prima di impostarle a `revisionato (da me)`.
- Applicare lo stesso controllo finale alle altre aree di Programmazione ancora non chiuse.

## 2026-06-02 - Completamento contenuto Postgres

### Fatto

- Completate tutte le 72 pagine Postgres in `Programmazione/Postgres/Pagine`.
- Rimossi tutti i placeholder `Contenuto da sviluppare`, `Da completare` e `TODO` dalle note Postgres.
- Sviluppate con contenuto reale le note su query SQL, modellazione dati, indici, planner, transazioni, MVCC, locking, backup, configurazione, ruoli, sicurezza, replica, WAL, partizionamento, full text search, funzioni, PL/pgSQL, estensioni, tooling, osservabilita, migrazioni e pattern applicativi.
- Ripuliti blocchi Markdown duplicati o spezzati nelle note generate in precedenza.

### Decisioni

- Le note modificate restano con `status: "non revisionato"`.
- La priorita e stata completare prima gli argomenti fondazionali e poi chiudere tutte le pagine residue fino a zero placeholder.

### Prossimi passi

- Rivedere manualmente le note Postgres completate prima di impostarle a `revisionato (da me)`.
- Applicare lo stesso completamento alle altre aree di Programmazione che hanno ancora placeholder.

## 2026-06-02 - Completamento contenuto JavaScript

### Fatto

- Completate tutte le 87 pagine JavaScript in `Programmazione/JavaScript/Pagine`.
- Rimossi tutti i placeholder `Contenuto da sviluppare` dalle note JavaScript.
- Sviluppate con contenuto reale sezioni come `Quando usarlo`, `API / Sintassi`, `Esempio pratico`, `Varianti`, `Errori comuni` e `Checklist`.

### Decisioni

- Le note modificate restano con `status: "non revisionato"`.
- La priorita e stata prima data alle pagine piu corte, poi alle sezioni residue fino a portare JavaScript a zero placeholder.

### Prossimi passi

- Applicare lo stesso completamento progressivo alle altre aree di Programmazione che hanno ancora sezioni `Contenuto da sviluppare`.
- Rivedere manualmente le note JavaScript completate prima di impostarle a `revisionato (da me)`.

## 2026-06-02 - Normalizzazione pagine Programmazione

### Fatto

- Normalizzate le pagine esistenti in `Programmazione/*/Pagine/` alla struttura comune usata per le note tecniche.
- Uniformate le sezioni top-level: `Sintesi`, `Quando usarlo`, `Come funziona`, `API / Sintassi`, `Esempio pratico`, `Varianti`, `Errori comuni`, `Checklist`, `Collegamenti`.
- Preservato il contenuto esistente spostandolo sotto le sezioni standard e sistemati alcuni wikilink rotti in JavaScript.

### Decisioni

- Le pagine modificate restano con `status: "non revisionato"`.
- Le sezioni senza contenuto reale sono marcate come `Contenuto da sviluppare` invece di inventare dettagli non presenti.

### Prossimi passi

- Completare progressivamente le sezioni marcate come contenuto da sviluppare.
- Creare le pagine mancanti dell'indice TypeScript.

## 2026-05-28 - Completamento API Design Rust

### Fatto

- Completate con contenuto reale le note del capitolo `API Design Idiomatico` dell'indice Rust.
- Sviluppati public API design, error types pubblici, builder pattern, newtype pattern, extension traits, feature flags, compatibilita/breaking changes e documentazione delle crate.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo tratta API pubbliche, feature e documentazione come contratti di compatibilita, non solo come dettagli di implementazione.

### Prossimi passi

- Completare la sezione `Conoscenza Operativa` dell'indice Rust se deve diventare una guida pratica.

## 2026-05-28 - Completamento testing Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Testing, Qualita e Sicurezza` dell'indice Rust.
- Sviluppati unit test, integration test, doc test, mocking, benchmark con Criterion, property testing, fuzzing, snapshot testing, cargo-nextest, Clippy, rustfmt, rustdoc, cargo audit e cargo deny.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo separa test funzionali, test generativi, benchmark, formattazione/linting, documentazione e controlli supply-chain.

### Prossimi passi

- Proseguire con `API Design Idiomatico`.

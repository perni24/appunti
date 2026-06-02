# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

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

## 2026-05-27 - Completamento Embedded Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Embedded` dell'indice Rust.
- Sviluppati `embedded-hal`, `cortex-m`, `probe-rs`, `defmt`, RTIC ed Embassy; aggiornata anche la nota `no_std` con collegamenti al percorso Embedded.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo distingue tra astrazioni hardware portabili, runtime Cortex-M, flashing/debug, logging compatto, concorrenza real-time e async embedded.

### Prossimi passi

- Proseguire con `Testing, Qualita e Sicurezza`.

## 2026-05-27 - Completamento WebAssembly Rust

### Fatto

- Completate con contenuto reale le note del capitolo `WebAssembly` dell'indice Rust.
- Sviluppati `wasm-bindgen`, `wasm-pack`, interop con JavaScript, WASI e limiti del runtime WebAssembly.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo distingue tra browser/JavaScript, packaging npm, runtime WASI e limiti generali del target Wasm.

### Prossimi passi

- Proseguire con `Embedded` oppure `Testing, Qualita e Sicurezza`.

## 2026-05-27 - Completamento backend Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Backend, Networking e Database` dell'indice Rust.
- Sviluppati networking con `reqwest`, backend con `axum`, Tower/middleware, Serde, SQLx, Diesel, SeaORM, connection pooling e background jobs.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo distingue chiaramente tra HTTP client, web layer, middleware, serializzazione, accesso dati e lavoro asincrono fuori richiesta.

### Prossimi passi

- Proseguire con `WebAssembly`, `Embedded` oppure `Testing, Qualita e Sicurezza`.

## 2026-05-27 - Completamento CLI e Tooling Rust

### Fatto

- Completate con contenuto reale le note del capitolo `CLI e Tooling` dell'indice Rust.
- Sviluppati CLI con `clap`, configurazione applicativa, logging, tracing, error reporting e packaging/release.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo tratta la CLI come superficie pubblica dell'applicazione, separando parsing, configurazione, osservabilita, reporting e distribuzione.

### Prossimi passi

- Proseguire con `Backend, Networking e Database` oppure `Testing, Qualita e Sicurezza`.

## 2026-05-26 - Completamento Rust di Sistema

### Fatto

- Completate con contenuto reale le note del capitolo `Rust di Sistema` dell'indice Rust.
- Sviluppati FFI, bindgen/cbindgen, libc/nix, layout, allocator, no_std, embedded, file descriptor, memory mapping, cross-compilation, linking, performance/profiling e zero-cost abstractions.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo separa i confini unsafe/FFI dalle pratiche operative di build, profiling e cross-compilation.

### Prossimi passi

- Proseguire con `Applicazioni e Ecosistema`.

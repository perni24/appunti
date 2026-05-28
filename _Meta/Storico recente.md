# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

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

## 2026-05-26 - Completamento unsafe Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Unsafe Rust in Profondita` dell'indice Rust.
- Sviluppati unsafe Rust, raw pointers, unsafe functions, unsafe traits, invariants, aliasing rules, undefined behavior, Miri e unsafe abstractions sicure.
- Aggiunti esempi pratici, contratti di safety, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo enfatizza confinamento dell'unsafe, documentazione delle invarianti e verifica con Miri.

### Prossimi passi

- Proseguire con il capitolo `Rust di Sistema`.

## 2026-05-26 - Completamento macro Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Macros` dell'indice Rust.
- Sviluppate macro dichiarative, procedural macros, derive macros, attribute macros, function-like macros e hygiene.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo distingue chiaramente tra `macro_rules!` e macro procedurali per evitare sovrauso di proc macro.

### Prossimi passi

- Proseguire con il capitolo `Unsafe Rust in Profondita`.

## 2026-05-26 - Completamento compile-time Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Compile-Time e Type-Level Programming` dell'indice Rust.
- Sviluppati `const`, `static`, `const fn`, const generics, `PhantomData`, marker types, newtype, typestate e zero-sized types.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo distingue tra valori compile-time, parametri const e pattern type-level per evitare uso eccessivo di astrazioni generiche.

### Prossimi passi

- Proseguire con il capitolo `Macros`.

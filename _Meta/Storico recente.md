# Storico recente

Questo file contiene un riepilogo operativo delle modifiche importanti al vault.

Non e uno storico completo: serve solo per aiutare l'utente o un modello LLM a riprendere il contesto tra una sessione e l'altra.

Mantieni solo le ultime 10 voci operative.

---

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

## 2026-05-26 - Completamento concorrenza e asincronia Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Concorrenza e Asincronia` dell'indice Rust.
- Sviluppati thread, message passing, shared state, `Send`/`Sync`, mutex, RwLock, atomics, Rayon, async/await, Future, runtime async, select/join/cancellation, async streams, channel async e graceful shutdown.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo separa concorrenza sync, parallelismo CPU e asincronia I/O per evitare sovrapposizioni concettuali.

### Prossimi passi

- Proseguire con il capitolo `Compile-Time e Type-Level Programming`.

## 2026-05-22 - Completamento Cargo e compatibilita Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Cargo, Editions e Compatibilita` dell'indice Rust.
- Sviluppati Cargo, manifest, lockfile, crates.io, semantic versioning, MSRV, editions, migrazione edition, feature, build script, profili e dipendenze workspace.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo chiarisce il ruolo di compatibilita, MSRV e edition come parte della manutenzione di crate e applicazioni Rust.

### Prossimi passi

- Proseguire con il percorso avanzato Rust partendo da `Concorrenza e Asincronia`.

## 2026-05-22 - Completamento standard library Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Standard Library` dell'indice Rust.
- Sviluppati Iterator API, conversioni `From`/`Into`/`TryFrom`/`TryInto`, `AsRef`/`AsMut`/`Borrow`, `Default`, `Display`/`Debug`, path, stringhe OS, file I/O, processi e tempo.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo `Standard Library` viene trattato come base operativa prima delle sezioni Cargo, tooling, async e applicazioni.

### Prossimi passi

- Completare il capitolo `Cargo, Editions e Compatibilita`.

## 2026-05-22 - Completamento smart pointer Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Smart Pointers e Interior Mutability` dell'indice Rust.
- Sviluppati `Box<T>`, `Deref`, `Drop`, `Rc<T>`, `Arc<T>`, `RefCell<T>`, `Cell<T>`, `Mutex<T>`, `RwLock<T>`, `OnceLock`, `LazyLock`, interior mutability e `Pin`/`Unpin`.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo collega ownership, borrowing e concorrenza, preparando le sezioni su standard library, async e unsafe.

### Prossimi passi

- Completare il capitolo `Standard Library` oppure approfondire concorrenza e async.

## 2026-05-22 - Completamento lifetimes Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Lifetimes` dell'indice Rust.
- Sviluppati lifetime annotations, lifetime elision, lifetimes nelle struct, lifetimes nei trait, lifetimes avanzati e HRTB.
- Aggiunti esempi pratici, errori comuni, checklist e collegamenti interni coerenti.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo `Lifetimes` fa da ponte tra ownership/borrowing e le sezioni su GAT, trait object, smart pointer e unsafe.

### Prossimi passi

- Completare il capitolo `Smart Pointers e Interior Mutability`.

## 2026-05-21 - Completamento astrazione e generici Rust

### Fatto

- Completate con contenuto reale le note del capitolo `Astrazione e Generici` dell'indice Rust.
- Sviluppati generics, traits, trait bounds, derive, associated types, GAT, trait object, dispatch, object safety e blanket implementations.
- Aggiornati frontmatter, esempi pratici, checklist e collegamenti interni.

### Decisioni

- Le note completate restano con `status: "non revisionato"` fino alla revisione dell'utente.
- Il capitolo viene trattato come base del percorso intermedio Rust prima di lifetime avanzati e smart pointer.

### Prossimi passi

- Completare il capitolo `Lifetimes` o collegare meglio queste note alle future sezioni su smart pointer e standard library.

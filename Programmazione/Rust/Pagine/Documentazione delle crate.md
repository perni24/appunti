---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - api-design-idiomatico
aliases:
  - "Documentazione delle crate"
  - "Crate documentation"
prerequisites:
  - "[[Programmazione/Rust/Pagine/rustdoc]]"
  - "[[Programmazione/Rust/Pagine/Doc test]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/Error types pubblici]]"
  - "[[Programmazione/Rust/Pagine/Feature flags ben progettate]]"
  - "[[Programmazione/Rust/Pagine/Packaging e release]]"
---

# Documentazione delle crate

## Sintesi

La **documentazione delle crate** spiega a utenti e manutentori come usare una libreria Rust: scopo, installazione, esempi, moduli principali, feature, errori, panics, safety e compatibilita.

In Rust la documentazione e parte dell'API. Viene generata da `rustdoc`, puo contenere doc test e spesso e il primo modo in cui un utente valuta una crate.

## Quando usarlo

Cura la documentazione quando:

- pubblichi una crate;
- esponi API usate da altri team;
- aggiungi feature opzionali;
- introduci errori pubblici o unsafe API;
- vuoi ridurre domande ripetute;
- vuoi rendere esempi e onboarding riproducibili.

Una crate non documentata puo essere tecnicamente corretta ma difficile da adottare.

## Come funziona

La documentazione efficace copre piu livelli:

- README: panoramica e quick start;
- crate-level docs: contesto generale in `lib.rs`;
- item docs: funzioni, struct, enum e trait pubblici;
- esempi: uso reale e minimale;
- sezioni speciali: `Errors`, `Panics`, `Safety`;
- feature documentation: cosa abilita ogni feature;
- changelog: evoluzione e breaking changes.

Gli esempi dovrebbero compilare quando possibile. I doc test mantengono allineati esempi e API.

## API / Sintassi

Documentazione crate-level:

```rust
//! Client per l'API Notes.
//!
//! # Quick start
//!
//! ```
//! let client = notes_client::Client::builder().build().unwrap();
//! ```
```

Documentazione item:

```rust
/// Carica un documento.
///
/// # Errors
///
/// Restituisce errore se il documento non esiste o non puo essere letto.
pub fn load_document(path: &std::path::Path) -> Result<Document, LoadError> {
    todo!()
}

# pub struct Document;
# #[derive(Debug)]
# pub struct LoadError;
```

Funzioni unsafe:

```rust
/// Converte un puntatore raw in riferimento.
///
/// # Safety
///
/// `ptr` deve essere non nullo, allineato e valido per la durata del riferimento.
pub unsafe fn from_ptr<'a, T>(ptr: *const T) -> &'a T {
    unsafe { &*ptr }
}
```

## Esempio pratico

Struttura minima per una crate pubblica:

```text
README.md
CHANGELOG.md
Cargo.toml
src/
  lib.rs
examples/
  basic.rs
tests/
  api.rs
```

`lib.rs`:

```rust
//! Libreria per normalizzare testo.
//!
//! # Example
//!
//! ```
//! let value = text_tools::normalize(" Luca ");
//! assert_eq!(value, "luca");
//! ```

/// Normalizza spazi e maiuscole.
pub fn normalize(input: &str) -> String {
    input.trim().to_lowercase()
}
```

La documentazione mostra subito lo scopo e un esempio verificabile.

## Varianti

- **README**: orientato a scoperta e quick start.
- **Crate docs**: guida principale generata da rustdoc.
- **Item docs**: contratto delle singole API.
- **Examples directory**: esempi piu lunghi.
- **Changelog**: migrazioni e breaking changes.
- **Feature matrix**: documenta combinazioni e dipendenze opzionali.

## Errori comuni

- Documentare solo cosa fa il codice, non quando usarlo.
- Lasciare esempi non compilanti.
- Non documentare errori e panics.
- Omettere `Safety` su funzioni unsafe.
- Non spiegare feature opzionali.
- Nascondere breaking changes nel testo di release.
- Usare documentazione come sostituto di nomi chiari.

## Checklist

- README e crate docs spiegano lo scopo?
- Esiste un quick start?
- Gli esempi compilano?
- Errori, panics e safety sono documentati?
- Le feature sono spiegate?
- Le API pubbliche principali hanno esempi?
- Changelog e versioning aiutano la migrazione?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/rustdoc]]
- [[Programmazione/Rust/Pagine/Doc test]]
- [[Programmazione/Rust/Pagine/Public API design]]
- [[Programmazione/Rust/Pagine/Error types pubblici]]
- [[Programmazione/Rust/Pagine/Feature flags ben progettate]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes]]
- [[Programmazione/Rust/Pagine/Packaging e release]]

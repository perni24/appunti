---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags:
  - programmazione
  - rust
  - cargo-editions-e-compatibilita
aliases:
  - "crates.io"
  - "Registry Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
  - "[[Programmazione/Rust/Pagine/Semantic Versioning]]"
related:
  - "[[Programmazione/Rust/Pagine/Cargo.lock]]"
  - "[[Programmazione/Rust/Pagine/cargo audit]]"
  - "[[Programmazione/Rust/Pagine/cargo deny]]"
---

# Crates.io

## Sintesi

Crates.io e il registry pubblico principale dell'ecosistema Rust. Cargo lo usa per scaricare dipendenze e pubblicare crate riusabili.

Pubblicare una crate significa rendere disponibile una versione immutabile: una versione pubblicata non puo essere sovrascritta, solo yanked o sostituita da una nuova release.

## Quando usarlo

- Quando aggiungi dipendenze pubbliche a un progetto Rust.
- Quando pubblichi una libreria riusabile.
- Quando controlli versioni, feature, documentazione e manutenzione di una crate.
- Quando vuoi verificare metadata, licenza e repository di una dipendenza.

## Come funziona

Dipendenza da crates.io:

```toml
[dependencies]
serde = "1"
```

Pubblicazione:

```bash
cargo login
cargo package
cargo publish
```

`cargo package` crea localmente il pacchetto che verrebbe pubblicato e aiuta a verificare cosa entra nella release.

## API / Sintassi

Metadata utili in `Cargo.toml`:

```toml
[package]
name = "my-crate"
version = "0.1.0"
edition = "2024"
license = "MIT OR Apache-2.0"
description = "Descrizione breve della crate"
repository = "https://github.com/user/my-crate"
readme = "README.md"
```

Escludere file:

```toml
exclude = ["tests/fixtures/*", "notes/*"]
```

## Esempio pratico

Checklist release:

```bash
cargo fmt --check
cargo clippy --all-targets --all-features
cargo test --all-features
cargo package
cargo publish
```

Prima della pubblicazione conviene verificare anche README, licenza, changelog e feature abilitate.

## Varianti

- Registry pubblico: crates.io.
- Registry privati: configurabili per organizzazioni.
- Git dependencies: dipendenze da repository Git.
- Path dependencies: dipendenze locali.
- Yank: rimozione dalla risoluzione automatica senza cancellare la versione.

## Errori comuni

- Pubblicare senza controllare i file inclusi nel package.
- Dimenticare licenza, descrizione o repository.
- Pubblicare API instabile con versione che promette stabilita.
- Usare dipendenze con feature eccessive.
- Pensare di poter modificare una versione gia pubblicata.

## Checklist

- Nome, descrizione, licenza e repository sono corretti?
- La crate compila con feature previste?
- Il package contiene solo i file necessari?
- La versione segue semantic versioning?
- README e documentazione spiegano l'uso base?

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]
- [[Programmazione/Rust/Pagine/cargo audit|cargo audit]]
- [[Programmazione/Rust/Pagine/cargo deny|cargo deny]]

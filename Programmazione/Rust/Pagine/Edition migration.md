---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - cargo-editions-e-compatibilita
aliases:
  - "Migrazione edition"
  - "cargo fix edition"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024]]"
  - "[[Programmazione/Rust/Pagine/Cargo]]"
related:
  - "[[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version]]"
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
  - "[[Programmazione/Rust/Pagine/rustfmt]]"
---

# Edition migration

## Sintesi

Edition migration e il processo con cui una crate passa da una edition Rust a una successiva. Rust fornisce strumenti automatici, ma la migrazione resta una modifica da testare: il codice puo compilare ma avere punti da rivedere manualmente.

Il comando centrale e `cargo fix --edition`.

## Quando usarlo

- Quando vuoi portare un progetto a una edition piu recente.
- Quando una nuova edition semplifica codice o abilita convenzioni moderne.
- Quando la MSRV del progetto permette la nuova edition.
- Quando vuoi ridurre warning o preparare una release di manutenzione.

## Come funziona

Flusso tipico:

```bash
cargo check
cargo fix --edition
cargo test
```

Poi aggiorni `Cargo.toml`:

```toml
[package]
edition = "2024"
```

Il comando applica fix meccanici dove possibile. Non sostituisce una revisione semantica del codice.

## API / Sintassi

Comandi utili:

```bash
cargo fix --edition
cargo fix --edition --allow-dirty
cargo check --all-targets
cargo test --all-features
```

Per workspace:

```bash
cargo fix --edition --workspace
```

In pratica conviene lavorare su una branch dedicata e tenere diff piccoli.

## Esempio pratico

Migrazione controllata:

```bash
git checkout -b chore/rust-2024-edition
cargo fix --edition
cargo fmt
cargo clippy --all-targets --all-features
cargo test --all-features
```

Dopo i fix automatici si rivedono diff, warning e comportamento dei test.

## Varianti

- Migrazione di una singola crate.
- Migrazione di workspace completo.
- Migrazione graduale: crate per crate.
- Migrazione solo preparatoria: applicare fix senza cambiare subito edition.
- Migrazione con MSRV bump: quando la nuova edition richiede toolchain minima piu recente.

## Errori comuni

- Cambiare `edition` a mano senza eseguire `cargo fix --edition`.
- Migrare tutto il workspace in un unico commit enorme.
- Non verificare feature opzionali.
- Dimenticare target come test, examples e benches.
- Confondere fix meccanici con garanzia di comportamento identico.

## Checklist

- La MSRV supporta la nuova edition?
- Hai una branch dedicata?
- Hai eseguito `cargo fix --edition`?
- Hai testato `--all-targets` e `--all-features`?
- Il changelog segnala eventuali cambiamenti per utenti o contributori?

## Collegamenti

- [[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024|Rust 2018 2021 e 2024]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV Minimum Supported Rust Version]]
- [[Programmazione/Rust/Pagine/rustfmt|rustfmt]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]

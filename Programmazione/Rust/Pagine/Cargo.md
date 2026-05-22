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
  - "Cargo Rust"
  - "Rust package manager"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
related:
  - "[[Programmazione/Rust/Pagine/Cargo.lock]]"
  - "[[Programmazione/Rust/Pagine/Crates.io]]"
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
---

# Cargo

## Sintesi

Cargo e il tool standard di Rust per creare progetti, compilare crate, gestire dipendenze, eseguire test, generare documentazione e pubblicare pacchetti. In pratica e insieme package manager, build system e task runner dell'ecosistema Rust.

Un progetto Rust moderno quasi sempre viene gestito tramite Cargo.

## Quando usarlo

- Per creare un nuovo binario o una nuova libreria.
- Per dichiarare dipendenze e feature.
- Per compilare, testare, fare benchmark e generare documentazione.
- Per pubblicare crate su crates.io.
- Per gestire workspace multi-crate.

## Come funziona

Cargo legge il manifest `Cargo.toml`, risolve le dipendenze, aggiorna `Cargo.lock` quando necessario e invoca `rustc` con le opzioni corrette.

Comandi base:

```bash
cargo new nome-progetto
cargo build
cargo run
cargo test
cargo check
cargo doc
```

`cargo check` e spesso il comando piu rapido durante lo sviluppo, perche controlla tipi e borrow checker senza produrre l'eseguibile finale.

## API / Sintassi

Creare un progetto:

```bash
cargo new app
cargo new libreria --lib
```

Aggiungere dipendenze:

```bash
cargo add serde
cargo add tokio --features full
```

Build release:

```bash
cargo build --release
```

Eseguire un binario specifico:

```bash
cargo run --bin nome_binario
```

## Esempio pratico

```bash
cargo new hello-rust
cd hello-rust
cargo check
cargo run
cargo test
```

Flusso tipico durante lo sviluppo:

```bash
cargo fmt
cargo clippy
cargo test
cargo build --release
```

Questo copre formattazione, lint, test e build ottimizzata.

## Varianti

- `cargo check`: controllo rapido.
- `cargo build`: compilazione debug.
- `cargo build --release`: compilazione ottimizzata.
- `cargo test`: test unitari e integrazione.
- `cargo doc --open`: documentazione locale.
- `cargo publish`: pubblicazione su crates.io.
- `cargo metadata`: dati strutturati sul progetto, utili per tooling.

## Errori comuni

- Usare solo `cargo build` durante lo sviluppo invece di `cargo check`.
- Non committare `Cargo.lock` per applicazioni/binari.
- Committare target build o artefatti generati.
- Abilitare feature troppo ampie senza motivo.
- Confondere crate, package e workspace.

## Checklist

- Il progetto e una libreria, un binario o un workspace?
- `Cargo.toml` dichiara correttamente edition, dipendenze e feature?
- `Cargo.lock` va committato in questo tipo di progetto?
- Prima di rilasciare hai eseguito `fmt`, `clippy`, `test` e build release?
- Le dipendenze sono necessarie e con feature minime?

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Crates.io|Crates.io]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]
- [[Programmazione/Rust/Pagine/Workspace|Workspace]]

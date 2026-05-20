---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags:
  - programmazione
  - rust
  - cargo
  - workspace
aliases: []
prerequisites: []
related: []
---

# Workspace

## Sintesi

Un **workspace** Cargo raggruppa piu package Rust sotto una configurazione comune. Serve a gestire monorepo, crate correlate, librerie interne e binari che condividono dipendenze.

## Quando usarlo

- Quando hai piu crate nello stesso repository.
- Quando vuoi condividere un unico `Cargo.lock`.
- Quando separi librerie interne, CLI, server e test utility.
- Quando vuoi compilare o testare piu package insieme.

## Come funziona

Il file `Cargo.toml` alla radice dichiara i membri del workspace. I package membri mantengono il proprio `Cargo.toml`, ma Cargo puo risolvere dipendenze e lockfile a livello comune.

## API / Sintassi

```toml
[workspace]
members = [
    "crates/core",
    "crates/api",
    "tools/cli"
]
resolver = "2"
```

## Esempio pratico

```text
project/
  Cargo.toml
  Cargo.lock
  crates/
    core/
      Cargo.toml
      src/lib.rs
    api/
      Cargo.toml
      src/main.rs
```

Comandi utili:

```powershell
cargo test --workspace
cargo check -p core
```

## Varianti

- Workspace con sole librerie.
- Workspace con binari e librerie.
- Workspace con dipendenze centralizzate in `[workspace.dependencies]`.
- Workspace virtuale senza package radice.

## Errori comuni

- Creare workspace troppo presto per un progetto piccolo.
- Dimenticare un package nei `members`.
- Confondere dipendenze del workspace e dipendenze del singolo package.
- Non usare `resolver = "2"` in workspace moderni quando serve separazione migliore delle feature.

## Checklist

- I membri sono elencati correttamente.
- Il lockfile e condiviso alla radice.
- Le dipendenze comuni sono centralizzate solo quando ha senso.
- I comandi CI usano `--workspace` se devono coprire tutto.

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Workspace dependencies|Workspace dependencies]]


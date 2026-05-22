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
  - "Lockfile Cargo"
  - "Cargo lockfile"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
related:
  - "[[Programmazione/Rust/Pagine/Semantic Versioning]]"
  - "[[Programmazione/Rust/Pagine/Crates.io]]"
  - "[[Programmazione/Rust/Pagine/cargo audit]]"
---

# Cargo.lock

## Sintesi

`Cargo.lock` registra le versioni esatte delle dipendenze risolte da Cargo. Serve a rendere le build riproducibili: due sviluppatori con lo stesso lockfile usano le stesse versioni transitive.

La regola pratica: committalo per applicazioni e binari; per librerie pubblicate, dipende dal contesto, ma il lockfile non vincola i consumatori della libreria.

## Quando usarlo

- Per applicazioni, servizi, CLI e binari deployati.
- Per CI e build riproducibili.
- Per sapere quali versioni transitive sono effettivamente usate.
- Per aggiornare dipendenze in modo controllato.

## Come funziona

`Cargo.toml` dichiara vincoli di versione. `Cargo.lock` contiene la risoluzione concreta.

```toml
[dependencies]
serde = "1"
```

Il lockfile registrera una versione specifica compatibile, per esempio `1.x.y`, insieme alle dipendenze transitive.

Aggiornare:

```bash
cargo update
cargo update -p nome_crate
```

## API / Sintassi

Comandi utili:

```bash
cargo build
cargo update
cargo update -p serde
cargo tree
```

Controllo CI:

```bash
cargo build --locked
cargo test --locked
```

`--locked` fallisce se Cargo dovrebbe modificare il lockfile.

## Esempio pratico

Flusso per aggiornare una dipendenza specifica:

```bash
cargo update -p tokio
cargo test
cargo tree -i tokio
```

Questo limita l'aggiornamento e permette di capire chi usa quella dipendenza.

## Varianti

- Applicazione/binario: `Cargo.lock` va normalmente versionato.
- Libreria: spesso il lockfile non e rilevante per i consumatori, ma puo essere utile per CI del repository.
- Workspace: un lockfile alla root del workspace.
- `--locked`: impone lockfile invariato.
- `--offline`: usa solo dipendenze gia disponibili localmente.

## Errori comuni

- Non committare `Cargo.lock` in un'applicazione.
- Aggiornare tutto con `cargo update` senza revisione.
- Pensare che il lockfile di una libreria pubblicata blocchi le versioni dei consumatori.
- Risolvere problemi cancellando il lockfile senza capire cosa cambia.
- Non usare `--locked` in CI quando serve riproducibilita.

## Checklist

- Il progetto e un'applicazione o una libreria?
- Il lockfile e committato dove serve?
- Gli aggiornamenti sono mirati e testati?
- La CI usa `--locked`?
- Hai controllato dipendenze transitive con `cargo tree`?

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]
- [[Programmazione/Rust/Pagine/Crates.io|Crates.io]]
- [[Programmazione/Rust/Pagine/cargo audit|cargo audit]]

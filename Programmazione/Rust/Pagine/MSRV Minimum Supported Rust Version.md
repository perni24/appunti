---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - cargo-editions-e-compatibilita
aliases:
  - "MSRV"
  - "Minimum Supported Rust Version"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024]]"
related:
  - "[[Programmazione/Rust/Pagine/Semantic Versioning]]"
  - "[[Programmazione/Rust/Pagine/Compatibility e breaking changes]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
---

# MSRV: Minimum Supported Rust Version

## Sintesi

MSRV significa Minimum Supported Rust Version: la versione minima di Rust con cui una crate o applicazione garantisce di compilare. E una scelta di compatibilita, non solo tecnica.

Definire una MSRV aiuta utenti, CI e maintainers a sapere quale toolchain e supportata.

## Quando usarlo

- Quando pubblichi una libreria usata da altri progetti.
- Quando lavori in ambienti con toolchain bloccate.
- Quando vuoi evitare di adottare feature Rust troppo recenti senza decisione esplicita.
- Quando organizzi CI per testare compatibilita.

## Come funziona

Nel manifest puoi dichiarare:

```toml
[package]
rust-version = "1.85"
edition = "2024"
```

`rust-version` comunica a Cargo la versione minima richiesta.

La MSRV e influenzata da:

- edition scelta;
- feature del linguaggio usate;
- standard library API usate;
- dipendenze che alzano la propria MSRV.

## API / Sintassi

Cargo manifest:

```toml
[package]
name = "my-crate"
version = "0.1.0"
edition = "2024"
rust-version = "1.85"
```

CI concettuale:

```bash
cargo +1.85 test
cargo +stable test
```

Documentazione:

```md
MSRV: Rust 1.85
```

## Esempio pratico

Se una libreria vuole supportare utenti enterprise con toolchain meno recenti, puo fissare una MSRV e aggiornala solo in minor o major release documentate.

```toml
[package]
rust-version = "1.74"
```

Prima di usare una API stabilizzata dopo `1.74`, bisogna decidere se alzare MSRV.

## Varianti

- MSRV per librerie: contratto verso utenti.
- MSRV per applicazioni: vincolo operativo interno.
- MSRV per workspace: spesso unica per tutti i crate.
- Policy conservativa: alzare MSRV raramente.
- Policy rolling: supportare solo stable recente.

## Errori comuni

- Dichiarare una MSRV ma non testarla.
- Alzare MSRV in una patch release senza segnalarlo.
- Confondere edition con MSRV: l'edition richiede una versione minima, ma non basta a descrivere tutte le API usate.
- Dimenticare che le dipendenze possono alzare la MSRV effettiva.
- Usare feature recenti senza aggiornare `rust-version`.

## Checklist

- Hai dichiarato `rust-version`?
- La CI testa davvero la MSRV?
- Le dipendenze rispettano la stessa policy?
- L'aumento MSRV e documentato nel changelog?
- L'edition scelta e compatibile con la versione minima dichiarata?

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024|Rust 2018 2021 e 2024]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]
- [[Programmazione/Rust/Pagine/Crates.io|Crates.io]]

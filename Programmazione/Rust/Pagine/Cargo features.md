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
  - "Feature Cargo"
  - "Cargo feature flags"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
  - "[[Programmazione/Rust/Pagine/Crates.io]]"
related:
  - "[[Programmazione/Rust/Pagine/Feature flags ben progettate]]"
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
  - "[[Programmazione/Rust/Pagine/Workspace dependencies]]"
---

# Cargo features

## Sintesi

Le Cargo features sono flag di compilazione che permettono di abilitare codice opzionale, dipendenze opzionali e integrazioni. Sono additive: se una dipendenza viene usata da piu crate con feature diverse, Cargo abilita l'unione delle feature richieste.

Vanno progettate con attenzione per evitare combinazioni fragili e dipendenze inutili.

## Quando usarlo

- Per rendere opzionale una dipendenza pesante.
- Per esporre integrazioni facoltative, per esempio `serde`, `tokio`, `sqlx`.
- Per separare backend o piattaforme.
- Per offrire una configurazione `default` comoda ma non eccessiva.

## Come funziona

In `Cargo.toml`:

```toml
[features]
default = ["std"]
std = []
serde = ["dep:serde"]

[dependencies]
serde = { version = "1", optional = true, features = ["derive"] }
```

Nel codice:

```rust
#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};
```

## API / Sintassi

Abilitare feature:

```bash
cargo build --features serde
cargo test --no-default-features
cargo test --all-features
```

Dipendenza con feature:

```toml
tokio = { version = "1", features = ["rt", "macros"] }
```

Feature che abilita feature di dipendenza:

```toml
[features]
async = ["dep:tokio", "tokio/rt"]
```

## Esempio pratico

```toml
[features]
default = ["std"]
std = []
json = ["dep:serde", "dep:serde_json"]

[dependencies]
serde = { version = "1", optional = true, features = ["derive"] }
serde_json = { version = "1", optional = true }
```

Questa configurazione mantiene il supporto JSON opzionale.

## Varianti

- Feature di default.
- Feature opzionali senza dipendenze.
- Dipendenze opzionali con `dep:nome`.
- Feature forwarding verso dipendenze.
- Feature per `no_std`/`std`.
- Feature additive vs mutualmente esclusive.

## Errori comuni

- Progettare feature mutualmente esclusive: Cargo le unifica e puo abilitarle insieme.
- Mettere troppe dipendenze in `default`.
- Non testare `--no-default-features`.
- Usare feature per configurazioni runtime che dovrebbero essere parametri.
- Rompere API pubbliche in base a feature non documentate.

## Checklist

- Le feature sono additive?
- La feature `default` e minimale?
- Hai testato `--all-features` e `--no-default-features`?
- Le dipendenze opzionali sono davvero opzionali?
- Le feature pubbliche sono documentate?

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Feature flags ben progettate|Feature flags ben progettate]]
- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/Rust/Pagine/Crates.io|Crates.io]]
- [[Programmazione/Rust/Pagine/Workspace dependencies|Workspace dependencies]]

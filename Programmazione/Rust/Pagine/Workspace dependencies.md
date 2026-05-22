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
  - "workspace.dependencies"
  - "Dipendenze workspace"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Workspace]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
  - "[[Programmazione/Rust/Pagine/Cargo features]]"
related:
  - "[[Programmazione/Rust/Pagine/Cargo.lock]]"
  - "[[Programmazione/Rust/Pagine/Cargo features]]"
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
---

# Workspace dependencies

## Sintesi

`workspace.dependencies` permette di dichiarare versioni e configurazioni di dipendenze a livello di workspace, riusandole nei crate membri. Riduce duplicazione e aiuta a mantenere versioni coerenti in repository multi-crate.

E utile soprattutto quando molti crate interni condividono le stesse dipendenze.

## Quando usarlo

- Quando un workspace ha piu crate con dipendenze comuni.
- Quando vuoi centralizzare versioni e feature base.
- Quando vuoi evitare divergenze tra crate interni.
- Quando gestisci monorepo Rust.

## Come funziona

Nella root:

```toml
[workspace]
members = ["crates/*"]

[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
anyhow = "1"
```

Nel crate membro:

```toml
[dependencies]
serde = { workspace = true }
anyhow = { workspace = true }
```

Cargo usa la definizione centralizzata.

## API / Sintassi

Dipendenza centralizzata con feature aggiuntive nel membro:

```toml
[dependencies]
tokio = { workspace = true, features = ["macros"] }
```

Root:

```toml
[workspace.dependencies]
tokio = { version = "1", default-features = false, features = ["rt"] }
```

Metadata condivisi:

```toml
[workspace.package]
edition = "2024"
license = "MIT"
```

## Esempio pratico

Workspace:

```toml
[workspace]
members = ["crates/api", "crates/cli"]
resolver = "2"

[workspace.dependencies]
clap = { version = "4", features = ["derive"] }
thiserror = "1"
```

Crate CLI:

```toml
[dependencies]
clap = { workspace = true }
thiserror = { workspace = true }
```

Questo mantiene le versioni comuni in un solo punto.

## Varianti

- `[workspace.dependencies]`: dipendenze condivise.
- `[workspace.package]`: metadata condivisi come edition o license.
- `[workspace.lints]`: lint condivisi nei workspace che lo usano.
- Dipendenze specifiche del crate: restano nel `Cargo.toml` del membro.
- Feature aggiuntive per membro: si possono aggiungere sopra la dipendenza workspace.

## Errori comuni

- Centralizzare ogni dipendenza anche quando e usata da un solo crate.
- Dimenticare che le feature sono additive nel workspace.
- Avere versioni duplicate tra root e membri.
- Non impostare il resolver corretto per il workspace.
- Rendere difficile capire quali dipendenze usa davvero un crate.

## Checklist

- La dipendenza e condivisa da piu crate?
- Versione e feature base sono davvero comuni?
- Le feature aggiunte nei membri sono documentate?
- Il workspace usa un resolver adeguato?
- `cargo tree` mostra dipendenze coerenti?

## Collegamenti

- [[Programmazione/Rust/Pagine/Workspace|Workspace]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]

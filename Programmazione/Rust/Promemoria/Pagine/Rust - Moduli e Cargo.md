---
date: 2026-07-30
area: Programmazione
topic: Promemoria Rust
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - rust
  - promemoria
  - moduli
  - cargo
aliases:
  - Cheatsheet Cargo Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Moduli crate e package]]"
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
title: Rust - Moduli e Cargo
---

# Rust - Moduli e Cargo

## Dichiarare un modulo

```rust
mod config;
mod services;
```

## Importare

```rust
use crate::config::Settings;
use crate::services::{create_user, delete_user};
```

```rust
use std::collections::HashMap as Map;
```

## Visibilita

```rust
pub struct User {}
pub(crate) fn internal_operation() {}
pub(super) fn parent_only() {}
```

## Re-export

```rust
pub use repository::UserRepository;
```

## Creare un progetto

```powershell
cargo new app
```

```powershell
cargo new library --lib
```

## Compilare ed eseguire

```powershell
cargo check
```

```powershell
cargo build
```

```powershell
cargo run
```

```powershell
cargo build --release
```

## Aggiungere una dipendenza

```powershell
cargo add serde --features derive
```

```powershell
cargo add serde_json --optional
```

## Cargo.toml

```toml
[package]
name = "app"
version = "0.1.0"
edition = "2024"

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = { version = "1", optional = true }
```

## Feature

```toml
[features]
default = []
json = ["dep:serde_json"]
```

`dep:serde_json` attiva una dipendenza opzionale. Con queste sezioni nello stesso manifest, `serde_json` si compila solo abilitando `json`.

```powershell
cargo build --features json
```

## Aggiornare

```powershell
cargo update
```

## Albero dipendenze

```powershell
cargo tree
```

## Documentazione

```powershell
cargo doc --open
```

## Approfondimento

- [[Programmazione/Rust/Pagine/Moduli crate e package|Moduli crate e package]]
- [[Programmazione/Rust/Pagine/Visibilita pub use e mod|Visibilita pub use e mod]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]
- [[Programmazione/Rust/Pagine/Workspace|Workspace]]
- [[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024|Rust 2018 2021 e 2024]]


## Navigazione

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]

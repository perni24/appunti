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
  - "[[Programmazione/Rust/Pagine/Moduli crate e package|Moduli crate e package]]"
  - "[[Programmazione/Rust/Pagine/Cargo|Cargo]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]"
title: Rust - Moduli e Cargo
---

# Rust - Moduli e Cargo

`mod` dichiara un modulo, `use` abbrevia un percorso e `pub use` espone un nome attraverso l'API pubblica. I tre file sotto appartengono **allo stesso package**.

## Creare il progetto

Dalla directory che dovrà contenere il nuovo progetto binario:

```sh
cargo new app
```

Per creare **in alternativa** una sola libreria:

```sh
cargo new library --lib
```

Per l'esempio usa `app`. Da qui in poi esegui i comandi nella cartella che contiene il suo `Cargo.toml`.

## Dichiarazione, visibilità e re-export

`src/lib.rs` (crealo accanto a `main.rs`):

```rust
mod repository;
pub use repository::UserRepository;

pub fn first_name() -> &'static str {
    repository::default_name()
}
```

`src/repository.rs`, caricato da `mod repository;`:

```rust
use std::collections::HashMap as Map;

#[derive(Default)]
pub struct UserRepository {
    users: Map<u64, String>,
}

impl UserRepository {
    pub fn insert(&mut self, id: u64, name: String) {
        self.users.insert(id, name);
    }
    pub fn get(&self, id: u64) -> Option<&str> {
        self.users.get(&id).map(String::as_str)
    }
}

pub(super) fn default_name() -> &'static str { "Ada" }
```

`src/main.rs`:

```rust
use app::{UserRepository, first_name};

fn main() {
    let mut repo = UserRepository::default();
    repo.insert(7, first_name().into());
    assert_eq!(repo.get(7), Some("Ada"));
    println!("{}", repo.get(7).unwrap());
    #[cfg(feature = "json")]
    println!("{}", serde_json::json!({ "name": repo.get(7) }));
}
```

`pub(super)` apre al modulo padre; `pub(crate)` apre all'intera crate. Il binario e la libreria sono **crate diverse**: in `main.rs`, `crate::` parte dal binario; `app::` raggiunge l'API pubblica della libreria.

## Manifest e feature

Per questo esempio usa il seguente `Cargo.toml`. La feature `json` abilita la dipendenza opzionale e il blocco `#[cfg(...)]` insieme. [Cargo Book: features](https://doc.rust-lang.org/cargo/reference/features.html).

```toml
[package]
name = "app"
version = "0.1.0"
edition = "2024"

[dependencies]
serde_json = { version = "1", optional = true }

[features]
default = []
json = ["dep:serde_json"]
```

In un altro progetto puoi dichiarare una dipendenza con `cargo add`: modifica il manifest. Non occorre rieseguire questi comandi dopo aver copiato il manifest sopra.

```sh
cargo add serde --features derive
```

```sh
cargo add serde_json --optional
```

## Compilare e ispezionare

Controllo dei tipi senza produrre l'eseguibile:

```sh
cargo check
```

Build di sviluppo:

```sh
cargo build
```

Esecuzione predefinita: stampa `Ada`.

```sh
cargo run
```

Esecuzione con JSON: stampa anche `{"name":"Ada"}`.

```sh
cargo run --features json
```

Build ottimizzata:

```sh
cargo build --release
```

Albero delle dipendenze effettivamente selezionate con la feature attiva:

```sh
cargo tree --features json
```

Aggiorna `Cargo.lock` entro i vincoli del manifest; controlla il diff prima del commit:

```sh
cargo update
```

Genera la documentazione locale. Aggiungi `--open` per aprirla nel browser.

```sh
cargo doc --no-deps
```

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/Moduli crate e package|Moduli crate e package]]
- [[Programmazione/Rust/Pagine/Visibilita pub use e mod|Visibilita pub use e mod]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]
- [[Programmazione/Rust/Pagine/Workspace|Workspace]]
- [[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024|Rust 2018 2021 e 2024]]

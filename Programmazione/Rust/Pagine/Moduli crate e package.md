---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - moduli
  - cargo
aliases:
  - "Moduli, crate e package"
prerequisites: []
related: []
---

# Moduli, crate e package

## Sintesi

Rust organizza il codice tramite package, crate e moduli. Un package e un progetto Cargo. Una crate e un'unita di compilazione. Un modulo organizza namespace e visibilita all'interno di una crate.

## Quando usarlo

- Quando un progetto cresce oltre un singolo file.
- Quando devi separare API pubbliche e dettagli interni.
- Quando vuoi capire la struttura `src/main.rs`, `src/lib.rs` e `mod`.

## Come funziona

Un package contiene un `Cargo.toml` e una o piu crate. Di solito:

- `src/main.rs` definisce una binary crate.
- `src/lib.rs` definisce una library crate.
- `mod nome;` dichiara un modulo.
- `use path::to::Item;` porta un nome nello scope.

## API / Sintassi

```rust
// src/lib.rs
pub mod users;

// src/users.rs
pub fn find_user(id: u64) -> Option<String> {
    Some(format!("user-{id}"))
}
```

## Esempio pratico

```text
my_app/
  Cargo.toml
  src/
    main.rs
    config.rs
    users/
      mod.rs
      repository.rs
```

```rust
// src/main.rs
mod config;
mod users;

fn main() {
    println!("app started");
}
```

## Varianti

- Binary crate: produce un eseguibile.
- Library crate: espone API riusabili.
- Module inline: definito dentro un file con `mod name { ... }`.
- Module file-based: definito in `name.rs` o `name/mod.rs`.

## Errori comuni

- Confondere package e crate.
- Dichiarare `mod` nel file sbagliato.
- Usare `use` pensando che carichi un file: `use` importa nomi, `mod` dichiara moduli.
- Rendere tutto `pub` invece di progettare l'API pubblica.

## Checklist

- Il package ha `Cargo.toml`.
- La struttura file corrisponde alle dichiarazioni `mod`.
- Le API pubbliche sono marcate con `pub` solo quando serve.
- I dettagli interni restano privati.

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Visibilita pub use e mod|Visibilita: pub, use e mod]]


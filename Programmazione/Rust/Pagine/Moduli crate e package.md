---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - moduli
  - cargo
aliases:
  - Moduli, crate e package
prerequisites: []
related: []
title: Moduli, crate e package
---

# Moduli, crate e package

## Sintesi

Rust organizza il codice tramite package, crate e moduli. Un package e un progetto Cargo. Una crate e un'unita di compilazione. Un modulo organizza namespace e visibilita all'interno di una crate.

Un file non e automaticamente una crate o un modulo: conta come entra nel progetto. Il demo seguente e un package completo, verificato con **Rust/Cargo 1.99.1, edition 2024**, senza dipendenze esterne.

## Quando usarlo

- Quando un progetto cresce oltre un singolo file.
- Quando devi separare API pubbliche e dettagli interni.
- Quando vuoi capire la struttura `src/main.rs`, `src/lib.rs` e `mod`.

## Come funziona

Un package e descritto da `Cargo.toml` e contiene target compilabili. Puo avere al massimo un target libreria e piu target binari, oltre a test ed esempi. Con le convenzioni standard:

- `src/main.rs` definisce una binary crate.
- `src/lib.rs` definisce una library crate.
- `mod nome;` dichiara un modulo.
- `use path::to::Item;` porta un nome nello scope.

`src/main.rs` e `src/lib.rs`, se presenti insieme, sono **radici di crate distinte**. Il binario usa l'API pubblica della libreria; non accede ai suoi dettagli `pub(crate)` solo perche appartiene allo stesso package.

`crate::` parte dalla crate corrente, `self::` dal modulo corrente e `super::` da quello padre. Un nome di dipendenza, o della libreria del package come `note_app`, puo iniziare un percorso verso quella crate. Il nome predefinito della libreria sostituisce i trattini del package con underscore.

## API / Sintassi

Per un modulo `users` dichiarato dalla radice con `mod users;`, scegli **uno solo** fra `src/users.rs` e `src/users/mod.rs`. Se il modulo dichiara `mod repository;`, il figlio puo stare in `src/users/repository.rs` in entrambi i layout.

`mod users { ... }` e la variante inline. `use` abbrevia percorsi gia disponibili: non legge un file `.rs` e non aggiunge una dipendenza Cargo. Dichiarare lo stesso sorgente come modulo in due crate distinte non condivide automaticamente tipi e stato fra esse.

## Esempio pratico

Prepara una directory nuova `note-app`, esterna a eventuali workspace esistenti, con questi file. Non concatenare i blocchi in un unico sorgente.

```text
note-app/
  Cargo.toml
  src/
    lib.rs
    main.rs
    config.rs
    users.rs
    users/
      repository.rs
  tests/
    public_api.rs
```

### Cargo.toml

```toml
[package]
name = "note-app"
version = "0.1.0"
edition = "2024"
publish = false
```

### src/lib.rs

```rust
mod config;
pub mod users;

pub fn default_user_id() -> u64 {
    config::DEFAULT_USER_ID
}
```

### src/config.rs

```rust
pub(crate) const DEFAULT_USER_ID: u64 = 7;
```

### src/users.rs

```rust
mod repository;

pub fn find_user(id: u64) -> Option<&'static str> {
    repository::find_user(id)
}
```

### src/users/repository.rs

```rust
const USERS: [(u64, &str); 2] = [(7, "Ada"), (9, "Linus")];

pub(super) fn find_user(id: u64) -> Option<&'static str> {
    for &(user_id, name) in &USERS {
        if user_id == id {
            return Some(name);
        }
    }
    None
}
```

Questo repository e una tabella dimostrativa di sola lettura in memoria, non un database o un servizio remoto. L'ID assente restituisce davvero `None`; non viene inventato un utente per ogni richiesta. I nomi sono letterali stringa con durata statica.

### src/main.rs

```rust
use note_app::{default_user_id, users::find_user};

fn main() {
    let name = find_user(default_user_id());
    assert_eq!(name, Some("Ada"));
    println!("{name:?}");
}
```

Non aggiungere `mod users;` anche qui: la definizione e nella libreria. `crate::users` in questo file cercherebbe un modulo nella **crate binaria**, non in `src/lib.rs`.

### tests/public_api.rs

```rust
use note_app::{default_user_id, users::find_user};

#[test]
fn lookup_handles_known_and_missing_ids() {
    assert_eq!(find_user(default_user_id()), Some("Ada"));
    assert_eq!(find_user(9), Some("Linus"));
    assert_eq!(find_user(0), None);
}
```

Il test di integrazione usa l'API come una crate esterna. I dettagli privati restano inaccessibili; per i test interni vedi la nota sui unit test.

### Verifica del progetto

Dalla directory `note-app`, controlla tutti i target:

```powershell
cargo check --all-targets
```

Esegui i test:

```powershell
cargo test
```

Avvia il binario; l'output e `Some("Ada")`:

```powershell
cargo run --quiet --bin note-app
```

## Varianti

- Binary crate: produce un eseguibile.
- Library crate: espone API riusabili.
- Module inline: definito dentro un file con `mod name { ... }`.
- Module file-based: definito in `name.rs` o `name/mod.rs`.
- Binari aggiuntivi: per convenzione in `src/bin/`, oppure con target `[[bin]]` espliciti nel manifest.
- Piu package coordinati: workspace, non una gerarchia di soli moduli.

## Errori comuni

- Confondere package e crate.
- Dichiarare `mod` nel file sbagliato.
- Usare `use` pensando che carichi un file: `use` importa nomi, `mod` dichiara moduli.
- Rendere tutto `pub` invece di progettare l'API pubblica.
- Creare contemporaneamente `users.rs` e `users/mod.rs` per la stessa dichiarazione.
- Supporre che un file nuovo entri automaticamente nella libreria: i normali moduli richiedono una dichiarazione nel relativo albero.
- Confondere un integration test con un modulo figlio della libreria.

## Checklist

- Il package ha `Cargo.toml`.
- La struttura file corrisponde alle dichiarazioni `mod`.
- Le API pubbliche sono marcate con `pub` solo quando serve.
- I dettagli interni restano privati.
- Il binario importa la libreria invece di duplicarne i moduli.
- Hai verificato anche i target di test, non soltanto l'eseguibile.

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Visibilita pub use e mod|Visibilita: pub, use e mod]]
- [[Programmazione/Rust/Pagine/Workspace|Workspace]]
- [[Programmazione/Rust/Pagine/Integration test|Integration test]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]

## Fonti

- [Rust Book: Packages and Crates](https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html).
- [Cargo Book: Targets](https://doc.rust-lang.org/cargo/reference/cargo-targets.html).
- [Rust Reference: Modules](https://doc.rust-lang.org/reference/items/modules.html).
- [Rust Book: Separating Modules into Different Files](https://doc.rust-lang.org/book/ch07-05-separating-modules-into-different-files.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

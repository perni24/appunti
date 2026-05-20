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
  - moduli
  - visibilita
aliases:
  - "Visibilita: pub, use e mod"
prerequisites: []
related: []
---

# Visibilita: pub, use e mod

## Sintesi

`mod`, `use` e `pub` controllano organizzazione, accesso e import dei nomi in Rust. Capire la differenza tra questi tre elementi evita molti errori quando un progetto viene diviso in piu file.

## Quando usarlo

- Quando una funzione o struct non e visibile da un altro modulo.
- Quando devi esporre un'API pubblica.
- Quando vuoi creare re-export comodi.
- Quando organizzi un package in piu file.

## Come funziona

- `mod` dichiara un modulo.
- `use` porta un percorso nello scope corrente.
- `pub` rende un item visibile fuori dal modulo.

Per default, gli item sono privati al modulo corrente e ai suoi figli. Rendere pubblico un item non rende automaticamente pubblici tutti i suoi campi o moduli interni.

## API / Sintassi

```rust
mod users;

use users::UserService;

pub struct User {
    pub id: u64,
    email: String,
}
```

## Esempio pratico

```rust
// src/lib.rs
mod repository;

pub use repository::UserRepository;

// src/repository.rs
pub struct UserRepository;

impl UserRepository {
    pub fn new() -> Self {
        Self
    }
}
```

`pub use` riesporta un nome, permettendo agli utenti della crate di importarlo da un percorso piu stabile o piu breve.

## Varianti

- `pub`: visibile pubblicamente.
- `pub(crate)`: visibile dentro la crate.
- `pub(super)`: visibile al modulo padre.
- `pub(in path)`: visibile in un percorso specifico.
- `pub use`: re-export.

## Errori comuni

- Usare `use` pensando che dichiari un modulo.
- Dichiarare `pub struct` e dimenticare che i campi restano privati.
- Rendere pubblici dettagli interni invece di usare `pub(crate)`.
- Creare percorsi pubblici instabili che poi diventano difficili da cambiare.

## Checklist

- Usa `mod` per dichiarare la struttura dei moduli.
- Usa `use` solo per portare nomi nello scope.
- Esponi con `pub` solo cio che fa parte dell'API.
- Usa `pub use` per costruire una superficie pubblica pulita.

## Collegamenti

- [[Programmazione/Rust/Pagine/Moduli crate e package|Moduli, crate e package]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Documentazione delle crate|Documentazione delle crate]]


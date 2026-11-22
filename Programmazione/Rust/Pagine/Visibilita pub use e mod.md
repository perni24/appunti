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
  - visibilita
aliases:
  - "Visibilita: pub, use e mod"
prerequisites: []
related: []
title: "Visibilita: pub, use e mod"
---

# Visibilita: pub, use e mod

## Sintesi

`mod`, `use` e `pub` controllano organizzazione, accesso e import dei nomi in Rust. Capire la differenza tra questi tre elementi evita molti errori quando un progetto viene diviso in piu file.

La privacy e un confine di API controllato dal compilatore, non una protezione dei dati sensibili o una garanzia di validita del dominio. Demo completo con **Rust/Cargo 1.99.1, edition 2024**, senza dipendenze esterne.

## Quando usarlo

- Quando una funzione o struct non e visibile da un altro modulo.
- Quando devi esporre un'API pubblica.
- Quando vuoi creare re-export comodi.
- Quando organizzi un package in piu file.

## Come funziona

- `mod` dichiara un modulo.
- `use` porta un percorso nello scope corrente.
- `pub` permette di esporre un item, ma il percorso usato per raggiungerlo deve essere accessibile oppure riesportato.

Gli item privati sono accessibili dal modulo che li contiene e dai suoi discendenti, non automaticamente dal suo padre. Rendere pubblico un item non rende pubblici tutti i campi o i moduli interni. Fra le eccezioni ai default privati: le varianti di un enum pubblico e gli item di un trait pubblico sono pubblici.

Un `pub fn` dentro un modulo privato non e necessariamente raggiungibile dall'esterno tramite quel percorso. `pub use` puo offrire un percorso pubblico alternativo per un item pubblico, mantenendo privato il modulo di implementazione; non permette di ampliare arbitrariamente la visibilita di un item privato.

## API / Sintassi

- `pub`: accesso pubblico attraverso percorsi accessibili.
- `pub(crate)`: accesso nella crate corrente, **non** in tutto il package o workspace.
- `pub(super)`: accesso nell'ambito del modulo padre e dei suoi discendenti.
- `pub(self)`: equivalente alla visibilita privata ordinaria.
- `pub(in crate::domain)`: limita l'accesso al modulo antenato indicato e ai suoi discendenti. `domain` deve essere un antenato della definizione, non un modulo fratello scelto come destinatario.

Nei percorsi ristretti delle edition moderne usa `crate`, `self` o `super` come inizio. La visibilita dell'item non scavalca quella dei moduli attraversati dal percorso.

## Esempio pratico

In una nuova directory `public-api-demo`, crea i quattro file seguenti. L'esempio espone un tipo con un campo pubblico e uno privato; non implementa un database o validazione delle email.

### Cargo.toml

```toml
[package]
name = "public-api-demo"
version = "0.1.0"
edition = "2024"
publish = false
```

### src/lib.rs

```rust
mod users;

pub use users::User;
```

### src/users.rs

```rust
pub struct User {
    pub id: u64,
    email: String,
}

impl User {
    pub fn new(id: u64, email: String) -> Self {
        Self { id, email }
    }

    pub fn email(&self) -> &str {
        &self.email
    }
}
```

### src/main.rs

```rust
use public_api_demo::User as Account;

fn main() {
    let mut account = Account::new(7, String::from("ada@example.test"));
    account.id = 9;
    assert_eq!(account.id, 9);
    assert_eq!(account.email(), "ada@example.test");
    println!("ID: {}", account.id);
}
```

`User` e raggiungibile tramite il re-export; `public_api_demo::users::User` non lo e, perche `users` resta privato. L'alias `Account` e soltanto un altro nome locale dello stesso tipo, non un nuovo tipo e non un altro oggetto.

Il binario puo leggere/modificare `id` se il binding lo consente e puo chiamare `email()`, ma non puo accedere direttamente al campo `email` o costruire `User { ... }` con quel campo privato. Il getter espone intenzionalmente il contenuto: privacy del campo non significa segretezza dell'email.

### Verifica del progetto

Dalla directory `public-api-demo` controlla i target:

```powershell
cargo check --all-targets
```

Esegui il binario; output `ID: 9`:

```powershell
cargo run --quiet
```

## Varianti

- `pub use`: un percorso pubblico stabile puo essere mantenuto anche spostando l'implementazione interna.
- `use path::Item as Alias`: evita collisioni di nomi nello scope locale.
- `use path::{First, Second}`: raggruppa import espliciti.
- `use path::*`: importa i nomi accessibili tramite glob; non aggira la privacy e puo rendere meno evidente la provenienza dei nomi.
- `crate::`, `self::`, `super::`: radice della crate, modulo corrente e modulo padre. Sono percorsi, non permessi aggiuntivi.

## Errori comuni

- Usare `use` pensando che dichiari un modulo.
- Dichiarare `pub struct` e dimenticare che i campi restano privati.
- Rendere pubblici dettagli interni invece di usare `pub(crate)`.
- Creare percorsi pubblici instabili che poi diventano difficili da cambiare.
- Pensare che `pub(crate)` sia accessibile da `src/main.rs` quando la definizione e nella crate di `src/lib.rs`.
- Usare `pub(in ...)` come una lista di moduli autorizzati: e una restrizione a un antenato, non un sistema di permessi per moduli fratelli.
- Credere che `use` del modulo padre importi automaticamente tutti i nomi nei figli: i binding hanno uno scope, e nei figli si usano i percorsi appropriati.
- Esportare un tipo e dimenticare la visibilita dei metodi necessari a usarlo.

## Checklist

- Usa `mod` per dichiarare la struttura dei moduli.
- Usa `use` solo per portare nomi nello scope.
- Esponi con `pub` solo cio che fa parte dell'API.
- Usa `pub use` per costruire una superficie pubblica pulita.
- Prova l'API anche da un binario o integration test separato: i unit test discendenti del modulo possono accedere a dettagli privati.
- La restrizione `pub(in ...)` indica un antenato valido e i percorsi intermedi sono accessibili.

## Collegamenti

- [[Programmazione/Rust/Pagine/Moduli crate e package|Moduli, crate e package]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Documentazione delle crate|Documentazione delle crate]]
- [[Programmazione/Rust/Pagine/Integration test|Integration test]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]

## Fonti

- [Rust Reference: Visibility and privacy](https://doc.rust-lang.org/reference/visibility-and-privacy.html).
- [Rust Reference: Use declarations](https://doc.rust-lang.org/reference/items/use-declarations.html).
- [Cargo Book: binary e library target](https://doc.rust-lang.org/cargo/reference/cargo-targets.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - macros
aliases:
  - "derive macro"
  - "proc_macro_derive"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
  - "[[Programmazione/Rust/Pagine/Procedural macros]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Attribute macros]]"
  - "[[Programmazione/Rust/Pagine/Display e Debug]]"
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow]]"
---

# Derive macros

## Sintesi

Le derive macros sono procedural macros invocate con `#[derive(...)]`. Generano implementazioni di trait o codice associato leggendo la definizione di una struct o enum.

Sono il meccanismo dietro molte API ergonomiche dell'ecosistema Rust, come `serde::Serialize`, `thiserror::Error` e derive custom di framework.

## Quando usarlo

- Quando vuoi generare implementazioni ripetitive di trait.
- Quando un trait richiede codice derivabile dalla struttura dei campi.
- Quando vuoi supportare attributi di configurazione sui campi.
- Quando vuoi offrire API ergonomica a utenti di una libreria.

## Come funziona

```rust
#[derive(Debug, Clone)]
struct User {
    id: u64,
    name: String,
}
```

Per derive custom:

```rust
#[proc_macro_derive(MyTrait)]
pub fn derive_my_trait(input: TokenStream) -> TokenStream {
    // parse input, generate impl
}
```

La macro riceve i token dell'item annotato e produce codice aggiuntivo, spesso un `impl Trait for Type`.

## API / Sintassi

Con attributi helper:

```rust
#[derive(MyDerive)]
#[my_derive(rename = "user")]
struct User {
    #[my_derive(skip)]
    password: String,
}
```

Dichiarazione:

```rust
#[proc_macro_derive(MyDerive, attributes(my_derive))]
pub fn my_derive(input: TokenStream) -> TokenStream {
    todo!()
}
```

## Esempio pratico

```rust
#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error("config mancante")]
    MissingConfig,

    #[error("errore io")]
    Io(#[from] std::io::Error),
}
```

`thiserror::Error` genera implementazioni di `Display`, `Error` e conversioni dove richiesto.

## Varianti

- Derive standard: `Debug`, `Clone`, `Copy`, `Default`, `Eq`, `Hash`.
- Derive custom da proc macro.
- Helper attributes per campi e varianti.
- Derive che generano trait impl.
- Derive che generano metodi o item aggiuntivi.

## Errori comuni

- Derivare trait senza capire il comportamento generato.
- Usare attributi helper non documentati.
- Generare impl troppo generici o con bounds sbagliati.
- Nascondere breaking changes dietro modifiche alla macro.
- Produrre messaggi di errore difficili da collegare al campo sbagliato.

## Checklist

- Il codice generato e prevedibile?
- I bound generati sui generics sono minimi?
- Gli attributi helper sono documentati?
- Gli errori puntano agli span corretti?
- Ci sono test su struct, enum, generics e lifetime?

## Collegamenti

- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]
- [[Programmazione/Rust/Pagine/Procedural macros|Procedural macros]]
- [[Programmazione/Rust/Pagine/Attribute macros|Attribute macros]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/Display e Debug|Display e Debug]]

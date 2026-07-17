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
  - smart-pointers-e-interior-mutability
aliases:
  - "Deref"
  - "Deref coercion"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Box T]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
related:
  - "[[Programmazione/Rust/Pagine/Drop Trait]]"
  - "[[Programmazione/Rust/Pagine/Rc T e Arc T]]"
  - "[[Programmazione/Rust/Pagine/AsRef AsMut e Borrow]]"
---

# Deref Trait

## Sintesi

`Deref` permette a uno smart pointer di comportarsi come un riferimento al valore interno. E il trait dietro l'operatore `*` e dietro molte deref coercions automatiche, per esempio passare `&String` dove serve `&str`.

Va implementato solo per tipi che sono davvero pointer-like.

## Quando usarlo

- Quando progetti uno smart pointer o wrapper che deve esporre accesso trasparente al valore interno.
- Quando vuoi capire perche `&Box<T>` puo essere usato come `&T`.
- Quando lavori con `String`, `Vec<T>`, `Box<T>`, `Rc<T>` o `Arc<T>`.
- Quando devi distinguere `Deref`, `AsRef` e accesso esplicito tramite metodi.

## Come funziona

Il trait ha un tipo associato `Target`:

```rust
use std::ops::Deref;

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
```

Quando scrivi `*x`, Rust chiama `deref`. In molti contesti applica anche conversioni automatiche da `&Smart<T>` a `&T`.

## API / Sintassi

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &T {
        &self.0
    }
}
```

Deref coercion:

```rust
fn stampa(s: &str) {
    println!("{s}");
}

let s = String::from("rust");
stampa(&s);
```

`String` implementa `Deref<Target = str>`.

## Esempio pratico

```rust
use std::ops::Deref;

struct NonEmptyString(String);

impl NonEmptyString {
    fn new(value: String) -> Option<Self> {
        if value.is_empty() {
            None
        } else {
            Some(Self(value))
        }
    }
}

impl Deref for NonEmptyString {
    type Target = str;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
```

Il wrapper puo essere usato come `&str`, ma mantiene una invariante in costruzione.

## Varianti

- `Deref`: accesso immutabile.
- `DerefMut`: accesso mutabile.
- Deref coercion: conversione automatica tra riferimenti.
- `AsRef`: conversione esplicita e piu leggera per API generiche.
- `Borrow`: usato soprattutto per lookup in collection.

## Errori comuni

- Implementare `Deref` su tipi che non sono semanticamente puntatori.
- Nascondere logica costosa o sorprendente in `deref`.
- Usare `Deref` per simulare ereditarieta.
- Confondere deref coercion con conversione ownership.
- Implementare `DerefMut` rompendo invarianti del wrapper.

## Checklist

- Il tipo e davvero uno smart pointer o una vista trasparente?
- `deref` e economico e senza effetti collaterali?
- L'accesso al target puo rompere invarianti?
- `AsRef` sarebbe piu appropriato?
- Serve anche `DerefMut` o basta accesso immutabile?

## Collegamenti

- [[Programmazione/Rust/Pagine/Box T|Box T]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc T e Arc T]]
- [[Programmazione/Rust/Pagine/AsRef AsMut e Borrow|AsRef AsMut e Borrow]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]

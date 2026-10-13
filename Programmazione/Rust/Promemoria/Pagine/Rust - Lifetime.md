---
date: 2026-07-30
area: Programmazione
topic: Promemoria Rust
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - rust
  - promemoria
  - lifetime
aliases:
  - Cheatsheet lifetime Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
  - "[[Programmazione/Rust/Pagine/Lifetime elision]]"
title: Rust - Lifetime
---

# Rust - Lifetime

## Annotazione su funzione

```rust
fn longest<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.len() >= right.len() {
        left
    } else {
        right
    }
}
```

Il risultato non puo vivere piu a lungo dei riferimenti in ingresso associati a `'a`.

## Un solo input

```rust
fn first_word(value: &str) -> &str {
    value.split_whitespace().next().unwrap_or("")
}
```

L'annotazione e omessa grazie alle regole di elision.

## Struct con riferimento

```rust
struct View<'a> {
    title: &'a str,
}
```

```rust
impl<'a> View<'a> {
    fn title(&self) -> &str {
        self.title
    }
}
```

## Bound di lifetime

```rust
fn log_and_return<'a, T>(value: &'a T) -> &'a T
where
    T: std::fmt::Debug + 'a,
{
    println!("{value:?}");
    value
}
```

## Lifetime `'static`

```rust
let label: &'static str = "application";
```

`'static` non significa che il valore deve restare in memoria per sempre; indica che il riferimento puo essere valido per tutta l'esecuzione.

## Errore tipico

```rust
// Non valido: restituisce un riferimento a un valore locale.
fn invalid() -> &str {
    let value = String::from("temporary");
    &value
}
```

Restituire ownership:

```rust
fn valid() -> String {
    String::from("owned")
}
```

## Approfondimento

- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetime elision|Lifetime elision]]
- [[Programmazione/Rust/Pagine/Lifetime impliciti|Lifetime impliciti]]
- [[Programmazione/Rust/Pagine/Lifetimes nelle struct|Lifetimes nelle struct]]
- [[Programmazione/Rust/Pagine/Lifetimes nei trait|Lifetimes nei trait]]
- [[Programmazione/Rust/Pagine/Lifetimes avanzati|Lifetimes avanzati]]


## Navigazione

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]

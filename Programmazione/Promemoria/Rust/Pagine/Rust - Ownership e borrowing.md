---
date: 2026-07-30
area: Programmazione
topic: Promemoria Rust
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [rust, promemoria, ownership, borrowing]
aliases: [Cheatsheet ownership Rust]
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
---

# Rust - Ownership e borrowing

## Move

```rust
let first = String::from("hello");
let second = first;

// first non e piu utilizzabile
```

## Clone

```rust
let first = String::from("hello");
let second = first.clone();
```

## Copy

```rust
let first = 42;
let second = first;

println!("{first} {second}");
```

I tipi che implementano `Copy` vengono copiati implicitamente.

## Prestito immutabile

```rust
fn length(value: &str) -> usize {
    value.len()
}

let name = String::from("Ada");
let size = length(&name);
```

## Prestito mutabile

```rust
fn normalize(value: &mut String) {
    value.make_ascii_lowercase();
}

let mut name = String::from("ADA");
normalize(&mut name);
```

## Regola rapida

Nello stesso intervallo:

- piu riferimenti `&T`; oppure
- un solo riferimento `&mut T`.

## Restituire ownership

```rust
fn create_name() -> String {
    String::from("Ada")
}
```

## Consumare e restituire

```rust
fn normalize(mut value: String) -> String {
    value.make_ascii_lowercase();
    value
}
```

## Reborrow

```rust
fn update(value: &mut String) {
    helper(&mut *value);
    value.push('!');
}
```

## Copia o prestito

| Necessita | Scelta |
|---|---|
| Solo leggere | `&T` |
| Modificare | `&mut T` |
| Conservare il valore | `T` |
| Duplicare intenzionalmente | `clone()` |

## Approfondimento

- [[Programmazione/Rust/Pagine/Ownership]]
- [[Programmazione/Rust/Pagine/References e Borrowing]]
- [[Programmazione/Rust/Pagine/Borrow checker]]
- [[Programmazione/Rust/Pagine/Move semantics]]
- [[Programmazione/Rust/Pagine/Copy e Clone]]
- [[Programmazione/Rust/Pagine/Aliasing rules]]

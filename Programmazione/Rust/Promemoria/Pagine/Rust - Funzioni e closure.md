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
  - funzioni
  - closure
aliases:
  - Cheatsheet funzioni Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Funzioni|Funzioni]]"
  - "[[Programmazione/Rust/Pagine/Closure|Closure]]"
title: Rust - Funzioni e closure
---

# Rust - Funzioni e closure

Ogni blocco è indipendente e va nel corpo di `fn main()`. Teoria: [[Programmazione/Rust/Pagine/Funzioni|Funzioni]] e [[Programmazione/Rust/Pagine/Closure|Closure]].

## Restituire un valore

```rust
fn add(a: i32, b: i32) -> i32 { a + b }
fn classify(n: i32) -> &'static str {
    if n < 0 { return "negative"; }
    "non-negative"
}
assert_eq!(add(2, 3), 5);
assert_eq!(classify(0), "non-negative");
```

L'espressione finale senza `;` restituisce il risultato. Con `return` puoi uscire prima.

## Funzione associata e metodi

```rust
struct User { name: String }
impl User {
    fn new(name: impl Into<String>) -> Self { Self { name: name.into() } }
    fn name(&self) -> &str { &self.name }
    fn rename(&mut self, name: String) { self.name = name; }
    fn into_name(self) -> String { self.name }
}
let mut user = User::new("Ada");
assert_eq!(user.name(), "Ada");
user.rename(String::from("Lia"));
assert_eq!(user.into_name(), "Lia"); // user consumato
```

`Type::new(...)` non ha ricevitore. Per i metodi: `&self` legge, `&mut self` permette di modificare, `self` prende il valore.

## Scegliere il bound della closure

| Come la chiami | Bound sufficiente |
| --- | --- |
| Una volta, anche se consuma una cattura | `FnOnce` |
| Più volte, potendo modificare lo stato catturato | `FnMut` |
| Più volte tramite un riferimento condiviso alla closure | `Fn` |

```rust
fn apply<T, U>(value: T, op: impl FnOnce(T) -> U) -> U { op(value) }
let double = |n: i32| n * 2;
assert_eq!(apply(5, double), 10);

let message = String::from("hello");
assert_eq!(apply((), move |()| message), "hello");
```

```rust
let prefix = String::from("user");
let label = move |id: u32| format!("{prefix}-{id}");
assert_eq!(label(1), "user-1");
assert_eq!(label(2), "user-2");

let mut count = 0;
let mut next = || { count += 1; count };
assert_eq!((next(), next()), (1, 2));
```

`move` cambia **come viene catturato** il valore. Non impone una sola chiamata: `label` possiede `prefix` ma lo legge soltanto.

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Rust/Pagine/Closure|Closure]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/From Into TryFrom e TryInto|From Into TryFrom e TryInto]]

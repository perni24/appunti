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
  - "[[Programmazione/Rust/Pagine/Funzioni]]"
  - "[[Programmazione/Rust/Pagine/Closure]]"
title: Rust - Funzioni e closure
---

# Rust - Funzioni e closure

## Funzione

```rust
fn add(left: i32, right: i32) -> i32 {
    left + right
}
```

L'ultima espressione senza `;` viene restituita.

## Return anticipato

```rust
fn classify(value: i32) -> &'static str {
    if value < 0 {
        return "negative";
    }

    "non-negative"
}
```

## Metodo

```rust
impl User {
    fn name(&self) -> &str {
        &self.name
    }

    fn rename(&mut self, name: String) {
        self.name = name;
    }

    fn into_name(self) -> String {
        self.name
    }
}
```

| Ricevitore | Effetto |
|---|---|
| `&self` | Prestito immutabile |
| `&mut self` | Prestito mutabile |
| `self` | Consuma il valore |

## Funzione associata

```rust
impl User {
    fn new(name: impl Into<String>) -> Self {
        Self { name: name.into() }
    }
}
```

```rust
let user = User::new("Ada");
```

## Closure

```rust
let double = |value: i32| value * 2;
let result = double(5);
```

```rust
let prefix = String::from("user");
let label = |id| format!("{prefix}-{id}");
```

## Closure `move`

```rust
let message = String::from("hello");

let task = move || {
    println!("{message}");
};
```

## Accettare una closure

```rust
fn apply<F>(value: i32, operation: F) -> i32
where
    F: Fn(i32) -> i32,
{
    operation(value)
}
```

| Trait | Cattura |
|---|---|
| `Fn` | Usa per riferimento immutabile |
| `FnMut` | Usa per riferimento mutabile |
| `FnOnce` | Puo consumare i valori catturati |

## Approfondimento

- [[Programmazione/Rust/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Rust/Pagine/Closure|Closure]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/From Into TryFrom e TryInto|From Into TryFrom e TryInto]]


## Navigazione

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]

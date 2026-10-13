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
  - generics
  - trait
aliases:
  - Cheatsheet trait Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
title: Rust - Generics e trait
---

# Rust - Generics e trait

## Funzione generica

```rust
fn first<T>(values: &[T]) -> Option<&T> {
    values.first()
}
```

## Struct generica

```rust
struct Pair<T> {
    left: T,
    right: T,
}
```

## Trait

```rust
trait Summary {
    fn summary(&self) -> String;
}
```

## Implementazione

```rust
impl Summary for User {
    fn summary(&self) -> String {
        format!("{}: {}", self.id, self.name)
    }
}
```

## Metodo predefinito

```rust
trait Summary {
    fn title(&self) -> &str;

    fn summary(&self) -> String {
        self.title().to_owned()
    }
}
```

## Trait bound

```rust
fn print_summary<T: Summary>(value: &T) {
    println!("{}", value.summary());
}
```

```rust
fn compare<T>(left: &T, right: &T) -> bool
where
    T: PartialEq + std::fmt::Debug,
{
    left == right
}
```

## `impl Trait`

```rust
fn print_summary(value: &impl Summary) {}
```

```rust
fn positive(values: &[i32]) -> impl Iterator<Item = &i32> {
    values.iter().filter(|value| **value > 0)
}
```

## Trait object

```rust
fn render(items: &[Box<dyn Summary>]) {
    for item in items {
        println!("{}", item.summary());
    }
}
```

| Forma | Dispatch |
|---|---|
| `<T: Trait>` | Statico |
| `impl Trait` | Statico |
| `dyn Trait` | Dinamico |

## Tipi associati

```rust
trait Repository {
    type Item;

    fn find(&self, id: u64) -> Option<Self::Item>;
}
```

## Conversioni

```rust
impl From<UserId> for u64 {
    fn from(value: UserId) -> Self {
        value.0
    }
}
```

## Approfondimento

- [[Programmazione/Rust/Pagine/Generics|Generics]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch|Static dispatch vs dynamic dispatch]]
- [[Programmazione/Rust/Pagine/From Into TryFrom e TryInto|From Into TryFrom e TryInto]]


## Navigazione

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]

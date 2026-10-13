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
  - iteratori
aliases:
  - Cheatsheet iteratori Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
  - "[[Programmazione/Rust/Pagine/Iterator API]]"
title: Rust - Iteratori
---

# Rust - Iteratori

## Creare un iteratore

```rust
values.iter()       // &T
values.iter_mut()   // &mut T
values.into_iter()  // T
```

`into_iter()` su una collezione posseduta la consuma.

## Trasformare e filtrare

```rust
let doubled: Vec<i32> = values
    .iter()
    .copied()
    .filter(|value| *value > 0)
    .map(|value| value * 2)
    .collect();
```

## Cercare e verificare

```rust
values.iter().find(|value| **value > 10)
values.iter().position(|value| *value > 10)
values.iter().any(|value| *value < 0)
values.iter().all(|value| *value > 0)
```

## Ridurre

```rust
let total = values.iter().sum::<i32>();
let product = values.iter().product::<i32>();
```

```rust
let total = values.iter().fold(0, |sum, value| sum + value);
```

## Enumerare e combinare

```rust
for (index, value) in values.iter().enumerate() {
    println!("{index}: {value}");
}
```

```rust
for (name, score) in names.iter().zip(scores.iter()) {
    println!("{name}: {score}");
}
```

`zip()` termina con l'iteratore piu corto.

## Ignorare o limitare

```rust
values.iter().skip(2)
values.iter().take(5)
values.iter().step_by(2)
```

## Flatten e filter_map

```rust
let values: Vec<i32> = optional_values.into_iter().flatten().collect();
```

```rust
let numbers: Vec<i32> = texts
    .iter()
    .filter_map(|text| text.parse().ok())
    .collect();
```

## Finestre e blocchi

```rust
for pair in values.windows(2) {}
for chunk in values.chunks(3) {}
```

## Collect fallibile

```rust
let numbers: Result<Vec<i32>, _> = texts
    .iter()
    .map(|text| text.parse())
    .collect();
```

## Approfondimento

- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]
- [[Programmazione/Rust/Pagine/Closure|Closure]]
- [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon e parallel iterators]]


## Navigazione

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]

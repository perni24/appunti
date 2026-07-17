---
date: 2026-05-21
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - astrazione-e-generici
aliases:
  - "Bound di trait"
  - "Vincoli generici Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch]]"
  - "[[Programmazione/Rust/Pagine/Associated types]]"
  - "[[Programmazione/Rust/Pagine/From Into TryFrom e TryInto]]"
---

# Trait bounds

## Sintesi

I trait bounds indicano quali comportamenti deve implementare un tipo generico. Senza bounds, una funzione generica non puo assumere quasi nulla sul tipo `T`. Con i bounds, il compilatore sa quali metodi e operatori sono disponibili.

Sono il punto di incontro tra generics e trait.

## Quando usarlo

- Quando una funzione generica deve chiamare metodi su `T`.
- Quando una struct generica deve vincolare i tipi accettati.
- Quando vuoi accettare qualsiasi tipo che implementa un comportamento.
- Quando vuoi rendere espliciti i requisiti di una API.

## Come funziona

Bound inline:

```rust
fn stampa<T: std::fmt::Display>(value: T) {
    println!("{value}");
}
```

Bound multipli:

```rust
fn debug_and_clone<T: std::fmt::Debug + Clone>(value: &T) -> T {
    println!("{value:?}");
    value.clone()
}
```

`where` clause:

```rust
fn process<T, E>(value: T) -> Result<(), E>
where
    T: std::fmt::Debug + Clone,
    E: std::error::Error,
{
    println!("{value:?}");
    Ok(())
}
```

## API / Sintassi

Forme equivalenti:

```rust
fn a<T: Clone>(value: T) -> T {
    value.clone()
}

fn b(value: impl Clone) {
    let _ = value;
}

fn c<T>(value: T)
where
    T: Clone,
{
    let _ = value.clone();
}
```

`impl Trait` e comodo nelle firme semplici. `where` e piu leggibile quando i vincoli crescono.

## Esempio pratico

```rust
use std::fmt::Display;

fn join_display<T>(items: &[T], sep: &str) -> String
where
    T: Display,
{
    items
        .iter()
        .map(|item| item.to_string())
        .collect::<Vec<_>>()
        .join(sep)
}
```

La funzione accetta qualunque slice di valori mostrabili con `Display`.

## Varianti

- Bound singolo: `T: Clone`.
- Bound multipli: `T: Clone + Debug`.
- Bound con lifetime: `T: 'a`.
- Higher-ranked bound: `for<'a>`.
- Bound su associated type: `Iterator<Item = String>`.
- `?Sized`: rilassa il vincolo implicito `Sized`.

## Errori comuni

- Mettere bounds sulla struct quando servono solo su un metodo.
- Usare `Clone` per aggirare problemi di ownership.
- Usare bounds troppo specifici e ridurre riuso.
- Scrivere firme illeggibili invece di usare `where`.
- Confondere `impl Trait` in parametro con `dyn Trait`.

## Checklist

- Il bound serve davvero in tutta la struct o solo in un metodo?
- Il vincolo comunica comportamento o dettaglio implementativo?
- `where` renderebbe la firma piu leggibile?
- Serve `Display` o `Debug`?
- Il tipo deve essere posseduto o basta un riferimento?

## Collegamenti

- [[Programmazione/Rust/Pagine/Generics|Generics]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)|Higher-Ranked Trait Bounds (HRTB)]]
- [[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch|Static dispatch vs dynamic dispatch]]

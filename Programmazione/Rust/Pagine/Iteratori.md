---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, iteratori, collezioni]
aliases:
  - "Iteratori Rust"
  - "Iterator"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Vec]]"
  - "[[Programmazione/Rust/Pagine/Closure]]"
related:
  - "[[Programmazione/Rust/Pagine/Iterator API]]"
  - "[[Programmazione/Rust/Pagine/Vec]]"
  - "[[Programmazione/Rust/Pagine/Zero-cost abstractions]]"
---

# Iteratori

## Sintesi

Gli iteratori rappresentano una sequenza di valori prodotti uno alla volta. In Rust sono lazy: non fanno lavoro finche non vengono consumati da un adattatore finale come `collect`, `sum`, `for_each` o un ciclo `for`.

Sono uno strumento centrale per trasformare collezioni in modo espressivo e spesso senza overhead rispetto a loop espliciti.

## Quando usarlo

- Quando devi trasformare, filtrare o aggregare una sequenza.
- Quando vuoi evitare indici manuali.
- Quando vuoi comporre passaggi di elaborazione.
- Quando vuoi produrre una nuova collection con `collect`.
- Quando vuoi lavorare sia su `Vec`, slice, mappe, range e altre sorgenti.

## Come funziona

Il trait base e `Iterator`:

```rust
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}
```

Un iteratore produce `Some(item)` finche ci sono elementi e `None` quando finisce.

```rust
let numeri = vec![1, 2, 3];

for n in numeri.iter() {
    println!("{n}");
}
```

## API / Sintassi

Tre modi comuni di iterare:

```rust
let v = vec![1, 2, 3];

for n in v.iter() {
    // &i32
}

for n in v.iter().copied() {
    // i32
}

for n in v {
    // i32, il Vec viene consumato
}
```

Adattatori:

```rust
let pari: Vec<i32> = (0..10)
    .filter(|n| n % 2 == 0)
    .map(|n| n * 2)
    .collect();
```

## Esempio pratico

```rust
fn normalizza_tags(tags: &[String]) -> Vec<String> {
    tags.iter()
        .map(|tag| tag.trim().to_lowercase())
        .filter(|tag| !tag.is_empty())
        .collect()
}
```

La pipeline legge una slice, produce nuove `String` normalizzate e scarta elementi vuoti.

## Varianti

- `iter()`: produce riferimenti immutabili.
- `iter_mut()`: produce riferimenti mutabili.
- `into_iter()`: consuma la collection e produce valori posseduti.
- Adattatori lazy: `map`, `filter`, `take`, `skip`, `zip`.
- Consumatori: `collect`, `sum`, `fold`, `any`, `all`, `find`.

## Errori comuni

- Dimenticare che gli adattatori sono lazy se non c'e un consumatore finale.
- Usare `into_iter()` e consumare la collection senza volerlo.
- Clonare elementi quando bastano riferimenti.
- Scrivere pipeline troppo lunghe e poco leggibili.
- Aspettarsi che `filter` riceva valori posseduti quando spesso riceve riferimenti.

## Checklist

- Vuoi leggere, modificare o consumare la collection?
- Serve `iter`, `iter_mut` o `into_iter`?
- La pipeline ha un consumatore finale?
- Il tipo prodotto da `collect` e chiaro?
- Un loop esplicito sarebbe piu leggibile?

## Collegamenti

- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]
- [[Programmazione/Rust/Pagine/Closure|Closure]]
- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/HashMap e HashSet|HashMap e HashSet]]
- [[Programmazione/Rust/Pagine/Zero-cost abstractions|Zero-cost abstractions]]


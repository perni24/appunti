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
  - standard-library
aliases:
  - "Iterator API"
  - "API Iterator Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
  - "[[Programmazione/Rust/Pagine/Closure]]"
  - "[[Programmazione/Rust/Pagine/Associated types]]"
related:
  - "[[Programmazione/Rust/Pagine/Vec]]"
  - "[[Programmazione/Rust/Pagine/Zero-cost abstractions]]"
  - "[[Programmazione/Rust/Pagine/Rayon e parallel iterators]]"
---

# Iterator API

## Sintesi

La `Iterator API` della standard library e il sistema con cui Rust lavora su sequenze in modo lazy, componibile e tipizzato. Il trait `Iterator` definisce un solo metodo essenziale, `next`, ma espone molti adattatori e consumatori.

Gli iteratori sono una delle astrazioni piu importanti di Rust: permettono codice espressivo senza rinunciare a performance prevedibili.

## Quando usarlo

- Quando devi trasformare, filtrare, aggregare o cercare elementi.
- Quando vuoi evitare gestione manuale di indici.
- Quando vuoi comporre piu passaggi in una pipeline leggibile.
- Quando vuoi produrre una nuova collection con `collect`.
- Quando vuoi scrivere API che accettano qualunque sequenza iterabile.

## Come funziona

Il trait base:

```rust
trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}
```

Gli adattatori come `map`, `filter`, `take`, `zip` sono lazy: creano un nuovo iteratore ma non consumano dati finche non arriva un consumatore finale.

```rust
let result: Vec<_> = (0..10)
    .filter(|n| n % 2 == 0)
    .map(|n| n * 10)
    .collect();
```

## API / Sintassi

Sorgenti comuni:

```rust
let v = vec![1, 2, 3];

v.iter();      // &i32
v.iter_mut();  // &mut i32
v.into_iter(); // i32, consuma il Vec
```

Consumatori comuni:

```rust
let somma: i32 = (1..=10).sum();
let tutti = [2, 4, 6].iter().all(|n| *n % 2 == 0);
let primo = [1, 3, 4].iter().find(|n| **n % 2 == 0);
```

## Esempio pratico

```rust
fn parole_uniche_ordinate(testo: &str) -> Vec<String> {
    let mut parole: Vec<String> = testo
        .split_whitespace()
        .map(|p| p.trim_matches(|c: char| !c.is_alphanumeric()))
        .filter(|p| !p.is_empty())
        .map(|p| p.to_lowercase())
        .collect();

    parole.sort();
    parole.dedup();
    parole
}
```

La pipeline normalizza il testo, poi usa metodi di `Vec` per ordinare e deduplicare.

## Varianti

- Adattatori lazy: `map`, `filter`, `flat_map`, `take`, `skip`, `enumerate`, `zip`.
- Consumatori: `collect`, `sum`, `fold`, `reduce`, `for_each`, `find`, `any`, `all`.
- `Iterator<Item = T>`: bound su tipo prodotto.
- `IntoIterator`: trait per convertire un valore in iteratore.
- Iteratori paralleli: disponibili con crate come `rayon`, non nella standard library base.

## Errori comuni

- Dimenticare il consumatore finale e aspettarsi effetti da una pipeline lazy.
- Usare `into_iter()` e consumare una collection che serviva ancora.
- Scrivere pipeline troppo lunghe e meno leggibili di un `for`.
- Clonare elementi quando basta iterare per riferimento.
- Confondere il tipo ricevuto da `filter`, spesso riferimento a item.

## Checklist

- Vuoi leggere, modificare o consumare la collection?
- Serve `iter`, `iter_mut` o `into_iter`?
- La pipeline ha un consumatore finale?
- Il tipo di `collect` e inferibile o va esplicitato?
- Un loop esplicito sarebbe piu chiaro?

## Collegamenti

- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Closure|Closure]]
- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Zero-cost abstractions|Zero-cost abstractions]]
- [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon e parallel iterators]]

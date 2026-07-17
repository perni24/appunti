---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - concorrenza-e-asincronia
aliases:
  - "Rayon"
  - "Parallel iterators"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
  - "[[Programmazione/Rust/Pagine/Threads]]"
related:
  - "[[Programmazione/Rust/Pagine/Iterator API]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
  - "[[Programmazione/Rust/Pagine/Zero-cost abstractions]]"
---

# Rayon e parallel iterators

## Sintesi

Rayon e una crate per parallelismo dati in Rust. Espone parallel iterators che permettono di trasformare molte pipeline `iter()` in versioni parallele con `par_iter()`, `into_par_iter()` e simili.

E utile per lavoro CPU-bound su collezioni, quando gli elementi possono essere elaborati indipendentemente.

## Quando usarlo

- Quando hai una collezione grande e lavoro CPU-bound per elemento.
- Quando vuoi parallelizzare senza gestire thread manualmente.
- Quando il lavoro non richiede I/O async.
- Quando puoi evitare stato condiviso mutabile.

## Come funziona

Dipendenza:

```toml
[dependencies]
rayon = "1"
```

Uso:

```rust
use rayon::prelude::*;

let sum: i64 = (0..1_000_000)
    .into_par_iter()
    .map(|n| n * 2)
    .sum();
```

Rayon usa un thread pool e work stealing per distribuire lavoro.

## API / Sintassi

```rust
use rayon::prelude::*;

vec.par_iter()
vec.par_iter_mut()
vec.into_par_iter()
```

Adattatori comuni:

```rust
items.par_iter()
    .filter(|item| item.is_valid())
    .map(|item| item.score())
    .sum::<u64>();
```

## Esempio pratico

```rust
use rayon::prelude::*;

fn normalize_all(values: &[String]) -> Vec<String> {
    values
        .par_iter()
        .map(|s| s.trim().to_lowercase())
        .filter(|s| !s.is_empty())
        .collect()
}
```

Ogni stringa viene elaborata indipendentemente; non serve gestire lock.

## Varianti

- `par_iter()`: riferimenti condivisi.
- `par_iter_mut()`: riferimenti mutabili disgiunti.
- `into_par_iter()`: consuma la collection.
- `join`: esegue due closure in parallelo.
- Thread pool custom: utile in applicazioni con vincoli specifici.

## Errori comuni

- Usare Rayon su collezioni piccole dove overhead supera benefici.
- Fare I/O bloccante dentro parallel iterators.
- Mutare stato condiviso sotto lock in ogni iterazione.
- Assumere ordine deterministico quando l'operazione non lo garantisce.
- Mescolare Rayon e async runtime senza capire i rispettivi thread pool.

## Checklist

- Il lavoro e CPU-bound?
- Gli elementi sono indipendenti?
- La collezione e abbastanza grande?
- Hai evitato lock nel corpo dell'iteratore?
- Hai misurato rispetto alla versione sequenziale?

## Collegamenti

- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]
- [[Programmazione/Rust/Pagine/Threads|Threads]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]

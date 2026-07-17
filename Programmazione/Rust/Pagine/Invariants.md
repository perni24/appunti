---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - unsafe-rust-in-profondita
aliases:
  - "Invarianti"
  - "Safety invariants"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Aliasing rules]]"
related:
  - "[[Programmazione/Rust/Pagine/Unsafe abstractions sicure]]"
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
  - "[[Programmazione/Rust/Pagine/Miri]]"
---

# Invariants

## Sintesi

Le invarianti sono condizioni che devono rimanere vere affinche un tipo o una funzione sia corretta. In safe Rust molte invarianti sono verificate dal type system. In unsafe Rust alcune devono essere mantenute manualmente.

Una astrazione unsafe e sicura solo se tutte le sue invarianti sono definite, preservate e non esponibili in modo violabile dall'API safe.

## Quando usarlo

- Quando un tipo contiene raw pointer, memoria non inizializzata o layout manuale.
- Quando una funzione unsafe richiede precondizioni.
- Quando costruisci wrapper safe sopra unsafe.
- Quando devi capire se un'ottimizzazione a basso livello e corretta.

## Come funziona

Esempio di invariante:

```rust
struct NonEmptyVec<T> {
    inner: Vec<T>,
}
```

Invariante: `inner.len() > 0`.

Il costruttore deve verificarla:

```rust
impl<T> NonEmptyVec<T> {
    fn new(inner: Vec<T>) -> Option<Self> {
        (!inner.is_empty()).then_some(Self { inner })
    }

    fn first(&self) -> &T {
        &self.inner[0]
    }
}
```

## API / Sintassi

Documentare invarianti:

```rust
/// Invariants:
/// - `ptr` is non-null.
/// - `ptr` points to `len` initialized elements.
/// - the allocation outlives `Self`.
struct RawSlice<T> {
    ptr: *const T,
    len: usize,
}
```

Precondizioni unsafe:

```rust
/// # Safety
///
/// Caller must ensure `ptr` is valid for `len` elements.
unsafe fn from_raw_parts<T>(ptr: *const T, len: usize) -> RawSlice<T> {
    RawSlice { ptr, len }
}
```

## Esempio pratico

```rust
struct Percent(u8);

impl Percent {
    fn new(value: u8) -> Option<Self> {
        (value <= 100).then_some(Self(value))
    }

    fn get(self) -> u8 {
        self.0
    }
}
```

L'invariante `0..=100` permette alle altre funzioni di fidarsi del valore senza ricontrollarlo continuamente.

## Varianti

- Invarianti di tipo: sempre vere per ogni valore valido.
- Precondizioni: devono essere vere prima di chiamare una funzione.
- Postcondizioni: vere dopo una operazione.
- Invarianti di aliasing: chi puo leggere o scrivere.
- Invarianti di layout: allineamento, dimensione, inizializzazione.

## Errori comuni

- Non scrivere le invarianti e affidarsi alla memoria del programmatore.
- Esporre campi pubblici che permettono di violare invarianti.
- Aggiungere unsafe senza descrivere cosa deve essere vero.
- Testare solo casi normali e non transizioni di stato.
- Confondere validita logica e safety: un valore sbagliato non sempre e UB, ma puo rompere l'API.

## Checklist

- Quali condizioni devono essere sempre vere?
- Chi puo costruire il tipo?
- Quali metodi possono rompere invarianti?
- Le invarianti sono documentate vicino al codice unsafe?
- L'API safe impedisce stati invalidi?

## Collegamenti

- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Aliasing rules|Aliasing rules]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/Unsafe abstractions sicure|Unsafe abstractions sicure]]
- [[Programmazione/Rust/Pagine/Miri|Miri]]

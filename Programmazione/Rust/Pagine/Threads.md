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
  - "Thread Rust"
  - "std::thread"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Move semantics]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Message passing]]"
  - "[[Programmazione/Rust/Pagine/Shared state]]"
  - "[[Programmazione/Rust/Pagine/Mutex RwLock e Atomics]]"
---

# Threads

## Sintesi

I thread in Rust permettono di eseguire codice in parallelo usando thread del sistema operativo. La standard library espone `std::thread`, con `spawn` per creare un thread e `JoinHandle` per attendere il risultato.

Ownership, `Send` e `'static` sono centrali: i dati passati a un thread devono essere sicuri da muovere o condividere.

## Quando usarlo

- Quando un lavoro CPU-bound puo essere eseguito in parallelo.
- Quando vuoi separare attivita bloccanti dal thread principale.
- Quando vuoi usare primitive sync della standard library.
- Quando non serve un runtime async.

## Come funziona

```rust
use std::thread;

let handle = thread::spawn(|| {
    println!("lavoro nel thread");
});

handle.join().unwrap();
```

Se la closure deve usare dati esterni, spesso serve `move`:

```rust
let data = String::from("rust");
let handle = thread::spawn(move || {
    println!("{data}");
});
handle.join().unwrap();
```

## API / Sintassi

```rust
let handle = std::thread::spawn(move || {
    42
});

let result = handle.join().unwrap();
```

Thread naming e stack size:

```rust
let builder = std::thread::Builder::new().name(String::from("worker"));
let handle = builder.spawn(|| 1).unwrap();
```

## Esempio pratico

```rust
use std::thread;

fn parallel_sum(chunks: Vec<Vec<i64>>) -> i64 {
    let handles: Vec<_> = chunks
        .into_iter()
        .map(|chunk| thread::spawn(move || chunk.into_iter().sum::<i64>()))
        .collect();

    handles
        .into_iter()
        .map(|h| h.join().unwrap())
        .sum()
}
```

Ogni thread prende ownership del proprio chunk, evitando condivisione mutabile.

## Varianti

- Thread OS con `std::thread`.
- Thread builder per nome e stack.
- Thread pool tramite crate esterne come Rayon.
- Message passing con channel.
- Shared state con `Arc<Mutex<T>>`.

## Errori comuni

- Usare thread manuali per parallelismo dati quando Rayon sarebbe piu semplice.
- Dimenticare `join` e perdere panic o risultato.
- Condividere stato mutabile senza sincronizzazione.
- Catturare riferimenti non `'static` in `thread::spawn`.
- Tenere lock durante lavoro lungo.

## Checklist

- Il lavoro e CPU-bound o I/O-bound?
- Ogni thread possiede i dati che usa?
- Serve comunicazione con channel?
- Serve stato condiviso con `Arc` e lock?
- Gestisci il risultato di `join`?

## Collegamenti

- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Message passing|Message passing]]
- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
- [[Programmazione/Rust/Pagine/Mutex RwLock e Atomics|Mutex RwLock e Atomics]]
- [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon e parallel iterators]]

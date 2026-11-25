---
date: 2026-07-30
area: Programmazione
topic: Promemoria Rust
type: operational-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - rust
  - promemoria
  - concorrenza
  - async
aliases:
  - Cheatsheet concorrenza Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Threads|Threads]]"
  - "[[Programmazione/Rust/Pagine/Async Await|Async Await]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]"
title: Rust - Concorrenza e async
---

# Rust - Concorrenza e async

Per lavoro sincrono scegli thread; per trasferire dati scegli un canale; per modificare lo stesso dato serve sincronizzazione. Una `async fn` crea invece un future: chiamarla non ne esegue il corpo, serve un esecutore che ne guidi il polling.

## Thread, messaggi e stato condiviso

Questi tre blocchi sono indipendenti: incollane uno alla volta nel corpo di `fn main()`. Non richiedono dipendenze.

```rust
let values = vec![2, 3, 4];
let worker = std::thread::spawn(move || values.into_iter().sum::<i32>());
assert_eq!(worker.join().expect("thread panicked"), 9);
```

```rust
use std::{sync::mpsc, thread};
let (tx, rx) = mpsc::channel();
let worker = thread::spawn(move || tx.send(42).expect("receiver dropped"));
assert_eq!(rx.recv().unwrap(), 42);
worker.join().unwrap();
assert!(rx.recv().is_err()); // coda vuota, nessun sender ancora vivo
```

```rust
use std::{sync::{Arc, Mutex}, thread};
let counter = Arc::new(Mutex::new(0));
let other = Arc::clone(&counter);
let worker = thread::spawn(move || *other.lock().unwrap() += 1);
worker.join().unwrap();
assert_eq!(*counter.lock().unwrap(), 1);
```

`recv` è bloccante. Non aspettare che il canale si chiuda mentre conservi una copia del mittente; non aspettare un thread tenendo il lock di cui ha bisogno.

## Tokio: task, concorrenza e timeout

In un progetto binario, aggiungi questa dipendenza alla sezione esistente di `Cargo.toml`; copia il programma in `src/main.rs` ed esegui `cargo run`. Non usa la rete.

```toml
[dependencies]
tokio = { version = "1", features = ["rt", "macros", "time"] }
```

```rust
use std::{future::pending, num::ParseIntError, time::Duration};
use tokio::{task, time};

async fn parse_id(text: &str) -> Result<u64, ParseIntError> {
    task::yield_now().await;
    text.parse()
}

#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let input = String::from("42");
    let worker = tokio::spawn(async move { parse_id(&input).await });
    let id = worker.await??; // prima JoinError, poi ParseIntError
    assert_eq!(id, 42);

    let pair = tokio::try_join!(parse_id("2"), parse_id("3"))?;
    assert_eq!(pair, (2, 3));
    assert!(tokio::try_join!(parse_id("x"), parse_id("3")).is_err());

    let never = pending::<()>();
    assert!(time::timeout(Duration::from_millis(5), never).await.is_err());

    let total = task::spawn_blocking(|| [2, 3, 4].iter().sum::<i32>()).await?;
    assert_eq!(total, 9);
    Ok(())
}
```

| Operazione | Cosa ricordare |
|---|---|
| `tokio::spawn` | Crea un task indipendente; `await` sull'handle distingue il fallimento del task dall'eventuale errore restituito dal lavoro. |
| `tokio::try_join!` | Fa avanzare i rami **nello stesso task**, non in parallelo; esce al primo `Err`. [Documentazione Tokio](https://docs.rs/tokio/latest/tokio/macro.try_join.html). |
| `timeout` | Limita l'attesa di un future cooperativo; non interrompe codice sincrono bloccato. |
| `spawn_blocking` | Sposta lavoro bloccante su un apposito pool; una volta partito non lo fermi abbandonando l'handle. |
| Rayon | Per calcolo CPU parallelo su collezioni; non è necessario per l'I/O asincrono. |

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/Threads|Threads]]
- [[Programmazione/Rust/Pagine/Message passing|Message passing]]
- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex T e RwLock T]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Async Await|Async Await]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/select join e cancellation|select join e cancellation]]
- [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon e parallel iterators]]

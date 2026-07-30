---
date: 2026-07-30
area: Programmazione
topic: Promemoria Rust
type: operational-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [rust, promemoria, concorrenza, async]
aliases: [Cheatsheet concorrenza Rust]
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Threads]]"
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
---

# Rust - Concorrenza e async

## Thread

```rust
use std::thread;

let handle = thread::spawn(|| {
    calculate()
});

let result = handle.join().expect("thread panicked");
```

## Spostare dati nel thread

```rust
let values = vec![1, 2, 3];

let handle = thread::spawn(move || {
    println!("{values:?}");
});
```

## Channel

```rust
use std::sync::mpsc;
use std::thread;

let (sender, receiver) = mpsc::channel();

thread::spawn(move || {
    sender.send(42).expect("receiver dropped");
});

let value = receiver.recv()?;
```

## Stato condiviso

```rust
use std::sync::{Arc, Mutex};
use std::thread;

let counter = Arc::new(Mutex::new(0));
let shared = Arc::clone(&counter);

let handle = thread::spawn(move || {
    *shared.lock().expect("mutex poisoned") += 1;
});

handle.join().expect("thread panicked");
```

## Funzione async

```rust
async fn load_user(id: u64) -> Result<User, Error> {
    client.get_user(id).await
}
```

Una funzione `async` restituisce un `Future` e richiede un runtime per essere eseguita.

## Tokio main

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    run().await?;
    Ok(())
}
```

## Task Tokio

```rust
let handle = tokio::spawn(async move {
    load_user(id).await
});

let user = handle.await??;
```

## Operazioni parallele

```rust
let (user, orders) = tokio::try_join!(
    load_user(id),
    load_orders(id),
)?;
```

## Timeout

```rust
use std::time::Duration;

let result = tokio::time::timeout(
    Duration::from_secs(5),
    operation(),
)
.await?;
```

## Codice bloccante

```rust
let result = tokio::task::spawn_blocking(|| blocking_operation())
    .await?;
```

## Scelta rapida

| Strumento | Uso |
|---|---|
| `std::thread` | Lavoro sincrono concorrente |
| Channel | Passaggio di messaggi |
| `Arc<Mutex<T>>` | Stato mutabile condiviso |
| Tokio task | I/O asincrono |
| Rayon | Calcolo parallelo su collezioni |

## Approfondimento

- [[Programmazione/Rust/Pagine/Threads]]
- [[Programmazione/Rust/Pagine/Message passing]]
- [[Programmazione/Rust/Pagine/Shared state]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Async Await]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/select join e cancellation]]
- [[Programmazione/Rust/Pagine/Rayon e parallel iterators]]

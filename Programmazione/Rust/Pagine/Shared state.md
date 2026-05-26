---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - concorrenza-e-asincronia
aliases:
  - "Stato condiviso Rust"
  - "Shared mutable state"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Rc T e Arc T]]"
  - "[[Programmazione/Rust/Pagine/Mutex RwLock e Atomics]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Message passing]]"
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
  - "[[Programmazione/Rust/Pagine/Graceful shutdown]]"
---

# Shared state

## Sintesi

Shared state e il modello in cui piu thread o task accedono allo stesso stato. In Rust e possibile solo tramite tipi che rendono esplicite ownership condivisa e sincronizzazione, per esempio `Arc<Mutex<T>>`, `Arc<RwLock<T>>` o atomics.

La regola pratica: condividi il meno possibile e tieni lock per scope brevi.

## Quando usarlo

- Quando piu worker devono aggiornare una cache, un contatore o uno stato comune.
- Quando message passing sarebbe troppo indiretto.
- Quando serve lettura concorrente di dati condivisi.
- Quando devi integrare codice che richiede stato globale o registry.

## Come funziona

`Arc<T>` condivide ownership tra thread. `Mutex<T>` protegge accesso mutabile:

```rust
use std::sync::{Arc, Mutex};

let state = Arc::new(Mutex::new(0));
let cloned = Arc::clone(&state);

std::thread::spawn(move || {
    *cloned.lock().unwrap() += 1;
});
```

La guard del lock implementa `Deref` e `DerefMut`; quando viene droppata, il lock viene rilasciato.

## API / Sintassi

```rust
type Shared<T> = std::sync::Arc<std::sync::Mutex<T>>;

fn update(shared: &Shared<Vec<String>>, value: String) {
    shared.lock().unwrap().push(value);
}
```

Per molte letture:

```rust
let state = std::sync::Arc::new(std::sync::RwLock::new(String::new()));
let read = state.read().unwrap();
```

## Esempio pratico

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn count_parallel() -> i32 {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = Vec::new();

    for _ in 0..4 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            *counter.lock().unwrap() += 1;
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    *counter.lock().unwrap()
}
```

Il contatore e condiviso, ma ogni aggiornamento avviene sotto lock.

## Varianti

- `Arc<Mutex<T>>`: mutazione esclusiva condivisa.
- `Arc<RwLock<T>>`: molte letture o una scrittura.
- Atomics: contatori e flag lock-free.
- `OnceLock`/`LazyLock`: inizializzazione condivisa una sola volta.
- Message passing: alternativa senza stato mutabile condiviso.

## Errori comuni

- Tenere lock durante I/O o chiamate lente.
- Creare deadlock con piu lock.
- Usare `Arc<Mutex<T>>` come default invece di progettare ownership.
- Ignorare poisoning dei lock.
- Usare `std::sync::Mutex` in async tenendo la guard attraverso `.await`.

## Checklist

- Lo stato deve davvero essere condiviso?
- Il lock ha scope minimo?
- Ci sono piu lock acquisiti in ordine coerente?
- Serve `Mutex`, `RwLock` o atomic?
- Message passing renderebbe il flusso piu semplice?

## Collegamenti

- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc T e Arc T]]
- [[Programmazione/Rust/Pagine/Mutex RwLock e Atomics|Mutex RwLock e Atomics]]
- [[Programmazione/Rust/Pagine/Message passing|Message passing]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]

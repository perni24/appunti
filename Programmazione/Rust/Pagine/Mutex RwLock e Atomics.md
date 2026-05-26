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
  - "Mutex"
  - "RwLock"
  - "Atomics"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Shared state]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
related:
  - "[[Programmazione/Rust/Pagine/Mutex T e RwLock T]]"
  - "[[Programmazione/Rust/Pagine/Threads]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
---

# Mutex, RwLock e Atomics

## Sintesi

`Mutex`, `RwLock` e atomics sono strumenti per coordinare accesso concorrente a dati condivisi. `Mutex<T>` protegge accesso esclusivo. `RwLock<T>` distingue lettori e scrittori. Gli atomic types gestiscono operazioni primitive lock-free su valori semplici.

La scelta dipende dal tipo di accesso, dal costo del lock e dalla complessita del modello.

## Quando usarlo

- Usa `Mutex<T>` per stato condiviso mutabile semplice.
- Usa `RwLock<T>` quando ci sono molte letture e poche scritture.
- Usa atomics per contatori, flag e primitive molto piccole.
- Evita atomics complessi se non conosci bene gli ordering.

## Come funziona

Mutex:

```rust
let value = std::sync::Mutex::new(0);
*value.lock().unwrap() += 1;
```

RwLock:

```rust
let value = std::sync::RwLock::new(String::new());
let read = value.read().unwrap();
```

Atomic:

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

let counter = AtomicUsize::new(0);
counter.fetch_add(1, Ordering::Relaxed);
```

## API / Sintassi

Condivisione tra thread:

```rust
use std::sync::{Arc, Mutex};

let shared = Arc::new(Mutex::new(Vec::<String>::new()));
let cloned = Arc::clone(&shared);
```

Ordering atomici comuni:

```rust
Ordering::Relaxed
Ordering::Acquire
Ordering::Release
Ordering::AcqRel
Ordering::SeqCst
```

## Esempio pratico

```rust
use std::sync::atomic::{AtomicBool, Ordering};

struct StopFlag {
    stopped: AtomicBool,
}

impl StopFlag {
    fn stop(&self) {
        self.stopped.store(true, Ordering::Release);
    }

    fn is_stopped(&self) -> bool {
        self.stopped.load(Ordering::Acquire)
    }
}
```

Un flag atomico evita un mutex per uno stato booleano semplice.

## Varianti

- `Mutex<T>`: un accesso esclusivo.
- `RwLock<T>`: molti lettori o uno scrittore.
- `AtomicBool`, `AtomicUsize`, `AtomicPtr`: primitive atomiche.
- `Arc<Mutex<T>>`: stato mutabile condiviso.
- Channel/message passing: alternativa senza memoria condivisa.

## Errori comuni

- Usare `RwLock` pensando sia sempre piu veloce di `Mutex`.
- Tenere lock durante I/O o `.await`.
- Usare `Ordering::Relaxed` senza capire le garanzie necessarie.
- Modellare strutture complesse solo con atomics.
- Ignorare poisoning dopo panic mentre un lock era acquisito.

## Checklist

- Serve accesso esclusivo o letture concorrenti?
- Il dato e abbastanza semplice per atomic?
- Hai misurato il collo di bottiglia?
- Lo scope del lock e minimo?
- L'ordering atomico e documentato?

## Collegamenti

- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex T e RwLock T]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Threads|Threads]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]

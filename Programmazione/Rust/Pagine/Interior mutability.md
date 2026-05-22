---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - smart-pointers-e-interior-mutability
aliases:
  - "Interior mutability"
  - "Mutabilita interna"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Mutabilita]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/Cell T]]"
  - "[[Programmazione/Rust/Pagine/RefCell T]]"
  - "[[Programmazione/Rust/Pagine/Mutex T e RwLock T]]"
---

# Interior mutability

## Sintesi

Interior mutability e il pattern che permette di modificare un valore anche quando si ha solo un riferimento condiviso `&T`. In Rust questo e possibile tramite tipi che incapsulano controlli specifici, come `Cell<T>`, `RefCell<T>`, `Mutex<T>` e `RwLock<T>`.

Il principio resta lo stesso: la mutabilita deve essere controllata. Cambia solo dove avviene il controllo, da compile time a runtime o tramite sincronizzazione.

## Quando usarlo

- Quando una API deve esporre `&self` ma deve aggiornare stato interno.
- Quando il borrow checker non puo provare staticamente una relazione sicura.
- Quando serve stato condiviso mutabile.
- Quando costruisci cache, metriche, mock, grafi o componenti concorrenti.

## Come funziona

Rust normalmente richiede `&mut T` per modificare un valore. I tipi di interior mutability usano API sicure costruite sopra primitive interne che permettono mutazione controllata.

Esempio:

```rust
use std::cell::RefCell;

struct Counter {
    value: RefCell<u64>,
}

impl Counter {
    fn increment(&self) {
        *self.value.borrow_mut() += 1;
    }
}
```

Il metodo usa `&self`, ma `RefCell` controlla a runtime che non ci siano borrow incompatibili.

## API / Sintassi

Single-thread:

```rust
use std::cell::{Cell, RefCell};

let flag = Cell::new(false);
flag.set(true);

let values = RefCell::new(Vec::new());
values.borrow_mut().push(1);
```

Multi-thread:

```rust
use std::sync::Mutex;

let value = Mutex::new(0);
*value.lock().unwrap() += 1;
```

## Esempio pratico

```rust
use std::cell::Cell;

struct RequestStats {
    seen: Cell<u64>,
}

impl RequestStats {
    fn record(&self) {
        self.seen.set(self.seen.get() + 1);
    }

    fn seen(&self) -> u64 {
        self.seen.get()
    }
}
```

La mutazione e un dettaglio interno della metrica; l'API puo restare basata su `&self`.

## Varianti

- `Cell<T>`: sostituzione del valore, spesso per tipi `Copy`.
- `RefCell<T>`: borrow checking a runtime single-thread.
- `Mutex<T>`: accesso esclusivo sincronizzato multi-thread.
- `RwLock<T>`: molti lettori o uno scrittore.
- Atomics: mutabilita concorrente per valori primitivi.

## Errori comuni

- Usare interior mutability per evitare di capire ownership.
- Nascondere stato globale mutabile in modo poco testabile.
- Tenere guard o borrow runtime troppo a lungo.
- Usare `RefCell<T>` in scenari multi-thread.
- Scegliere `Mutex<T>` dove un passaggio di ownership o message passing sarebbe piu semplice.

## Checklist

- La mutabilita interna e davvero necessaria?
- Il controllo deve essere single-thread, runtime o thread-safe?
- Lo scope dei borrow/lock e piccolo?
- Un design con ownership esplicita sarebbe piu chiaro?
- Il tipo scelto comunica bene il modello di accesso?

## Collegamenti

- [[Programmazione/Rust/Pagine/Mutabilita|Mutabilita]]
- [[Programmazione/Rust/Pagine/Cell T|Cell T]]
- [[Programmazione/Rust/Pagine/RefCell T|RefCell T]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex T e RwLock T]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]

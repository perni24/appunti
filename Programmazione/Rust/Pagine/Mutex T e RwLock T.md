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
  - smart-pointers-e-interior-mutability
aliases:
  - "Mutex<T>"
  - "RwLock<T>"
  - "Lock Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
  - "[[Programmazione/Rust/Pagine/Rc T e Arc T]]"
  - "[[Programmazione/Rust/Pagine/Threads]]"
related:
  - "[[Programmazione/Rust/Pagine/Mutex RwLock e Atomics]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
  - "[[Programmazione/Rust/Pagine/Shared state]]"
---

# Mutex<T> e RwLock<T>

## Sintesi

`Mutex<T>` e `RwLock<T>` permettono mutabilita interna sincronizzata tra thread. `Mutex<T>` consente un solo accesso alla volta. `RwLock<T>` consente molti lettori oppure un solo scrittore.

In Rust il lock restituisce una guard: finche la guard e viva, l'accesso e valido; quando la guard viene droppata, il lock viene rilasciato.

## Quando usarlo

- Usa `Mutex<T>` per stato condiviso mutabile con accessi brevi e semplici.
- Usa `RwLock<T>` quando ci sono molte letture e poche scritture.
- Combina spesso con `Arc<T>` per condividere il lock tra thread.
- Preferisci message passing quando evita stato condiviso complesso.

## Come funziona

```rust
use std::sync::Mutex;

let value = Mutex::new(0);
{
    let mut guard = value.lock().unwrap();
    *guard += 1;
}
```

`lock()` blocca finche il mutex e disponibile e restituisce `MutexGuard<T>`.

`RwLock` distingue lettura e scrittura:

```rust
use std::sync::RwLock;

let value = RwLock::new(String::from("rust"));
let read = value.read().unwrap();
```

## API / Sintassi

Con `Arc`:

```rust
use std::sync::{Arc, Mutex};
use std::thread;

let counter = Arc::new(Mutex::new(0));
let cloned = Arc::clone(&counter);

thread::spawn(move || {
    let mut value = cloned.lock().unwrap();
    *value += 1;
});
```

Poisoning:

```rust
let guard = mutex.lock().unwrap();
```

`unwrap()` qui accetta di fallire se un thread e andato in panic mentre teneva il lock.

## Esempio pratico

```rust
use std::sync::{Arc, Mutex};

struct SharedLog {
    entries: Arc<Mutex<Vec<String>>>,
}

impl SharedLog {
    fn push(&self, entry: String) {
        self.entries.lock().unwrap().push(entry);
    }

    fn len(&self) -> usize {
        self.entries.lock().unwrap().len()
    }
}
```

La guard resta viva solo per la durata dell'operazione, riducendo il rischio di deadlock.

## Varianti

- `Mutex<T>`: accesso esclusivo sincronizzato.
- `RwLock<T>`: molti lettori o uno scrittore.
- `Arc<Mutex<T>>`: stato condiviso mutabile tra thread.
- Atomics: contatori e flag senza lock esplicito.
- `tokio::sync::Mutex`: mutex async per contesti async.

## Errori comuni

- Tenere un lock mentre si eseguono operazioni lente o chiamate esterne.
- Creare deadlock acquisendo lock in ordine diverso.
- Usare `std::sync::Mutex` in codice async mantenendo la guard attraverso `.await`.
- Usare `RwLock` pensando sia sempre piu veloce di `Mutex`.
- Ignorare il poisoning senza una decisione esplicita.

## Checklist

- Serve davvero stato condiviso mutabile?
- Il lock viene tenuto per uno scope breve?
- L'ordine di acquisizione dei lock e coerente?
- Il codice e sync o async?
- `Arc<Mutex<T>>` e piu chiaro di message passing?

## Collegamenti

- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc T e Arc T]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Mutex RwLock e Atomics|Mutex RwLock e Atomics]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Shared state|Shared state]]

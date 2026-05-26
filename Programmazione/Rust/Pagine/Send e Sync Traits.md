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
  - "Send"
  - "Sync"
  - "Marker trait concorrenza"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Threads]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
related:
  - "[[Programmazione/Rust/Pagine/Unsafe traits]]"
  - "[[Programmazione/Rust/Pagine/Rc T e Arc T]]"
  - "[[Programmazione/Rust/Pagine/Mutex RwLock e Atomics]]"
---

# Send e Sync Traits

## Sintesi

`Send` e `Sync` sono marker trait che esprimono sicurezza tra thread. `Send` indica che un valore puo essere trasferito a un altro thread. `Sync` indica che un riferimento condiviso `&T` puo essere condiviso tra thread.

Sono implementati automaticamente per molti tipi quando i loro campi lo permettono. Implementarli manualmente richiede unsafe e molta cautela.

## Quando usarlo

- Quando lavori con thread, task o runtime multi-thread.
- Quando una API richiede `T: Send` o `T: Sync`.
- Quando scegli tra `Rc` e `Arc`, `RefCell` e `Mutex`.
- Quando progetti tipi che incapsulano puntatori o unsafe.

## Come funziona

Regole pratiche:

- `T: Send`: `T` puo essere mosso tra thread.
- `T: Sync`: `&T` puo essere condiviso tra thread.
- `T` e `Sync` se `&T` e `Send`.

Esempi:

```rust
use std::sync::Arc;

let data = Arc::new(String::from("shared"));
let cloned = Arc::clone(&data);

std::thread::spawn(move || {
    println!("{cloned}");
});
```

`Arc<T>` e adatto a condivisione thread-safe quando `T` soddisfa i vincoli necessari.

## API / Sintassi

Bound comuni:

```rust
fn spawn_work<T>(value: T)
where
    T: Send + 'static,
{
    std::thread::spawn(move || {
        let _ = value;
    });
}
```

Async multi-thread:

```rust
fn requires_send<F>(future: F)
where
    F: std::future::Future + Send + 'static,
{
    let _ = future;
}
```

## Esempio pratico

```rust
use std::rc::Rc;
use std::sync::Arc;

fn main() {
    let shared = Arc::new(String::from("ok"));
    std::thread::spawn({
        let shared = Arc::clone(&shared);
        move || println!("{shared}")
    });

    let _not_send = Rc::new(String::from("single thread"));
}
```

`Rc<T>` non e thread-safe; `Arc<T>` usa reference counting atomico.

## Varianti

- `Send`: trasferimento ownership tra thread.
- `Sync`: condivisione di riferimenti tra thread.
- Marker trait automatici.
- Negative impl: alcuni tipi dichiarano esplicitamente di non supportare un marker.
- Unsafe impl: solo per tipi che garantiscono manualmente invarianti thread-safe.

## Errori comuni

- Pensare che `Arc<T>` renda automaticamente `T` mutabile e sicuro.
- Usare `Rc<T>` o `RefCell<T>` in codice multi-thread.
- Aggiungere `unsafe impl Send` senza prova rigorosa.
- Non capire perche una future non e `Send`: spesso conserva un tipo non thread-safe attraverso `.await`.
- Confondere `Send`/`Sync` con assenza di deadlock.

## Checklist

- Il valore viene mosso tra thread? Serve `Send`.
- Un riferimento condiviso attraversa thread? Serve `Sync`.
- Stai usando `Rc`, `RefCell` o raw pointer?
- La future deve essere eseguita su runtime multi-thread?
- Ogni unsafe impl ha invarianti documentate?

## Collegamenti

- [[Programmazione/Rust/Pagine/Threads|Threads]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc T e Arc T]]
- [[Programmazione/Rust/Pagine/Mutex RwLock e Atomics|Mutex RwLock e Atomics]]
- [[Programmazione/Rust/Pagine/Unsafe traits|Unsafe traits]]
- [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]

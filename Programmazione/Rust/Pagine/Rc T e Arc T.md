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
  - "Rc<T>"
  - "Arc<T>"
  - "Reference counting Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Box T]]"
  - "[[Programmazione/Rust/Pagine/Threads]]"
related:
  - "[[Programmazione/Rust/Pagine/RefCell T]]"
  - "[[Programmazione/Rust/Pagine/Mutex T e RwLock T]]"
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
---

# Rc<T> e Arc<T>

## Sintesi

`Rc<T>` e `Arc<T>` permettono ownership condivisa tramite reference counting. `Rc<T>` e per uso single-thread. `Arc<T>` rende atomico il contatore e puo attraversare thread solo quando il valore interno soddisfa i vincoli `Send` e `Sync` richiesti.

Entrambi permettono molti proprietari dello stesso valore, ma non permettono mutazione diretta del valore interno senza un meccanismo di interior mutability.

## Quando usarlo

- Usa `Rc<T>` quando piu parti single-thread devono condividere ownership.
- Usa `Arc<T>` quando il valore deve essere condiviso tra thread e `T` e compatibile con tale condivisione.
- Usa `Rc<RefCell<T>>` per mutabilita condivisa single-thread.
- Usa `Arc<Mutex<T>>` o `Arc<RwLock<T>>` per stato condiviso mutabile tra thread.

## Come funziona

Clonare `Rc` o `Arc` incrementa il contatore, non clona il valore interno:

```rust
use std::rc::Rc;

let a = Rc::new(String::from("rust"));
let b = Rc::clone(&a);
```

Il valore viene distrutto quando l'ultimo proprietario viene droppato.

`Arc` usa contatori atomici:

```rust
use std::sync::Arc;

let shared = Arc::new(vec![1, 2, 3]);
let other = Arc::clone(&shared);
```

## API / Sintassi

```rust
let value = Rc::new(10);
let cloned = Rc::clone(&value);
let count = Rc::strong_count(&value);
```

Con thread:

```rust
use std::sync::Arc;
use std::thread;

let data = Arc::new(String::from("shared"));
let worker_data = Arc::clone(&data);

thread::spawn(move || {
    println!("{worker_data}");
});
```

## Esempio pratico

```rust
use std::rc::Rc;

#[derive(Debug)]
struct Node {
    name: String,
}

fn main() {
    let root = Rc::new(Node {
        name: String::from("root"),
    });

    let left_owner = Rc::clone(&root);
    let right_owner = Rc::clone(&root);

    println!("{left_owner:?} {right_owner:?}");
}
```

`root`, `left_owner` e `right_owner` condividono ownership dello stesso nodo.

## Varianti

- `Rc<T>`: reference counting non atomico, single-thread.
- `Arc<T>`: reference counting atomico; implementa `Send` e `Sync` quando anche `T` soddisfa i vincoli necessari.
- `Weak<T>`: riferimento debole che non mantiene vivo il valore.
- `Rc<RefCell<T>>`: ownership condivisa e mutabilita runtime single-thread.
- `Arc<Mutex<T>>`: ownership condivisa e mutabilita sincronizzata tra thread.

## Errori comuni

- Usare `Rc<T>` tra thread.
- Pensare che `Rc::clone` cloni il valore interno.
- Creare cicli di `Rc` senza `Weak`, causando memory leak.
- Usare `Arc<T>` per mutare dati senza `Mutex`, `RwLock` o atomics.
- Pensare che `Arc<T>` renda thread-safe un tipo interno che non lo e, per esempio `RefCell<T>`.
- Usare reference counting quando ownership semplice o borrowing bastano.

## Checklist

- Serve davvero ownership condivisa?
- Il codice e single-thread o multi-thread?
- Serve mutare il valore condiviso?
- Potrebbero formarsi cicli? Usa `Weak`.
- `Box<T>` o riferimenti sarebbero piu semplici?

## Collegamenti

- [[Programmazione/Rust/Pagine/Box T|Box T]]
- [[Programmazione/Rust/Pagine/RefCell T|RefCell T]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex T e RwLock T]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Threads|Threads]]

## Fonti

- [Rust Standard Library - Arc](https://doc.rust-lang.org/std/sync/struct.Arc.html)
- [Rust Standard Library - Send](https://doc.rust-lang.org/std/marker/trait.Send.html)
- [Rust Standard Library - Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html)

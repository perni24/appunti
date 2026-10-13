---
date: 2026-07-30
area: Programmazione
topic: Promemoria Rust
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - rust
  - promemoria
  - smart-pointer
aliases:
  - Cheatsheet smart pointer Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Box T]]"
  - "[[Programmazione/Rust/Pagine/Rc T e Arc T]]"
  - "[[Programmazione/Rust/Pagine/RefCell T]]"
title: Rust - Smart pointer
---

# Rust - Smart pointer

## Box

```rust
let value = Box::new(42);
println!("{}", *value);
```

Usato per allocazione su heap, tipi ricorsivi e trait object.

## Rc

```rust
use std::rc::Rc;

let shared = Rc::new(String::from("value"));
let second = Rc::clone(&shared);

println!("{}", Rc::strong_count(&shared));
```

`Rc<T>` e per ownership condivisa nello stesso thread.

## Arc

```rust
use std::sync::Arc;

let shared = Arc::new(String::from("value"));
let second = Arc::clone(&shared);
```

`Arc<T>` e per ownership condivisa tra thread.

## RefCell

```rust
use std::cell::RefCell;

let value = RefCell::new(vec![1, 2]);
value.borrow_mut().push(3);
```

`RefCell<T>` verifica le regole di borrowing a runtime e puo generare panic.

## Rc con RefCell

```rust
use std::{cell::RefCell, rc::Rc};

let shared = Rc::new(RefCell::new(0));
*shared.borrow_mut() += 1;
```

## Arc con Mutex

```rust
use std::sync::{Arc, Mutex};

let shared = Arc::new(Mutex::new(0));

{
    let mut value = shared.lock().expect("mutex poisoned");
    *value += 1;
}
```

## Weak

```rust
let weak = Rc::downgrade(&shared);

if let Some(value) = weak.upgrade() {
    println!("{value:?}");
}
```

Usare `Weak` per riferimenti non proprietari e per interrompere cicli.

## Scelta rapida

| Tipo | Uso |
|---|---|
| `Box<T>` | Singolo proprietario, heap |
| `Rc<T>` | Piu proprietari, singolo thread |
| `Arc<T>` | Piu proprietari, piu thread |
| `RefCell<T>` | Mutabilita interna, singolo thread |
| `Mutex<T>` | Mutabilita sincronizzata |
| `Weak<T>` | Riferimento senza ownership |

## Approfondimento

- [[Programmazione/Rust/Pagine/Box T|Box T]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc T e Arc T]]
- [[Programmazione/Rust/Pagine/RefCell T|RefCell T]]
- [[Programmazione/Rust/Pagine/Cell T|Cell T]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Deref Trait|Deref Trait]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]


## Navigazione

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]

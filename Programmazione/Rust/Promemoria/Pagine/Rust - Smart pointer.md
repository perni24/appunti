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
  - "[[Programmazione/Rust/Pagine/Box T|Box T]]"
  - "[[Programmazione/Rust/Pagine/Rc T e Arc T|Rc T e Arc T]]"
  - "[[Programmazione/Rust/Pagine/RefCell T|RefCell T]]"
title: Rust - Smart pointer
---

# Rust - Smart pointer

Scegli separatamente chi possiede il dato e come viene modificato. Ogni blocco è indipendente e va nel corpo di `fn main()`.

| Esigenza | Scelta rapida |
|---|---|
| Un proprietario, dato su heap | `Box<T>`; utile anche per tipi ricorsivi o `Box<dyn Trait>`. |
| Più proprietari sullo stesso thread | `Rc<T>`; aggiungi `RefCell<T>` per modificare attraverso handle condivisi. |
| Più proprietari tra thread | `Arc<T>` se `T` è `Send + Sync`; per accesso mutabile esclusivo, spesso `Arc<Mutex<T>>`. |
| Osservare senza tenere vivo il dato | `Weak<T>` della famiglia `rc` o `sync`; `upgrade()` può restituire `None`. |

## Un proprietario o più handle

```rust
let mut value = Box::new(41);
*value += 1;
assert_eq!(*value, 42);
```

```rust
use std::rc::Rc;
let owner = Rc::new(String::from("Guida"));
let weak = Rc::downgrade(&owner);
let other = Rc::clone(&owner);
assert!(Rc::ptr_eq(&owner, &other)); // stesso dato, non una copia della String
assert_eq!(Rc::strong_count(&owner), 2);
drop(owner);
assert_eq!(weak.upgrade().as_deref(), Some(&*other));
drop(other);
assert!(weak.upgrade().is_none());
```

Un `Weak` non incrementa il numero di proprietari forti. Usalo, ad esempio, per il collegamento da un figlio al genitore senza creare un ciclo di riferimenti forti.

## Modificare nello stesso thread

```rust
use std::{cell::RefCell, rc::Rc};
let items = Rc::new(RefCell::new(vec![1, 2]));
let other = Rc::clone(&items);
let reader = items.borrow();
assert!(other.try_borrow_mut().is_err()); // reader è ancora attiva
drop(reader);
other.borrow_mut().push(3);
assert_eq!(&*items.borrow(), &[1, 2, 3]);
```

`RefCell` controlla i prestiti a runtime: `borrow_mut()` in conflitto causa panic, `try_borrow_mut()` restituisce un errore. `Rc` da solo non offre accesso mutabile condiviso.

## Condividere tra thread

```rust
use std::{sync::Arc, thread};
let text = Arc::new(String::from("Guida"));
let reader = Arc::clone(&text);
let worker = thread::spawn(move || reader.len());
assert_eq!(worker.join().unwrap(), 5);
assert_eq!(text.as_str(), "Guida");
```

`Arc` rende atomico il conteggio dei riferimenti, non le operazioni su `T`. `Arc<RefCell<T>>` non rende `RefCell` condivisibile fra thread. [Garanzie di Arc](https://doc.rust-lang.org/std/sync/struct.Arc.html#thread-safety).

```rust
use std::{sync::{Arc, Mutex}, thread};
let count = Arc::new(Mutex::new(0));
let other = Arc::clone(&count);
let worker = thread::spawn(move || {
    let mut guard = other.lock().expect("mutex poisoned");
    *guard += 1;
}); // la guardia rilascia il lock a fine blocco
worker.join().expect("worker panicked");
assert_eq!(*count.lock().expect("mutex poisoned"), 1);
```

`Mutex<T>` protegge l'accesso; `Arc` serve qui a condividere la proprietà del mutex. Non tenere una guardia mentre aspetti un thread che deve acquisire lo stesso lock.

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/Box T|Box T]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc T e Arc T]]
- [[Programmazione/Rust/Pagine/RefCell T|RefCell T]]
- [[Programmazione/Rust/Pagine/Cell T|Cell T]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Deref Trait|Deref Trait]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]

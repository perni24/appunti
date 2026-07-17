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
  - "RefCell<T>"
  - "Borrow checking runtime"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Rc T e Arc T]]"
related:
  - "[[Programmazione/Rust/Pagine/Cell T]]"
  - "[[Programmazione/Rust/Pagine/Mutex T e RwLock T]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
---

# RefCell<T>

## Sintesi

`RefCell<T>` permette mutabilita interna in codice single-thread spostando le regole di borrowing da compile time a runtime. Se le regole vengono violate, il programma fa panic.

E utile quando sai che il borrowing e corretto, ma il compilatore non riesce a provarlo staticamente.

## Quando usarlo

- Quando serve modificare un valore dietro un riferimento condiviso.
- Quando costruisci strutture dati con ownership condivisa single-thread, spesso `Rc<RefCell<T>>`.
- Quando fai test o mock che devono registrare chiamate tramite `&self`.
- Quando il modello statico e troppo restrittivo ma la logica resta single-thread.

## Come funziona

```rust
use std::cell::RefCell;

let value = RefCell::new(10);
*value.borrow_mut() += 1;
println!("{}", value.borrow());
```

`borrow()` restituisce `Ref<T>`. `borrow_mut()` restituisce `RefMut<T>`. A runtime valgono le stesse regole:

- molti borrow immutabili;
- oppure un solo borrow mutabile;
- mai entrambi contemporaneamente.

## API / Sintassi

```rust
let cell = RefCell::new(String::from("rust"));

{
    let read = cell.borrow();
    println!("{read}");
}

{
    let mut write = cell.borrow_mut();
    write.push('!');
}
```

Versioni non-panicking:

```rust
if let Ok(mut value) = cell.try_borrow_mut() {
    value.push_str(" ok");
}
```

## Esempio pratico

```rust
use std::cell::RefCell;

struct Logger {
    messages: RefCell<Vec<String>>,
}

impl Logger {
    fn log(&self, message: &str) {
        self.messages.borrow_mut().push(message.to_owned());
    }

    fn count(&self) -> usize {
        self.messages.borrow().len()
    }
}
```

`log` prende `&self`, ma modifica internamente la lista dei messaggi.

## Varianti

- `RefCell<T>`: mutabilita interna single-thread con controllo runtime.
- `Cell<T>`: mutabilita interna per tipi `Copy` o sostituzione intera del valore.
- `Mutex<T>`: mutabilita interna sincronizzata multi-thread.
- `RwLock<T>`: letture multiple o una scrittura in multi-thread.
- `Rc<RefCell<T>>`: ownership condivisa e mutabilita single-thread.

## Errori comuni

- Usare `RefCell<T>` per evitare di progettare ownership e borrowing.
- Tenere un `RefMut` vivo troppo a lungo e causare panic.
- Usare `RefCell<T>` tra thread: non e `Sync`.
- Creare grafi con `Rc<RefCell<T>>` e cicli senza `Weak`.
- Ignorare `try_borrow` quando una violazione a runtime e possibile.

## Checklist

- Il codice e davvero single-thread?
- La mutabilita interna e necessaria o basta `&mut self`?
- I borrow runtime hanno scope piccoli?
- Un panic da borrow violato sarebbe accettabile?
- Serve combinare con `Rc<T>` o basta ownership normale?

## Collegamenti

- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Cell T|Cell T]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc T e Arc T]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex T e RwLock T]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]

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
  - "Box<T>"
  - "Box Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Stack e Heap]]"
  - "[[Programmazione/Rust/Pagine/Deref Trait]]"
related:
  - "[[Programmazione/Rust/Pagine/Rc T e Arc T]]"
  - "[[Programmazione/Rust/Pagine/Drop Trait]]"
  - "[[Programmazione/Rust/Pagine/Pin e Unpin]]"
---

# Box<T>

## Sintesi

`Box<T>` e uno smart pointer che possiede un valore allocato sullo heap. Il `Box` resta un valore con ownership normale: quando esce dallo scope, viene chiamato `drop` e la memoria heap viene liberata.

Si usa quando serve indirection, dimensione nota per tipi ricorsivi, trait object posseduti o spostare un valore grande fuori dallo stack.

## Quando usarlo

- Quando un tipo ricorsivo ha bisogno di indirection, per esempio una lista o un albero.
- Quando vuoi possedere un trait object: `Box<dyn Trait>`.
- Quando vuoi allocare un valore sullo heap con ownership esclusiva.
- Quando vuoi ridurre la dimensione stack di una struct che contiene dati grandi.

## Come funziona

```rust
let value = Box::new(42);
println!("{}", *value);
```

`Box::new` alloca il valore sullo heap e restituisce un puntatore posseduto. L'operatore `*` dereferenzia il box. Grazie a `Deref`, molti accessi avvengono automaticamente.

`Box<T>` non introduce ownership condivisa: c'e un solo proprietario, come per `T`.

## API / Sintassi

Allocazione:

```rust
let boxed: Box<i32> = Box::new(10);
```

Trait object:

```rust
trait Draw {
    fn draw(&self);
}

fn make_widget() -> Box<dyn Draw> {
    todo!()
}
```

Tipo ricorsivo:

```rust
enum List {
    Cons(i32, Box<List>),
    Nil,
}
```

## Esempio pratico

```rust
enum Expr {
    Number(i64),
    Add(Box<Expr>, Box<Expr>),
}

fn eval(expr: &Expr) -> i64 {
    match expr {
        Expr::Number(n) => *n,
        Expr::Add(left, right) => eval(left) + eval(right),
    }
}
```

Senza `Box`, `Expr::Add` conterrebbe direttamente altri `Expr` e il tipo avrebbe dimensione infinita.

## Varianti

- `Box<T>`: ownership esclusiva su heap.
- `Box<dyn Trait>`: trait object posseduto.
- `Pin<Box<T>>`: valore heap che non deve essere mosso.
- `Rc<T>`: ownership condivisa single-thread.
- `Arc<T>`: ownership condivisa con reference counting atomico; la condivisione tra thread richiede che `T` soddisfi i vincoli `Send` e `Sync` necessari.

## Errori comuni

- Usare `Box<T>` pensando di ottenere condivisione.
- Allocare sullo heap senza una ragione concreta.
- Usare `Box<dyn Trait>` quando `impl Trait` o generics sarebbero piu semplici.
- Dimenticare che muovere un `Box<T>` non muove il valore heap, ma muove il puntatore posseduto.
- Confondere `Box<T>` con garbage collection.

## Checklist

- Serve davvero heap allocation?
- Il tipo e ricorsivo o unsized?
- Serve ownership esclusiva o condivisa?
- Il trait object deve essere posseduto?
- `Box<T>` semplifica il modello o nasconde un problema di design?

## Collegamenti

- [[Programmazione/Rust/Pagine/Stack e Heap|Stack e Heap]]
- [[Programmazione/Rust/Pagine/Deref Trait|Deref Trait]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]]

## Fonti

- [Rust Standard Library - Box](https://doc.rust-lang.org/std/boxed/struct.Box.html)
- [Rust Standard Library - Arc](https://doc.rust-lang.org/std/sync/struct.Arc.html)

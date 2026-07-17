---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - compile-time-e-type-level-programming
aliases:
  - "PhantomData"
  - "std::marker::PhantomData"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Lifetimes avanzati]]"
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/Zero-sized types]]"
related:
  - "[[Programmazione/Rust/Pagine/Marker types]]"
  - "[[Programmazione/Rust/Pagine/Typestate pattern]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
---

# PhantomData

## Sintesi

`PhantomData<T>` e un marker zero-sized che comunica al compilatore che un tipo si comporta come se contenesse un valore di tipo `T`, anche se non lo contiene fisicamente.

Serve per modellare ownership, lifetime, variance, drop checking e stati type-level, soprattutto in tipi generici e unsafe abstractions.

## Quando usarlo

- Quando un tipo generico usa `T` solo a livello di tipo.
- Quando una struct contiene raw pointer ma deve comunicare ownership o borrowing.
- Quando vuoi associare un lifetime a una struct senza campo reference reale.
- Quando implementi typestate o marker types.
- Quando costruisci wrapper unsafe e devi guidare drop checker e auto trait.

## Come funziona

```rust
use std::marker::PhantomData;

struct Id<T> {
    raw: u64,
    _marker: PhantomData<T>,
}
```

`Id<User>` e `Id<Order>` diventano tipi distinti anche se a runtime contengono solo `u64`.

`PhantomData<T>` non occupa spazio, ma influenza type checking.

## API / Sintassi

Marker con tipo:

```rust
struct TypedId<T> {
    value: u64,
    _marker: PhantomData<T>,
}
```

Marker con lifetime:

```rust
struct SliceView<'a, T> {
    ptr: *const T,
    len: usize,
    _marker: PhantomData<&'a T>,
}
```

Marker di ownership:

```rust
struct Owning<T> {
    ptr: *mut T,
    _marker: PhantomData<T>,
}
```

## Esempio pratico

```rust
use std::marker::PhantomData;

struct User;
struct Order;

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
struct Id<T> {
    value: u64,
    _marker: PhantomData<T>,
}

impl<T> Id<T> {
    fn new(value: u64) -> Self {
        Self {
            value,
            _marker: PhantomData,
        }
    }
}
```

`Id<User>` non puo essere passato dove serve `Id<Order>`.

## Varianti

- `PhantomData<T>`: simula ownership di `T`.
- `PhantomData<&'a T>`: simula riferimento condiviso.
- `PhantomData<&'a mut T>`: simula riferimento mutabile.
- `PhantomData<fn(T)>` o `fn() -> T`: usato per controllare variance in casi avanzati.
- Marker zero-sized per typestate.

## Errori comuni

- Usare `PhantomData` senza capire l'effetto su variance, drop check e auto trait.
- Dimenticarlo in tipi con raw pointer e lifetime logico.
- Usarlo dove un campo reale sarebbe piu semplice.
- Scegliere la forma sbagliata, per esempio ownership invece di borrow.
- Esporre complessita type-level non necessaria nella API pubblica.

## Checklist

- Il parametro generico appare solo a livello di tipo?
- Devi comunicare ownership o solo borrowing?
- Il lifetime deve essere collegato a dati esterni?
- Il tipo contiene raw pointer?
- La forma scelta di `PhantomData` influenza correttamente `Send`, `Sync` e drop checking?

## Collegamenti

- [[Programmazione/Rust/Pagine/Zero-sized types|Zero-sized types]]
- [[Programmazione/Rust/Pagine/Marker types|Marker types]]
- [[Programmazione/Rust/Pagine/Typestate pattern|Typestate pattern]]
- [[Programmazione/Rust/Pagine/Lifetimes avanzati|Lifetimes avanzati]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]

---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - unsafe-rust-in-profondita
aliases:
  - "Raw pointer"
  - "*const T"
  - "*mut T"
prerequisites:
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/Aliasing rules]]"
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
  - "[[Programmazione/Rust/Pagine/FFI]]"
---

# Raw pointers

## Sintesi

I raw pointer, `*const T` e `*mut T`, sono puntatori non soggetti alle stesse garanzie statiche dei riferimenti Rust. Possono essere null, dangling, non allineati o aliasare in modi che i riferimenti non permettono.

Crearli e safe; dereferenziarli richiede unsafe.

## Quando usarlo

- Quando interagisci con C o API di sistema.
- Quando implementi strutture dati o allocatori a basso livello.
- Quando devi rappresentare puntatori potenzialmente null.
- Quando lavori con memory layout, buffer raw o FFI.

## Come funziona

Creazione:

```rust
let value = 10;
let ptr: *const i32 = &value;
```

Dereferenziazione:

```rust
unsafe {
    println!("{}", *ptr);
}
```

Il compilatore non garantisce che `ptr` sia valido quando lo dereferenzi. Devi garantire manualmente validita, allineamento e aliasing.

## API / Sintassi

Puntatore mutabile:

```rust
let mut value = 10;
let ptr: *mut i32 = &mut value;

unsafe {
    *ptr += 1;
}
```

Null pointer:

```rust
let ptr: *const i32 = std::ptr::null();
```

Pointer arithmetic:

```rust
let array = [1, 2, 3];
let ptr = array.as_ptr();

unsafe {
    let second = *ptr.add(1);
}
```

## Esempio pratico

```rust
fn first_or_null<T>(slice: &[T]) -> *const T {
    if slice.is_empty() {
        std::ptr::null()
    } else {
        slice.as_ptr()
    }
}
```

La funzione restituisce un raw pointer, ma non lo dereferenzia. Chi lo usa deve controllare null e validita.

## Varianti

- `*const T`: puntatore raw per lettura.
- `*mut T`: puntatore raw mutabile.
- `NonNull<T>`: raw pointer non-null, utile in strutture dati unsafe.
- `addr_of!` e `addr_of_mut!`: creazione di puntatori senza creare riferimenti intermedi.
- Puntatori FFI: rappresentano indirizzi passati da C o sistema operativo.

## Errori comuni

- Dereferenziare un puntatore null o dangling.
- Creare riferimenti `&T` da puntatori che violano aliasing o allineamento.
- Usare `add` fuori dall'allocazione valida.
- Confondere `*mut T` con permesso automatico di mutare in sicurezza.
- Tenere puntatori a elementi di un `Vec` dopo riallocazione.

## Checklist

- Il puntatore e non-null se lo dereferenzi?
- Punta a memoria inizializzata e valida per `T`?
- L'indirizzo e correttamente allineato?
- Le regole di aliasing sono rispettate?
- La durata della memoria copre tutto l'uso del puntatore?

## Collegamenti

- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Aliasing rules|Aliasing rules]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/FFI|FFI]]

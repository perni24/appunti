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
  - "unsafe Rust"
  - "Unsafe code Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
related:
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
  - "[[Programmazione/Rust/Pagine/Unsafe abstractions sicure]]"
---

# Unsafe Rust

## Sintesi

`unsafe` in Rust permette di eseguire alcune operazioni che il compilatore non puo verificare completamente. Non disattiva il borrow checker e non rende tutto il blocco “senza regole”: abilita solo cinque capacita specifiche che richiedono garanzie manuali.

L'obiettivo non e scrivere tanto unsafe, ma confinare unsafe in punti piccoli e costruire API sicure attorno a invarianti ben documentate.

## Quando usarlo

- Quando devi dereferenziare raw pointer.
- Quando chiami funzioni unsafe o FFI.
- Quando implementi trait unsafe.
- Quando accedi o modifichi static mut.
- Quando accedi a campi di union.
- Quando costruisci astrazioni a basso livello non esprimibili solo con safe Rust.

## Come funziona

Un blocco unsafe:

```rust
let ptr = &10 as *const i32;

unsafe {
    println!("{}", *ptr);
}
```

Dentro il blocco stai dicendo: “ho verificato manualmente le precondizioni che il compilatore non puo provare”.

Le regole di ownership, aliasing, validita dei riferimenti e assenza di undefined behavior restano valide.

## API / Sintassi

Operazioni abilitate da unsafe:

```rust
unsafe {
    // dereferenziare raw pointer
    // chiamare unsafe fn
    // accedere a static mut
    // implementare/assumere contratti unsafe
    // leggere campi di union
}
```

Funzione unsafe:

```rust
unsafe fn read_unchecked(ptr: *const i32) -> i32 {
    *ptr
}
```

Chiamata:

```rust
let value = unsafe { read_unchecked(&10) };
```

## Esempio pratico

```rust
fn split_at_mut_safe<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T]) {
    assert!(mid <= slice.len());

    let len = slice.len();
    let ptr = slice.as_mut_ptr();

    unsafe {
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}
```

Il blocco unsafe e piccolo. La funzione safe controlla `mid` e costruisce due slice mutabili non sovrapposte.

## Varianti

- Unsafe block: abilita operazioni unsafe localmente.
- Unsafe function: il chiamante deve rispettare un contratto.
- Unsafe trait: implementarlo richiede garantire invarianti non verificabili dal compilatore.
- Unsafe impl: dichiarazione manuale di conformita.
- Safe wrapper: API pubblica sicura che incapsula unsafe interno.

## Errori comuni

- Pensare che unsafe permetta di ignorare le regole di Rust.
- Usare unsafe per aggirare il borrow checker senza una prova.
- Non documentare le precondizioni di una unsafe function.
- Esporre raw pointer quando si puo esporre una API safe.
- Fare blocchi unsafe grandi e difficili da verificare.

## Checklist

- Quale operazione richiede davvero unsafe?
- Le precondizioni sono documentate?
- Il blocco unsafe e il piu piccolo possibile?
- Esistono test e, se utile, verifica con Miri?
- La API pubblica puo restare safe?

## Collegamenti

- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Unsafe functions|Unsafe functions]]
- [[Programmazione/Rust/Pagine/Unsafe traits|Unsafe traits]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/Unsafe abstractions sicure|Unsafe abstractions sicure]]

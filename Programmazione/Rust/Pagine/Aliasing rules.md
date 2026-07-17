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
  - unsafe-rust-in-profondita
aliases:
  - "Aliasing"
  - "Regole di aliasing"
prerequisites:
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
  - "[[Programmazione/Rust/Pagine/Miri]]"
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
---

# Aliasing rules

## Sintesi

Le regole di aliasing stabiliscono quando piu accessi alla stessa memoria possono coesistere. In safe Rust la regola pratica e: molti riferimenti condivisi `&T` oppure un solo riferimento mutabile `&mut T`.

In unsafe Rust puoi creare raw pointer che aggirano il controllo statico, ma devi comunque rispettare le invarianti che rendono validi i riferimenti Rust.

## Quando usarlo

- Quando converti raw pointer in riferimenti.
- Quando costruisci slice da parti raw.
- Quando implementi interior mutability o strutture dati unsafe.
- Quando ottimizzi codice basso livello che accede a memoria condivisa.

## Come funziona

Safe Rust:

```rust
let mut value = 10;
let r = &mut value;
*r += 1;
```

Durante la vita di `r`, non puoi usare altri riferimenti incompatibili a `value`.

Unsafe:

```rust
let mut value = 10;
let p1 = &mut value as *mut i32;
let p2 = &mut value as *mut i32;
```

Creare raw pointer e permesso. Usarli in modo da produrre accessi mutabili aliasati puo violare le regole e causare undefined behavior.

## API / Sintassi

Creare riferimenti da raw pointer:

```rust
unsafe {
    let r: &mut i32 = &mut *ptr;
}
```

Questa operazione richiede garantire:

- puntatore valido;
- allineamento corretto;
- memoria inizializzata;
- nessun aliasing incompatibile;
- lifetime corretto.

## Esempio pratico

```rust
fn split_two<T>(slice: &mut [T]) -> Option<(&mut T, &mut T)> {
    if slice.len() < 2 {
        return None;
    }

    let ptr = slice.as_mut_ptr();

    unsafe {
        Some((&mut *ptr, &mut *ptr.add(1)))
    }
}
```

I due riferimenti puntano a elementi distinti, quindi non aliasano lo stesso valore.

## Varianti

- Aliasing condiviso: piu `&T`.
- Accesso esclusivo: un `&mut T`.
- Raw pointer aliasati: permessi come valori, pericolosi quando usati.
- Interior mutability: aliasing condiviso con controllo interno.
- Atomics e lock: aliasing concorrente sincronizzato.

## Errori comuni

- Creare due `&mut T` allo stesso valore.
- Convertire raw pointer in riferimenti troppo presto.
- Usare puntatori a elementi dopo riallocazione di `Vec`.
- Confondere `UnsafeCell` con permesso generico di ignorare aliasing.
- Fare assunzioni C-like che non valgono per riferimenti Rust.

## Checklist

- Gli accessi puntano alla stessa memoria?
- Esiste un `&mut T` attivo?
- Stai creando riferimenti o solo raw pointer?
- La memoria puo essere riallocata durante l'uso?
- Serve `UnsafeCell`, lock o atomic per mutabilita condivisa?

## Collegamenti

- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Miri|Miri]]

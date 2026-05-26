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
  - "UB"
  - "Undefined behavior"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Aliasing rules]]"
  - "[[Programmazione/Rust/Pagine/Invariants]]"
related:
  - "[[Programmazione/Rust/Pagine/Miri]]"
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment]]"
---

# Undefined behavior

## Sintesi

Undefined behavior, o UB, e comportamento per cui il programma viola le assunzioni fondamentali del compilatore. Dopo UB, il compilatore non deve garantire un risultato sensato: il programma puo sembrare funzionare, crashare o essere ottimizzato in modo inatteso.

Unsafe Rust non deve mai produrre UB, nemmeno se i test sembrano passare.

## Quando usarlo

- Quando valuti codice unsafe.
- Quando dereferenzi raw pointer.
- Quando costruisci riferimenti da memoria raw.
- Quando lavori con layout, FFI, uninitialized memory o aliasing.
- Quando usi Miri per cercare bug di memoria.

## Come funziona

Esempi di UB:

- dereferenziare puntatori null o dangling;
- creare riferimenti non validi;
- violare aliasing di `&mut T`;
- leggere memoria non inizializzata;
- usare valori non validi per il tipo, per esempio `bool` diverso da 0/1;
- accedere fuori dai limiti di una allocazione;
- violare allineamento richiesto.

Esempio:

```rust
let ptr: *const i32 = std::ptr::null();

unsafe {
    // UB
    let _ = *ptr;
}
```

## API / Sintassi

Pattern da evitare:

```rust
unsafe {
    let r: &i32 = &*std::ptr::null();
}
```

Anche creare un riferimento invalido e UB, non solo usarlo dopo.

Controllo con Miri:

```bash
cargo miri test
```

## Esempio pratico

```rust
fn invalid_bool() -> bool {
    unsafe {
        std::mem::transmute::<u8, bool>(2)
    }
}
```

Un `bool` Rust puo avere solo rappresentazioni valide. Creare un valore con rappresentazione invalida e UB.

## Varianti

- UB per puntatori invalidi.
- UB per aliasing.
- UB per memoria non inizializzata.
- UB per layout o allineamento.
- UB per data race.
- UB attraverso FFI se il contratto C/Rust viene violato.

## Errori comuni

- Pensare che UB equivalga solo a crash.
- Giudicare corretto un unsafe block perche “funziona sul mio PC”.
- Creare riferimenti invalidi temporanei.
- Usare `transmute` senza controllare layout e valid values.
- Ignorare data race in codice multithread unsafe.

## Checklist

- Ogni riferimento creato e valido?
- La memoria e inizializzata?
- L'allineamento e corretto?
- Le regole di aliasing sono rispettate?
- Miri riesce a eseguire test significativi sul codice unsafe?

## Collegamenti

- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Aliasing rules|Aliasing rules]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/Miri|Miri]]

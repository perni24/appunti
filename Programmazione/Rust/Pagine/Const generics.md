---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - compile-time-e-type-level-programming
aliases:
  - "Const generics"
  - "Generics const Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/const fn]]"
related:
  - "[[Programmazione/Rust/Pagine/Zero-sized types]]"
  - "[[Programmazione/Rust/Pagine/Typestate pattern]]"
  - "[[Programmazione/Rust/Pagine/PhantomData]]"
---

# Const generics

## Sintesi

I const generics permettono di usare valori costanti come parametri generici di tipi e funzioni. Il caso piu comune e modellare dimensioni note a compile time, per esempio array, buffer e matrici.

Permettono di portare vincoli numerici nel type system senza ricorrere a macro o tipi duplicati.

## Quando usarlo

- Quando la dimensione fa parte del tipo.
- Quando vuoi evitare errori tra buffer di dimensioni diverse.
- Quando implementi strutture dati con capacita fissa.
- Quando vuoi specializzare codice su valori compile-time.

## Come funziona

```rust
struct Buffer<const N: usize> {
    data: [u8; N],
}
```

`Buffer<16>` e `Buffer<32>` sono tipi diversi.

```rust
let a = Buffer::<16> { data: [0; 16] };
let b = Buffer::<32> { data: [0; 32] };
```

Il parametro `N` e disponibile nella definizione del tipo.

## API / Sintassi

Funzione generica su dimensione:

```rust
fn first<const N: usize>(items: [i32; N]) -> Option<i32> {
    items.first().copied()
}
```

Impl:

```rust
impl<const N: usize> Buffer<N> {
    fn len(&self) -> usize {
        N
    }
}
```

Più parametri:

```rust
struct Matrix<T, const R: usize, const C: usize> {
    data: [[T; C]; R],
}
```

## Esempio pratico

```rust
struct FixedStr<const N: usize> {
    bytes: [u8; N],
}

impl<const N: usize> FixedStr<N> {
    fn as_bytes(&self) -> &[u8; N] {
        &self.bytes
    }
}
```

La dimensione e parte del tipo e viene controllata dal compilatore.

## Varianti

- Parametri const `usize`: dimensioni e capacita.
- Parametri const booleani o interi dove supportati.
- Array `[T; N]`.
- Tipi con dimensioni multiple: matrici, vettori matematici.
- Pattern type-level combinati con marker types.

## Errori comuni

- Usare const generics per configurazioni che dovrebbero essere runtime.
- Produrre troppi monomorfismi con molti valori diversi.
- Tentare calcoli const complessi non supportati nel tipo.
- Rendere API pubbliche troppo rigide sulla dimensione.
- Confondere controllo di dimensione con validazione contenuto.

## Checklist

- Il valore deve essere parte del tipo?
- La dimensione e nota a compile time?
- Quanti valori diversi genereranno monomorfizzazione?
- Un parametro runtime sarebbe piu flessibile?
- Il vincolo migliora sicurezza o complica l'API?

## Collegamenti

- [[Programmazione/Rust/Pagine/Generics|Generics]]
- [[Programmazione/Rust/Pagine/const fn|const fn]]
- [[Programmazione/Rust/Pagine/Zero-sized types|Zero-sized types]]
- [[Programmazione/Rust/Pagine/Typestate pattern|Typestate pattern]]
- [[Programmazione/Rust/Pagine/PhantomData|PhantomData]]

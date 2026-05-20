---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags:
  - programmazione
  - rust
  - tipi
aliases: []
prerequisites: []
related: []
---

# Tipi di dato primitivi

## Sintesi

I tipi primitivi di Rust sono i mattoni base del linguaggio: numeri, booleani, caratteri, tuple, array, slice e riferimenti. Rust e staticamente tipizzato: ogni valore ha un tipo noto a compile-time.

## Quando usarlo

- Quando devi scegliere il tipo corretto per dati semplici.
- Quando vuoi capire inferenza e annotazioni di tipo.
- Quando lavori con memoria, array, slice e conversioni numeriche.

## Come funziona

Rust inferisce molti tipi, ma richiede precisione quando ci sono ambiguita. I tipi primitivi hanno dimensioni definite, soprattutto per interi e float. Questo rende prevedibili memoria, overflow e interazione con API di sistema.

## API / Sintassi

```rust
let active: bool = true;
let letter: char = 'R';
let count: u32 = 42;
let temperature: f64 = 21.5;
let pair: (i32, bool) = (10, true);
let values: [i32; 3] = [1, 2, 3];
```

Tipi numerici principali:

- Interi signed: `i8`, `i16`, `i32`, `i64`, `i128`, `isize`.
- Interi unsigned: `u8`, `u16`, `u32`, `u64`, `u128`, `usize`.
- Floating point: `f32`, `f64`.

## Esempio pratico

```rust
fn main() {
    let numbers = [10, 20, 30];
    let first = numbers[0];
    let len: usize = numbers.len();

    println!("Primo valore: {first}, lunghezza: {len}");
}
```

`usize` e il tipo usato per indici e dimensioni perche dipende dall'architettura della macchina.

## Varianti

- Tuple: raccolgono valori di tipi diversi e dimensione fissa.
- Array: raccolgono valori dello stesso tipo e dimensione fissa.
- Slice: vista dinamica su una sequenza, come `&[T]`.
- String literal: `&str`, non `String`.

## Errori comuni

- Confondere `char` con byte: un `char` Rust rappresenta un valore Unicode scalare.
- Usare `usize` per dati di dominio solo perche e comodo.
- Confondere array `[T; N]` e slice `&[T]`.
- Aspettarsi conversioni numeriche implicite: Rust richiede cast o conversioni esplicite.

## Checklist

- Usa interi signed solo se servono valori negativi.
- Usa `usize` per indici e lunghezze.
- Usa `f64` come default per floating point se non hai vincoli specifici.
- Preferisci slice `&[T]` nei parametri quando non serve possedere l'array.

## Collegamenti

- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe: String e &str]]
- [[Programmazione/Rust/Pagine/Slices|Slices]]
- [[Programmazione/Rust/Pagine/Stack e Heap|Stack e Heap]]


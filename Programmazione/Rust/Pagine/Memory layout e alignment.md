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
  - rust-di-sistema
aliases:
  - "Memory layout"
  - "Alignment"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Stack e Heap]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/FFI]]"
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
  - "[[Programmazione/Rust/Pagine/Allocator]]"
---

# Memory layout e alignment

## Sintesi

Memory layout indica come un tipo e rappresentato in memoria: ordine dei campi, padding, dimensione e allineamento. Alignment indica a quali indirizzi un valore puo essere letto o scritto correttamente.

In safe Rust questi dettagli sono spesso astratti. Diventano critici con FFI, unsafe, serializzazione binaria, allocator e performance.

## Quando usarlo

- Quando passi struct Rust a C.
- Quando lavori con raw pointer o transmute.
- Quando ottimizzi memoria e cache locality.
- Quando implementi allocator, parser binari o strutture dati unsafe.

## Come funziona

Dimensione e allineamento:

```rust
let size = std::mem::size_of::<u64>();
let align = std::mem::align_of::<u64>();
```

Rust non garantisce layout dei campi per `repr(Rust)`. Il compilatore puo riordinare/ottimizzare secondo le regole del linguaggio.

Per layout compatibile C:

```rust
#[repr(C)]
struct Header {
    len: u32,
    tag: u16,
}
```

## API / Sintassi

Rappresentazioni:

```rust
#[repr(C)]
struct CStruct {
    a: u32,
    b: u8,
}

#[repr(transparent)]
struct UserId(u64);

#[repr(u8)]
enum Tag {
    A = 1,
    B = 2,
}
```

Allineamento custom:

```rust
#[repr(align(64))]
struct CacheLine([u8; 64]);
```

## Esempio pratico

```rust
#[repr(C)]
struct PacketHeader {
    kind: u16,
    len: u16,
}

fn header_size() -> usize {
    std::mem::size_of::<PacketHeader>()
}
```

`repr(C)` rende il layout adatto a un confine FFI o protocollo che richiede compatibilita C, ma non sostituisce validazione di endianess e padding.

## Varianti

- `repr(Rust)`: default, non stabile per FFI.
- `repr(C)`: layout compatibile C.
- `repr(transparent)`: wrapper con stesso layout del campo principale.
- `repr(packed)`: riduce padding ma puo creare accessi non allineati.
- `repr(align(N))`: aumenta allineamento.

## Errori comuni

- Usare `transmute` tra tipi con layout non garantito.
- Assumere ordine dei campi in `repr(Rust)`.
- Leggere campi packed tramite riferimenti non allineati.
- Confondere layout con formato di serializzazione stabile.
- Ignorare endianess nei dati binari.

## Checklist

- Il tipo attraversa FFI?
- Serve `repr(C)` o `repr(transparent)`?
- Ci sono accessi potenzialmente non allineati?
- Padding ed endianess sono gestiti?
- Puoi usare parsing esplicito invece di reinterpretare memoria?

## Collegamenti

- [[Programmazione/Rust/Pagine/FFI|FFI]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/Allocator|Allocator]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]

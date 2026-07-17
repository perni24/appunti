---
date: 2026-05-27
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
  - embedded
aliases:
  - "no_std"
  - "#![no_std]"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/Allocator]]"
related:
  - "[[Programmazione/Rust/Pagine/Embedded Rust]]"
  - "[[Programmazione/Rust/Pagine/Allocator]]"
  - "[[Programmazione/Rust/Pagine/Cargo features]]"
  - "[[Programmazione/Rust/Pagine/embedded-hal]]"
  - "[[Programmazione/Rust/Pagine/cortex-m]]"
---

# no_std

## Sintesi

`no_std` indica che un crate non dipende dalla standard library `std`, ma solo da `core` e, se disponibile, `alloc`. Serve in ambienti senza sistema operativo, embedded, kernel, bootloader o contesti con runtime limitato.

`no_std` non significa “niente Rust moderno”: ownership, trait, generics, enum e molte API di `core` restano disponibili.

## Quando usarlo

- In embedded bare-metal.
- In kernel, bootloader o firmware.
- Quando vuoi una libreria utilizzabile anche senza OS.
- Quando vuoi rendere opzionale la dipendenza da `std` tramite feature.

## Come funziona

All'inizio del crate:

```rust
#![no_std]
```

`std` non e disponibile. Puoi usare `core`:

```rust
use core::fmt;
```

Se hai un allocator, puoi usare `alloc`:

```rust
extern crate alloc;
use alloc::vec::Vec;
```

## API / Sintassi

Feature `std` opzionale:

```toml
[features]
default = ["std"]
std = []
```

Nel codice:

```rust
#![cfg_attr(not(feature = "std"), no_std)]
```

Alloc opzionale:

```rust
#[cfg(feature = "alloc")]
extern crate alloc;
```

## Esempio pratico

```rust
#![cfg_attr(not(feature = "std"), no_std)]

pub fn checksum(bytes: &[u8]) -> u8 {
    bytes.iter().fold(0, |acc, b| acc.wrapping_add(*b))
}
```

Questa funzione lavora solo con slice e tipi primitivi, quindi non ha bisogno di `std`.

## Varianti

- `core`: API fondamentali senza allocazione.
- `alloc`: tipi heap come `Vec`, `Box`, `String` se esiste allocator.
- `std`: include OS, I/O, thread, filesystem e altro.
- Crate dual-mode: supporta `std` e `no_std`.
- Embedded HAL ecosystem.

## Errori comuni

- Usare `Vec` o `String` senza `alloc`.
- Dipendere indirettamente da crate che richiedono `std`.
- Usare feature default che abilitano `std` senza accorgersene.
- Confondere `no_std` con assenza di panic handler o runtime.
- Non testare build `--no-default-features`.

## Checklist

- Il crate deve funzionare senza sistema operativo?
- Serve heap allocation?
- Le feature `std`/`alloc` sono chiare?
- La CI testa `--no-default-features`?
- Le dipendenze supportano davvero `no_std`?

## Collegamenti

- [[Programmazione/Rust/Pagine/Embedded Rust|Embedded Rust]]
- [[Programmazione/Rust/Pagine/Allocator|Allocator]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]
- [[Programmazione/Rust/Pagine/Feature flags ben progettate|Feature flags ben progettate]]
- [[Programmazione/Rust/Pagine/embedded-hal|embedded-hal]]
- [[Programmazione/Rust/Pagine/cortex-m|cortex-m]]

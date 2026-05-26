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
  - rust-di-sistema
aliases:
  - "Allocator Rust"
  - "Global allocator"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Stack e Heap]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/no_std]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
---

# Allocator

## Sintesi

Un allocator gestisce allocazioni e deallocazioni di memoria heap. In Rust tipi come `Box<T>`, `Vec<T>`, `String`, `Arc<T>` usano un allocator per ottenere memoria dinamica.

Nella maggior parte dei progetti si usa l'allocator globale predefinito. In contesti di sistema, embedded, performance o no_std puo servire configurarlo o sostituirlo.

## Quando usarlo

- Quando devi controllare memoria heap in embedded o no_std.
- Quando misuri overhead di allocazione.
- Quando vuoi usare un allocator alternativo.
- Quando stai costruendo runtime, strutture dati a basso livello o librerie performance-critical.

## Come funziona

Global allocator:

```rust
#[global_allocator]
static ALLOC: std::alloc::System = std::alloc::System;
```

Le allocazioni standard passano dall'allocator globale. La deallocazione deve usare lo stesso layout e lo stesso allocator con cui la memoria e stata allocata.

## API / Sintassi

API basso livello:

```rust
use std::alloc::{alloc, dealloc, Layout};

unsafe {
    let layout = Layout::new::<u64>();
    let ptr = alloc(layout);
    dealloc(ptr, layout);
}
```

Questa API e unsafe perche devi garantire layout corretto, non-null quando richiesto, inizializzazione e deallocazione esatta.

## Esempio pratico

```rust
#[global_allocator]
static GLOBAL: std::alloc::System = std::alloc::System;

fn allocate_vec() -> Vec<u8> {
    Vec::with_capacity(1024)
}
```

Il `Vec` usa l'allocator globale per riservare il buffer.

## Varianti

- Allocator globale predefinito.
- `std::alloc::System`.
- Allocator custom con `GlobalAlloc`.
- Allocator per embedded/no_std.
- Strategie arena, bump allocation e pool allocation.

## Errori comuni

- Deallocare con layout diverso da quello di allocazione.
- Usare memoria non inizializzata come se fosse valida.
- Confondere capacita e lunghezza di `Vec`.
- Cambiare allocator senza misurare.
- Implementare allocator custom senza test severi.

## Checklist

- Serve davvero controllare l'allocator?
- Il layout di allocazione/deallocazione coincide?
- Chi possiede la memoria?
- Esistono test con Miri o strumenti runtime?
- Il beneficio e misurato rispetto all'allocator standard?

## Collegamenti

- [[Programmazione/Rust/Pagine/Stack e Heap|Stack e Heap]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Memory layout e alignment|Memory layout e alignment]]
- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]

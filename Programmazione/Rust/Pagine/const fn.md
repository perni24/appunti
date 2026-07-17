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
  - "const fn"
  - "Funzioni const Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/const e static]]"
  - "[[Programmazione/Rust/Pagine/Funzioni]]"
related:
  - "[[Programmazione/Rust/Pagine/Const generics]]"
  - "[[Programmazione/Rust/Pagine/Default]]"
  - "[[Programmazione/Rust/Pagine/Zero-sized types]]"
---

# const fn

## Sintesi

Una `const fn` e una funzione che puo essere valutata a compile time quando viene chiamata in un contesto const. La stessa funzione puo anche essere chiamata a runtime.

Serve per costruire valori costanti in modo controllato, validare invarianti semplici e riusare logica tra inizializzazione compile-time e runtime.

## Quando usarlo

- Quando devi inizializzare una `const` o una `static` con logica non banale.
- Quando vuoi costruttori disponibili in contesti compile-time.
- Quando un tipo ha invarianti controllabili senza allocazione o I/O.
- Quando lavori con const generics e dimensioni calcolate.

## Come funziona

```rust
const fn double(n: usize) -> usize {
    n * 2
}

const SIZE: usize = double(8);
```

Il compilatore valuta `double(8)` durante la compilazione. La funzione resta utilizzabile anche a runtime:

```rust
let runtime = double(10);
```

## API / Sintassi

Costruttore const:

```rust
struct Port(u16);

impl Port {
    pub const fn new(value: u16) -> Self {
        Self(value)
    }
}

const HTTP: Port = Port::new(80);
```

Uso con array:

```rust
const fn capacity(base: usize) -> usize {
    base * 2
}

let buffer = [0u8; capacity(512)];
```

## Esempio pratico

```rust
struct Limits {
    max_connections: usize,
}

impl Limits {
    pub const fn new(max_connections: usize) -> Self {
        Self { max_connections }
    }
}

const DEFAULT_LIMITS: Limits = Limits::new(100);
```

Il tipo ha un costruttore usabile per configurazione statica.

## Varianti

- `const fn`: funzione valutabile in const context.
- `const` associata: valore legato a un tipo.
- `const` generics: parametri const nella firma dei tipi.
- `const` block: blocco valutato come costante.
- Costruttori `const` per tipi wrapper.

## Errori comuni

- Pensare che una `const fn` venga sempre eseguita a compile time.
- Provare a fare I/O, allocazione arbitraria o operazioni non ammesse in const context.
- Usare `panic!` in contesti const senza valutare messaggi e limiti.
- Rendere `const fn` una promessa pubblica senza considerare compatibilita.
- Confondere `const fn` con ottimizzazione automatica.

## Checklist

- La funzione deve essere chiamabile in un const context?
- La logica e compatibile con valutazione compile-time?
- Il costruttore mantiene invarianti del tipo?
- Serve davvero `const fn` nella API pubblica?
- Il valore deve essere noto a compile time o puo essere runtime?

## Collegamenti

- [[Programmazione/Rust/Pagine/const e static|const e static]]
- [[Programmazione/Rust/Pagine/Const generics|Const generics]]
- [[Programmazione/Rust/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Rust/Pagine/Default|Default]]
- [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]

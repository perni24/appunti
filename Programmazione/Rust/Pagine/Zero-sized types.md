---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - compile-time-e-type-level-programming
aliases:
  - "ZST"
  - "Zero-sized types"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Enums]]"
related:
  - "[[Programmazione/Rust/Pagine/PhantomData]]"
  - "[[Programmazione/Rust/Pagine/Marker types]]"
  - "[[Programmazione/Rust/Pagine/Typestate pattern]]"
---

# Zero-sized types

## Sintesi

Gli zero-sized types, o ZST, sono tipi che hanno dimensione zero a runtime. Non occupano spazio per valore, ma possono trasportare informazione a livello di tipo.

Sono usati per marker, stati type-level, ottimizzazioni e API che vogliono distinguere concetti senza costo runtime.

## Quando usarlo

- Quando ti serve un marker type senza dati.
- Quando vuoi rappresentare stati nel type system.
- Quando vuoi implementare trait per un tipo simbolico.
- Quando vuoi usare `PhantomData` o typestate.

## Come funziona

```rust
struct Marker;

fn main() {
    println!("{}", std::mem::size_of::<Marker>());
}
```

`Marker` ha dimensione zero. Anche tuple vuote `()` e alcuni enum/struct senza campi possono essere ZST.

Un valore ZST puo esistere logicamente senza occupare memoria significativa.

## API / Sintassi

Unit struct:

```rust
struct Connected;
struct Disconnected;
```

Uso come marker:

```rust
struct Client<State> {
    endpoint: String,
    _state: std::marker::PhantomData<State>,
}
```

Verifica dimensione:

```rust
assert_eq!(std::mem::size_of::<Connected>(), 0);
```

## Esempio pratico

```rust
struct Json;
struct Toml;

trait Format {
    fn name() -> &'static str;
}

impl Format for Json {
    fn name() -> &'static str {
        "json"
    }
}

impl Format for Toml {
    fn name() -> &'static str {
        "toml"
    }
}
```

`Json` e `Toml` non contengono dati, ma distinguono formati a compile time.

## Varianti

- Unit type: `()`.
- Unit struct: `struct Marker;`.
- `PhantomData<T>`.
- Marker state per typestate.
- Empty enum: tipo non abitabile, usato in casi avanzati.

## Errori comuni

- Pensare che zero-sized significhi inutile.
- Usare ZST quando un enum runtime sarebbe piu chiaro.
- Esporre marker pubblici senza documentare lo scopo.
- Assumere indirizzi unici per valori ZST.
- Rendere generics complessi per evitare un semplice campo runtime.

## Checklist

- Il tipo deve trasportare informazione solo a compile time?
- Serve distinguere stati o ruoli?
- Il marker e documentato?
- Una enum runtime sarebbe piu semplice?
- Il tipo ZST interagisce correttamente con `PhantomData` e trait?

## Collegamenti

- [[Programmazione/Rust/Pagine/Marker types|Marker types]]
- [[Programmazione/Rust/Pagine/PhantomData|PhantomData]]
- [[Programmazione/Rust/Pagine/Typestate pattern|Typestate pattern]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]
- [[Programmazione/Rust/Pagine/Enums|Enums]]

---
date: 2026-05-21
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - astrazione-e-generici
aliases:
  - "Derive Rust"
  - "Trait derivati"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Enums]]"
related:
  - "[[Programmazione/Rust/Pagine/Derive macros]]"
  - "[[Programmazione/Rust/Pagine/Copy e Clone]]"
  - "[[Programmazione/Rust/Pagine/Display e Debug]]"
---

# Derive traits

## Sintesi

`derive` genera automaticamente implementazioni di trait comuni per struct ed enum. Riduce codice ripetitivo e rende esplicite capacita standard come `Debug`, `Clone`, `Copy`, `PartialEq`, `Eq`, `PartialOrd`, `Ord`, `Hash` e `Default`.

Il derive funziona solo se tutti i campi supportano il trait richiesto.

## Quando usarlo

- Quando vuoi stampare un tipo in debug con `{:?}`.
- Quando vuoi confrontare valori con `==`.
- Quando vuoi clonare o copiare tipi semplici.
- Quando vuoi usare un tipo come chiave in `HashMap` o `BTreeMap`.
- Quando vuoi una implementazione standard e prevedibile.

## Come funziona

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
struct UserId(u64);
```

Il compilatore genera implementazioni equivalenti a quelle manuali per i trait indicati.

Se un campo non supporta il trait, il derive fallisce:

```rust
#[derive(Clone)]
struct Wrapper<T> {
    value: T,
}
```

`Wrapper<T>` implementa `Clone` solo quando `T: Clone`.

## API / Sintassi

Trait standard derivabili:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Default)]
struct Point {
    x: i32,
    y: i32,
}
```

Enum:

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Stato {
    Aperto,
    Chiuso,
}
```

## Esempio pratico

```rust
use std::collections::HashSet;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct UserId(u64);

fn main() {
    let mut seen = HashSet::new();
    seen.insert(UserId(1));
    seen.insert(UserId(1));

    println!("{seen:?}");
}
```

`Eq` e `Hash` permettono di usare `UserId` in `HashSet`. `Debug` permette stampa diagnostica.

## Varianti

- Derive standard del compilatore.
- Derive procedural macros da crate esterne, per esempio `serde::Serialize`.
- Implementazione manuale quando il comportamento standard non basta.
- `Default` per creare valori iniziali.
- `Copy` piu `Clone` per tipi piccoli senza risorse possedute.

## Errori comuni

- Derivare `Copy` su un tipo che concettualmente rappresenta una risorsa unica.
- Derivare `Ord` aspettandosi un ordinamento di dominio diverso dall'ordine dei campi.
- Dimenticare `Hash` quando un tipo deve stare in `HashMap` o `HashSet`.
- Usare `Debug` come formato utente stabile.
- Derivare troppi trait pubblici e vincolare inutilmente la API.

## Checklist

- Il comportamento generato e quello giusto per il dominio?
- Tutti i campi supportano il trait?
- Il tipo e parte della API pubblica?
- `Debug` basta o serve `Display` manuale?
- `Copy` e semanticamente corretto?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Derive macros|Derive macros]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/Display e Debug|Display e Debug]]
- [[Programmazione/Rust/Pagine/HashMap e HashSet|HashMap e HashSet]]

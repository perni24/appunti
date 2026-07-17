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
  - "Generics Rust"
  - "Tipi generici Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Funzioni]]"
related:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
  - "[[Programmazione/Rust/Pagine/Zero-cost abstractions]]"
---

# Generics

## Sintesi

I generics permettono di scrivere funzioni, struct, enum e trait parametrizzati su uno o piu tipi. Servono a riusare logica senza perdere controllo statico sui tipi.

In Rust i generics vengono normalmente monomorfizzati: il compilatore genera versioni concrete del codice per i tipi usati. Questo consente astrazione senza dispatch dinamico di default.

## Quando usarlo

- Quando la stessa logica funziona per piu tipi.
- Quando una struct deve contenere un valore di tipo variabile.
- Quando una funzione deve accettare tipi diversi con lo stesso comportamento.
- Quando vuoi evitare `enum` o `dyn Trait` se il tipo puo restare noto a compile time.

## Come funziona

Un parametro generico si dichiara tra `<...>`:

```rust
fn identita<T>(valore: T) -> T {
    valore
}
```

`T` e un tipo scelto dal chiamante o inferito dal compilatore.

```rust
let a = identita(10);
let b = identita(String::from("rust"));
```

Senza vincoli, il codice puo solo muovere, restituire o conservare `T`. Per usare metodi o operatori servono trait bounds.

## API / Sintassi

Struct generica:

```rust
struct Wrapper<T> {
    value: T,
}

impl<T> Wrapper<T> {
    fn new(value: T) -> Self {
        Self { value }
    }
}
```

Enum generico:

```rust
enum Maybe<T> {
    Some(T),
    None,
}
```

Funzione con piu tipi:

```rust
fn coppia<A, B>(a: A, b: B) -> (A, B) {
    (a, b)
}
```

## Esempio pratico

```rust
struct CacheEntry<K, V> {
    key: K,
    value: V,
}

impl<K, V> CacheEntry<K, V> {
    fn new(key: K, value: V) -> Self {
        Self { key, value }
    }

    fn into_parts(self) -> (K, V) {
        (self.key, self.value)
    }
}

fn main() {
    let entry = CacheEntry::new("user:1", String::from("Luca"));
    let (key, value) = entry.into_parts();
    println!("{key} -> {value}");
}
```

La struct non sa nulla dei tipi concreti di chiave e valore, ma mantiene ownership e tipo statico.

## Varianti

- Funzioni generiche: `fn f<T>(x: T)`.
- Struct generiche: `struct Nome<T>`.
- Enum generici: `enum Nome<T>`.
- Trait generici: `trait Parser<T>`.
- Generics con lifetime: `struct View<'a, T>`.
- Const generics: parametri costanti, per esempio dimensioni di array.

## Errori comuni

- Aggiungere generics prima che servano davvero.
- Dimenticare trait bounds quando si chiamano metodi su `T`.
- Usare lo stesso parametro `T` quando servono due tipi indipendenti.
- Confondere generics con trait objects: i primi sono statici, i secondi dinamici.
- Rendere la firma troppo complessa per evitare una struct o un trait dedicato.

## Checklist

- La logica e davvero indipendente dal tipo concreto?
- Servono vincoli sul comportamento di `T`?
- I parametri generici hanno nomi leggibili?
- Il tipo deve essere noto a compile time o serve dispatch dinamico?
- L'astrazione migliora il codice o lo rende solo piu generico?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Const generics|Const generics]]
- [[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch|Static dispatch vs dynamic dispatch]]
- [[Programmazione/Rust/Pagine/Zero-cost abstractions|Zero-cost abstractions]]

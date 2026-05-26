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
  - "Newtype"
  - "Newtype pattern"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Tuple structs]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Marker types]]"
  - "[[Programmazione/Rust/Pagine/Typestate pattern]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
---

# Newtype pattern

## Sintesi

Il newtype pattern consiste nel creare un tipo wrapper, spesso una tuple struct a un campo, intorno a un tipo esistente. Serve a dare significato di dominio, impedire confusione tra valori simili e controllare quali trait/metodi esporre.

Il costo runtime e normalmente nullo o trascurabile, ma il controllo di tipo aumenta.

## Quando usarlo

- Quando due valori hanno stessa rappresentazione ma significato diverso.
- Quando vuoi validare un valore prima di costruire il tipo.
- Quando vuoi implementare trait per un tipo esterno rispettando la orphan rule.
- Quando vuoi nascondere dettagli interni della rappresentazione.

## Come funziona

```rust
struct UserId(u64);
struct OrderId(u64);
```

`UserId` e `OrderId` sono incompatibili anche se entrambi contengono `u64`.

```rust
fn load_user(id: UserId) {}
```

Non puoi passare per errore un `OrderId`.

## API / Sintassi

Con costruttore:

```rust
#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
struct UserId(u64);

impl UserId {
    fn new(value: u64) -> Self {
        Self(value)
    }

    fn get(self) -> u64 {
        self.0
    }
}
```

Con validazione:

```rust
struct NonEmptyString(String);

impl NonEmptyString {
    fn new(value: String) -> Option<Self> {
        (!value.is_empty()).then_some(Self(value))
    }
}
```

## Esempio pratico

```rust
#[derive(Debug, Copy, Clone, PartialEq, Eq)]
struct Celsius(i32);

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
struct Fahrenheit(i32);

fn convert(value: Celsius) -> Fahrenheit {
    Fahrenheit(value.0 * 9 / 5 + 32)
}
```

Il tipo impedisce di confondere unita di misura.

## Varianti

- Tuple struct a un campo.
- Wrapper con campo privato e costruttore.
- Newtype generico con marker: `Id<T>`.
- Newtype per trait implementation.
- Newtype con `Deref`, da usare con cautela.

## Errori comuni

- Rendere il campo pubblico e perdere controllo sugli invarianti.
- Implementare `Deref` per simulare ereditarieta.
- Non derivare trait utili come `Debug`, `Eq`, `Hash`.
- Usare alias `type` quando serve distinzione di tipo.
- Creare troppi wrapper senza vantaggio pratico.

## Checklist

- Il dominio ha concetti diversi con stessa rappresentazione?
- Serve validazione alla costruzione?
- Il campo interno deve restare privato?
- Quali trait devono essere esposti?
- Un alias `type` sarebbe insufficiente?

## Collegamenti

- [[Programmazione/Rust/Pagine/Tuple structs|Tuple structs]]
- [[Programmazione/Rust/Pagine/Marker types|Marker types]]
- [[Programmazione/Rust/Pagine/Typestate pattern|Typestate pattern]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Deref Trait|Deref Trait]]

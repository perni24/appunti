---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - api-design-idiomatico
aliases:
  - "Newtype"
  - "Newtype pattern"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Tuple structs]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Public API design]]"
  - "[[Programmazione/Rust/Pagine/Marker types]]"
  - "[[Programmazione/Rust/Pagine/Typestate pattern]]"
  - "[[Programmazione/Rust/Pagine/Deref Trait]]"
---

# Newtype pattern

## Sintesi

Il **newtype pattern** consiste nel creare un tipo wrapper, spesso una tuple struct a un campo, intorno a un tipo esistente. Serve a dare significato di dominio, impedire confusione tra valori simili e controllare quali trait e metodi esporre.

Il costo runtime e normalmente nullo o trascurabile, mentre il controllo di tipo aumenta. In API pubbliche e uno strumento importante per proteggere invarianti senza esporre dettagli interni.

## Quando usarlo

Usa un newtype quando:

- due valori hanno stessa rappresentazione ma significato diverso;
- vuoi validare un valore prima di costruirlo;
- vuoi implementare trait per un tipo esterno rispettando la orphan rule;
- vuoi nascondere la rappresentazione interna;
- vuoi evitare parametri primitivi ambigui;
- vuoi rendere il dominio piu leggibile.

Se ti serve solo un nome alternativo senza nuova distinzione di tipo, un alias `type` puo bastare.

## Come funziona

Una tuple struct a un campo crea un tipo distinto:

```rust
pub struct UserId(u64);
pub struct OrderId(u64);
```

`UserId` e `OrderId` sono incompatibili anche se contengono entrambi un `u64`.

```rust
fn load_user(id: UserId) {}
```

Non puoi passare un `OrderId` per errore.

Se il campo e privato, gli utenti devono passare dai costruttori pubblici e quindi rispettare gli invarianti.

## API / Sintassi

Con costruttore:

```rust
#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub struct UserId(u64);

impl UserId {
    pub fn new(value: u64) -> Self {
        Self(value)
    }

    pub fn get(self) -> u64 {
        self.0
    }
}
```

Con validazione:

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NonEmptyString(String);

impl NonEmptyString {
    pub fn new(value: impl Into<String>) -> Option<Self> {
        let value = value.into();
        (!value.is_empty()).then_some(Self(value))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}
```

## Esempio pratico

Unita di misura:

```rust
#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub struct Celsius(i32);

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub struct Fahrenheit(i32);

pub fn convert(value: Celsius) -> Fahrenheit {
    Fahrenheit(value.0 * 9 / 5 + 32)
}
```

Il tipo impedisce di confondere Celsius e Fahrenheit, anche se entrambi sono rappresentati da `i32`.

## Varianti

- **Tuple struct a un campo**: forma piu comune.
- **Campo privato con costruttore**: protegge invarianti.
- **Newtype generico**: per esempio `Id<T>`.
- **Newtype per trait implementation**: aggira la orphan rule in modo pulito.
- **Newtype con marker**: collega tipo e contesto.
- **Newtype con `Deref`**: possibile, ma da usare con cautela.

## Errori comuni

- Rendere il campo pubblico e perdere controllo sugli invarianti.
- Implementare `Deref` per simulare ereditarieta.
- Non derivare trait utili come `Debug`, `Eq`, `Hash`.
- Usare alias `type` quando serve distinzione di tipo.
- Creare troppi wrapper senza vantaggio pratico.
- Esporre il tipo interno con conversioni troppo permissive.
- Non documentare cosa garantisce il newtype.

## Checklist

- Il dominio ha concetti diversi con stessa rappresentazione?
- Serve validazione alla costruzione?
- Il campo interno deve restare privato?
- Quali trait devono essere esposti?
- Un alias `type` sarebbe insufficiente?
- Le conversioni preservano invarianti?
- Il newtype migliora davvero l'API?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Tuple structs]]
- [[Programmazione/Rust/Pagine/Marker types]]
- [[Programmazione/Rust/Pagine/Typestate pattern]]
- [[Programmazione/Rust/Pagine/Public API design]]
- [[Programmazione/Rust/Pagine/Deref Trait]]
- [[Programmazione/Rust/Pagine/Derive traits]]

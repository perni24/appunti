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
  - "Marker types"
  - "Tipi marker"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Zero-sized types]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/PhantomData]]"
related:
  - "[[Programmazione/Rust/Pagine/Typestate pattern]]"
  - "[[Programmazione/Rust/Pagine/Newtype pattern]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
---

# Marker types

## Sintesi

I marker types sono tipi usati per trasportare informazione a livello di tipo, spesso senza dati runtime. Servono a distinguere stati, ruoli, unita di misura, ownership logica o capacita.

In Rust si combinano spesso con zero-sized types, `PhantomData` e trait marker.

## Quando usarlo

- Quando vuoi impedire di mescolare valori semanticamente diversi.
- Quando vuoi rappresentare stati di una macchina a compile time.
- Quando vuoi abilitare metodi solo per alcuni stati.
- Quando vuoi associare un tag type-level senza costo runtime.

## Come funziona

```rust
struct Meters;
struct Seconds;

struct Quantity<Unit> {
    value: f64,
    _unit: std::marker::PhantomData<Unit>,
}
```

`Quantity<Meters>` e `Quantity<Seconds>` sono tipi diversi, anche se hanno la stessa rappresentazione runtime.

## API / Sintassi

Marker zero-sized:

```rust
struct Connected;
struct Disconnected;
```

Uso in tipo generico:

```rust
struct Client<State> {
    endpoint: String,
    _state: std::marker::PhantomData<State>,
}
```

Trait marker:

```rust
trait Trusted {}
```

## Esempio pratico

```rust
use std::marker::PhantomData;

struct Validated;
struct Raw;

struct Email<State> {
    value: String,
    _state: PhantomData<State>,
}

impl Email<Raw> {
    fn validate(self) -> Option<Email<Validated>> {
        self.value.contains('@').then(|| Email {
            value: self.value,
            _state: PhantomData,
        })
    }
}
```

Solo `Email<Validated>` dovrebbe essere accettata dalle API che richiedono email gia controllate.

## Varianti

- Marker struct zero-sized.
- Marker trait senza metodi.
- Marker con `PhantomData`.
- Marker per typestate.
- Marker per unita di misura o contesti.

## Errori comuni

- Aggiungere marker types per vincoli che non portano valore reale.
- Rendere generiche API semplici e poco leggibili.
- Usare marker pubblici senza documentare il significato.
- Lasciare costruttori che permettono di saltare lo stato valido.
- Confondere marker types con runtime flags.

## Checklist

- Il vincolo e importante abbastanza da stare nel type system?
- Il marker ha costo runtime nullo?
- Le transizioni tra stati sono controllate?
- I nomi dei marker sono chiari?
- Una enum runtime sarebbe piu semplice?

## Collegamenti

- [[Programmazione/Rust/Pagine/Zero-sized types|Zero-sized types]]
- [[Programmazione/Rust/Pagine/PhantomData|PhantomData]]
- [[Programmazione/Rust/Pagine/Typestate pattern|Typestate pattern]]
- [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]

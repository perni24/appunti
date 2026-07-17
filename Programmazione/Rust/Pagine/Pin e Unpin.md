---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - smart-pointers-e-interior-mutability
aliases:
  - "Pin"
  - "Unpin"
  - "Pinning Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Box T]]"
  - "[[Programmazione/Rust/Pagine/Move semantics]]"
  - "[[Programmazione/Rust/Pagine/Async Await]]"
related:
  - "[[Programmazione/Rust/Pagine/Future Trait]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment]]"
---

# Pin e Unpin

## Sintesi

`Pin<P>` impedisce che il valore puntato venga mosso attraverso quel puntatore, quando il tipo non implementa `Unpin`. Serve per tipi che dipendono dalla propria posizione in memoria, come alcune future async o strutture autoreferenziali.

Per la maggior parte del codice Rust quotidiano non si manipola `Pin` direttamente, ma lo si incontra con `Future`, async runtime e API avanzate.

## Quando usarlo

- Quando lavori con `Future` manuali o polling.
- Quando un tipo non puo essere mosso dopo l'inizializzazione.
- Quando costruisci astrazioni unsafe o autoreferenziali.
- Quando una API richiede `Pin<&mut T>` o `Pin<Box<T>>`.

## Come funziona

Normalmente Rust puo muovere valori quando cambia ownership:

```rust
let a = String::from("rust");
let b = a;
```

`Pin` crea una garanzia: il valore puntato non verra mosso tramite quell'accesso, a meno che il tipo sia `Unpin`.

La maggior parte dei tipi e `Unpin` automaticamente. I tipi che non devono essere mossi usano marker come `PhantomPinned`.

## API / Sintassi

Pin su heap:

```rust
let pinned = Box::pin(async {
    42
});
```

Firma tipica di `Future::poll`:

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

trait SimpleFuture {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

`Pin<&mut Self>` impedisce di muovere la future mentre viene polled.

## Esempio pratico

```rust
use std::marker::PhantomPinned;
use std::pin::Pin;

struct NotUnpin {
    data: String,
    _pin: PhantomPinned,
}

fn use_pinned(value: Pin<&mut NotUnpin>) {
    let _ = value;
}
```

`PhantomPinned` rende il tipo `!Unpin`. Da quel momento, le API sicure devono rispettare il pinning.

## Varianti

- `Pin<&mut T>`: riferimento mutabile pinnato.
- `Pin<Box<T>>`: ownership heap pinnata.
- `Unpin`: marker trait per tipi che possono essere mossi anche se pinnati.
- `PhantomPinned`: impedisce l'implementazione automatica di `Unpin`.
- Projection: accesso sicuro a campi di un tipo pinnato, spesso con macro/crate dedicate.

## Errori comuni

- Usare `Pin` senza una necessita reale.
- Pensare che `Pin` impedisca ogni move del valore in assoluto: dipende dal tipo e dal puntatore.
- Accedere a campi pinnati in modo unsafe senza rispettare invarianti.
- Confondere `Pin<Box<T>>` con semplice heap allocation.
- Implementare manualmente future senza capire pinning.

## Checklist

- Il tipo puo diventare autoreferenziale o dipendere dal proprio indirizzo?
- Il tipo e `Unpin`? Se si, `Pin` non aggiunge vincoli rilevanti sul move.
- Serve davvero manipolare `Pin` o basta usare `async`/runtime?
- L'accesso ai campi pinnati e sicuro?
- Le invarianti sono documentate se c'e unsafe?

## Collegamenti

- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Box T|Box T]]
- [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]
- [[Programmazione/Rust/Pagine/Async Await|Async Await]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]

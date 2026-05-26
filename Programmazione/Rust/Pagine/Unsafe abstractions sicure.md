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
  - unsafe-rust-in-profondita
aliases:
  - "Safe unsafe abstractions"
  - "Astrazioni unsafe sicure"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Invariants]]"
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
related:
  - "[[Programmazione/Rust/Pagine/Miri]]"
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
---

# Unsafe abstractions sicure

## Sintesi

Una astrazione unsafe sicura incapsula codice unsafe dietro una API safe che impedisce al chiamante di violare invarianti. Il codice interno puo usare raw pointer, layout manuale o FFI, ma la superficie pubblica deve restare corretta per ogni uso safe.

Questo e uno dei principi chiave di Rust: unsafe puo esistere, ma deve essere confinato e giustificato.

## Quando usarlo

- Quando devi implementare performance o integrazione non ottenibile in safe Rust.
- Quando lavori con FFI o memoria raw.
- Quando costruisci strutture dati custom.
- Quando vuoi esporre una API ergonomica e safe sopra primitive unsafe.

## Come funziona

Schema:

1. definisci invarianti;
2. limita costruzione e mutazione;
3. usa unsafe solo in punti piccoli;
4. documenta precondizioni;
5. testa casi limite, possibilmente con Miri.

Esempio:

```rust
pub struct NonEmptySlice<'a, T> {
    inner: &'a [T],
}

impl<'a, T> NonEmptySlice<'a, T> {
    pub fn new(inner: &'a [T]) -> Option<Self> {
        (!inner.is_empty()).then_some(Self { inner })
    }

    pub fn first(&self) -> &T {
        &self.inner[0]
    }
}
```

Qui non serve unsafe, ma mostra il pattern: costruttore controllato e metodi che si fidano dell'invariante.

## API / Sintassi

Unsafe interno, API safe:

```rust
pub fn split_at_mut_checked<T>(
    slice: &mut [T],
    mid: usize,
) -> Option<(&mut [T], &mut [T])> {
    if mid > slice.len() {
        return None;
    }

    let len = slice.len();
    let ptr = slice.as_mut_ptr();

    Some(unsafe {
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    })
}
```

Il chiamante non puo creare slice sovrapposte, perche la funzione controlla `mid`.

## Esempio pratico

```rust
pub struct RawBuffer {
    data: Vec<u8>,
}

impl RawBuffer {
    pub fn as_ptr_len(&self) -> (*const u8, usize) {
        (self.data.as_ptr(), self.data.len())
    }

    pub fn as_slice(&self) -> &[u8] {
        &self.data
    }
}
```

Esporre raw pointer puo essere necessario per FFI, ma l'API safe mantiene ownership nel `Vec` e offre anche una vista sicura.

## Varianti

- Safe wrapper sopra raw pointer.
- Safe wrapper sopra FFI.
- Tipo con campi privati e costruttore validante.
- Unsafe function con wrapper safe.
- Modulo interno `unsafe` con API pubblica safe.

## Errori comuni

- Esporre campi interni che permettono di rompere invarianti.
- Avere unsafe block grandi e non localizzati.
- Non documentare perche l'unsafe e corretto.
- Rendere safe una funzione che richiede precondizioni dal chiamante.
- Testare solo casi felici.

## Checklist

- La API safe puo essere usata male causando UB?
- Tutte le invarianti sono scritte?
- I campi pericolosi sono privati?
- Ogni unsafe block ha un commento di sicurezza concreto?
- Esistono test, Miri e casi limite?

## Collegamenti

- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Invariants|Invariants]]
- [[Programmazione/Rust/Pagine/Raw pointers|Raw pointers]]
- [[Programmazione/Rust/Pagine/Miri|Miri]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]

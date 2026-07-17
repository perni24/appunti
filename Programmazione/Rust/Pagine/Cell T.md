---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - smart-pointers-e-interior-mutability
aliases:
  - "Cell<T>"
  - "Cell Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
  - "[[Programmazione/Rust/Pagine/Copy e Clone]]"
  - "[[Programmazione/Rust/Pagine/Mutabilita]]"
related:
  - "[[Programmazione/Rust/Pagine/RefCell T]]"
  - "[[Programmazione/Rust/Pagine/OnceLock e LazyLock]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
---

# Cell<T>

## Sintesi

`Cell<T>` fornisce mutabilita interna per valori piccoli o sostituibili interamente. A differenza di `RefCell<T>`, non restituisce riferimenti al contenuto: legge, scrive, sostituisce o prende il valore.

E adatto per tipi `Copy`, flag, contatori locali e cache semplici in codice single-thread.

## Quando usarlo

- Quando devi modificare un valore tramite `&self`.
- Quando il valore e `Copy` e piccolo.
- Quando vuoi evitare borrow runtime di `RefCell`.
- Quando ti basta sostituire l'intero valore, non mutarne parti interne tramite riferimento.

## Come funziona

```rust
use std::cell::Cell;

let counter = Cell::new(0);
counter.set(counter.get() + 1);
```

`get()` richiede in genere `T: Copy`, perche restituisce una copia del valore. `set()` rimpiazza il contenuto.

`Cell<T>` non e thread-safe: per condivisione tra thread servono atomics, `Mutex` o `RwLock`.

## API / Sintassi

```rust
let value = Cell::new(10);

let old = value.get();
value.set(20);

let replaced = value.replace(30);
let taken = value.take();
```

`take()` richiede `T: Default`, perche lascia un valore di default al posto del contenuto.

## Esempio pratico

```rust
use std::cell::Cell;

struct Metrics {
    calls: Cell<u64>,
}

impl Metrics {
    fn record_call(&self) {
        self.calls.set(self.calls.get() + 1);
    }

    fn calls(&self) -> u64 {
        self.calls.get()
    }
}
```

`record_call` usa `&self`, ma aggiorna internamente il contatore.

## Varianti

- `Cell<T>`: sostituzione interna senza riferimenti al contenuto.
- `RefCell<T>`: borrow runtime e accesso tramite `Ref`/`RefMut`.
- Tipi atomici: contatori e flag thread-safe.
- `OnceLock<T>`: inizializzazione una sola volta.
- `Mutex<T>`: mutabilita interna sincronizzata.

## Errori comuni

- Usare `Cell<T>` quando serve modificare una parte interna di un valore complesso.
- Aspettarsi riferimenti al contenuto.
- Usarlo tra thread.
- Nascondere mutabilita importante rendendo l'API poco chiara.
- Usare `Cell` per valori grandi dove sostituzione/copia e costosa.

## Checklist

- Il valore e piccolo o `Copy`?
- Serve accesso per riferimento o basta sostituzione?
- Il codice e single-thread?
- `RefCell<T>` sarebbe piu adatto?
- La mutabilita interna e documentata dal tipo?

## Collegamenti

- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/RefCell T|RefCell T]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/OnceLock e LazyLock|OnceLock e LazyLock]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]

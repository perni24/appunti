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
  - "unsafe trait"
  - "Unsafe traits Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Invariants]]"
related:
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
  - "[[Programmazione/Rust/Pagine/Unsafe functions]]"
  - "[[Programmazione/Rust/Pagine/Unsafe abstractions sicure]]"
---

# Unsafe traits

## Sintesi

Un unsafe trait e un trait la cui implementazione richiede garantire invarianti che il compilatore non puo verificare. Dichiarare il trait unsafe significa che implementarlo e unsafe, non necessariamente usarlo.

Esempi concettuali importanti sono marker trait legati a sicurezza di memoria o thread-safety.

## Quando usarlo

- Quando implementare il trait in modo errato puo causare undefined behavior in codice safe che si fida del trait.
- Quando il trait rappresenta una garanzia non verificabile staticamente.
- Quando costruisci astrazioni unsafe che delegano responsabilita agli implementatori.
- Quando marker come `Send` e `Sync` devono essere implementati manualmente per tipi a basso livello.

## Come funziona

Definizione:

```rust
unsafe trait TrustedLen {
    fn len(&self) -> usize;
}
```

Implementazione:

```rust
struct MyCollection {
    len: usize,
}

unsafe impl TrustedLen for MyCollection {
    fn len(&self) -> usize {
        self.len
    }
}
```

L'`unsafe impl` dichiara che l'implementatore ha verificato il contratto del trait.

## API / Sintassi

Documentazione:

```rust
/// # Safety
///
/// Implementors must guarantee that `len` always returns the exact
/// number of initialized elements.
unsafe trait ExactInitializedLen {
    fn len(&self) -> usize;
}
```

Uso da codice safe:

```rust
fn use_len<T: ExactInitializedLen>(value: &T) -> usize {
    value.len()
}
```

Il codice safe puo fidarsi del contratto se il trait e progettato correttamente.

## Esempio pratico

```rust
struct RawSend<T>(*mut T);

unsafe impl<T: Send> Send for RawSend<T> {}
```

Un'implementazione manuale di `Send` e corretta solo se il tipo garantisce che il puntatore raw non violi ownership, aliasing o thread-safety. Va documentata con cura.

## Varianti

- Unsafe marker trait.
- Unsafe trait con metodi.
- Unsafe impl per auto trait come `Send` e `Sync`.
- Trait safe con metodi unsafe.
- Trait unsafe usato internamente da una astrazione safe.

## Errori comuni

- Rendere unsafe un trait solo perche alcuni metodi sono pericolosi.
- Non documentare il contratto `# Safety`.
- Implementare manualmente `Send` o `Sync` senza ragionare su aliasing e mutabilita.
- Far dipendere codice safe da invarianti non testate.
- Esportare unsafe trait pubblici senza esempi e limiti.

## Checklist

- Implementare male il trait puo causare UB in codice safe?
- Il contratto e scritto chiaramente?
- I metodi devono essere unsafe o l'implementazione?
- Gli implementatori esterni possono rispettare il contratto?
- Serve davvero un trait pubblico?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Unsafe functions|Unsafe functions]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Invariants|Invariants]]
- [[Programmazione/Rust/Pagine/Unsafe abstractions sicure|Unsafe abstractions sicure]]

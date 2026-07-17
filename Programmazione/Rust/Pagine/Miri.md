---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - unsafe-rust-in-profondita
aliases:
  - "Miri"
  - "cargo miri"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Undefined behavior]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/Raw pointers]]"
  - "[[Programmazione/Rust/Pagine/Aliasing rules]]"
  - "[[Programmazione/Rust/Pagine/Unsafe abstractions sicure]]"
---

# Miri

## Sintesi

Miri e un interpreter per Rust MIR che aiuta a trovare alcune forme di undefined behavior, soprattutto in codice unsafe: accessi fuori limite, uso di memoria non inizializzata, violazioni di aliasing, puntatori invalidi e altri errori dinamici.

Non dimostra che il codice sia corretto, ma e uno strumento molto utile per testare invarianti unsafe.

## Quando usarlo

- Quando scrivi o modifichi codice unsafe.
- Quando costruisci astrazioni safe sopra raw pointer.
- Quando vuoi verificare test che esercitano aliasing e layout.
- Quando sospetti UB non visibile nei test normali.

## Come funziona

Miri esegue test e programmi in un interprete che controlla molte regole di memoria.

Comando tipico:

```bash
cargo miri test
```

Richiede la componente Miri installata nella toolchain usata.

## API / Sintassi

Installazione tipica:

```bash
rustup component add miri
```

Esecuzione:

```bash
cargo miri test
```

Con variabili:

```bash
MIRIFLAGS="-Zmiri-strict-provenance" cargo miri test
```

Le opzioni possono cambiare nel tempo; vanno verificate sulla toolchain usata.

## Esempio pratico

```rust
#[test]
fn raw_pointer_access() {
    let value = 10;
    let ptr = &value as *const i32;

    unsafe {
        assert_eq!(*ptr, 10);
    }
}
```

Un test come questo e semplice, ma in codice unsafe reale Miri puo individuare puntatori invalidi o violazioni non visibili con `cargo test`.

## Varianti

- `cargo miri test`: test suite.
- `cargo miri run`: esecuzione binario.
- Strict provenance flags: controlli piu severi sui puntatori.
- Test mirati per unsafe abstraction.
- Sanitizer e fuzzing: strumenti complementari, non sostitutivi.

## Errori comuni

- Pensare che Miri provi assenza completa di bug.
- Non coprire con test i percorsi unsafe.
- Ignorare differenze tra interprete Miri e ambiente reale.
- Usare Miri solo dopo aver trovato un bug, invece che durante sviluppo unsafe.
- Non documentare quali invarianti i test Miri coprono.

## Checklist

- I test esercitano davvero i blocchi unsafe?
- Ci sono casi limite: vuoto, uno, molti, allineamento, offset?
- Miri gira in CI o almeno localmente prima di modifiche unsafe?
- Le failure sono comprese, non solo aggirate?
- Servono anche fuzzing o sanitizer?

## Collegamenti

- [[Programmazione/Rust/Pagine/Undefined behavior|Undefined behavior]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Aliasing rules|Aliasing rules]]
- [[Programmazione/Rust/Pagine/Unsafe abstractions sicure|Unsafe abstractions sicure]]
- [[Programmazione/Rust/Pagine/Fuzzing|Fuzzing]]

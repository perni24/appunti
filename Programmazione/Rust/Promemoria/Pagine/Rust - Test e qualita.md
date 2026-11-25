---
date: 2026-07-30
area: Programmazione
topic: Promemoria Rust
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - rust
  - promemoria
  - test
  - clippy
  - rustfmt
aliases:
  - Cheatsheet test Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Unit test|Unit test]]"
  - "[[Programmazione/Rust/Pagine/Integration test|Integration test]]"
  - "[[Programmazione/Rust/Pagine/Clippy|Clippy]]"
title: Rust - Test e qualita
---

# Rust - Test e qualita

Per controllare una funzione privata scrivi un unit test nello stesso modulo; per verificare l'API vista dall'esterno usa `tests/`; per verificare l'esempio mostrato nei commenti usa un doctest. Esempio: libreria chiamata `app`, senza dipendenze.

## Libreria, unit test e doctest

Da una directory di prova, se non hai già il progetto:

```sh
cargo new app --lib
```

Sostituisci `app/src/lib.rs`. Il commento `///` contiene un esempio eseguito da rustdoc.

```rust
/// Restituisce l'ID se è positivo.
///
/// ```
/// assert_eq!(app::positive_id(7), 7);
/// ```
pub fn positive_id(value: u64) -> u64 {
    assert!(value > 0, "invalid value: zero");
    value
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_id() -> Result<(), std::num::ParseIntError> {
        let id = "42".parse::<u64>()?;
        assert_eq!(positive_id(id), 42);
        assert_ne!(id, 0);
        Ok(())
    }

    #[test]
    #[should_panic(expected = "invalid value: zero")]
    fn rejects_zero() {
        positive_id(0);
    }
}
```

`?` fa fallire il test se il parsing restituisce `Err`. `#[should_panic(expected = "...")]` controlla che il messaggio contenga il testo atteso, non che ogni panic sia accettabile.

## Integration test

Crea `app/tests/api_test.rs`. È una crate di test separata: importa la libreria per nome, non con `super`.

```rust
use app::positive_id;

#[test]
fn accepts_public_id() {
    assert_eq!(positive_id(5), 5);
}
```

## Eseguire i test

Dalla directory `app/`, esegui tutti i test predefiniti, compresi i doctest della libreria:

```sh
cargo test
```

Filtro per nome: un refuso può selezionare **zero** test ed essere comunque verde. Controlla il conteggio.

```sh
cargo test parses_id
```

Per il solo file di integrazione:

```sh
cargo test --test api_test
```

Per mostrare l'output dei test anche quando passano:

```sh
cargo test -- --nocapture
```

## Formato, lint e copertura dei target

Serve una toolchain con `rustfmt` e `clippy`. Il primo comando controlla senza scrivere; il secondo riformatta i sorgenti.

```sh
cargo fmt --check
```

```sh
cargo fmt
```

Controlla i tipi senza eseguire i test:

```sh
cargo check --all-targets --all-features
```

Esegui Clippy: con `-D warnings` gli avvisi fanno fallire il comando.

```sh
cargo clippy --all-targets --all-features -- -D warnings
```

Per una libreria in CI, controlla **sia i target sia i doctest**. `--all-features` abilita le feature insieme, non testa ogni combinazione.

```sh
cargo test --all-targets --all-features
```

```sh
cargo test --doc --all-features
```

Genera la documentazione: questo comando da solo non esegue gli esempi. [Cargo Book: cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html).

```sh
cargo doc --no-deps
```

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]
- [[Programmazione/Rust/Pagine/Integration test|Integration test]]
- [[Programmazione/Rust/Pagine/Doc test|Doc test]]
- [[Programmazione/Rust/Pagine/Property testing|Property testing]]
- [[Programmazione/Rust/Pagine/Clippy|Clippy]]
- [[Programmazione/Rust/Pagine/rustfmt|rustfmt]]
- [[Programmazione/Rust/Pagine/cargo-nextest|cargo-nextest]]
- [[Programmazione/Rust/Pagine/cargo audit|cargo audit]]
- [[Programmazione/Rust/Pagine/cargo deny|cargo deny]]

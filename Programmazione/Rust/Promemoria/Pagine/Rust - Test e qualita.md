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
  - "[[Programmazione/Rust/Pagine/Unit test]]"
  - "[[Programmazione/Rust/Pagine/Integration test]]"
  - "[[Programmazione/Rust/Pagine/Clippy]]"
title: Rust - Test e qualita
---

# Rust - Test e qualita

## Unit test

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_two_numbers() {
        assert_eq!(add(2, 3), 5);
    }
}
```

## Asserzioni

```rust
assert!(value > 0);
assert_eq!(actual, expected);
assert_ne!(actual, unexpected);
```

## Test che restituisce Result

```rust
#[test]
fn parses_id() -> Result<(), Box<dyn std::error::Error>> {
    let id: u64 = "42".parse()?;
    assert_eq!(id, 42);
    Ok(())
}
```

## Panic atteso

```rust
#[test]
#[should_panic(expected = "invalid value")]
fn rejects_invalid_value() {
    validate(-1);
}
```

## Integration test

```text
tests/
`-- api_test.rs
```

```rust
use app::create_user;

#[test]
fn creates_user() {
    let user = create_user("Ada");
    assert_eq!(user.name, "Ada");
}
```

## Eseguire test

```powershell
cargo test
```

```powershell
cargo test test_name
```

```powershell
cargo test -- --nocapture
```

## Formattazione

```powershell
cargo fmt --check
```

```powershell
cargo fmt
```

## Clippy

```powershell
cargo clippy --all-targets --all-features -- -D warnings
```

## Controllo completo

```powershell
cargo check --all-targets --all-features
```

```powershell
cargo test --all-targets --all-features
```

## Documentazione

```powershell
cargo doc --no-deps
```

## Approfondimento

- [[Programmazione/Rust/Pagine/Unit test|Unit test]]
- [[Programmazione/Rust/Pagine/Integration test|Integration test]]
- [[Programmazione/Rust/Pagine/Doc test|Doc test]]
- [[Programmazione/Rust/Pagine/Property testing|Property testing]]
- [[Programmazione/Rust/Pagine/Clippy|Clippy]]
- [[Programmazione/Rust/Pagine/rustfmt|rustfmt]]
- [[Programmazione/Rust/Pagine/cargo-nextest|cargo-nextest]]
- [[Programmazione/Rust/Pagine/cargo audit|cargo audit]]
- [[Programmazione/Rust/Pagine/cargo deny|cargo deny]]


## Navigazione

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]

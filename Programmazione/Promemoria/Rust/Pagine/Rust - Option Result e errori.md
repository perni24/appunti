---
date: 2026-07-30
area: Programmazione
topic: Promemoria Rust
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [rust, promemoria, option, result, errori]
aliases: [Cheatsheet error handling Rust]
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Option]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
---

# Rust - Option, Result ed errori

## Option

```rust
let value: Option<i32> = Some(42);
let missing: Option<i32> = None;
```

```rust
value.unwrap_or(0)
value.unwrap_or_default()
value.map(|number| number * 2)
value.and_then(validate)
value.filter(|number| *number > 0)
value.as_ref()
```

## Convertire Option in Result

```rust
let user = user.ok_or(AppError::UserNotFound)?;
```

```rust
let user = user.ok_or_else(|| AppError::UserNotFound)?;
```

## Result

```rust
fn parse_id(value: &str) -> Result<u64, std::num::ParseIntError> {
    value.parse()
}
```

```rust
result.map(transform)
result.map_err(AppError::Parse)
result.and_then(validate)
result.unwrap_or(default)
```

## Operatore `?`

```rust
fn load_id(text: &str) -> Result<u64, AppError> {
    let id = text.trim().parse::<u64>()?;
    Ok(id)
}
```

## Match esplicito

```rust
match operation() {
    Ok(value) => println!("{value}"),
    Err(error) => eprintln!("{error}"),
}
```

## Errore personalizzato

```rust
#[derive(Debug)]
enum AppError {
    UserNotFound,
    InvalidId(std::num::ParseIntError),
}
```

## `main` fallibile

```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {
    run()?;
    Ok(())
}
```

## Panic

```rust
assert!(value > 0);
assert_eq!(actual, expected);
unreachable!("stato gia validato");
```

Evitare `unwrap()` ed `expect()` per errori recuperabili provenienti dall'esterno.

## Approfondimento

- [[Programmazione/Rust/Pagine/Option]]
- [[Programmazione/Rust/Pagine/Result]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/Error types pubblici]]
- [[Programmazione/Rust/Pagine/Error reporting]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/panic]]

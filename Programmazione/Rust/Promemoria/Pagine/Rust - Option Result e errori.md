---
date: 2026-07-30
area: Programmazione
topic: Promemoria Rust
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - rust
  - promemoria
  - option
  - result
  - errori
aliases:
  - Cheatsheet error handling Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Option|Option]]"
  - "[[Programmazione/Rust/Pagine/Result|Result]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]"
title: Rust - Option, Result ed errori
---

# Rust - Option, Result ed errori

Usa `Option<T>` per assenza prevista, `Result<T, E>` quando serve sapere perché l'operazione è fallita. I blocchi vanno in `fn main()`, salvo il programma finale.

## Option: trasformare o scegliere un default

```rust
let value = Some(3_i32);
let missing: Option<i32> = None;
assert_eq!(missing.unwrap_or(7), 7);
assert_eq!(missing.unwrap_or_default(), 0);
assert_eq!(value.map(|n| n * 2), Some(6));
assert_eq!(value.and_then(|n| n.checked_add(1)), Some(4));
assert_eq!(value.filter(|&n| n > 5), None);
let label = Some(String::from("Ada"));
assert_eq!(label.as_ref().map(|s| s.len()), Some(3)); // non consuma label
```

## Da Option a Result, da testo a ID

```rust
#[derive(Debug)]
enum AppError { UserNotFound, InvalidId(std::num::ParseIntError) }
fn load_id(input: Option<&str>) -> Result<u64, AppError> {
    let text = input.ok_or(AppError::UserNotFound)?;
    let id = text.trim().parse::<u64>().map_err(AppError::InvalidId)?;
    Ok(id)
}
assert!(matches!(load_id(None), Err(AppError::UserNotFound)));
assert!(matches!(load_id(Some("x")), Err(AppError::InvalidId(e))
    if *e.kind() == std::num::IntErrorKind::InvalidDigit));
assert_eq!(load_id(Some(" 42 ")).unwrap(), 42);
```

`ok_or(error)` valuta subito l'errore; `ok_or_else(|| costruisci_errore())` lo costruisce solo su `None`. Per fare `parse::<u64>()?` senza `map_err` qui servirebbe `From<ParseIntError> for AppError`.

## Result: map, and_then, match

```rust
fn parse_id(text: &str) -> Result<u64, std::num::ParseIntError> { text.parse() }
let doubled = parse_id("4").map(|id| id * 2);
assert_eq!(doubled, Ok(8));
let checked = parse_id("0").map_err(|_| "not a number").and_then(|id| {
    if id == 0 { Err("zero") } else { Ok(id) }
});
match checked {
    Ok(id) => println!("id={id}"),
    Err(reason) => eprintln!("{reason}"),
}
assert_eq!(parse_id("x").unwrap_or(99), 99); // solo se 99 è un ripiego voluto
```

## Main fallibile e panic

Programma completo. `?` esce con `Err` se il parsing fallisce.

```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let id = "42".parse::<u64>()?;
    println!("id={id}");
    Ok(())
}
```

`assert!` e `assert_eq!` verificano aspettative; `unreachable!()` causa un panic se il ramo viene raggiunto. Non usare `unwrap()` o `expect()` al posto di gestire input esterno non valido. Teoria: [[Programmazione/Rust/Pagine/Error handling idiomatico|Gestione degli errori]].

## Fonti

- [Libreria standard: `Option::ok_or_else`](https://doc.rust-lang.org/std/option/enum.Option.html#method.ok_or_else)
- [Libreria standard: `Result::map_err`](https://doc.rust-lang.org/std/result/enum.Result.html#method.map_err)
- [Rust Book: propagare gli errori con `?`](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html)

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]
- [[Programmazione/Rust/Pagine/Error reporting|Error reporting]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/panic|panic]]

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
  - struct
  - enum
  - pattern-matching
aliases:
  - Cheatsheet struct enum Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Structs|Structs]]"
  - "[[Programmazione/Rust/Pagine/Enums|Enums]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]"
title: Rust - Struct, enum e pattern matching
---

# Rust - Struct, enum e pattern matching

Ogni blocco è indipendente e va nel corpo di `fn main()`. Teoria: [[Programmazione/Rust/Pagine/Pattern Matching|Pattern matching]].

## Struct: costruire, aggiornare, destrutturare

```rust
#[derive(Debug, Clone)]
struct User { id: u64, name: String, active: bool }
let user = User { id: 1, name: "Ada".into(), active: true };
let updated = User { active: false, ..user };
let User { id, name, .. } = updated;
assert_eq!((id, name.as_str(), updated.active), (1, "Ada", false));
assert_eq!(user.id, 1); // Copy; user.name invece è stato spostato
```

## Tuple struct e newtype

```rust
struct UserId(u64);
struct Point(i32, i32);
let id = UserId(7);
let Point(x, y) = Point(3, 4);
let (first, second) = (x, y);
assert_eq!((id.0, first, second), (7, 3, 4));
```

## Enum: match esaustivo e guardia

```rust
enum Command { Create { name: String }, Delete(u64), List }
fn describe(command: Command) -> String {
    match command {
        Command::Create { name } => format!("create {name}"),
        Command::Delete(id) => format!("delete {id}"),
        Command::List => "list".into(),
    }
}
assert_eq!(describe(Command::Create { name: "Ada".into() }), "create Ada");
assert_eq!(describe(Command::Delete(7)), "delete 7");
assert_eq!(describe(Command::List), "list");
```

```rust
fn label(value: Option<i32>) -> &'static str {
    match value {
        Some(n) if n > 0 => "positive",
        Some(_) => "non-positive", // la guardia non copre tutti i Some
        None => "missing",
    }
}
assert_eq!(label(Some(0)), "non-positive");
assert_eq!(label(None), "missing");
```

## if let, let else, while let

```rust
let selected = Some("Ada");
if let Some(name) = selected { println!("{name}"); }

fn initials(name: Option<&str>) -> Option<char> {
    let Some(name) = name else { return None; };
    name.chars().next()
}
assert_eq!(initials(selected), Some('A'));
assert_eq!(initials(None), None);

let mut queue = std::collections::VecDeque::from([1, 2]);
while let Some(item) = queue.pop_front() { println!("{item}"); }
assert!(queue.is_empty());
```

Con `let ... else` il ramo `else` deve uscire da quel percorso (per esempio con `return`); dopo l'istruzione i nomi del pattern sono disponibili.

## Fonti

- [Rust Book: aggiornare una struct e trasferirne i campi](https://doc.rust-lang.org/book/ch05-01-defining-structs.html)
- [Rust Book: destrutturazione e guardie di `match`](https://doc.rust-lang.org/book/ch19-03-pattern-syntax.html)
- [Rust Book: `if let` e `let ... else`](https://doc.rust-lang.org/book/ch06-03-if-let.html)

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]
- [[Programmazione/Rust/Pagine/Tuple structs|Tuple structs]]
- [[Programmazione/Rust/Pagine/Enums|Enums]]
- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/if let e while let|if let e while let]]
- [[Programmazione/Rust/Pagine/Destructuring|Destructuring]]
- [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]

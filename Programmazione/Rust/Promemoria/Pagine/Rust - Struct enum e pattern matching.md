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
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
title: Rust - Struct, enum e pattern matching
---

# Rust - Struct, enum e pattern matching

## Struct

```rust
#[derive(Debug, Clone)]
struct User {
    id: u64,
    name: String,
    active: bool,
}
```

```rust
let user = User {
    id: 1,
    name: String::from("Ada"),
    active: true,
};
```

## Update syntax

```rust
let updated = User {
    active: false,
    ..user
};
```

I campi non `Copy` possono essere spostati da `user`.

## Tuple struct e newtype

```rust
struct UserId(u64);
struct Point(i32, i32);
```

## Enum

```rust
enum Command {
    Create { name: String },
    Delete(u64),
    List,
}
```

## Match

```rust
match command {
    Command::Create { name } => create(name),
    Command::Delete(id) => delete(id),
    Command::List => list(),
}
```

## Guard

```rust
match value {
    Some(number) if number > 0 => println!("positive"),
    Some(_) => println!("non-positive"),
    None => println!("missing"),
}
```

## `if let`

```rust
if let Some(user) = user {
    println!("{}", user.name);
}
```

## `let else`

```rust
let Some(user) = find_user(id) else {
    return;
};
```

## `while let`

```rust
while let Some(item) = queue.pop_front() {
    process(item);
}
```

## Destructuring

```rust
let User { id, name, .. } = user;
let (first, second) = pair;
```

## Approfondimento

- [[Programmazione/Rust/Pagine/Structs|Structs]]
- [[Programmazione/Rust/Pagine/Tuple structs|Tuple structs]]
- [[Programmazione/Rust/Pagine/Enums|Enums]]
- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/if let e while let|if let e while let]]
- [[Programmazione/Rust/Pagine/Destructuring|Destructuring]]
- [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]


## Navigazione

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]

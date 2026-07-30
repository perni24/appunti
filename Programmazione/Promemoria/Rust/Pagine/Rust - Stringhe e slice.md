---
date: 2026-07-30
area: Programmazione
topic: Promemoria Rust
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [rust, promemoria, stringhe, slice]
aliases: [Cheatsheet stringhe Rust]
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Stringhe String e &str]]"
  - "[[Programmazione/Rust/Pagine/Slices]]"
---

# Rust - Stringhe e slice

## `String` e `&str`

```rust
let borrowed: &str = "hello";
let owned: String = String::from("hello");
let owned = "hello".to_owned();
```

```rust
fn print_name(name: &str) {
    println!("{name}");
}

print_name(&owned);
print_name(borrowed);
```

Accettare `&str` quando basta leggere testo.

## Modificare una String

```rust
let mut text = String::new();

text.push('R');
text.push_str("ust");
text.insert(0, '!');
text.truncate(4);
text.clear();
```

## Concatenare

```rust
let message = format!("{greeting} {name}");
```

```rust
let mut message = String::from("Hello");
message.push(' ');
message.push_str(name);
```

## Metodi principali

```rust
text.len()
text.is_empty()
text.contains("term")
text.starts_with("http")
text.ends_with(".json")
text.trim()
text.to_lowercase()
text.to_uppercase()
text.replace("old", "new")
text.split(',')
text.lines()
```

## Iterare Unicode

```rust
for character in text.chars() {}
for byte in text.bytes() {}
```

Non indicizzare una stringa con `text[index]`.

## Parsing

```rust
let number: i32 = text.trim().parse()?;
```

## Slice

```rust
fn first(values: &[i32]) -> Option<&i32> {
    values.first()
}
```

```rust
let values = vec![1, 2, 3, 4];
let middle = &values[1..3];
```

## Slice mutabile

```rust
fn reset(values: &mut [i32]) {
    values.fill(0);
}
```

## Approfondimento

- [[Programmazione/Rust/Pagine/Stringhe String e &str]]
- [[Programmazione/Rust/Pagine/Slices]]
- [[Programmazione/Rust/Pagine/OsStr e OsString]]
- [[Programmazione/Rust/Pagine/References e Borrowing]]

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
  - stringhe
  - slice
aliases:
  - Cheatsheet stringhe Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]"
  - "[[Programmazione/Rust/Pagine/Slices|Slices]]"
title: Rust - Stringhe e slice
---

# Rust - Stringhe e slice

Usa `&str` per leggere testo, `String` per possederlo e modificarne la lunghezza. I blocchi sono indipendenti e vanno nel corpo di `fn main()`.

## Creare, prestare e concatenare

```rust
fn print_name(name: &str) { println!("{name}"); }
let borrowed: &str = "Ada";
let owned = String::from(borrowed); // anche borrowed.to_owned()
print_name(borrowed);
print_name(&owned);

let greeting = "Ciao";
let mut message = format!("{greeting} {borrowed}");
message.push('!');
message.push_str(" A presto");
assert_eq!(message, "Ciao Ada! A presto");
```

## Indici UTF-8: byte, non caratteri

```rust
let text = "è!";
assert_eq!(text.len(), 3);                 // byte UTF-8
assert_eq!(text.chars().count(), 2);       // valori scalari Unicode
assert_eq!(text.bytes().count(), 3);
assert_eq!(text.get(0..2), Some("è"));
assert_eq!(text.get(0..1), None);          // dentro il primo carattere
```

Non usare `text[i]`. Se gli estremi possono essere errati usa `get`: `&text[0..1]` qui causerebbe un panic. `chars()` non conta necessariamente i caratteri percepiti dall'utente.

```rust
let mut text = String::new();
text.push('è');
text.push_str("!");
text.insert(0, '#');
text.truncate(3); // confine valido dopo "#è"
assert_eq!(text, "#è");
text.clear();
assert!(text.is_empty());
```

## Cercare, dividere e convertire

```rust
let path = "notes/data.json";
assert!(path.starts_with("notes/") && path.contains("data") && path.ends_with(".json"));
assert_eq!(" A ".trim().to_lowercase(), "a");
assert_eq!("Ada".to_uppercase(), "ADA");
assert_eq!("old.csv".replace("old", "new"), "new.csv");
assert_eq!("a,b".split(',').collect::<Vec<_>>(), ["a", "b"]);
assert_eq!("a\nb".lines().count(), 2);
assert_eq!(" 42 ".trim().parse::<i32>(), Ok(42));
```

## Slice di elementi

```rust
fn first(values: &[i32]) -> Option<&i32> { values.first() }
fn reset(values: &mut [i32]) { values.fill(0); }
let mut values = vec![1, 2, 3, 4];
assert_eq!(first(&[]), None);
assert_eq!(&values[1..3], &[2, 3]);
reset(&mut values[1..3]);
assert_eq!(values, [1, 0, 0, 4]);
```

Per una slice di `i32` gli indici contano **elementi**; per `str` contano **byte**. Teoria: [[Programmazione/Rust/Pagine/Slices|Slice]].

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]
- [[Programmazione/Rust/Pagine/Slices|Slices]]
- [[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]

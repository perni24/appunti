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
  - ownership
  - borrowing
aliases:
  - Cheatsheet ownership Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Ownership|Ownership]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]"
title: Rust - Ownership e borrowing
---

# Rust - Ownership e borrowing

Scegli se trasferire, duplicare o prestare un valore. Ogni blocco è indipendente e va nel corpo di `fn main()`.

## Move, Clone e Copy

```rust
let first = String::from("hello");
let second = first;          // move: first non è più utilizzabile
let mut copy = second.clone();
copy.push('!');
assert_eq!(second, "hello");
assert_eq!(copy, "hello!");

let a = 42_i32;
let b = a;                   // Copy: anche a resta utilizzabile
assert_eq!(a, b);
```

## Scegliere la firma

| Necessità | Esempio |
| --- | --- |
| Leggere senza acquisire il testo | `fn byte_len(s: &str) -> usize` |
| Modificare in-place senza ridimensionare | `fn lower(s: &mut str)` |
| Conservare o trasformare il testo posseduto | `fn lower_owned(s: String) -> String` |
| Creare testo indipendente dal chiamante | `fn name() -> String` |

```rust
fn byte_len(s: &str) -> usize { s.len() }
fn lower(s: &mut str) { s.make_ascii_lowercase(); }
fn name() -> String { String::from("ADA") }
fn lower_owned(mut s: String) -> String {
    lower(&mut s);
    s
}
let mut text = name();
assert_eq!(byte_len(&text), 3);
lower(&mut text);
assert_eq!(text, "ada");
let result = lower_owned(text);
assert_eq!(result, "ada");
```

## Prestiti e reborrow

```rust
fn add_dot(s: &mut String) { s.push('.'); }
fn finish(s: &mut String) {
    add_dot(&mut *s); // prestito temporaneo del valore già prestato
    s.push('!');      // il prestito di add_dot è finito
}
let mut text = String::from("ok");
let view = &text;
assert_eq!(view, "ok"); // ultimo uso di view
finish(&mut text);
assert_eq!(text, "ok.!");
```

Sul **medesimo dato**, più prestiti condivisi oppure uno esclusivo mentre sono in uso. Non usare `view` dopo la chiamata mutabile: ne prolungheresti il prestito. Teoria: [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]].

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/Aliasing rules|Aliasing rules]]

---
date: 2026-07-30
area: Programmazione
topic: Promemoria Rust
type: operational-note
status: "non revisionato"
publish: true
difficulty: base
tags: [rust, promemoria, sintassi]
aliases: [Cheatsheet sintassi Rust]
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Sintassi di base]]"
  - "[[Programmazione/Rust/Pagine/Tipi di dato primitivi]]"
---

# Rust - Sintassi essenziale

## Variabili

```rust
let name = "Ada";
let mut count = 0;
count += 1;

const MAX_ITEMS: usize = 100;
```

## Shadowing

```rust
let input = "42";
let input: i32 = input.parse()?;
```

## Tipi principali

```rust
let integer: i32 = 42;
let unsigned: u64 = 42;
let decimal: f64 = 3.14;
let active: bool = true;
let letter: char = 'R';
let tuple: (i32, &str) = (1, "one");
let array: [i32; 3] = [1, 2, 3];
```

## Condizioni

```rust
let label = if score >= 60 { "ok" } else { "ko" };
```

## Cicli

```rust
for value in &values {
    println!("{value}");
}
```

```rust
for (index, value) in values.iter().enumerate() {
    println!("{index}: {value}");
}
```

```rust
while count < limit {
    count += 1;
}
```

```rust
let result = loop {
    if ready {
        break 42;
    }
};
```

## Range

```rust
for value in 0..10 {}
for value in 0..=10 {}
```

## Conversioni

```rust
let number = "42".parse::<i32>()?;
let larger = i64::from(number);
let checked = u8::try_from(number)?;
```

## Formattazione

```rust
println!("name={name}");
println!("debug={value:?}");

let message = format!("Ciao {name}");
```

## Macro comuni

```rust
vec![1, 2, 3]
format!("{value}")
println!("{value}")
dbg!(&value)
todo!()
unreachable!()
```

## Approfondimento

- [[Programmazione/Rust/Pagine/Sintassi di base]]
- [[Programmazione/Rust/Pagine/Variabili mutabilita e shadowing]]
- [[Programmazione/Rust/Pagine/Tipi di dato primitivi]]
- [[Programmazione/Rust/Pagine/Operatore]]
- [[Programmazione/Rust/Pagine/Controllo di flusso]]

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
  - sintassi
aliases:
  - Cheatsheet sintassi Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Sintassi di base|Sintassi di base]]"
  - "[[Programmazione/Rust/Pagine/Tipi di dato primitivi|Tipi di dato primitivi]]"
title: Rust - Sintassi essenziale
---

# Rust - Sintassi essenziale

Blocchi indipendenti da incollare nel corpo di `fn main()`. Per i dettagli: [[Programmazione/Rust/Pagine/Sintassi di base|Sintassi di base]].

## Variabili, costanti e shadowing

```rust
const MAX_ITEMS: usize = 100;
let mut count = 0;
count += 1;
let input = "42";
let input: i32 = input.parse().expect("letterale numerico");
assert!(count < MAX_ITEMS);
assert_eq!(input, 42);
```

`mut` permette di cambiare il valore; un nuovo `let` può cambiare anche il tipo.

## Tipi e accesso

```rust
let signed: i32 = -42;
let unsigned: u64 = 42;
let decimal: f64 = 1.5;
let active: bool = true;
let letter: char = 'R';
let pair: (i32, &str) = (signed, "one");
let array: [u64; 3] = [unsigned, 7, 8];
assert_eq!((pair.0, pair.1, array[0]), (-42, "one", 42));
assert!(active && decimal > 1.0 && letter == 'R');
```

## Condizioni, range e cicli

```rust
let score = 60;
let label = if score >= 60 { "ok" } else { "ko" };
assert_eq!(label, "ok");
assert_eq!((0..3).count(), 3);  // 0, 1, 2
assert_eq!((0..=3).count(), 4); // anche 3
```

```rust
let values = [10, 20];
for value in &values {
    println!("{value}");
}
for (index, value) in values.iter().enumerate() {
    println!("{index}: {value}");
}
```

```rust
let mut count = 0;
while count < 3 { count += 1; }
let result = loop {
    count += 1;
    if count % 2 == 0 { break count; }
};
assert_eq!(result, 4);
```

## Conversioni: testo, ampliamento, intervallo

```rust
fn as_byte(text: &str) -> Result<u8, Box<dyn std::error::Error>> {
    let number = text.parse::<i32>()?;
    let larger = i64::from(number);
    Ok(u8::try_from(larger)?)
}
assert_eq!(as_byte("255").unwrap(), 255);
assert!(as_byte("256").is_err());
assert!(as_byte("abc").is_err());
```

## Formattazione e macro

```rust
let name = "Ada";
let values = vec![1, 2];
let message = format!("Ciao {name}");
println!("{message}: {values:?}");
dbg!(&values); // stderr, senza spostare il Vec
assert_eq!(values.len(), 2);
```

`format!` restituisce una `String`; `println!` scrive su stdout. `todo!()` (codice da implementare) e `unreachable!()` (ramo ritenuto impossibile) causano entrambi un panic se raggiunti.

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/Sintassi di base|Sintassi di base]]
- [[Programmazione/Rust/Pagine/Variabili mutabilita e shadowing|Variabili mutabilita e shadowing]]
- [[Programmazione/Rust/Pagine/Tipi di dato primitivi|Tipi di dato primitivi]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/Controllo di flusso|Controllo di flusso]]

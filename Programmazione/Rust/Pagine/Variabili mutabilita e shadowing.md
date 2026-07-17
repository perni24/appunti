---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - variabili
aliases:
  - "Variabili, mutabilita e shadowing"
prerequisites: []
related: []
---

# Variabili, mutabilita e shadowing

## Sintesi

In Rust i binding creati con `let` sono immutabili di default. La mutabilita va dichiarata esplicitamente con `mut`. Lo shadowing permette di dichiarare un nuovo binding con lo stesso nome, anche cambiando tipo.

## Quando usarlo

- Quando devi modellare dati modificabili o immutabili.
- Quando vuoi trasformare un valore senza mantenere variabili temporanee con nomi diversi.
- Quando il compilatore segnala che stai provando a modificare un binding immutabile.

## Come funziona

`let` lega un nome a un valore. Senza `mut`, quel binding non puo essere riassegnato. Con `mut`, puoi cambiare il valore mantenendo lo stesso tipo. Con shadowing, invece, crei un nuovo binding che nasconde il precedente nello stesso scope o in uno scope interno.

## API / Sintassi

```rust
let x = 5;
let mut count = 0;
count += 1;

let value = "42";
let value: i32 = value.parse().unwrap();
```

## Esempio pratico

```rust
fn main() {
    let input = "  rust  ";
    let input = input.trim();
    let input = input.to_uppercase();

    println!("{input}");
}
```

Qui ogni `let input` crea un nuovo binding. Non e una mutazione dello stesso valore.

## Varianti

- `let x = ...`: binding immutabile.
- `let mut x = ...`: binding mutabile.
- `let x = x + 1`: shadowing.
- Scope interno: uno shadowing puo valere solo dentro un blocco.

## Errori comuni

- Usare `mut` quando basta shadowing.
- Pensare che shadowing e mutabilita siano equivalenti.
- Provare a cambiare tipo a una variabile `mut`: la mutabilita non permette cambio di tipo.
- Rendere mutabile un dato condiviso senza pensare a ownership e borrowing.

## Checklist

- Preferisci immutabilita come default.
- Usa `mut` solo quando il valore evolve realmente nel tempo.
- Usa shadowing per trasformazioni progressive o cambio di tipo.
- Controlla lo scope in cui il binding e valido.

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Mutabilita|Mutabilita]]


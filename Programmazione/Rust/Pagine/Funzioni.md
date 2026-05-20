---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags:
  - programmazione
  - rust
  - funzioni
aliases: []
prerequisites: []
related: []
---

# Funzioni

## Sintesi

Le funzioni in Rust sono definite con `fn`, hanno parametri tipizzati e possono restituire un valore. Il tipo di ritorno e dichiarato dopo `->`, tranne quando la funzione restituisce unit `()`.

## Quando usarlo

- Quando vuoi isolare logica riutilizzabile.
- Quando devi esprimere chiaramente input e output.
- Quando vuoi controllare ownership, borrowing e mutabilita nei parametri.

## Come funziona

Rust richiede il tipo dei parametri. Il valore di ritorno puo essere prodotto con l'ultima espressione della funzione o con `return`. Lo stile idiomatico usa spesso l'ultima espressione senza `;`.

## API / Sintassi

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn print_value(value: i32) {
    println!("{value}");
}
```

## Esempio pratico

```rust
fn is_even(value: i32) -> bool {
    value % 2 == 0
}

fn main() {
    let result = is_even(10);
    println!("{result}");
}
```

## Varianti

- Funzione senza ritorno esplicito: restituisce `()`.
- Funzione associata: definita dentro `impl`.
- Metodo: funzione associata con parametro `self`, `&self` o `&mut self`.
- Closure: funzione anonima con cattura dell'ambiente.

## Errori comuni

- Mettere `;` sull'espressione finale e trasformare il ritorno in `()`.
- Dimenticare il tipo dei parametri.
- Usare `return` ovunque imitando altri linguaggi, anche quando l'espressione finale e piu chiara.
- Passare ownership quando basterebbe un riferimento.

## Checklist

- I parametri hanno tipo esplicito.
- Il tipo di ritorno e coerente con l'ultima espressione.
- Usi riferimenti quando la funzione non deve possedere il dato.
- Non usi `mut` nei parametri se non modifichi il binding locale.

## Collegamenti

- [[Programmazione/Rust/Pagine/Closure|Closure]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]


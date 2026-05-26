---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - macros
aliases:
  - "Function-like macro"
  - "proc_macro"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Procedural macros]]"
  - "[[Programmazione/Rust/Pagine/Macro dichiarative]]"
related:
  - "[[Programmazione/Rust/Pagine/Attribute macros]]"
  - "[[Programmazione/Rust/Pagine/Derive macros]]"
  - "[[Programmazione/Rust/Pagine/Hygiene]]"
---

# Function-like macros

## Sintesi

Le function-like macros sono macro invocate con sintassi simile a una funzione, `nome!(...)`, ma operano su token a compile time. Possono essere dichiarative (`macro_rules!`) o procedural (`#[proc_macro]`).

La forma procedural e utile quando il parsing dell'input o la generazione dell'output richiedono logica piu complessa di `macro_rules!`.

## Quando usarlo

- Quando vuoi creare una DSL interna.
- Quando devi validare o trasformare input a compile time.
- Quando `macro_rules!` diventa troppo complessa.
- Quando vuoi generare item, espressioni o codice da una sintassi custom.

## Come funziona

Macro dichiarativa:

```rust
macro_rules! add {
    ($a:expr, $b:expr) => {
        $a + $b
    };
}
```

Macro procedurale function-like:

```rust
#[proc_macro]
pub fn my_macro(input: TokenStream) -> TokenStream {
    input
}
```

Uso:

```rust
my_macro!(tokens);
```

## API / Sintassi

Proc macro:

```rust
use proc_macro::TokenStream;

#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
    // parse SQL-like input and generate Rust code
    input
}
```

Invocazione:

```rust
let query = sql!(SELECT * FROM users);
```

Il contenuto non deve essere sintassi Rust valida completa: e una sequenza di token che la macro interpreta.

## Esempio pratico

```rust
macro_rules! hashmap {
    ($($key:expr => $value:expr),* $(,)?) => {{
        let mut map = std::collections::HashMap::new();
        $(
            map.insert($key, $value);
        )*
        map
    }};
}
```

Questa macro crea una `HashMap` con sintassi compatta.

## Varianti

- `macro_rules! nome { ... }`: function-like dichiarativa.
- `#[proc_macro]`: function-like procedurale.
- Macro DSL, per esempio query, HTML o parser.
- Macro che producono item.
- Macro che producono espressioni.

## Errori comuni

- Usare function-like macros per nascondere logica ordinaria.
- Creare DSL troppo distante da Rust.
- Generare codice con nomi non qualificati.
- Non gestire input invalido con errori chiari.
- Confondere token parsing con parsing testuale.

## Checklist

- L'input della macro e una sintassi davvero utile?
- Una funzione o builder sarebbe piu chiaro?
- La macro produce codice leggibile in errori?
- Gli errori di parsing sono espliciti?
- I path generati sono qualificati?

## Collegamenti

- [[Programmazione/Rust/Pagine/Macro dichiarative|Macro dichiarative]]
- [[Programmazione/Rust/Pagine/Procedural macros|Procedural macros]]
- [[Programmazione/Rust/Pagine/Attribute macros|Attribute macros]]
- [[Programmazione/Rust/Pagine/Derive macros|Derive macros]]
- [[Programmazione/Rust/Pagine/Hygiene|Hygiene]]

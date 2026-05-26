---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - macros
aliases:
  - "macro_rules!"
  - "Declarative macros"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Sintassi di base]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
  - "[[Programmazione/Rust/Pagine/Hygiene]]"
related:
  - "[[Programmazione/Rust/Pagine/Procedural macros]]"
  - "[[Programmazione/Rust/Pagine/Function-like macros]]"
  - "[[Programmazione/Rust/Pagine/rustfmt]]"
---

# Macro dichiarative

## Sintesi

Le macro dichiarative, definite con `macro_rules!`, permettono di generare codice a compile time usando pattern su token. Sono utili quando una funzione non basta: sintassi variadica, generazione ripetitiva, DSL leggere o codice che deve produrre dichiarazioni.

Sono macro by example: definisci pattern di input e template di output.

## Quando usarlo

- Quando vuoi accettare un numero variabile di argomenti.
- Quando devi generare codice ripetitivo.
- Quando vuoi costruire piccole DSL interne.
- Quando serve produrre item, espressioni, pattern o blocchi.
- Quando una funzione generica non puo esprimere la forma sintattica desiderata.

## Come funziona

```rust
macro_rules! say_hello {
    () => {
        println!("hello");
    };
}

say_hello!();
```

Una macro ha uno o piu bracci. Ogni braccio contiene:

- un matcher;
- `=>`;
- una trascrizione di output.

Metavariabili:

```rust
macro_rules! log_value {
    ($value:expr) => {
        println!("{:?}", $value);
    };
}
```

`$value:expr` cattura una espressione.

## API / Sintassi

Ripetizione:

```rust
macro_rules! vec_like {
    ($($item:expr),* $(,)?) => {{
        let mut v = Vec::new();
        $(v.push($item);)*
        v
    }};
}
```

Fragment specifiers comuni:

```text
expr, ident, ty, path, pat, stmt, item, block, literal, meta, tt
```

Esportazione:

```rust
#[macro_export]
macro_rules! my_macro {
    () => {};
}
```

## Esempio pratico

```rust
macro_rules! ensure {
    ($condition:expr, $message:expr) => {
        if !$condition {
            return Err($message.into());
        }
    };
}

fn parse_port(port: u16) -> Result<u16, String> {
    ensure!(port != 0, "porta non valida");
    Ok(port)
}
```

La macro genera un early return, cosa che una funzione non potrebbe fare nel chiamante.

## Varianti

- Macro dichiarative con `macro_rules!`.
- Macro esportate con `#[macro_export]`.
- Macro locali a modulo.
- Macro ricorsive per parsing di token.
- Macro helper nascoste per implementare macro pubbliche piu leggibili.

## Errori comuni

- Usare macro quando una funzione o un trait sarebbero piu chiari.
- Scrivere pattern troppo permissivi con `tt`.
- Generare codice difficile da leggere negli errori del compilatore.
- Dimenticare casi con virgola finale.
- Dipendere da nomi non qualificati e rompere hygiene o uso da altri moduli.

## Checklist

- Una funzione, trait o generic non basta?
- Gli input della macro hanno pattern chiari?
- La macro produce errori comprensibili?
- I path generati sono qualificati correttamente?
- Hai testato casi con zero, uno e piu argomenti?

## Collegamenti

- [[Programmazione/Rust/Pagine/Hygiene|Hygiene]]
- [[Programmazione/Rust/Pagine/Procedural macros|Procedural macros]]
- [[Programmazione/Rust/Pagine/Function-like macros|Function-like macros]]
- [[Programmazione/Rust/Pagine/rustfmt|rustfmt]]
- [[Programmazione/Rust/Pagine/Zero-cost abstractions|Zero-cost abstractions]]

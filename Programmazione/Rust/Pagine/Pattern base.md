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
  - pattern
aliases: []
prerequisites: []
related: []
---

# Pattern base

## Sintesi

I pattern in Rust descrivono la forma di un valore e permettono di estrarre parti interne. Compaiono in `let`, parametri di funzione, `match`, `if let`, `while let` e cicli `for`.

## Quando usarlo

- Quando devi destrutturare tuple, array, struct o enum.
- Quando vuoi gestire casi diversi con `match`.
- Quando vuoi ignorare parti di un valore.

## Come funziona

Un pattern viene confrontato con un valore. Se la forma coincide, Rust lega nomi alle parti estratte. Alcuni pattern sono irrefutabili, cioe funzionano sempre; altri sono refutabili, cioe possono fallire.

## API / Sintassi

```rust
let (x, y) = (10, 20);

match value {
    0 => "zero",
    1 | 2 => "piccolo",
    _ => "altro",
}
```

## Esempio pratico

```rust
fn describe(point: (i32, i32)) -> &'static str {
    match point {
        (0, 0) => "origine",
        (0, _) => "asse y",
        (_, 0) => "asse x",
        _ => "punto generico",
    }
}
```

## Varianti

- Literal pattern: `0`, `"ok"`, `true`.
- Wildcard: `_`.
- Binding: `name`.
- Or pattern: `a | b`.
- Tuple pattern: `(x, y)`.
- Range pattern: `1..=5`.

## Errori comuni

- Usare `_` quando poi serve il valore.
- Dimenticare che `match` deve essere esaustivo.
- Confondere pattern refutabili e irrefutabili.
- Fare shadowing involontario di nomi gia esistenti dentro un pattern.

## Checklist

- Usa `_` solo per valori davvero inutili.
- Controlla che `match` copra tutti i casi.
- Usa `if let` per un solo caso rilevante.
- Usa nomi espliciti nei binding per rendere chiara l'estrazione.

## Collegamenti

- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Destructuring|Destructuring]]
- [[Programmazione/Rust/Pagine/if let e while let|if let e while let]]


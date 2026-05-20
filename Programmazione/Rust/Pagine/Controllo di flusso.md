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
  - controllo-di-flusso
aliases: []
prerequisites: []
related: []
---

# Controllo di flusso

## Sintesi

Il controllo di flusso in Rust usa `if`, `loop`, `while`, `for` e `match`. Molti di questi costrutti sono espressioni, quindi possono produrre valori.

## Quando usarlo

- Quando devi scegliere tra rami alternativi.
- Quando devi iterare su range, collezioni o iteratori.
- Quando devi gestire casi multipli in modo esaustivo.

## Come funziona

`if` richiede una condizione booleana. Non c'e conversione implicita da interi o altri tipi a `bool`. I loop possono essere interrotti con `break`; `loop` puo anche restituire un valore usando `break valore`.

## API / Sintassi

```rust
if condition {
    // ramo vero
} else {
    // ramo falso
}

for item in items {
    println!("{item}");
}
```

## Esempio pratico

```rust
fn classify(value: i32) -> &'static str {
    if value < 0 {
        "negativo"
    } else if value == 0 {
        "zero"
    } else {
        "positivo"
    }
}

fn main() {
    for number in [1, 2, 3] {
        println!("{}", classify(number));
    }
}
```

## Varianti

- `if` / `else if` / `else`: scelta condizionale.
- `loop`: ciclo infinito controllato da `break`.
- `while`: ciclo finche la condizione e vera.
- `for`: iterazione su un iteratore.
- `match`: selezione esaustiva su pattern.

## Errori comuni

- Usare `if value` invece di una condizione booleana.
- Dimenticare che i rami di un `if` usato come espressione devono avere lo stesso tipo.
- Usare loop manuali dove un iteratore sarebbe piu idiomatico.
- Ignorare `match` quando i casi devono essere esaustivi.

## Checklist

- Le condizioni sono `bool`.
- I rami restituiscono tipi coerenti.
- Usi `for` con iteratori per collezioni.
- Usi `match` quando i casi devono essere completi.

## Collegamenti

- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Pattern base|Pattern base]]


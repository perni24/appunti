---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [programmazione, rust, pattern-matching, if-let, while-let]
aliases:
  - "if let Rust"
  - "while let Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
  - "[[Programmazione/Rust/Pagine/Option]]"
related:
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Control flow avanzato]]"
---

# if let e while let

## Sintesi

`if let` e `while let` sono forme compatte di pattern matching. Servono quando interessa gestire un pattern specifico senza scrivere un `match` completo.

Sono utili con `Option`, `Result`, enum applicativi e iteratori che producono valori opzionali.

## Quando usarlo

- Usa `if let` quando ti interessa un solo caso e vuoi ignorare o gestire in modo semplice gli altri.
- Usa `while let` quando vuoi continuare un ciclo finche un pattern corrisponde.
- Usa `match` quando i casi importanti sono piu di uno o vuoi esaustivita esplicita.
- Usa `let else` quando vuoi uscire subito se un pattern non corrisponde.

## Come funziona

`if let`:

```rust
let valore = Some(10);

if let Some(n) = valore {
    println!("{n}");
}
```

Equivale concettualmente a:

```rust
match valore {
    Some(n) => println!("{n}"),
    _ => {}
}
```

`while let`:

```rust
let mut stack = vec![1, 2, 3];

while let Some(n) = stack.pop() {
    println!("{n}");
}
```

Il ciclo continua finche `pop()` restituisce `Some`.

## API / Sintassi

```rust
if let PATTERN = espressione {
    // caso corrispondente
} else {
    // opzionale
}
```

```rust
while let PATTERN = espressione {
    // ripeti finche il pattern corrisponde
}
```

Con `Result`:

```rust
if let Err(err) = salva() {
    eprintln!("errore: {err}");
}
```

## Esempio pratico

```rust
enum Comando {
    Stampa(String),
    Esci,
}

fn esegui(comando: Comando) -> bool {
    if let Comando::Stampa(testo) = comando {
        println!("{testo}");
        true
    } else {
        false
    }
}

fn main() {
    let mut comandi = vec![
        Comando::Esci,
        Comando::Stampa(String::from("ciao")),
    ];

    while let Some(comando) = comandi.pop() {
        if !esegui(comando) {
            break;
        }
    }
}
```

`while let` estrae comandi finche il vettore contiene elementi. `if let` gestisce solo la variante `Stampa`.

## Varianti

- `if let`: singolo pattern interessante.
- `if let ... else`: pattern principale piu fallback.
- `while let`: ciclo basato su pattern.
- `let PATTERN = valore`: destructuring irrefutabile.
- `let PATTERN = valore else { ... }`: uscita anticipata se il pattern fallisce.

## Errori comuni

- Usare `if let` quando un `match` esaustivo renderebbe il codice piu chiaro.
- Ignorare errori con `if let Ok(_)` senza gestire `Err`.
- Dimenticare che il pattern puo muovere dati.
- Scrivere `while let` con una espressione che non cambia mai, creando loop infiniti.
- Nascondere logica importante nel ramo `else`.

## Checklist

- C'e davvero un solo pattern interessante?
- Gli altri casi possono essere ignorati in modo sicuro?
- Il pattern muove dati o prende riferimenti?
- Con `Result`, l'errore viene gestito o tracciato?
- Un `match` sarebbe piu leggibile?

## Collegamenti

- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Control flow avanzato|Control flow avanzato]]
- [[Programmazione/Rust/Pagine/Destructuring|Destructuring]]


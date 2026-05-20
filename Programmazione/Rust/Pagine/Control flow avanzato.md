---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, control-flow, expressions]
aliases:
  - "Controllo di flusso avanzato Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Controllo di flusso]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
related:
  - "[[Programmazione/Rust/Pagine/if let e while let]]"
  - "[[Programmazione/Rust/Pagine/Operatore]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
---

# Control flow avanzato

## Sintesi

Il controllo di flusso avanzato in Rust include costrutti espressivi come `loop` con valore di ritorno, label sui loop, `let else`, `match` come espressione e uscita anticipata con `?`.

Questi strumenti permettono di scrivere flussi espliciti senza eccezioni e senza nascondere i casi di errore.

## Quando usarlo

- Quando un ciclo deve restituire un valore.
- Quando hai loop annidati e vuoi uscire da uno specifico livello.
- Quando vuoi validare un pattern e uscire subito se non corrisponde.
- Quando vuoi propagare errori in modo idiomatico.
- Quando vuoi sostituire flag e variabili temporanee con espressioni piu chiare.

## Come funziona

`loop` puo restituire un valore con `break valore`:

```rust
let mut n = 0;

let risultato = loop {
    n += 1;
    if n == 3 {
        break n * 10;
    }
};
```

Loop label:

```rust
'esterno: for x in 0..10 {
    for y in 0..10 {
        if x + y > 12 {
            break 'esterno;
        }
    }
}
```

`let else`:

```rust
let Some(id) = trova_id() else {
    return;
};
```

## API / Sintassi

```rust
let valore = if condizione {
    a
} else {
    b
};
```

```rust
let valore = match input {
    Caso::A => 1,
    Caso::B => 2,
};
```

```rust
fn carica() -> Result<String, std::io::Error> {
    let testo = std::fs::read_to_string("config.toml")?;
    Ok(testo)
}
```

## Esempio pratico

```rust
fn parse_port(input: Option<&str>) -> Result<u16, String> {
    let Some(raw) = input else {
        return Err(String::from("porta mancante"));
    };

    let port = raw
        .parse::<u16>()
        .map_err(|_| String::from("porta non valida"))?;

    if port == 0 {
        return Err(String::from("porta zero non ammessa"));
    }

    Ok(port)
}
```

`let else` gestisce il caso assente, `?` propaga l'errore di parsing convertito, `return` esplicita la validazione fallita.

## Varianti

- `if` come espressione.
- `match` come espressione.
- `loop` con `break valore`.
- Label sui loop: `'label: loop { ... }`.
- `let else` per pattern refutabili con uscita anticipata.
- Operatore `?` per propagazione di errori.

## Errori comuni

- Usare flag mutabili quando un `break valore` sarebbe piu chiaro.
- Usare `unwrap` dove `?` comunicherebbe meglio l'errore.
- Abusare di label e rendere il flusso difficile da seguire.
- Usare `let else` quando un `match` completo sarebbe piu leggibile.
- Dimenticare che `if` e `match` devono restituire lo stesso tipo in tutti i rami.

## Checklist

- Il costrutto scelto rende espliciti tutti i casi?
- Il ciclo deve produrre un valore?
- L'uscita anticipata restituisce errore, `None` o termina davvero la funzione?
- Il `?` conserva abbastanza contesto sull'errore?
- I branch restituiscono lo stesso tipo?

## Collegamenti

- [[Programmazione/Rust/Pagine/Controllo di flusso|Controllo di flusso]]
- [[Programmazione/Rust/Pagine/if let e while let|if let e while let]]
- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]


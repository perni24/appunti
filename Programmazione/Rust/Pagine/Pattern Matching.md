---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, pattern-matching, match]
aliases:
  - "match Rust"
  - "Pattern matching Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Pattern base]]"
related:
  - "[[Programmazione/Rust/Pagine/if let e while let]]"
  - "[[Programmazione/Rust/Pagine/Pattern matching avanzato]]"
  - "[[Programmazione/Rust/Pagine/Destructuring]]"
---

# Pattern Matching

## Sintesi

Il pattern matching permette di confrontare un valore con una serie di pattern e di estrarre dati dalle strutture corrispondenti. In Rust e usato soprattutto con `match`, enum, tuple, struct, `Option` e `Result`.

La forza di `match` e l'esaustivita: il compilatore controlla che tutti i casi possibili siano gestiti.

## Quando usarlo

- Quando devi distinguere varianti di un enum.
- Quando devi gestire `Option<T>` o `Result<T, E>`.
- Quando vuoi estrarre campi da tuple, struct o enum.
- Quando il controllo di flusso dipende dalla forma del dato.

## Come funziona

```rust
match valore {
    pattern1 => espressione1,
    pattern2 => espressione2,
    _ => fallback,
}
```

Ogni braccio contiene un pattern e una espressione. Il primo pattern che corrisponde viene eseguito.

```rust
let valore = Some(10);

let testo = match valore {
    Some(n) => format!("numero {n}"),
    None => String::from("nessun valore"),
};
```

`match` e una espressione: puo produrre un valore.

## API / Sintassi

Pattern su enum:

```rust
match risultato {
    Ok(valore) => println!("{valore}"),
    Err(err) => eprintln!("{err}"),
}
```

Pattern con guardia:

```rust
match n {
    x if x < 0 => println!("negativo"),
    0 => println!("zero"),
    _ => println!("positivo"),
}
```

Pattern su struct:

```rust
let punto = Punto { x: 3, y: 4 };

match punto {
    Punto { x, y: 0 } => println!("asse x: {x}"),
    Punto { x, y } => println!("{x}, {y}"),
}
```

## Esempio pratico

```rust
enum Evento {
    Click { x: i32, y: i32 },
    Tasto(char),
    Chiudi,
}

fn gestisci(evento: Evento) {
    match evento {
        Evento::Click { x, y } => println!("click a {x},{y}"),
        Evento::Tasto('q') | Evento::Chiudi => println!("uscita"),
        Evento::Tasto(c) => println!("tasto {c}"),
    }
}
```

Il pattern matching rende esplicita la forma degli eventi e permette di unire casi con `|`.

## Varianti

- `match`: forma completa ed esaustiva.
- `if let`: comodo per un solo pattern interessante.
- `while let`: ciclo finche un pattern continua a corrispondere.
- `let PATTERN = valore`: destructuring irrefutabile.
- `matches!`: macro per controllare se un valore corrisponde a un pattern.

## Errori comuni

- Usare `_` e perdere controllo sulle varianti future.
- Scrivere bracci irraggiungibili perche un pattern precedente e troppo ampio.
- Dimenticare che `match` puo muovere valori se il pattern prende ownership.
- Restituire tipi diversi nei vari bracci.
- Usare `match` verbosi quando `if let` o metodi come `map` e `unwrap_or` sono piu chiari.

## Checklist

- Il match e esaustivo senza nascondere casi importanti?
- I pattern piu specifici vengono prima di quelli generali?
- Stai muovendo dati o li stai prendendo in prestito?
- I bracci restituiscono lo stesso tipo?
- `_` e davvero corretto o conviene nominare tutti i casi?

## Collegamenti

- [[Programmazione/Rust/Pagine/Enums|Enums]]
- [[Programmazione/Rust/Pagine/if let e while let|if let e while let]]
- [[Programmazione/Rust/Pagine/Destructuring|Destructuring]]
- [[Programmazione/Rust/Pagine/Pattern matching avanzato|Pattern matching avanzato]]
- [[Programmazione/Rust/Pagine/Option|Option]]


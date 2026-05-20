---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, enums, tipi-dato]
aliases:
  - "Enum Rust"
  - "Enumerazioni Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
related:
  - "[[Programmazione/Rust/Pagine/Option]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
---

# Enums

## Sintesi

Un `enum` definisce un tipo che puo assumere una tra piu varianti. A differenza di molte enumerazioni tradizionali, in Rust ogni variante puo contenere dati. Questo rende gli enum adatti a modellare stati, risultati, comandi, eventi e alternative strutturate.

Gli enum sono uno dei pilastri del codice Rust idiomatico insieme a `match`, `Option` e `Result`.

## Quando usarlo

- Quando un valore puo essere in uno tra piu stati alternativi.
- Quando ogni variante puo avere dati diversi.
- Quando vuoi evitare flag booleani o campi opzionali incoerenti.
- Quando vuoi rendere il compilatore responsabile dell'esaustivita dei casi.

## Come funziona

```rust
enum StatoOrdine {
    Creato,
    Pagato { ricevuta: String },
    Spedito(String),
    Annullato,
}
```

Ogni valore di tipo `StatoOrdine` e esattamente una variante.

```rust
let stato = StatoOrdine::Spedito(String::from("TRK123"));
```

Per leggere la variante si usa di solito `match`:

```rust
match stato {
    StatoOrdine::Creato => println!("creato"),
    StatoOrdine::Pagato { ricevuta } => println!("pagato: {ricevuta}"),
    StatoOrdine::Spedito(tracking) => println!("spedito: {tracking}"),
    StatoOrdine::Annullato => println!("annullato"),
}
```

## API / Sintassi

```rust
enum Messaggio {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(u8, u8, u8),
}

impl Messaggio {
    fn descrizione(&self) -> &'static str {
        match self {
            Self::Quit => "quit",
            Self::Move { .. } => "move",
            Self::Write(_) => "write",
            Self::ChangeColor(_, _, _) => "color",
        }
    }
}
```

## Esempio pratico

```rust
#[derive(Debug)]
enum Comando {
    Lista,
    Aggiungi { titolo: String },
    Rimuovi(u64),
}

fn esegui(comando: Comando) {
    match comando {
        Comando::Lista => println!("lista elementi"),
        Comando::Aggiungi { titolo } => println!("aggiungo {titolo}"),
        Comando::Rimuovi(id) => println!("rimuovo {id}"),
    }
}

fn main() {
    esegui(Comando::Aggiungi {
        titolo: String::from("studiare Rust"),
    });
}
```

Il tipo `Comando` impedisce combinazioni invalide: un comando `Lista` non puo avere per errore un `id`.

## Varianti

- Varianti senza dati: `Creato`.
- Varianti tuple-like: `Spedito(String)`.
- Varianti struct-like: `Pagato { ricevuta: String }`.
- Enum generici: `enum Maybe<T> { Some(T), None }`.
- Enum ricorsivi: richiedono indirection, per esempio `Box<T>`.

## Errori comuni

- Usare piu booleani per modellare stati mutuamente esclusivi.
- Dimenticare che un `match` su enum deve essere esaustivo.
- Usare `_` troppo presto e nascondere nuove varianti aggiunte in futuro.
- Inserire troppe responsabilita in un singolo enum.
- Clonare dati nelle varianti invece di muoverli o prenderli in prestito quando possibile.

## Checklist

- Gli stati sono alternativi? Un enum e probabilmente adatto.
- Ogni variante contiene solo i dati necessari per quello stato?
- Il `match` gestisce tutti i casi rilevanti?
- Serve derivare `Debug`, `Clone`, `Copy`, `PartialEq`?
- L'enum e parte della API pubblica? Valuta evoluzione e breaking changes.

## Collegamenti

- [[Programmazione/Rust/Pagine/Pattern Matching|Pattern Matching]]
- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]


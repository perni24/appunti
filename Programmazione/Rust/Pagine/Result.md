---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - result
  - error-handling
aliases:
  - Result Rust
  - Gestione errori con Result
prerequisites:
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
  - "[[Programmazione/Rust/Pagine/Option]]"
related:
  - "[[Programmazione/Rust/Pagine/Operatore]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow]]"
title: Result
---

# Result

## Sintesi

`Result<T, E>` descrive due esiti alternativi: `Ok(T)` per il successo, `Err(E)` per il fallimento. Il tipo di errore fa parte della firma; il chiamante decide se gestirlo, trasformarlo o propagarlo.

"Recuperabile" non significa che il recupero riesca sempre: anche terminare una CLI con un messaggio puo essere la scelta corretta. Restituire `Result` non impedisce a una funzione di fare panic per altre cause.

## Quando usarlo

- Parsing, validazione, I/O e operazioni con un motivo di fallimento utile.
- API nelle quali il chiamante deve distinguere errori diversi.
- Operazioni senza valore di ritorno significativo ma comunque fallibili: `Result<(), E>`.
- Se interessa soltanto l'assenza, valuta [[Programmazione/Rust/Pagine/Option|Option]].

## Come funziona

`Result`, `Ok` ed `Err` sono gia nel prelude. `T` ed `E` sono parametri indipendenti: `Result` non richiede da solo che `E` implementi `std::error::Error`. Quel trait, insieme a `Display` e `Debug`, serve per integrare gli errori nell'ecosistema.

### Divisione senza panic aritmetici

Ogni blocco Rust e autonomo per `src/main.rs`, salvo i controesempi indicati. Baseline: Rust 1.99.1, edition 2024, standard library.

```rust
#[derive(Debug, PartialEq)]
enum DivisionError {
    ZeroDivisor,
    Overflow,
}

fn divide(a: i32, b: i32) -> Result<i32, DivisionError> {
    if b == 0 {
        return Err(DivisionError::ZeroDivisor);
    }
    a.checked_div(b).ok_or(DivisionError::Overflow)
}

fn main() {
    assert_eq!(divide(10, 2), Ok(5));
    assert_eq!(divide(-7, 2), Ok(-3));
    assert_eq!(divide(1, 0), Err(DivisionError::ZeroDivisor));
    assert_eq!(divide(i32::MIN, -1), Err(DivisionError::Overflow));

    let message = match divide(1, 0) {
        Ok(value) => format!("quotient: {value}"),
        Err(DivisionError::ZeroDivisor) => String::from("choose another divisor"),
        Err(DivisionError::Overflow) => String::from("quotient out of range"),
    };
    assert_eq!(message, "choose another divisor");
}
```

Controllare solo `b == 0` non basta: `i32::MIN / -1` non e rappresentabile e fa panic anche con overflow checks disabilitati. La divisione intera tronca verso zero, non restituisce una frazione. L'enum permette al chiamante di scegliere senza confrontare messaggi testuali.

## API / Sintassi

### map, map_err e and_then

`map` modifica il successo lasciando `E` invariato; `map_err` modifica l'errore lasciando `T` invariato. `and_then` concatena un'altra operazione che restituisce `Result<U, E>`.

```rust
#[derive(Debug, PartialEq)]
enum CountError {
    Invalid(std::num::ParseIntError),
    Overflow,
}

fn doubled_count(raw: &str) -> Result<u8, CountError> {
    raw.parse::<u8>()
        .map_err(CountError::Invalid)
        .and_then(|n| n.checked_mul(2).ok_or(CountError::Overflow))
}

fn main() {
    assert_eq!(doubled_count("12").map(|n| n.to_string()), Ok("24".into()));
    assert_eq!(doubled_count("128"), Err(CountError::Overflow));
    assert!(matches!(doubled_count("bad"), Err(CountError::Invalid(_))));
}
```

Le closure di successo non partono su `Err`; quella di `map_err` non parte su `Ok`. `map` con una funzione fallibile produce invece un `Result` annidato. Convertire ogni errore in `"invalid"` elimina dettagli: qui conserviamo il `ParseIntError` originale.

### Ispezionare senza consumare

```rust
fn main() {
    let loaded: Result<String, String> = Ok(String::from("notes"));
    assert_eq!(loaded.as_ref().map(String::len), Ok(5));
    assert_eq!(loaded.as_deref().map(str::len), Ok(5));
    assert_eq!(loaded, Ok(String::from("notes")));

    let failed: Result<String, String> = Err(String::from("unavailable"));
    match &failed {
        Ok(text) => assert!(!text.is_empty()),
        Err(error) => assert_eq!(error, "unavailable"),
    }
    assert!(failed.is_err());
}
```

`as_ref` produce `Result<&T, &E>`. `Result<T, E>` e `Copy` solo se lo sono **entrambi** i tipi: non basta che il valore dentro `Ok` sia un intero.

### Recupero locale e default

```rust
fn fallback(calls: &mut usize) -> u16 {
    *calls += 1;
    8080
}

fn main() {
    let mut calls = 0;
    assert_eq!(Ok::<u16, &str>(9000).unwrap_or(fallback(&mut calls)), 9000);
    assert_eq!(calls, 1);

    let value = Ok::<u16, &str>(9000).unwrap_or_else(|_| fallback(&mut calls));
    assert_eq!(value, 9000);
    assert_eq!(calls, 1);

    let missing: Result<u16, &str> = Err("missing");
    assert_eq!(missing.unwrap_or_else(|_| fallback(&mut calls)), 8080);
    assert_eq!(calls, 2);

    let retry: Result<u16, &str> = Err("missing");
    let recovered = retry.or_else(|error| {
        if error == "missing" { Ok(8080) } else { Err(error) }
    });
    assert_eq!(recovered, Ok(8080));
}
```

`unwrap_or_else` riceve l'errore e restituisce `T`; `or_else` restituisce un altro `Result`. Non sono retry automatici: il comportamento dipende dalla closure. Un valore di default su input corrotto puo nascondere un problema.

## Esempio pratico

### Configurazione di una porta obbligatoria

```rust
use std::num::ParseIntError;

#[derive(Debug, PartialEq)]
enum ConfigError {
    MissingPort,
    InvalidPort(ParseIntError),
    ZeroPort,
}

fn parse_port(input: Option<&str>) -> Result<u16, ConfigError> {
    let raw = input.ok_or(ConfigError::MissingPort)?;
    let port = raw.parse::<u16>().map_err(ConfigError::InvalidPort)?;
    if port == 0 {
        return Err(ConfigError::ZeroPort);
    }
    Ok(port)
}

fn main() {
    assert_eq!(parse_port(Some("8080")), Ok(8080));
    assert_eq!(parse_port(Some("65535")), Ok(65535));
    assert_eq!(parse_port(None), Err(ConfigError::MissingPort));
    assert_eq!(parse_port(Some("0")), Err(ConfigError::ZeroPort));
    assert!(matches!(parse_port(Some("65536")), Err(ConfigError::InvalidPort(_))));
    assert!(matches!(parse_port(Some("")), Err(ConfigError::InvalidPort(_))));
}
```

`ok_or` assegna una causa all'assenza; `map_err` conserva il parsing sottostante. La policy e esplicita: numero `1..=65535`, nessun `trim`. `" 80 "` fallisce; il parser numerico accetta `"+80"`. Non e una grammatica composta soltanto da cifre.

Rifiutare zero e una scelta di questa configurazione: altre API lo usano per richiedere una porta assegnata dal sistema. Il parsing non verifica disponibilita, permessi o connettivita. Questo enum didattico non implementa ancora `Display` e `Error`: per esporlo come errore di libreria vedi [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]].

## Varianti

### Successo senza payload utile

```rust
fn validate_name(name: &str) -> Result<(), &'static str> {
    if name.trim().is_empty() {
        Err("name is blank")
    } else {
        Ok(())
    }
}

fn main() {
    assert_eq!(validate_name("notes"), Ok(()));
    assert_eq!(validate_name(" \n"), Err("name is blank"));
}
```

Questo controllo respinge solo stringhe vuote dopo `trim`: non normalizza il nome e non e una validazione completa. `Ok(())` indica che quel controllo e passato, non che manchino errori possibili.

### Raccogliere solo se tutti riescono

```rust
fn main() {
    let mut visited = Vec::new();
    let numbers: Result<Vec<u8>, _> = ["10", "bad", "20"]
        .into_iter()
        .map(|raw| {
            visited.push(raw);
            raw.parse::<u8>()
        })
        .collect();

    assert!(numbers.is_err());
    assert_eq!(visited, vec!["10", "bad"]);
    let empty: Result<Vec<u8>, _> = std::iter::empty::<&str>()
        .map(str::parse::<u8>)
        .collect();
    assert_eq!(empty, Ok(Vec::new()));
}
```

`collect` si ferma al primo `Err` nell'ordine di iterazione e non restituisce il vettore parziale. Gli effetti gia prodotti, qui `visited`, restano. Per tutti gli errori serve un'altra strategia; `filter_map(|x| x.parse().ok())` li scarta.

- `Result<Option<T>, E>`: operazione riuscita senza valore distinta dal fallimento.
- `Option<Result<T, E>>`: operazione opzionale; `transpose` scambia i due livelli, anche nella direzione inversa.
- `.ok()` converte in `Option<T>` e perde `E`; `.err()` conserva solo l'eventuale errore.
- Un alias come `type AppResult<T> = Result<T, AppError>` abbrevia un tipo esistente, non crea un nuovo enum.

## Errori comuni

### Consumare due volte il risultato

Controesempio **non compilabile**, E0382:

```rust
fn main() {
    let parsed: Result<u32, String> = Ok(42);
    let value = parsed.unwrap_or(0);
    assert_eq!(value, 42);
    assert!(parsed.is_ok());
}
```

Usa un prestito per leggere piu volte, oppure consuma una sola volta. Non affidarti al fatto che una particolare istanza sia `Ok`: il trait `Copy` riguarda l'intero tipo.

### Ignorare must_use

Per default un `Result` scartato genera un warning, non un errore di compilazione. Il seguente controesempio lo rende **errore** tramite lint:

```rust
#![deny(unused_must_use)]

fn check() -> Result<(), &'static str> {
    Err("not ready")
}

fn main() {
    check();
}
```

`let _ = check();` sopprime intenzionalmente l'avviso ma non gestisce il fallimento. `unwrap` e `expect` fanno panic su `Err`; non vanno usati per rendere apparentemente infallibile un input esterno.

## Checklist

- Sono provati sia `Ok` sia tutti gli errori rilevanti?
- La funzione puo ancora fare panic per overflow o accessi fuori indice?
- Il tipo distingue cause sulle quali il chiamante agisce diversamente?
- Una conversione o un default stanno perdendo informazioni?
- Effetti parziali e punto di gestione dell'errore sono documentati?

## Collegamenti

- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Enums|Enums]]

## Fonti

Riferimento verificato: Rust 1.99.1, edition 2024; nessuna MSRV complessiva dichiarata.

- [Standard library: Result e must_use](https://doc.rust-lang.org/std/result/).
- [API Result](https://doc.rust-lang.org/std/result/enum.Result.html).
- [i32::checked_div](https://doc.rust-lang.org/std/primitive.i32.html#method.checked_div).
- [Rust Book: errori recuperabili](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html).
- [Trait Error](https://doc.rust-lang.org/std/error/trait.Error.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

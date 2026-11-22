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
  - operatore-question-mark
  - error-handling
aliases:
  - Operatore ?
  - Question mark operator
  - "? in Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Option]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
related:
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow]]"
  - "[[Programmazione/Rust/Pagine/Control flow avanzato]]"
title: Operatore ?
---

# Operatore ?

## Sintesi

`?` estrae il valore che permette di continuare oppure propaga l'uscita anticipata. Su `Result`: `Ok(value)` diventa `value`, `Err(error)` termina il contesto compatibile restituendo un errore. Su `Option`: `Some(value)` diventa `value`, `None` viene propagato.

Non risolve l'errore, non fa retry e non equivale a `unwrap`: il caso negativo e un ritorno ordinario, non un panic.

## Quando usarlo

- Sequenze fallibili nelle quali il primo errore va restituito al chiamante.
- Ricerca composta che deve restituire `None` appena manca un elemento.
- Funzioni di supporto che non devono decidere messaggi UI o policy di recupero.
- Se puoi recuperare localmente, usa `match`, `or_else` o un ramo esplicito.

## Come funziona

### Equivalenza con match per Result

Ogni blocco Rust e autonomo per `src/main.rs`, salvo i controesempi indicati. Baseline: Rust 1.99.1, edition 2024, standard library.

```rust
use std::num::ParseIntError;

fn parse_id(raw: &str) -> Result<u64, ParseIntError> {
    let id = raw.parse::<u64>()?;
    Ok(id)
}

fn parse_id_explicit(raw: &str) -> Result<u64, ParseIntError> {
    let id = match raw.parse::<u64>() {
        Ok(value) => value,
        Err(error) => return Err(error),
    };
    Ok(id)
}

fn main() {
    assert_eq!(parse_id("42"), Ok(42));
    assert!(parse_id("bad").is_err());
    for raw in ["0", "42", "", "-1", "18446744073709551616"] {
        assert_eq!(parse_id(raw), parse_id_explicit(raw));
    }
}
```

Quando il tipo di errore in uscita e diverso, il ramo equivalente e `return Err(From::from(error))`. Non e necessaria la conversione del valore di successo: `?` produce proprio il `T` interno, non lo incapsula nel risultato finale. Qui serve ancora `Ok(id)`.

### Propagare None

```rust
fn first_character(raw: &str) -> Option<char> {
    let character = raw.chars().next()?;
    Some(character)
}

fn main() {
    assert_eq!(first_character(""), None);
    assert_eq!(first_character("rust"), Some('r'));
}
```

Non viene associato alcun motivo all'assenza. Per diagnosticare errori diversi usa `Result`; per convertire `Option` in `Result` scegli prima un errore con `ok_or` o `ok_or_else`.

## API / Sintassi

### Conversione dell'errore con From

```rust
use std::num::ParseIntError;

#[derive(Debug, PartialEq)]
enum ReadError {
    InvalidNumber(ParseIntError),
}

impl From<ParseIntError> for ReadError {
    fn from(error: ParseIntError) -> Self {
        Self::InvalidNumber(error)
    }
}

fn parse_number(raw: &str) -> Result<u32, ReadError> {
    let number = raw.parse::<u32>()?;
    Ok(number)
}

fn main() {
    assert_eq!(parse_number("7"), Ok(7));
    assert!(matches!(parse_number("bad"), Err(ReadError::InvalidNumber(_))));
}
```

Serve una conversione dall'errore prodotto a quello restituito: `From<ParseIntError> for ReadError`, non il contrario. Implementare soltanto `Error` non basta. `map_err(ReadError::InvalidNumber)?` e l'alternativa locale senza implementazione di `From`.

`From` non puo catturare automaticamente il percorso, l'ID o altri dati della chiamata. Per aggiungere contesto specifico usa `map_err(|source| ... )` mantenendo la causa, senza includere segreti o payload arbitrari nel messaggio.

### Il confine e la closure, non il ciclo

```rust
fn main() {
    let parse_one = |raw: &str| -> Result<u8, std::num::ParseIntError> {
        let number = raw.parse::<u8>()?;
        Ok(number)
    };

    let mut results = Vec::new();
    for raw in ["1", "bad", "2"] {
        results.push(parse_one(raw));
    }
    assert_eq!(results.len(), 3);
    assert_eq!(results[0], Ok(1));
    assert!(results[1].is_err());
    assert_eq!(results[2], Ok(2));
}
```

Il fallimento termina `parse_one`, non `main`. Con `?` scritto direttamente nel corpo della funzione esterna, invece, termina quella funzione, anche se si trova dentro un `for`, un `if` o un normale blocco `{ ... }`.

In un blocco `async` il confine e il risultato del future: `operation().await?` propaga l'errore **dopo** l'attesa. `?` da solo non attende un future.

## Esempio pratico

### Leggere una porta da un file

Programma in sola lettura. Senza argomenti non accede al filesystem; con un percorso legge un piccolo file UTF-8 contenente un numero, per esempio `8080` seguito da newline.

```rust
use std::{error::Error, fs, io, path::Path};

fn read_port(path: &Path) -> Result<u16, Box<dyn Error>> {
    let text = fs::read_to_string(path)?;
    let port = text.trim().parse::<u16>()?;
    if port == 0 {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "port must be nonzero",
        ).into());
    }
    Ok(port)
}

fn main() -> Result<(), Box<dyn Error>> {
    let Some(path) = std::env::args_os().nth(1) else {
        return Ok(());
    };
    let port = read_port(Path::new(&path))?;
    println!("port: {port}");
    Ok(())
}
```

In un progetto Cargo, passando un file gia esistente:

```sh
cargo run -- ./port.txt
```

- `read_to_string` restituisce `io::Error` anche per UTF-8 non valido; il parsing restituisce `ParseIntError`.
- `Box<dyn Error>` riceve entrambi tramite conversioni standard: conserva l'oggetto errore, ma non espone un enum di casi esaustivo.
- `main` che restituisce `Err` termina con esito non riuscito e diagnostica di debug. Per messaggi e codici personalizzati gestisci l'errore esplicitamente.
- Percorsi relativi dipendono dalla directory corrente. Il file viene letto tutto in memoria, senza limite applicativo di dimensione.
- `trim` accetta spazi ai margini; `+80` e valido, zero viene rifiutato per scelta del demo. Non legge TOML, non apre socket e non verifica la disponibilita della porta.
- Il demo non aggiunge contesto del percorso all'errore: un'applicazione con piu file dovrebbe farlo. Per thread/task che lo richiedono puo servire `Box<dyn Error + Send + Sync>`, non aggiungere questi vincoli senza motivo.

## Varianti

### Uscita anticipata non significa rollback

```rust
fn append_numbers(
    output: &mut Vec<u8>,
    values: &[&str],
) -> Result<(), std::num::ParseIntError> {
    for raw in values {
        let number = raw.parse::<u8>()?;
        output.push(number);
    }
    Ok(())
}

fn main() {
    let mut output = vec![9];
    assert!(append_numbers(&mut output, &["1", "bad", "2"]).is_err());
    assert_eq!(output, vec![9, 1]);
}
```

Il `?` esce dall'intera funzione e i valori locali vengono distrutti secondo le regole di `Drop`. Gli effetti gia applicati al vettore del chiamante restano. Se il contratto richiede nessuna modifica in caso di parsing fallito, valida prima in un vettore temporaneo, poi aggiorna quello finale. Questo non crea una transazione per filesystem o database.

`?` funziona anche con `ControlFlow` e alcune combinazioni di `Poll` previste dalla standard library: non e limitato in assoluto a `Result` e `Option`. Per il primo vedi [[Programmazione/Rust/Pagine/Control flow avanzato|Control flow avanzato]]. Il trait `Try` per implementazioni personalizzate rimane un'API nightly nella baseline: non serve implementarlo per gli esempi di questa nota.

## Errori comuni

### Option non diventa Result automaticamente

Controesempio **non compilabile**, E0277:

```rust
fn required(raw: Option<&str>) -> Result<&str, &'static str> {
    let value = raw?;
    Ok(value)
}

fn main() {}
```

Correzione: `let value = raw.ok_or("missing value")?;`. Nella direzione opposta, `result.ok()?` e valido in una funzione `Option`, ma **scarta l'errore**: usalo solo quando questa perdita e intenzionale.

### main con ritorno unit

Controesempio **non compilabile**, E0277:

```rust
fn main() {
    let number = "42".parse::<u32>()?;
    println!("{number}");
}
```

Il fatto che questo literal sia valido non cambia il tipo di ritorno. Dichiara un `main -> Result<(), E>` con `Ok(())` finale oppure gestisci il `Result` localmente.

- Una closure passata a `for_each` deve restituire `()`: per interrompere fallibilmente considera `try_for_each`.
- `?` non cattura panic, non effettua logging e non aggiunge contesto da solo.
- Un normale blocco non isola `?`: per un confine locale compatibile usa una funzione o closure.

## Checklist

- Quale funzione, closure o future termina al fallimento?
- Il tipo in uscita e compatibile e la conversione dell'errore esiste?
- La conversione conserva le informazioni utili?
- Il codice dopo `?` deve davvero essere saltato?
- Quali effetti possono essere gia avvenuti?
- Il chiamante ha una policy di gestione, non solo ulteriore propagazione?

## Collegamenti

- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/Control flow avanzato|Control flow avanzato]]

## Fonti

Riferimento verificato: Rust 1.99.1, edition 2024. Esempi senza feature nightly; nessuna MSRV complessiva dichiarata.

- [Rust Reference: try propagation](https://doc.rust-lang.org/reference/expressions/operator-expr.html#the-try-propagation-expression).
- [Rust Book: propagazione e main](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html).
- [Trait From e conversione degli errori](https://doc.rust-lang.org/std/convert/trait.From.html).
- [fs::read_to_string](https://doc.rust-lang.org/std/fs/fn.read_to_string.html).
- [Trait Try: stato dell'API](https://doc.rust-lang.org/std/ops/trait.Try.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

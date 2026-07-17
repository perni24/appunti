---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [programmazione, rust, result, error-handling]
aliases:
  - "Result Rust"
  - "Gestione errori con Result"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Enums]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
  - "[[Programmazione/Rust/Pagine/Option]]"
related:
  - "[[Programmazione/Rust/Pagine/Operatore]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow]]"
---

# Result

## Sintesi

`Result<T, E>` rappresenta un'operazione che puo riuscire con un valore `T` oppure fallire con un errore `E`. E il tipo principale per la gestione degli errori recuperabili in Rust.

Le due varianti sono `Ok(T)` e `Err(E)`.

## Quando usarlo

- Quando una funzione puo fallire e il chiamante puo reagire.
- Quando serve conservare il motivo dell'errore.
- Per parsing, I/O, rete, database e validazioni.
- Quando vuoi evitare eccezioni e rendere gli errori parte della firma.

## Come funziona

`Result` e un enum generico:

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

Una funzione che puo fallire restituisce `Result`:

```rust
fn dividi(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err(String::from("divisione per zero"))
    } else {
        Ok(a / b)
    }
}
```

Il chiamante deve gestire entrambi i casi o propagare l'errore.

## API / Sintassi

```rust
match dividi(10, 2) {
    Ok(valore) => println!("{valore}"),
    Err(err) => eprintln!("errore: {err}"),
}
```

Metodi comuni:

```rust
let parsed = "42".parse::<i32>();

let valore = parsed.unwrap_or(0);
let testo = parsed.map(|n| n.to_string());
let errore_testuale = parsed.map_err(|e| e.to_string());
```

Propagazione:

```rust
fn leggi_config() -> Result<String, std::io::Error> {
    let testo = std::fs::read_to_string("config.toml")?;
    Ok(testo)
}
```

## Esempio pratico

```rust
#[derive(Debug)]
enum ConfigError {
    MissingPort,
    InvalidPort,
}

fn parse_port(input: Option<&str>) -> Result<u16, ConfigError> {
    let raw = input.ok_or(ConfigError::MissingPort)?;
    raw.parse::<u16>().map_err(|_| ConfigError::InvalidPort)
}
```

`Option` viene convertito in `Result` con `ok_or`, poi l'errore del parsing viene mappato in un errore di dominio.

## Varianti

- `Result<T, E>`: successo o errore.
- `Result<(), E>`: operazione che puo fallire ma non produce valore utile.
- `Result<Option<T>, E>`: operazione fallibile dove l'assenza e un caso normale.
- `Option<Result<T, E>>`: valore opzionale che, se presente, puo essere errore.
- Alias di tipo: `type AppResult<T> = Result<T, AppError>;`.

## Errori comuni

- Usare `String` come errore ovunque invece di un tipo strutturato.
- Usare `unwrap()` su risultati fallibili in codice di produzione.
- Perdere contesto con `map_err(|_| ...)` troppo generico.
- Confondere errore recuperabile con bug: per i bug puo essere piu adatto `panic!`.
- Creare enum errore enormi e accoppiati a troppe responsabilita.

## Checklist

- Il chiamante puo reagire all'errore?
- L'errore contiene informazioni sufficienti?
- Serve un errore di dominio o basta propagare quello sottostante?
- `?` mantiene il contesto o serve aggiungerlo?
- Il tipo di ritorno comunica chiaramente cosa puo fallire?

## Collegamenti

- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/Enums|Enums]]


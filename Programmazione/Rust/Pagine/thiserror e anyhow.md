---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [programmazione, rust, thiserror, anyhow, error-handling]
aliases:
  - "thiserror"
  - "anyhow"
  - "thiserror vs anyhow"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
related:
  - "[[Programmazione/Rust/Pagine/Error types pubblici]]"
  - "[[Programmazione/Rust/Pagine/Derive macros]]"
  - "[[Programmazione/Rust/Pagine/Operatore]]"
---

# thiserror e anyhow

## Sintesi

`thiserror` e `anyhow` sono due crate molto usate per gestire errori in Rust, ma risolvono problemi diversi. `thiserror` aiuta a definire tipi di errore strutturati. `anyhow` aiuta a propagare errori con contesto nelle applicazioni.

Regola pratica: `thiserror` per librerie e confini di API; `anyhow` per binari, CLI e codice applicativo.

## Quando usarlo

- Usa `thiserror` quando vuoi un enum errore tipizzato e pubblico.
- Usa `anyhow` quando vuoi semplicita e contesto in una applicazione.
- Usa entrambi quando una libreria espone errori tipizzati e il binario li aggrega.
- Evita `anyhow::Error` nelle API pubbliche di librerie se il chiamante deve distinguere i casi.

## Come funziona

`thiserror` deriva automaticamente `std::error::Error` e `Display`:

```rust
use thiserror::Error;

#[derive(Debug, Error)]
enum ConfigError {
    #[error("file mancante: {0}")]
    MissingFile(String),

    #[error("errore io")]
    Io(#[from] std::io::Error),
}
```

`anyhow` usa un errore dinamico con contesto:

```rust
use anyhow::{Context, Result};

fn carica(path: &str) -> Result<String> {
    std::fs::read_to_string(path)
        .with_context(|| format!("lettura config da {path}"))
}
```

## API / Sintassi

Dipendenze tipiche:

```toml
[dependencies]
thiserror = "1"
anyhow = "1"
```

Uso combinato:

```rust
use anyhow::Result;

fn main() -> Result<()> {
    let config = carica_config("config.toml")?;
    println!("{config}");
    Ok(())
}
```

## Esempio pratico

```rust
use thiserror::Error;

#[derive(Debug, Error)]
enum ParseUserError {
    #[error("campo nome mancante")]
    MissingName,

    #[error("eta non valida")]
    InvalidAge(#[from] std::num::ParseIntError),
}

fn parse_age(input: &str) -> Result<u8, ParseUserError> {
    let age = input.parse::<u8>()?;
    Ok(age)
}
```

`#[from]` genera la conversione necessaria per usare `?` sugli errori compatibili.

## Varianti

- `thiserror::Error`: derive per errori tipizzati.
- `#[error("...")]`: messaggio `Display`.
- `#[from]`: conversione automatica da errore sorgente.
- `#[source]`: causa sottostante.
- `anyhow::Result<T>`: alias per `Result<T, anyhow::Error>`.
- `Context`: aggiunge contesto agli errori propagati.

## Errori comuni

- Usare `anyhow` nella API pubblica di una libreria quando serve tipizzazione.
- Creare enum con varianti troppo generiche, per esempio solo `Other(String)`.
- Dimenticare contesto in applicazioni CLI o servizi.
- Usare `thiserror` come sostituto della progettazione degli errori.
- Esporre dettagli interni dell'implementazione in un errore pubblico stabile.

## Checklist

- Stai scrivendo libreria o applicazione?
- Il chiamante deve distinguere varianti di errore?
- Serve aggiungere contesto operativo al punto di fallimento?
- `#[from]` conserva abbastanza informazione?
- L'errore pubblico e stabile rispetto alle future modifiche interne?

## Collegamenti

- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]
- [[Programmazione/Rust/Pagine/Derive macros|Derive macros]]


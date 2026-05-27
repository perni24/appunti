---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - cli-e-tooling
aliases:
  - "Error reporting"
  - "Report degli errori"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow]]"
  - "[[Programmazione/Rust/Pagine/CLI con clap]]"
related:
  - "[[Programmazione/Rust/Pagine/Logging con log]]"
  - "[[Programmazione/Rust/Pagine/Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Error types pubblici]]"
---

# Error reporting

## Sintesi

L'**error reporting** riguarda come un'applicazione comunica gli errori a chi la usa o la gestisce. Non coincide con l'error handling interno: puoi avere un buon uso di `Result` ma produrre messaggi finali confusi, troppo tecnici o privi di contesto.

In una CLI Rust, un buon report di errore deve dire cosa e fallito, perche, e possibilmente cosa puo fare l'utente. Nei servizi, deve anche integrarsi con logging, tracing e codici di uscita o stato.

## Quando usarlo

Serve curare l'error reporting quando:

- una CLI e usata da persone o script;
- un errore puo avere cause operative diverse;
- devi distinguere errore utente, bug e problema ambientale;
- vuoi conservare la chain degli errori;
- vuoi stampare messaggi leggibili senza perdere dettagli diagnostici;
- devi scegliere exit code coerenti.

Per librerie, evita di stampare direttamente: restituisci errori ricchi e lascia all'applicazione decidere come presentarli.

## Come funziona

Una strategia pulita separa tre livelli:

- **errore di dominio**: tipo Rust che descrive il problema;
- **propagazione**: uso di `Result`, `?`, `thiserror`, `anyhow` o equivalenti;
- **presentazione**: messaggio finale, log, tracing, exit code.

In applicazioni binarie e CLI, spesso si usa un errore applicativo flessibile per propagare contesto. Nelle librerie pubbliche, invece, e preferibile un enum di errori stabile e documentato.

La presentazione deve evitare due estremi:

- messaggio troppo generico: "error";
- dump tecnico incomprensibile per l'utente.

## API / Sintassi

Errore pubblico con `thiserror`:

```rust
use std::path::PathBuf;

use thiserror::Error;

#[derive(Debug, Error)]
enum AppError {
    #[error("configuration file not found: {0}")]
    ConfigNotFound(PathBuf),

    #[error("invalid configuration: {0}")]
    InvalidConfig(String),
}
```

Errore applicativo con contesto:

```rust
use anyhow::{Context, Result};

fn load_text(path: &std::path::Path) -> Result<String> {
    std::fs::read_to_string(path)
        .with_context(|| format!("failed to read {}", path.display()))
}
```

`Context` conserva la causa originale e aggiunge informazione utile per il report finale.

## Esempio pratico

`main` con report controllato:

```rust
use anyhow::{Context, Result};
use clap::Parser;

#[derive(Debug, Parser)]
struct Cli {
    path: std::path::PathBuf,
}

fn main() {
    if let Err(error) = run() {
        eprintln!("error: {error:#}");
        std::process::exit(1);
    }
}

fn run() -> Result<()> {
    let cli = Cli::parse();

    let content = std::fs::read_to_string(&cli.path)
        .with_context(|| format!("cannot read {}", cli.path.display()))?;

    println!("{}", content.len());
    Ok(())
}
```

`{error:#}` mostra una chain piu leggibile con `anyhow`, utile nelle CLI. Per output macchina conviene progettare formati dedicati invece di parsare messaggi testuali.

## Varianti

- **Errore libreria**: enum esplicito, stabile, documentato.
- **Errore applicativo**: contesto ricco, spesso con `anyhow`.
- **Errore utente**: messaggio breve e azionabile.
- **Errore diagnostico**: log o trace con dettagli tecnici.
- **Exit code**: segnala a shell e CI il tipo di fallimento.
- **Report colorato**: utile nelle CLI interattive, da disabilitare in contesti non TTY se necessario.

## Errori comuni

- Stampare errori dentro librerie.
- Usare `unwrap()` e `expect()` in percorsi utente.
- Perdere la causa originale convertendo tutto in `String`.
- Mostrare backtrace o dettagli interni a utenti non tecnici.
- Non distinguere errori attesi da bug.
- Usare sempre exit code `1` anche quando servono codici specifici.
- Loggare lo stesso errore in troppi livelli creando rumore.

## Checklist

- L'errore finale dice quale operazione e fallita?
- La causa originale e preservata?
- L'utente riceve un messaggio azionabile?
- I dettagli tecnici finiscono in log/tracing quando opportuno?
- Le librerie restituiscono errori invece di stampare?
- Gli exit code sono coerenti?
- I segreti non compaiono nei messaggi?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/Error types pubblici]]
- [[Programmazione/Rust/Pagine/CLI con clap]]
- [[Programmazione/Rust/Pagine/Logging con log]]
- [[Programmazione/Rust/Pagine/Tracing con tracing]]

---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - cli-e-tooling
aliases:
  - "Logging con log"
  - "log crate"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
  - "[[Programmazione/Rust/Pagine/Configurazione applicativa]]"
related:
  - "[[Programmazione/Rust/Pagine/Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Error reporting]]"
  - "[[Programmazione/Rust/Pagine/CLI con clap]]"
---

# Logging con log

## Sintesi

`log` e una facciata di logging per Rust. Le librerie possono emettere eventi con macro come `info!`, `warn!` ed `error!` senza scegliere direttamente dove mandarli. L'applicazione finale installa un backend di logging, per esempio verso terminale, file o sistema di osservabilita.

Questa separazione e importante: una crate di libreria non dovrebbe imporre il logger dell'applicazione che la usa.

## Quando usarlo

Usa `log` quando:

- scrivi una libreria che deve emettere messaggi diagnostici;
- vuoi logging semplice in una CLI;
- non ti serve contesto strutturato complesso;
- vuoi compatibilita con molte crate dell'ecosistema;
- devi distinguere messaggi utente da diagnostica sviluppatore.

Per applicazioni async, backend complessi o osservabilita strutturata, spesso `tracing` e piu adatto.

## Come funziona

`log` definisce macro e livelli, ma non registra output da solo. Senza inizializzare un logger, i messaggi possono essere ignorati.

Livelli principali:

- `error!`: errore importante;
- `warn!`: condizione anomala ma non necessariamente fatale;
- `info!`: eventi importanti del flusso normale;
- `debug!`: dettagli utili in sviluppo;
- `trace!`: informazioni molto dettagliate.

Il livello effettivamente visibile dipende dal backend e dalla configurazione, spesso tramite variabili d'ambiente o opzioni CLI.

Una distinzione utile:

- **output utente**: risultato del comando, stampato su stdout;
- **errori utente**: messaggi leggibili su stderr;
- **log**: diagnostica configurabile per debug e produzione.

## API / Sintassi

Uso base:

```rust
use log::{debug, error, info, warn};

fn run() {
    info!("starting application");
    debug!("loading cache");
    warn!("cache is empty");
    error!("operation failed");
}
```

In una applicazione devi inizializzare un backend:

```rust
fn main() {
    env_logger::init();
    log::info!("logger initialized");
}
```

Una libreria invece di solito non chiama `init()`:

```rust
pub fn parse_input(input: &str) -> Result<(), String> {
    log::debug!("parsing input with {} bytes", input.len());

    if input.is_empty() {
        log::warn!("empty input");
    }

    Ok(())
}
```

## Esempio pratico

Logging configurato da un flag CLI:

```rust
use clap::Parser;
use log::LevelFilter;

#[derive(Debug, Parser)]
struct Cli {
    #[arg(short, long, action = clap::ArgAction::Count)]
    verbose: u8,
}

fn main() {
    let cli = Cli::parse();
    init_logging(cli.verbose);

    log::info!("application started");
}

fn init_logging(verbose: u8) {
    let level = match verbose {
        0 => LevelFilter::Warn,
        1 => LevelFilter::Info,
        2 => LevelFilter::Debug,
        _ => LevelFilter::Trace,
    };

    env_logger::Builder::new()
        .filter_level(level)
        .init();
}
```

Il flag `-v` aumenta progressivamente il dettaglio senza cambiare il codice applicativo.

## Varianti

- **Logging in libreria**: usa `log`, non inizializza backend.
- **Logging in applicazione**: inizializza backend all'avvio.
- **Logging testuale**: leggibile in terminale.
- **Logging JSON**: utile per sistemi centralizzati.
- **Tracing strutturato**: alternativa piu ricca tramite `tracing`.
- **Output utente senza log**: usa `println!`/`eprintln!` con criterio, non per diagnostica.

## Errori comuni

- Aspettarsi output senza aver inizializzato un logger.
- Inizializzare il logger dentro una libreria.
- Usare `info!` per dati che dovrebbero essere output del comando.
- Loggare segreti, token o dati personali.
- Usare `debug!` in percorsi molto caldi con formattazione costosa.
- Non distinguere stdout e stderr in una CLI.
- Rendere il logging troppo rumoroso di default.

## Checklist

- Il backend di logging e inizializzato solo dall'applicazione?
- Le librerie usano `log` senza imporre un logger?
- I livelli sono coerenti?
- I log non contengono segreti?
- Il livello e configurabile da CLI o ambiente?
- stdout e stderr hanno ruoli separati?
- Per contesto strutturato serve passare a `tracing`?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Tracing con tracing]]
- [[Programmazione/Rust/Pagine/Error reporting]]
- [[Programmazione/Rust/Pagine/Configurazione applicativa]]
- [[Programmazione/Rust/Pagine/CLI con clap]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico]]

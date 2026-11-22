---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - cli-e-tooling
aliases:
  - Logging con log
  - log crate
prerequisites:
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]"
  - "[[Programmazione/Rust/Pagine/Configurazione applicativa|Configurazione applicativa]]"
related:
  - "[[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Error reporting|Error reporting]]"
  - "[[Programmazione/Rust/Pagine/CLI con clap|CLI con clap]]"
title: Logging con log
---

# Logging con log

## Sintesi

La crate `log` permette a una libreria di dire **che cosa è successo** senza decidere **dove scriverlo**. Una chiamata a `debug!` descrive un evento con livello, target e messaggio. È l'eseguibile a installare un *backend*, per esempio `env_logger`, che filtra gli eventi e scrive quelli accettati. Senza backend non c'è output di log: gli eventi precedenti all'inizializzazione non vengono conservati per dopo.

Per una CLI, tieni separati tre contratti: **stdout** per il risultato consumabile da altri programmi, **stderr** per la diagnostica, **codice di uscita** per successo o fallimento. `error!` da sola non restituisce un errore e non interrompe il processo. Viceversa, un file mancante deve produrre un messaggio utile e un codice di errore anche con il logging disattivato.

## Livelli e target

| Livello | Quando ha senso | Esempio |
| --- | --- | --- |
| `error!` | Un'operazione è fallita e chi monitora il processo deve saperlo. | Un servizio non riesce a salvare un aggiornamento. |
| `warn!` | Il programma prosegue, ma la condizione merita attenzione. | Un archivio che ci si aspettava popolato è vuoto. |
| `info!` | Evento normale significativo. | Scansione completata. |
| `debug!` | Dati utili per spiegare un comportamento. | Quante righe hanno superato un filtro. |
| `trace!` | Passi molto frequenti, da abilitare selettivamente. | Posizione di ogni riga saltata. |

Un filtro `info` ammette `error`, `warn` e `info`, non solo i messaggi `info!`. Il **target** predefinito è il percorso del modulo Rust che emette l'evento, non il nome del file sorgente. Con `env_logger` si possono usare direttive separate da virgole: `warn,note_log::scan=debug` lascia il resto a `warn` e abilita `debug` per il prefisso più specifico. Il package Cargo del laboratorio si chiama `note-log`; nel target Rust si usa l'underscore: `note_log::scan`.

## Laboratorio: una libreria, una CLI

In una directory di prova, con Rust/Cargo stabile che supporti l'edition 2024 e un linker per l'host:

```sh
cargo new --bin --vcs none note-log
```

```sh
cd note-log
```

Sotto `[dependencies]` in `Cargo.toml` inserisci queste righe. Il primo build deve poter reperire le dipendenze; per riprodurre la stessa risoluzione conserva anche `Cargo.lock`.

```toml
log = "=0.4.28"
env_logger = "=0.11.8"
clap = { version = "=4.5.50", features = ["derive"] }
```

### La libreria emette, ma non installa il logger

Crea `src/lib.rs`. Il modulo conta le righe non vuote dopo `trim()`. Registra quantità e posizioni, mai il contenuto delle righe:

```rust
pub mod scan {
    pub fn count_nonempty(input: &str) -> usize {
        let mut count = 0;
        for (index, line) in input.lines().enumerate() {
            if line.trim().is_empty() {
                log::trace!("riga vuota: {}", index + 1);
            } else {
                count += 1;
            }
        }
        log::debug!("righe non vuote: {count}");
        if count == 0 {
            log::warn!("nessuna riga non vuota");
        }
        count
    }
}
```

### Il binario decide filtro e destinazione

Sostituisci `src/main.rs`. Qui la politica è **flag esplicito > ambiente > default applicativo**: senza `-v` si legge `RUST_LOG`, e in sua assenza si usa `warn`. Con almeno un `-v` si usa soltanto la soglia della CLI, senza ereditare direttive per singolo target. È una scelta del programma, non una precedenza automatica di clap o di `log`.

```rust
use clap::{ArgAction, Parser};
use env_logger::{Builder, Env, Target};
use log::LevelFilter;
use std::{fs, io::Write, path::PathBuf, process::ExitCode};

#[derive(Parser)]
struct Cli {
    /// File UTF-8 da esaminare.
    path: PathBuf,
    /// Aumenta la verbosità: -v info, -vv debug, -vvv trace.
    #[arg(short, long, action = ArgAction::Count)]
    verbose: u8,
}

fn init_logging(verbose: u8) -> Result<(), log::SetLoggerError> {
    let mut builder = if verbose == 0 {
        Builder::from_env(Env::default().default_filter_or("warn"))
    } else {
        let mut b = Builder::new();
        b.filter_level(match verbose {
            1 => LevelFilter::Info,
            2 => LevelFilter::Debug,
            _ => LevelFilter::Trace,
        });
        b
    };
    builder.target(Target::Stderr);
    builder.format(|buf, record| {
        writeln!(buf, "{} {}: {}", record.level(), record.target(), record.args())
    });
    builder.try_init()
}

fn main() -> ExitCode {
    let cli = Cli::parse();
    if let Err(err) = init_logging(cli.verbose) {
        eprintln!("logger non inizializzato: {err}");
        return ExitCode::FAILURE;
    }
    match fs::read_to_string(&cli.path) {
        Ok(text) => {
            let count = note_log::scan::count_nonempty(&text);
            log::info!("scansione completata");
            println!("{count}");
            ExitCode::SUCCESS
        }
        Err(err) => {
            eprintln!("{}: {err}", cli.path.display());
            ExitCode::FAILURE
        }
    }
}
```

Il logger globale si installa **una sola volta**. `try_init()` permette di gestire una seconda registrazione come `Err`; `init()` può andare in panic. Inizia nel binario prima del lavoro applicativo, non in una funzione di libreria chiamata da più punti. Nel programma sopra il formato è esplicito; non dipende dal formato predefinito di `env_logger`.

### Verificare cosa si vede

Crea `esempio.txt` in UTF-8 con questo contenuto, inclusa la riga vuota:

```text
prima

seconda
```

Compila una volta. Per osservare i canali del solo programma usa l'eseguibile: `cargo run` può aggiungere i messaggi di Cargo su stderr.

```sh
cargo build
```

Dalla radice del progetto, in una **nuova PowerShell di prova** senza `RUST_LOG` impostata:

```powershell
.\target\debug\note-log.exe esempio.txt
```

```powershell
.\target\debug\note-log.exe -vvv esempio.txt
```

Per filtrare soltanto il modulo della libreria, assegna la variabile nella sessione di prova. Chiudila alla fine per non mantenere l'impostazione:

```powershell
$env:RUST_LOG = 'warn,note_log::scan=debug'
```

```powershell
.\target\debug\note-log.exe esempio.txt
```

In una shell POSIX, l'equivalente limitato a una sola invocazione è:

```sh
RUST_LOG=warn,note_log::scan=debug ./target/debug/note-log esempio.txt
```

| Condizione su `esempio.txt` | stdout | Eventi su stderr |
| --- | --- | --- |
| Nessun flag, ambiente non impostato | `2` | Nessuno: non ci sono anomalie e `info` è sotto la soglia di visibilità scelta. |
| `-vvv` | `2` | `TRACE note_log::scan: riga vuota: 2`, poi `DEBUG` per il conteggio e `INFO` per la fine della scansione. |
| `RUST_LOG=warn,note_log::scan=debug`, nessun flag | `2` | Solo `DEBUG note_log::scan: righe non vuote: 2`. L'evento `info!` è emesso dal binario, non da `scan`. |
| Stesso ambiente, con `-v` | `2` | Solo `INFO note_log: scansione completata`: il flag sostituisce tutto il filtro ambiente. |

Con un file vuoto il risultato è `0` e il processo ha successo, anche se il backend scrive un `WARN`. Con un file inesistente stdout resta vuoto, il processo fallisce e `eprintln!` segnala il percorso: `RUST_LOG=off` spegne i log, **non** gli errori rivolti a chi invoca il programma.

### Controprova senza backend

Crea `examples/senza_backend.rs` (crea anche la directory `examples`). È un altro eseguibile: usa la stessa libreria ma non installa alcun logger.

```rust
fn main() {
    println!("{}", note_log::scan::count_nonempty("prima\n\nseconda"));
}
```

```sh
cargo run --quiet --example senza_backend
```

L'output del programma è solo `2`, anche se l'ambiente richiede `trace`: **la facciata non legge `RUST_LOG`**. Nell'altro eseguibile è `Builder::from_env` a interpretarla. Al contrario, con la semplice `env_logger::init()`, senza filtro d'ambiente, il default del backend è `error`: non aspettarti di vedere subito un `info!`.

## Errori da evitare

- Non affidare operazioni necessarie agli argomenti di una macro di log: potrebbero non essere valutati quando il livello è disabilitato. Se preparare dettagli diagnostici è costoso, usa `log::log_enabled!(target: "note_log::scan", log::Level::Debug)` prima della preparazione e lo stesso target nel messaggio.
- Non mettere segreti, contenuti dei file o dati personali nei log di debug. Un filtro regola la visibilità, **non** rende sicuri i dati già inseriti in un messaggio. Se ti serve JSON, scegli un formatter o un backend dedicato: non basta cambiare il livello.
- Non usare il livello come gestione degli errori e non duplicare la stessa diagnosi a ogni strato: restituisci un `Result` e decidi al confine cosa mostrare all'utente. Per associare eventi a una richiesta che attraversa task asincroni, valuta gli *span* di [[Programmazione/Rust/Pagine/Tracing con tracing|tracing]].
- Se un evento non appare nemmeno con `trace`, controlla inizializzazione, target e canale. Controlla anche le feature `max_level_*` o `release_max_level_*` di `log`: un evento escluso in compilazione non si riattiva con una variabile d'ambiente.

## Fonti ufficiali

- [log 0.4.28: facciata, librerie, binari e filtri di compilazione](https://docs.rs/log/0.4.28/log/)
- [log 0.4.28: log_enabled!](https://docs.rs/log/0.4.28/log/macro.log_enabled.html)
- [env_logger 0.11.8: livelli e direttive per target](https://docs.rs/env_logger/0.11.8/env_logger/)
- [env_logger 0.11.8: Builder e try_init](https://docs.rs/env_logger/0.11.8/env_logger/struct.Builder.html#method.try_init)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]
- [[Programmazione/Rust/Pagine/Error reporting|Error reporting]]
- [[Programmazione/Rust/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Programmazione/Rust/Pagine/CLI con clap|CLI con clap]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]

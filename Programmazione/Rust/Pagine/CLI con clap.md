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
  - "CLI con clap"
  - "clap"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
related:
  - "[[Programmazione/Rust/Pagine/Configurazione applicativa]]"
  - "[[Programmazione/Rust/Pagine/Error reporting]]"
  - "[[Programmazione/Rust/Pagine/Packaging e release]]"
  - "[[Programmazione/Rust/Pagine/OsStr e OsString]]"
---

# CLI con clap

## Sintesi

`clap` e una crate Rust per costruire interfacce a riga di comando. Gestisce parsing di argomenti, flag, subcommand, help, validazione di base e generazione automatica del testo d'uso.

In una CLI Rust, `clap` evita di scrivere manualmente parsing fragile di `std::env::args()` e permette di rappresentare il contratto della command line con tipi Rust. Il risultato e piu leggibile, testabile e vicino al modello di dominio dell'applicazione.

## Quando usarlo

Usa `clap` quando la tua applicazione deve esporre:

- opzioni come `--config path.toml`;
- flag booleani come `--verbose`;
- argomenti posizionali;
- subcommand come `init`, `build`, `serve`;
- validazioni semplici sui valori;
- messaggi di help coerenti.

Per script molto piccoli `std::env::args_os()` puo bastare. Per strumenti destinati ad altri utenti, automazione o CI, `clap` e quasi sempre una scelta piu robusta.

## Come funziona

`clap` puo essere usato in due stili principali:

- **derive API**: definisci struct ed enum annotate con attributi;
- **builder API**: costruisci il comando con chiamate esplicite.

Lo stile derive e idiomatico per molte CLI perche rende il contratto visibile nei tipi:

- una `struct` rappresenta le opzioni globali;
- un `enum` rappresenta i subcommand;
- i campi rappresentano flag, option e positional argument;
- il tipo del campo guida il parsing.

Una CLI ben progettata separa:

- parsing degli argomenti;
- caricamento configurazione;
- inizializzazione logging/tracing;
- logica applicativa;
- error reporting verso l'utente.

Questo evita che `main` diventi un blocco unico difficile da testare.

## API / Sintassi

Esempio base con derive:

```rust
use clap::{Parser, Subcommand};

#[derive(Debug, Parser)]
#[command(name = "notes")]
#[command(about = "Gestisce un archivio di note")]
struct Cli {
    #[arg(short, long)]
    config: Option<std::path::PathBuf>,

    #[arg(short, long, action = clap::ArgAction::Count)]
    verbose: u8,

    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    Add {
        title: String,
    },
    List,
}

fn main() {
    let cli = Cli::parse();
    println!("{cli:#?}");
}
```

Elementi frequenti:

- `#[derive(Parser)]`: abilita parsing della struct principale;
- `#[derive(Subcommand)]`: modella subcommand;
- `#[arg(short, long)]`: genera `-c` e `--config`;
- `#[command(subcommand)]`: collega un enum di comandi;
- `PathBuf`: tipo preferibile per path;
- `ArgAction::Count`: conta ripetizioni come `-vvv`.

## Esempio pratico

Una struttura pulita per una CLI separa parsing ed esecuzione:

```rust
use std::path::PathBuf;

use clap::{Parser, Subcommand};

#[derive(Debug, Parser)]
struct Cli {
    #[arg(long)]
    config: Option<PathBuf>,

    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    Check {
        path: PathBuf,
    },
    Format {
        path: PathBuf,
        #[arg(long)]
        write: bool,
    },
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();
    run(cli)
}

fn run(cli: Cli) -> Result<(), Box<dyn std::error::Error>> {
    match cli.command {
        Command::Check { path } => {
            println!("checking {}", path.display());
        }
        Command::Format { path, write } => {
            println!("formatting {} write={write}", path.display());
        }
    }

    Ok(())
}
```

`run` puo essere testata passando una `Cli` costruita a mano, senza dipendere dalla riga di comando reale.

## Varianti

- **Derive API**: compatta, tipizzata, adatta alla maggior parte dei casi.
- **Builder API**: utile per CLI generate dinamicamente o molto personalizzate.
- **Subcommand nested**: comandi annidati per strumenti complessi.
- **Value enum**: limita un argomento a valori ammessi.
- **Shell completions**: genera completamenti per shell quando integrato nel packaging.
- **args_os**: alternativa standard per parsing manuale di argomenti non Unicode.

## Errori comuni

- Usare `String` per path invece di `PathBuf`.
- Mettere troppa logica dentro i metodi di parsing.
- Rendere obbligatoria configurazione che potrebbe avere default sensati.
- Non distinguere messaggi per utente finale da log diagnostici.
- Non testare subcommand e combinazioni di flag.
- Usare `unwrap()` in `main` ottenendo errori poco leggibili.
- Cambiare nomi di flag senza considerare compatibilita per script e CI.

## Checklist

- La CLI ha help leggibile?
- I path sono `PathBuf` e non `String`?
- I subcommand riflettono azioni reali dell'utente?
- Parsing, configurazione e logica sono separati?
- Gli errori sono mostrati in modo utile?
- Le opzioni hanno default chiari?
- I flag pubblici sono trattati come API stabile?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Configurazione applicativa]]
- [[Programmazione/Rust/Pagine/Error reporting]]
- [[Programmazione/Rust/Pagine/Packaging e release]]
- [[Programmazione/Rust/Pagine/Path e PathBuf]]
- [[Programmazione/Rust/Pagine/OsStr e OsString]]
- [[Programmazione/Rust/Pagine/Cargo]]

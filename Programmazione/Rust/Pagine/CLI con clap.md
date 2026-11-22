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
  - CLI con clap
  - clap
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo|Cargo]]"
  - "[[Programmazione/Rust/Pagine/Structs|Structs]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]"
related:
  - "[[Programmazione/Rust/Pagine/Configurazione applicativa|Configurazione applicativa]]"
  - "[[Programmazione/Rust/Pagine/Error reporting|Error reporting]]"
  - "[[Programmazione/Rust/Pagine/Packaging e release|Packaging e release]]"
  - "[[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]"
title: CLI con clap
---

# CLI con clap

## Sintesi

`clap` trasforma gli argomenti della riga di comando in valori Rust e genera help e diagnostica dalla stessa definizione. Può stabilire che `--unit words` sia valido e che sia stato fornito un percorso; **non** stabilisce che il file esista, sia leggibile o contenga testo UTF-8. Questi ultimi sono compiti del programma.

La **derive API** è adatta quando i comandi sono noti in compilazione: una struct descrive gli argomenti e un enum i sottocomandi. La **builder API** permette di comporre la stessa interfaccia esplicitamente, per esempio se alcune opzioni dipendono da informazioni disponibili all'avvio. Per un piccolo programma con un solo argomento può invece bastare `std::env::args_os()`.

## Il contratto della CLI

Il laboratorio costruisce `notainfo`, uno strumento che non modifica i file:

| Invocazione | Risultato atteso |
| --- | --- |
| `notainfo count <PATH>` | Numero di righe di un file UTF-8. Un file vuoto ha zero righe; il terminatore finale non aggiunge una riga vuota. |
| `notainfo count <PATH> --unit words` | Numero di sequenze separate da spazi bianchi Unicode, secondo `split_whitespace`. Non è un conteggio linguistico delle parole. |
| `notainfo bytes <PATH>` | Numero di byte letti, anche per un file che non è testo UTF-8. |
| `notainfo -v count <PATH>` | Stesso risultato su stdout; su stderr appaiono il livello di verbosità e il percorso. `-vv` porta il livello a 2. |

Il **percorso** è un argomento posizionale obbligatorio di tipo `PathBuf`: non deve essere convertito in `String` per aprire il file. Il contenuto ha un contratto separato: solo il sottocomando `count` usa `read_to_string`. Per semplicità entrambi i comandi caricano tutto il file in memoria; per file grandi conviene una lettura a blocchi o con buffer.

## Laboratorio

Da una directory di prova, con una toolchain Rust stabile che supporti l'edition 2024 e un linker per l'host:

```sh
cargo new --bin --vcs none notainfo
```

```sh
cd notainfo
```

In `Cargo.toml`, **sotto la sezione `[dependencies]` già presente**, aggiungi la riga seguente. La versione è fissata per il laboratorio; la feature `derive` abilita le macro. Al primo avvio Cargo deve poter reperire le dipendenze. Per riprodurre la stessa risoluzione in un'applicazione, conserva anche `Cargo.lock`.

```toml
clap = { version = "=4.5.50", features = ["derive"] }
```

Sostituisci `src/main.rs`:

```rust
use clap::{ArgAction, Parser, Subcommand, ValueEnum};
use std::{fs, io, path::{Path, PathBuf}, process::ExitCode};

#[derive(Parser)]
#[command(name = "notainfo", version, about = "Legge un file senza modificarlo")]
struct Cli {
    /// Mostra informazioni diagnostiche; ripetibile.
    #[arg(short, long, global = true, action = ArgAction::Count)]
    verbose: u8,

    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Conta righe o parole in un testo UTF-8.
    Count {
        path: PathBuf,
        #[arg(long, value_enum, default_value_t = Unit::Lines)]
        unit: Unit,
    },
    /// Conta i byte senza decodificare il contenuto.
    Bytes { path: PathBuf },
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, ValueEnum)]
enum Unit { Lines, Words }

impl Command {
    fn path(&self) -> &Path {
        match self {
            Self::Count { path, .. } | Self::Bytes { path } => path,
        }
    }
}

fn run(command: &Command) -> io::Result<usize> {
    match command {
        Command::Count { path, unit } => {
            let text = fs::read_to_string(path)?;
            Ok(match unit {
                Unit::Lines => text.lines().count(),
                Unit::Words => text.split_whitespace().count(),
            })
        }
        Command::Bytes { path } => Ok(fs::read(path)?.len()),
    }
}

fn main() -> ExitCode {
    let cli = Cli::parse();
    let path = cli.command.path();
    if cli.verbose > 0 {
        eprintln!("verbose={} input={}", cli.verbose, path.display());
    }
    match run(&cli.command) {
        Ok(n) => { println!("{n}"); ExitCode::SUCCESS }
        Err(err) => { eprintln!("{}: {err}", path.display()); ExitCode::FAILURE }
    }
}
```

`command: Command` rende obbligatorio un sottocomando. Il campo `verbose` è davvero **globale** perché ha `global = true`: si può scrivere prima o dopo il sottocomando. Un campo sulla struct principale **non** diventa globale solo per la sua posizione. Invece `--unit` è dichiarato dentro `Count`: non è valido per `bytes`. `ValueEnum` ammette solo `lines` e `words` e li elenca nell'help del sottocomando.

### Provare l'interfaccia

```sh
cargo run -- --help
```

```sh
cargo run -- count --help
```

Crea nella directory del progetto un file UTF-8 chiamato `prova note.txt` con questo contenuto:

```text
prima riga
seconda
```

```sh
cargo run -- count "prova note.txt"
```

Il risultato è `2`. Le virgolette servono alla **shell** per passare il nome con lo spazio come singolo argomento.

```sh
cargo run -- count "prova note.txt" --unit words -vv
```

Qui stdout contiene solo `3`; la diagnostica va su stderr. Per il numero di byte:

```sh
cargo run -- bytes "prova note.txt"
```

Il numero dipende anche da LF/CRLF e dall'eventuale terminatore finale salvato dall'editor. In questi comandi il primo `--` separa gli argomenti di Cargo da quelli del programma. Per un file chiamato `-bozza.txt` serve un **secondo** separatore per dire a clap di smettere di interpretare le opzioni:

```sh
cargo run -- count -- -bozza.txt
```

### Interpretare il risultato

| Situazione | Chi risponde | Esito del binario |
| --- | --- | --- |
| `--help` o `--version` | clap, senza chiamare `run` | Testo su stdout, codice 0. |
| Sottocomando sconosciuto, percorso omesso o `--unit caratteri` | clap, prima dell'accesso al file | Diagnostica su stderr, codice 2. |
| Percorso valido come argomento, ma file assente; oppure testo non UTF-8 con `count` | `run` restituisce un errore di I/O; `main` aggiunge il percorso | Diagnostica su stderr, codice 1 in questa CLI. |
| Operazione riuscita | `main` | Numero su stdout, codice 0. |

Questa tabella riguarda l'eseguibile: `cargo run` può aggiungere su stderr i **propri** messaggi di compilazione. Per uno script o un test dei canali di output costruisci il binario con `cargo build` e avvia direttamente `target/debug/notainfo` (su Windows: `target\debug\notainfo.exe`). Non usare la presenza di testo su stderr come sinonimo di fallimento: con `-v` può esserci anche quando l'esito è 0.

## Testare il parser senza terminare il processo

`Cli::parse()` è comodo in `main`: gestisce help ed errori e può terminare il processo. Nei test usa `try_parse_from`: restituisce un `Result`, senza stampare o uscire automaticamente. **Il primo elemento è il nome del programma**, non il sottocomando. Aggiungi in fondo a `src/main.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use clap::{error::ErrorKind, CommandFactory};

    #[test]
    fn schema_coerente() {
        Cli::command().debug_assert();
    }

    #[test]
    fn opzione_globale_dopo_il_sottocomando() {
        let cli = Cli::try_parse_from(["notainfo", "count", "non-aperto.txt", "-vv"]).unwrap();
        assert_eq!(cli.verbose, 2);
        assert!(matches!(cli.command, Command::Count { unit: Unit::Lines, .. }));
    }

    #[test]
    fn valore_non_ammesso() {
        let err = Cli::try_parse_from(["notainfo", "count", "x", "--unit", "caratteri"])
            .err().expect("il parser deve rifiutare il valore");
        assert_eq!(err.kind(), ErrorKind::InvalidValue);
    }
}
```

```sh
cargo test
```

Questi test controllano il **contratto degli argomenti**, non l'esistenza di `non-aperto.txt`. Per controllare comportamento, stdout, stderr e codice d'uscita occorre anche avviare il binario con file di prova.

## Scelte di progettazione

- Se aggiungi `--config`, `Option<PathBuf>` distingue opzione omessa e percorso fornito. Leggere e validare il file spetta al livello di [[Programmazione/Rust/Pagine/Configurazione applicativa|configurazione]], non al parser degli argomenti.
- Un flag booleano serve per un sì/no; `ArgAction::Count` serve quando il numero di ripetizioni ha un significato. Per una scelta chiusa preferisci `ValueEnum` ad accettare una stringa arbitraria.
- Gruppi di sottocomandi annidati e completamenti della shell sono estensioni possibili, non necessari per questa CLI; per distribuire completamenti esiste la crate separata `clap_complete`. Nomi, valori, default e canali di output sono parte dell'interfaccia pubblica per gli script.

## Fonti ufficiali

- [clap 4.5.50: tutorial derive](https://docs.rs/clap/4.5.50/clap/_derive/_tutorial/index.html)
- [clap 4.5.50: Parser, parse e try_parse_from](https://docs.rs/clap/4.5.50/clap/trait.Parser.html)
- [clap 4.5.50: argomenti globali](https://docs.rs/clap/4.5.50/clap/struct.Arg.html#method.global)
- [clap 4.5.50: gestione dell'uscita e dei canali di errore](https://docs.rs/clap/4.5.50/clap/error/struct.Error.html#method.exit)
- [Libreria standard: righe di una stringa](https://doc.rust-lang.org/std/primitive.str.html#method.lines)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Programmazione/Rust/Pagine/Error reporting|Error reporting]]
- [[Programmazione/Rust/Pagine/Packaging e release|Packaging e release]]
- [[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]
- [[Programmazione/Rust/Pagine/OsStr e OsString|OsStr e OsString]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]

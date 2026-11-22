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
  - Error reporting
  - Report degli errori
prerequisites:
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]"
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]"
  - "[[Programmazione/Rust/Pagine/CLI con clap|CLI con clap]]"
related:
  - "[[Programmazione/Rust/Pagine/Logging con log|Logging con log]]"
  - "[[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]"
title: Error reporting
---

# Error reporting

## Sintesi

Un `Result` dice al **chiamante** che un'operazione è fallita; un report dice alla **persona** che cosa non ha funzionato e come intervenire. Se una CLI riceve un file con una quantità errata, «invalid digit found in string» è una causa tecnica utile, ma non dice *quale file* o *quale riga* correggere. Allo script che invoca la CLI serve invece un codice di uscita documentato, non una frase da interpretare.

## Tre responsabilità diverse

| Livello | Responsabilità | Nel laboratorio |
| --- | --- | --- |
| Libreria | Restituire un errore tipizzato con dati e causa, senza stampare. | La variante `Quantity` conserva il numero di riga e il `ParseIntError`. |
| Applicazione | Aggiungere il contesto noto solo al chiamante. | `with_context` aggiunge l'operazione e il percorso, senza sostituire la causa con una stringa. |
| Confine CLI | Scegliere messaggio, canale e stato del processo. | Un solo report su stderr, dettagli facoltativi; stdout contiene solo il risultato valido. |

Il testo è per le persone e può cambiare con la lingua, il sistema operativo o la versione di una dipendenza. Per scegliere un comportamento usa la **variante** dell'errore o, per l'I/O, `io::ErrorKind`. Non cercare «not found» nel testo dell'errore. Per la distinzione fra `#[source]`, `#[from]` e contesto vedi [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]].

## Laboratorio: individuare la riga da correggere

La CLI `verifica-lista` legge un piccolo file UTF-8. Ogni riga non vuota deve contenere una quantità intera compresa tra 1 e 4294967295. Le righe che contengono solo spazi sono ignorate nel conteggio, ma **mantengono il loro numero di riga** nella diagnostica. Al primo errore la CLI si ferma senza stampare un risultato parziale.

Con Rust/Cargo stabile che supporti l'edition 2024 e un linker per l'host, in una directory di prova:

```sh
cargo new --bin --vcs none verifica-lista
```

```sh
cd verifica-lista
```

Sotto `[dependencies]` in `Cargo.toml` aggiungi le righe seguenti. Il primo build deve poter recuperare le dipendenze; conserva `Cargo.lock` per riprodurre anche le versioni transitive.

```toml
anyhow = "=1.0.104"
thiserror = "=2.0.21"
clap = { version = "=4.5.50", features = ["derive"] }
```

### Conservare la causa nella libreria

Crea `src/lib.rs`:

```rust
use std::{fs, io, num::{NonZeroU32, ParseIntError}, path::Path, str::Utf8Error};
use thiserror::Error;

#[derive(Debug, Error)]
#[non_exhaustive]
pub enum CheckError {
    #[error("impossibile leggere il file")]
    Read(#[from] io::Error),
    #[error("il file non è testo UTF-8")]
    Encoding(#[from] Utf8Error),
    #[error("quantità non valida alla riga {line}")]
    Quantity {
        line: usize,
        #[source]
        source: ParseIntError,
    },
}

pub fn check(path: &Path) -> Result<usize, CheckError> {
    let bytes = fs::read(path)?;
    let text = std::str::from_utf8(&bytes)?;
    let mut count = 0;
    for (index, line) in text.lines().enumerate() {
        let value = line.trim();
        if value.is_empty() {
            continue;
        }
        value.parse::<NonZeroU32>().map_err(|source| CheckError::Quantity {
            line: index + 1,
            source,
        })?;
        count += 1;
    }
    Ok(count)
}
```

`fs::read` e `from_utf8` sono separati: non riuscire a leggere i byte e non riuscire a interpretarli sono problemi diversi. La variante `Quantity` non conserva né ristampa il valore errato. Il suo `Display` identifica la riga; `Error::source()` espone la causa tecnica. Inserire lo stesso `{source}` anche nel messaggio della variante lo farebbe comparire due volte quando si stampa la catena completa.

### Presentare il report nel binario

Sostituisci `src/main.rs`:

```rust
use anyhow::Context;
use clap::Parser;
use std::{io::ErrorKind, path::PathBuf, process::ExitCode};
use verifica_lista::{check, CheckError};

#[derive(Parser)]
struct Cli {
    /// File UTF-8 con una quantità per riga.
    path: PathBuf,
    /// Aggiunge al report le cause tecniche.
    #[arg(short, long)]
    verbose: bool,
}

fn report(err: &anyhow::Error, verbose: bool) -> ExitCode {
    let domain = err.downcast_ref::<CheckError>();
    if verbose {
        eprintln!("errore: {err:#}");
    } else if let Some(detail) = domain {
        eprintln!("errore: {err}: {detail}");
    } else {
        eprintln!("errore: {err}");
    }

    let (code, hint) = match domain {
        Some(CheckError::Quantity { .. }) => (3, "usa una quantità intera positiva per riga"),
        Some(CheckError::Encoding(_)) => (3, "converti il file in UTF-8"),
        Some(CheckError::Read(e)) if e.kind() == ErrorKind::NotFound => {
            (1, "verifica il percorso del file")
        }
        Some(CheckError::Read(_)) => (1, "verifica che il file sia leggibile"),
        _ => (1, "controlla i dettagli con --verbose"),
    };
    eprintln!("suggerimento: {hint}");
    ExitCode::from(code)
}

fn main() -> ExitCode {
    let cli = Cli::parse();
    match check(&cli.path).with_context(|| format!("controllo di {}", cli.path.display())) {
        Ok(count) => {
            println!("{count}");
            ExitCode::SUCCESS
        }
        Err(err) => report(&err, cli.verbose),
    }
}
```

`{err}` mostra solo il contesto esterno di `anyhow`; per questo il report breve gli affianca il messaggio del dominio. `{err:#}` mostra il contesto e le cause in sequenza, senza richiedere un backtrace. Il downcast recupera il `CheckError` incapsulato, non dipende dalle parole del messaggio e funziona anche dopo `with_context`. Per visitare le singole cause di un `anyhow::Error` usa `err.chain()`.

### Provare i due report

Crea `lista.txt` con questo contenuto, **inclusa la riga vuota**:

```text
12

abc
```

```sh
cargo run --quiet -- lista.txt
```

Il binario lascia stdout vuoto, termina con codice **3** e scrive su stderr:

```text
errore: controllo di lista.txt: quantità non valida alla riga 3
suggerimento: usa una quantità intera positiva per riga
```

```sh
cargo run --quiet -- --verbose lista.txt
```

Ora la prima riga contiene anche la causa del parser. Il valore `abc` non viene ristampato e il codice resta **3**. Sostituisci `abc` con `8` e riesegui: stdout contiene `2`, stderr è vuoto e il codice è **0**. La CLI conta le righe valide, non somma le quantità.

| Caso | Codice del binario | Informazione per l'utente |
| --- | --- | --- |
| File valido o vuoto | 0 | Conteggio su stdout; un file vuoto vale `0`. |
| File assente o illeggibile | 1 | Percorso e suggerimento su stderr; la causa di sistema è disponibile con `--verbose`. |
| Argomento obbligatorio omesso o opzione sconosciuta | 2 | clap segnala l'errore d'uso **prima** di chiamare la libreria. `--help` non è un errore e termina con 0. |
| Byte non UTF-8 o quantità non valida | 3 | Il file è stato letto, ma il suo contenuto è da correggere. |

Questi codici sono il **contratto di questa CLI**, non uno standard universale di Rust. Per testare i canali senza l'output di Cargo, compila con `cargo build` e invoca direttamente `target/debug/verifica-lista` (su Windows `target\debug\verifica-lista.exe`). In PowerShell leggi subito `$LASTEXITCODE`; in una shell POSIX leggi `$?`.

## Limiti e scelte

- **Catena e backtrace rispondono a domande diverse.** La catena spiega *quale operazione è fallita e perché*; il backtrace, quando catturato, aiuta a localizzare i punti del codice. Non serve un panic per segnalare un file non valido. Restituire `ExitCode` da `main` consente un'uscita normale, senza chiamare `process::exit` nel codice di libreria.
- **Non stampare lo stesso errore a ogni livello.** Restituiscilo o aggiungi contesto dove conosci qualcosa di nuovo. Tieni il report per l'utente distinto da [[Programmazione/Rust/Pagine/Logging con log|log]] e [[Programmazione/Rust/Pagine/Tracing con tracing|tracing]]: disabilitare i log non deve nascondere il fallimento del comando.
- **Dettagli tecnici non significa dettagli pubblici.** In questo esempio le cause del parser non includono il testo letto. Non generalizzare: errori di altri parser possono contenere righe di input, URL o credenziali. Valuta tutta la catena prima di mostrarla, anche con `--verbose`. In un servizio, non inviare percorsi locali o backtrace al client: usa un messaggio pubblico e, se utile, un identificatore di correlazione.
- **Persone e automazione hanno interfacce diverse.** Non promettere che il testo del sistema operativo resti costante. Se uno script deve conoscere anche la riga o la categoria, progetta un formato strutturato documentato; colori e formattazione interattiva non devono contaminarlo.

## Fonti ufficiali

- [Libreria standard: Error::source e catene di errori](https://doc.rust-lang.org/std/error/trait.Error.html#method.source)
- [thiserror: Display, source e from](https://docs.rs/thiserror/2.0.21/thiserror/)
- [anyhow: formattazione, chain e downcast](https://docs.rs/anyhow/1.0.104/anyhow/struct.Error.html)
- [Libreria standard: ExitCode](https://doc.rust-lang.org/std/process/struct.ExitCode.html)
- [clap: destinazione del messaggio ed exit code](https://docs.rs/clap/4.5.50/clap/error/struct.Error.html#method.exit)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]
- [[Programmazione/Rust/Pagine/CLI con clap|CLI con clap]]
- [[Programmazione/Rust/Pagine/Logging con log|Logging con log]]
- [[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]

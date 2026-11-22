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
  - thiserror
  - anyhow
  - error-handling
aliases:
  - thiserror
  - anyhow
  - thiserror vs anyhow
prerequisites:
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
related:
  - "[[Programmazione/Rust/Pagine/Error types pubblici]]"
  - "[[Programmazione/Rust/Pagine/Derive macros]]"
  - "[[Programmazione/Rust/Pagine/Operatore]]"
title: thiserror e anyhow
---

# thiserror e anyhow

## Sintesi

`thiserror` genera implementazioni di `Display` e `std::error::Error` per tipi definiti da te. `anyhow` offre un contenitore dinamico e l'aggiunta di contesto per propagare e riportare errori eterogenei.

Non sostituiscono `Result` o `?`. Possono convivere: il dominio espone errori tipizzati, l'applicazione aggiunge informazioni sull'operazione e decide come presentarli.

## Quando usarlo

- `thiserror`: varianti sulle quali il chiamante fa matching, errori di dominio o confini con un contratto.
- `anyhow`: orchestrazione, CLI e applicazioni con molte cause tecniche da riportare.
- Entrambi: API tipizzata all'interno, contesto dinamico al confine.
- "Libreria contro applicazione" e un criterio pratico, non una restrizione tecnica. Conta cio che il chiamante deve conoscere e gestire.

## Come funziona

### Tipi e derive

`#[derive(Debug, thiserror::Error)]` mantiene il tuo enum come tipo concreto. `thiserror` non compare necessariamente nella firma pubblica; sostituire il derive con implementazioni equivalenti manuali non cambia quel contratto.

- `#[error("...")]`: implementazione di `Display`, con accesso ai campi.
- `#[from]`: genera `From` e implica anche `source`. La variante non puo contenere altri dati arbitrari oltre alla causa e all'eventuale backtrace supportato.
- `#[source]`: identifica la causa, senza generare da solo `From`. Un campo chiamato `source` viene riconosciuto automaticamente.
- `#[error(transparent)]`: delega `Display` e `source` all'errore interno; non aggiunge automaticamente un livello alla catena.

La forma `#[from] io::Error` non puo inventare il percorso del file. Con `PathBuf` aggiuntivo usa `map_err` e un campo source.

### Contenitore dinamico e contesto

`anyhow::Result<T>` usa `anyhow::Error`. Gli errori concreti convertiti nel contenitore devono normalmente soddisfare `Error + Send + Sync + 'static`. Non e solo un alias di `Box<dyn Error>`.

`Context` aggiunge `context` e `with_context` a `Result` e `Option`. Il primo riceve un valore gia valutato; il secondo costruisce il contesto solo su errore/assenza. Le cause non vengono convertite in semplici stringhe.

## API / Sintassi

Baseline degli esempi: **Rust 1.99.1**, edition **2024**, **thiserror 2.0.21** e **anyhow 1.0.104**, con feature predefinite. Non e dichiarata una MSRV complessiva. I pin esatti rendono esplicita la versione del demo; in un progetto reale scegli consapevolmente gli intervalli SemVer e conserva il lockfile dell'applicazione.

### Cargo.toml

Manifest completo per il progetto `error-guide`:

```toml
[package]
name = "error-guide"
version = "0.1.0"
edition = "2024"

[dependencies]
thiserror = "=2.0.21"
anyhow = "=1.0.104"
```

### Esempio breve di From

Programma autonomo per `src/main.rs` con il manifest precedente:

```rust
use thiserror::Error;

#[derive(Debug, Error)]
enum ParseAgeError {
    #[error("age is not a valid u8")]
    Invalid(#[from] std::num::ParseIntError),
}

fn parse_age(input: &str) -> Result<u8, ParseAgeError> {
    Ok(input.parse::<u8>()?)
}

fn main() {
    use std::error::Error as _;
    assert_eq!(parse_age("42").unwrap(), 42);
    let error = parse_age("256").unwrap_err();
    assert!(matches!(error, ParseAgeError::Invalid(_)));
    assert!(error.source().unwrap().is::<std::num::ParseIntError>());
}
```

Il tipo copre davvero i fallimenti del parser, senza una variante "nome mancante" mai prodotta. Il range di `u8` non e una validazione realistica dell'eta: `255` e accettato, gli spazi no e `+42` si puo analizzare. Le regole di dominio vanno aggiunte separatamente.

## Esempio pratico

### src/main.rs

Questo e un **programma alternativo completo**, non va concatenato al precedente. Legge un piccolo file UTF-8 che contiene una porta, per esempio `8080`. Non scrive file e non apre socket.

```rust
use anyhow::Context;
use std::{fs, io, num::ParseIntError, path::{Path, PathBuf}, process::ExitCode};
use thiserror::Error;

#[derive(Debug, Error)]
enum ConfigError {
    #[error("cannot read port file")]
    Read {
        path: PathBuf,
        #[source]
        cause: io::Error,
    },
    #[error("invalid port number")]
    InvalidPort(#[from] ParseIntError),
    #[error("port must be nonzero")]
    ZeroPort,
}

fn parse_port(raw: &str) -> Result<u16, ConfigError> {
    let port = raw.trim().parse::<u16>()?;
    if port == 0 {
        return Err(ConfigError::ZeroPort);
    }
    Ok(port)
}

fn load_port(path: &Path) -> Result<u16, ConfigError> {
    let text = fs::read_to_string(path).map_err(|cause| ConfigError::Read {
        path: path.to_owned(),
        cause,
    })?;
    parse_port(&text)
}

fn run() -> anyhow::Result<()> {
    let path = std::env::args_os().nth(1)
        .context("usage: error-guide <port-file>")?;
    let path = PathBuf::from(path);
    let port = load_port(&path)
        .with_context(|| format!("loading port from {}", path.display()))?;
    println!("port: {port}");
    Ok(())
}

fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("{error:#}");
            ExitCode::FAILURE
        }
    }
}
```

Con un file gia presente, dalla directory del progetto:

```sh
cargo run -- ./port.txt
```

Per un file con testo non numerico, il messaggio include l'operazione, `invalid port number` e la causa del parser. Il literal sbagliato non viene riportato. Senza percorso termina con esito non riuscito e un messaggio d'uso.

Il livello tipizzato non stampa niente. Il livello applicativo aggiunge il percorso anche agli errori di parsing e stampa una sola volta la catena. Il campo `path` resta disponibile per chi gestisce `ConfigError::Read`; `Display` non lo duplica perche il contesto applicativo lo aggiunge gia.

Limiti del demo: file intero in memoria, percorso relativo alla directory corrente, nessun parser TOML, nessun limite di dimensione o sandbox del percorso. Il parser fa trim, accetta `+80` e rifiuta zero per policy; non controlla disponibilita di rete. I percorsi sono adatti a questa diagnostica locale, non automaticamente a messaggi pubblici HTTP.

## Varianti

### Messaggio, catena e downcast

Altro programma autonomo con lo stesso manifest:

```rust
use anyhow::Context;

fn main() {
    let failure = "bad".parse::<u16>().context("reading configured port");
    let error = failure.unwrap_err();

    assert_eq!(error.to_string(), "reading configured port");
    assert!(format!("{error:#}").starts_with("reading configured port: "));
    assert_eq!(error.chain().count(), 2);
    assert!(error.downcast_ref::<std::num::ParseIntError>().is_some());

    let mut calls = 0;
    let ok = Ok::<u8, std::io::Error>(7)
        .with_context(|| { calls += 1; "not used" });
    assert_eq!(ok.unwrap(), 7);
    assert_eq!(calls, 0);
}
```

`{error}` mostra il messaggio esterno; `{error:#}` include le cause; `{error:?}` fornisce la diagnostica con l'eventuale backtrace catturato. Aggiungere contesto conserva il downcast all'errore originale; non rende pero esaustivo il contratto dinamico. Se l'errore originale e un `ConfigError`, fai downcast a quel tipo e poi visita la sua source chain: non presumere che ogni causa annidata sia un downcast diretto di `anyhow::Error`.

### bail ed ensure non fanno panic

```rust
use anyhow::{bail, ensure, Result};

fn workers(count: u8, maintenance: bool) -> Result<u8> {
    ensure!(count > 0, "worker count must be nonzero");
    if maintenance {
        bail!("maintenance mode");
    }
    Ok(count)
}

fn main() {
    assert_eq!(workers(2, false).unwrap(), 2);
    assert_eq!(workers(0, false).unwrap_err().to_string(),
        "worker count must be nonzero");
    assert_eq!(workers(2, true).unwrap_err().to_string(),
        "maintenance mode");
}
```

`anyhow!` costruisce un errore; `bail!` lo restituisce subito e `ensure!` restituisce un errore quando la condizione e falsa. Non sostituiscono enum di dominio quando il chiamante deve fare matching sui casi.

## Errori comuni

- Usare `#[from]` con campi di contesto aggiuntivi: usa una costruzione esplicita con `map_err`.
- Convertire la causa con `to_string()` e aspettarsi di conservarne tipo e source chain.
- Pensare che `context` sia logging, recovery o cattura dei panic.
- Dare per scontato che `with_context` cancelli informazioni sensibili: il testo e la catena dipendono da cio che inserisci.
- Ripetere la causa sia nel `Display` del wrapper sia in `source`, ottenendo messaggi duplicati.
- Aspettarsi che `thiserror` renda automaticamente stabile un enum pubblico.
- Copiare esempi nightly di backtrace nel derive senza controllarne i requisiti.

I backtrace dipendono da runtime e variabili come `RUST_BACKTRACE`/`RUST_LIB_BACKTRACE`; avere un oggetto `Backtrace` non garantisce una traccia catturata e simboli completi. La CLI sopra usa il formato Display esteso, non quello Debug con backtrace.

## Checklist

- Il chiamante necessita di varianti tipizzate o di reporting generico?
- `From` dispone di tutti i dati oppure serve `map_err`?
- La causa e conservata senza duplicazioni?
- Il contesto e costruito soltanto quando serve?
- Sono distinti messaggio interno, diagnostica locale e risposta pubblica?
- Dipendenze, feature, edition e lockfile del progetto sono coerenti?

## Collegamenti

- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]
- [[Programmazione/Rust/Pagine/Derive macros|Derive macros]]

## Fonti

Baseline verificata: Rust 1.99.1, thiserror 2.0.21, anyhow 1.0.104; le pagine versionate fissano i contratti consultati.

- [thiserror 2.0.21: derive, from, source e transparent](https://docs.rs/thiserror/2.0.21/thiserror/).
- [anyhow 1.0.104](https://docs.rs/anyhow/1.0.104/anyhow/).
- [Context e downcast](https://docs.rs/anyhow/1.0.104/anyhow/trait.Context.html).
- [Error, formati e backtrace](https://docs.rs/anyhow/1.0.104/anyhow/struct.Error.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

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
  - Configurazione applicativa
  - Application configuration
prerequisites:
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]"
  - "[[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]"
  - "[[Programmazione/Rust/Pagine/CLI con clap|CLI con clap]]"
related:
  - "[[Programmazione/Rust/Pagine/Error reporting|Error reporting]]"
  - "[[Programmazione/Rust/Pagine/Logging con log|Logging con log]]"
  - "[[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Cargo features|Cargo features]]"
title: Configurazione applicativa
---

# Configurazione applicativa

## Sintesi

Una configurazione applicativa traduce decisioni esterne al programma in un valore Rust che la logica può usare senza rileggere file o ambiente. Davanti a `--total-secs 90`, le domande sono due: **quale fonte vince per questo campo?** E **la configurazione risultante ha senso nel suo insieme?** La precedenza non sostituisce la validazione.

## Il contratto delle fonti

Il laboratorio configura due durate: tempo massimo di connessione e tempo totale dell'operazione. Non apre connessioni: stampa la configurazione effettiva. La regola è **CLI > ambiente > file TOML > default**, applicata **a ogni campo**. È una scelta dell'applicazione, non un ordine imposto da Rust, Serde o clap.

| Fonte | Connessione | Tempo totale | Se il valore manca |
| --- | --- | --- | --- |
| Default | 3 secondi | 30 secondi | Sono la base, non opzioni CLI inserite automaticamente. |
| File indicato con `--config` | `connect_secs` | `total_secs` | Una chiave omessa lascia decidere le altre fonti. Un file richiesto ma illeggibile è un errore. |
| Ambiente | `APP_CONNECT_SECS` | `APP_TOTAL_SECS` | Una variabile assente non sovrascrive nulla. Una variabile presente ma vuota è invalida. |
| CLI | `--connect-secs` | `--total-secs` | Un flag omesso resta `None`. Un default nel parser maschererebbe le fonti inferiori. |

Tutti i valori forniti devono essere interi positivi. Il programma sceglie una politica **rigorosa**: una chiave sconosciuta, un tipo errato o una variabile malformata interrompono l'avvio anche se una fonte superiore avrebbe sostituito quel valore. Il vincolo **connessione ≤ totale**, invece, riguarda solo i valori *effettivi*: verificarlo su ogni file parziale potrebbe rifiutare una configurazione finale valida.

## Laboratorio: risolvere due timeout

Servono Rust/Cargo stabile con edition 2024 e un linker per l'host. Dalla directory di prova:

```sh
cargo new --bin --vcs none config-demo
```

```sh
cd config-demo
```

In `Cargo.toml`, sotto la sezione `[dependencies]` già presente, aggiungi:

```toml
clap = { version = "=4.5.50", features = ["derive"] }
serde = { version = "=1.0.228", features = ["derive"] }
toml = "=0.8.23"
```

Il primo build deve poter reperire le dipendenze. Conserva `Cargo.lock` per riprodurre anche le versioni transitive. Sostituisci `src/main.rs`:

```rust
use clap::{Args, Parser};
use serde::Deserialize;
use std::{env, fs, num::NonZeroU64, path::PathBuf, process::ExitCode, time::Duration};

#[derive(Parser)]
struct Cli {
    #[arg(long)]
    config: Option<PathBuf>,
    #[command(flatten)]
    overrides: Overrides,
}

#[derive(Args, Default, Deserialize)]
#[serde(deny_unknown_fields)]
struct Overrides {
    #[arg(long)]
    connect_secs: Option<NonZeroU64>,
    #[arg(long)]
    total_secs: Option<NonZeroU64>,
}

struct Config {
    connect: Duration,
    total: Duration,
}

fn env_seconds(key: &str) -> Result<Option<NonZeroU64>, String> {
    match env::var(key) {
        Ok(raw) => raw.parse::<NonZeroU64>().map(Some)
            .map_err(|_| format!("{key}: atteso un intero positivo in secondi")),
        Err(env::VarError::NotPresent) => Ok(None),
        Err(env::VarError::NotUnicode(_)) => Err(format!("{key}: testo non Unicode")),
    }
}

fn resolve(file: Overrides, env: Overrides, cli: Overrides) -> Result<Config, String> {
    let connect = cli.connect_secs.or(env.connect_secs).or(file.connect_secs)
        .map_or(3, NonZeroU64::get);
    let total = cli.total_secs.or(env.total_secs).or(file.total_secs)
        .map_or(30, NonZeroU64::get);
    if connect > total {
        return Err("connect_secs non può superare total_secs".into());
    }
    Ok(Config {
        connect: Duration::from_secs(connect),
        total: Duration::from_secs(total),
    })
}

fn load(cli: Cli) -> Result<Config, String> {
    let file = match cli.config {
        None => Overrides::default(),
        Some(path) => {
            let text = fs::read_to_string(&path)
                .map_err(|err| format!("{}: {err}", path.display()))?;
            toml::from_str::<Overrides>(&text).map_err(|err| {
                let at = err.span().map(|s| format!(" al byte {}", s.start)).unwrap_or_default();
                format!("{}: TOML o schema non valido{at}", path.display())
            })?
        }
    };
    let environment = Overrides {
        connect_secs: env_seconds("APP_CONNECT_SECS")?,
        total_secs: env_seconds("APP_TOTAL_SECS")?,
    };
    resolve(file, environment, cli.overrides)
}

fn main() -> ExitCode {
    match load(Cli::parse()) {
        Ok(cfg) => {
            println!("connect={}s total={}s", cfg.connect.as_secs(), cfg.total.as_secs());
            ExitCode::SUCCESS
        }
        Err(err) => {
            eprintln!("{err}");
            ExitCode::FAILURE
        }
    }
}
```

`Overrides` è **parziale**: `None` vuol dire «questa fonte non ha un'opinione», non «usa il default adesso». I tipi condivisi tra CLI e TOML impediscono che una fonte ammetta zero e l'altra no. `Config`, invece, non contiene campi opzionali e usa `Duration`: il resto del programma non deve chiedersi se un numero sia in secondi o millisecondi. La funzione `resolve` non fa I/O e si può testare senza cambiare l'ambiente del processo.

### Provare i quattro livelli

Parti da una shell di prova in cui le due variabili `APP_*` del laboratorio non siano impostate. Senza argomenti:

```sh
cargo run
```

Risultato: `connect=3s total=30s`. Salva il seguente file come `app.toml` nella directory del progetto. **Non viene cercato automaticamente**:

```toml
connect_secs = 5
total_secs = 40
```

```sh
cargo run -- --config app.toml
```

Risultato: `connect=5s total=40s`. In una shell **PowerShell di prova**, imposta solo il tempo totale per questa sessione e i suoi processi figli:

```powershell
$env:APP_TOTAL_SECS = '60'
```

```powershell
cargo run -- --config app.toml
```

Ora il risultato è `connect=5s total=60s`: il valore di connessione viene ancora dal file. Aggiungi il flag:

```powershell
cargo run -- --config app.toml --total-secs 90
```

Risultato: `connect=5s total=90s`. Chiudi la shell di prova per non conservare la variabile. In una shell POSIX puoi ottenere lo stesso ultimo confronto impostando l'ambiente soltanto per il comando:

```sh
APP_TOTAL_SECS=60 cargo run -- --config app.toml --total-secs 90
```

### Capire perché l'avvio fallisce

| Caso | Perché | Esito del binario |
| --- | --- | --- |
| `--total-secs 0` | clap non può costruire un `NonZeroU64`. | Codice 2: errore d'uso, prima del caricamento. |
| `--config assente.toml`, TOML malformato o chiave `totla_secs` | Il file è stato richiesto: ignorarlo e usare i default nasconderebbe un errore. | Codice 1, percorso su stderr. |
| `APP_TOTAL_SECS=abc`, anche con `--total-secs 90` | Il valore fornito non è un numero; la politica non scarta in silenzio una fonte malformata. | Codice 1, nome della variabile su stderr. |
| File con `connect_secs = 20` e `total_secs = 10` | Senza override il vincolo finale fallisce. Con `--total-secs 25` e ambiente vuoto il risultato diventa valido. | Rispettivamente codice 1 oppure 0 con `connect=20s total=25s`. |

## Estendere il modello

- **Percorsi:** `--config app.toml` è relativo alla directory di lavoro del processo. Se il file contiene a sua volta un `data_dir` relativo, stabilisci se risolverlo rispetto al file o alla directory di lavoro. `PathBuf` da solo non sceglie una base e non verifica l'esistenza del percorso.
- **Segreti e valori obbligatori:** un URL di database con credenziali non dovrebbe finire su stdout, nei log o nel dump di una struct con `Debug`. Segnala il campo o la fonte, non il contenuto. Non inventare un default per un segreto mancante; preferisci il meccanismo di consegna previsto dall'ambiente di esecuzione.
- **Servizi e moduli:** carica e valida una volta all'avvio, poi passa `&Config` o la sottostruttura necessaria al modulo. Una [[Programmazione/Rust/Pagine/Cargo features|feature Cargo]] seleziona codice durante la compilazione: una modifica a TOML non la abilita in un binario già costruito.
- **Ricaricamento a caldo:** costruisci e valida un nuovo insieme completo di valori prima di renderlo visibile. Se la ricarica fallisce, conserva la configurazione precedente e segnala l'errore. Il laboratorio implementa solo il caricamento all'avvio.

## Fonti ufficiali

- [clap 4.5.50: derive, tipi di campo e flatten](https://docs.rs/clap/4.5.50/clap/_derive/index.html)
- [Serde: deny_unknown_fields e attributi del contenitore](https://serde.rs/container-attrs.html)
- [toml 0.8.23: deserializzare una stringa](https://docs.rs/toml/0.8.23/toml/fn.from_str.html)
- [Libreria standard: env::var e casi di errore](https://doc.rust-lang.org/std/env/fn.var.html)
- [Libreria standard: NonZeroU64](https://doc.rust-lang.org/std/num/type.NonZeroU64.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/CLI con clap|CLI con clap]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/Path e PathBuf|Path e PathBuf]]
- [[Programmazione/Rust/Pagine/Error reporting|Error reporting]]
- [[Programmazione/Rust/Pagine/Logging con log|Logging con log]]
- [[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]

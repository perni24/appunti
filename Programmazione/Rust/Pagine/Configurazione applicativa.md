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
  - "Configurazione applicativa"
  - "Application configuration"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione]]"
  - "[[Programmazione/Rust/Pagine/Path e PathBuf]]"
  - "[[Programmazione/Rust/Pagine/CLI con clap]]"
related:
  - "[[Programmazione/Rust/Pagine/Error reporting]]"
  - "[[Programmazione/Rust/Pagine/Logging con log]]"
  - "[[Programmazione/Rust/Pagine/Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Cargo features]]"
---

# Configurazione applicativa

## Sintesi

La **configurazione applicativa** raccoglie valori che cambiano tra ambienti, installazioni o esecuzioni: path, porte, URL, credenziali, livelli di logging, feature abilitate, timeout e limiti operativi.

In Rust conviene modellare la configurazione con struct tipizzate, caricarla da fonti esplicite e validarla all'avvio. Questo rende gli errori precoci, leggibili e separati dalla logica applicativa.

## Quando usarlo

Serve una strategia di configurazione quando:

- una CLI legge un file `toml`, `yaml` o `json`;
- un servizio usa variabili d'ambiente;
- la stessa applicazione gira in sviluppo, test e produzione;
- alcune opzioni arrivano da flag CLI e altre da file;
- vuoi evitare costanti sparse nel codice;
- devi validare path, URL, timeout o limiti.

Per programmi piccoli bastano argomenti CLI. Per applicazioni mantenute nel tempo, una struct `Config` centrale riduce ambiguita e duplicazione.

## Come funziona

Una configurazione robusta di solito segue questo flusso:

1. definisci una struct tipizzata;
2. leggi le fonti disponibili;
3. combini valori con una precedenza dichiarata;
4. applichi default;
5. validi il risultato;
6. passi `Config` alla logica applicativa.

Una precedenza comune e:

- default interni;
- file di configurazione;
- variabili d'ambiente;
- flag CLI.

Le variabili d'ambiente sono utili per deploy e segreti, ma possono rendere il comportamento implicito. I file sono piu ispezionabili, ma devono essere trovati e validati. I flag CLI sono espliciti, ma non scalano bene per configurazioni grandi.

## API / Sintassi

Una configurazione puo essere deserializzata con Serde:

```rust
use std::path::PathBuf;

use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Config {
    database_url: String,
    data_dir: PathBuf,
    log_level: String,
    timeout_seconds: u64,
}
```

Caricamento da file TOML:

```rust
use std::fs;
use std::path::Path;

fn load_config(path: &Path) -> Result<Config, Box<dyn std::error::Error>> {
    let text = fs::read_to_string(path)?;
    let config = toml::from_str::<Config>(&text)?;
    validate_config(config)
}

fn validate_config(config: Config) -> Result<Config, Box<dyn std::error::Error>> {
    if config.timeout_seconds == 0 {
        return Err("timeout_seconds must be greater than zero".into());
    }

    Ok(config)
}
```

In applicazioni reali conviene usare un error type esplicito invece di `Box<dyn Error>`.

## Esempio pratico

Combinazione tra CLI e file:

```rust
use std::path::PathBuf;

use clap::Parser;
use serde::Deserialize;

#[derive(Debug, Parser)]
struct Cli {
    #[arg(long)]
    config: PathBuf,

    #[arg(long)]
    log_level: Option<String>,
}

#[derive(Debug, Deserialize)]
struct FileConfig {
    data_dir: PathBuf,
    log_level: Option<String>,
}

#[derive(Debug)]
struct Config {
    data_dir: PathBuf,
    log_level: String,
}

fn merge(cli: Cli, file: FileConfig) -> Config {
    Config {
        data_dir: file.data_dir,
        log_level: cli
            .log_level
            .or(file.log_level)
            .unwrap_or_else(|| "info".to_string()),
    }
}
```

La precedenza e leggibile: il flag CLI vince sul file, poi arriva il default.

## Varianti

- **Solo CLI**: semplice, adatta a comandi piccoli.
- **File di configurazione**: utile per opzioni numerose e versionabili.
- **Variabili d'ambiente**: adatte a container, CI e deploy.
- **Layered config**: unisce default, file, env e CLI.
- **Config per modulo**: ogni sottosistema ha una struct dedicata.
- **Reload dinamico**: utile ma piu complesso, richiede concorrenza e validazione runtime.

## Errori comuni

- Leggere variabili d'ambiente in punti sparsi del codice.
- Usare `String` per path, durate e URL senza validazione.
- Mescolare parsing della configurazione e logica di business.
- Non documentare la precedenza tra fonti.
- Loggare segreti o token.
- Usare default silenziosi per valori critici.
- Validare troppo tardi, quando l'applicazione e gia avviata.

## Checklist

- Esiste una struct `Config` centrale o per sottosistema?
- La precedenza tra fonti e documentata?
- I valori obbligatori falliscono all'avvio se mancano?
- Segreti e credenziali non finiscono nei log?
- Path, URL, porte e timeout sono validati?
- La configurazione e passata come dipendenza, non letta globalmente?
- I test coprono default e override?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/CLI con clap]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/Path e PathBuf]]
- [[Programmazione/Rust/Pagine/Error reporting]]
- [[Programmazione/Rust/Pagine/Logging con log]]
- [[Programmazione/Rust/Pagine/Tracing con tracing]]
- [[Programmazione/Rust/Pagine/Cargo features]]

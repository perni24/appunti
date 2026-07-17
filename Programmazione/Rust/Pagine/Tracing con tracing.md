---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - cli-e-tooling
aliases:
  - "Tracing con tracing"
  - "tracing crate"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Logging con log]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
related:
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
  - "[[Programmazione/Rust/Pagine/Error reporting]]"
  - "[[Programmazione/Rust/Pagine/Web backend con axum]]"
---

# Tracing con tracing

## Sintesi

`tracing` e una crate per osservabilita strutturata in Rust. A differenza del logging tradizionale, non registra solo messaggi testuali: permette di creare eventi, campi strutturati e span che descrivono operazioni nel tempo.

E particolarmente utile in applicazioni async, server, worker e tool complessi, dove un singolo flusso logico puo attraversare task, thread e funzioni diverse.

## Quando usarlo

Usa `tracing` quando:

- vuoi correlare eventi dentro una stessa operazione;
- hai codice async o concorrente;
- devi aggiungere campi strutturati come `request_id`, `user_id`, `path`;
- vuoi esportare log in formato JSON;
- devi osservare latenza, errori e flussi applicativi;
- un semplice logger testuale non basta piu.

Per librerie piccole o CLI semplici, `log` puo essere sufficiente. Per servizi e tool mantenuti nel tempo, `tracing` offre un modello piu ricco.

## Come funziona

I concetti principali sono:

- **event**: un evento puntuale, simile a una riga di log;
- **span**: un intervallo di lavoro con inizio, fine e contesto;
- **field**: dato strutturato associato a event o span;
- **subscriber**: componente che riceve e formatta eventi e span;
- **layer**: componente componibile per filtrare, formattare o esportare dati.

Uno span permette di dire "tutti questi eventi appartengono alla stessa operazione". Questo e utile quando i log di piu task sono interleavati.

`tracing` non stampa niente finche non installi un subscriber, di solito all'avvio dell'applicazione.

## API / Sintassi

Eventi:

```rust
use tracing::{debug, error, info, warn};

fn run() {
    info!(version = env!("CARGO_PKG_VERSION"), "starting");
    debug!("loading configuration");
    warn!("using default cache directory");
    error!("operation failed");
}
```

Span manuale:

```rust
use tracing::{info, span, Level};

fn process_file(path: &str) {
    let span = span!(Level::INFO, "process_file", path);
    let _guard = span.enter();

    info!("reading file");
    info!("processing file");
}
```

Strumentazione di funzione:

```rust
use tracing::instrument;

#[instrument(skip(password))]
fn login(user: &str, password: &str) -> Result<(), String> {
    if password.is_empty() {
        return Err("empty password".to_string());
    }

    Ok(())
}
```

`skip` evita di registrare argomenti sensibili o troppo grandi.

## Esempio pratico

Inizializzazione per una CLI o servizio:

```rust
use tracing_subscriber::EnvFilter;

fn init_tracing() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .with_target(false)
        .init();
}

fn main() {
    init_tracing();

    tracing::info!(command = "import", "starting command");
}
```

Con `EnvFilter` puoi cambiare livello senza ricompilare, per esempio impostando regole diverse per moduli diversi.

## Varianti

- **Tracing testuale**: adatto a CLI e sviluppo locale.
- **Tracing JSON**: utile per log centralizzati.
- **Span asincroni**: collegano eventi attraverso `Future`.
- **Instrumentation con attributi**: `#[instrument]` riduce boilerplate.
- **Layer multipli**: formattazione, filtro, esportazione e integrazioni.
- **Interop con log**: molte applicazioni catturano anche eventi dalla crate `log`.

## Errori comuni

- Usare `tracing` come semplice `println!` strutturato.
- Dimenticare il subscriber.
- Registrare dati sensibili nei field.
- Creare span troppo granulari e rumorosi.
- Usare `#[instrument]` su funzioni con argomenti grandi senza `skip`.
- Non propagare il contesto negli spawn async.
- Confondere tracing applicativo con profiling CPU: sono strumenti complementari.

## Checklist

- Esiste un subscriber inizializzato all'avvio?
- I field importanti sono strutturati, non nascosti nel testo?
- I dati sensibili sono esclusi?
- Gli span rappresentano operazioni reali?
- Il filtro e configurabile?
- I log sono leggibili localmente e utili in produzione?
- Per performance serve anche profiling separato?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Logging con log]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/Performance e profiling]]
- [[Programmazione/Rust/Pagine/Error reporting]]
- [[Programmazione/Rust/Pagine/Web backend con axum]]

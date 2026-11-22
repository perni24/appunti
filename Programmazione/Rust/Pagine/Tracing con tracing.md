---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - cli-e-tooling
aliases:
  - Tracing con tracing
  - tracing crate
prerequisites:
  - "[[Programmazione/Rust/Pagine/Logging con log|Logging con log]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]"
related:
  - "[[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]"
  - "[[Programmazione/Rust/Pagine/Error reporting|Error reporting]]"
  - "[[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]"
title: Tracing con tracing
---

# Tracing con tracing

## Sintesi

Due richieste possono scrivere entrambe «conteggio completato» sullo stesso thread. L'ordine delle righe non basta per capire quale richiesta sia terminata. Con `tracing` assegni un **campo** identificativo allo **span** della richiesta e produci un **evento** nel punto in cui il lavoro termina. Un subscriber può mostrare l'evento insieme alla sua catena di span, senza dover ripetere a mano l'identificativo in ogni messaggio.

## Evento, span e subscriber

| Concetto | Domanda a cui risponde | Esempio |
| --- | --- | --- |
| Evento | Che cosa è successo in questo punto? | «Conteggio completato», con il numero di parole come campo numerico. |
| Span | Di quale operazione fa parte questo lavoro? | Lo span `documento` con `doc_id=17`, padre dello span `worker`. |
| Subscriber e layer | Quali dati raccogliere e come renderli visibili? | Un filtro accetta gli eventi da `INFO` in su; un layer di formato scrive JSON su stderr. |

La libreria che esegue il lavoro emette eventi e span; **il binario** configura il subscriber. Creare uno span non significa entrarci, e non obbliga il formatter a stampare righe di apertura e chiusura. I campi di un evento sono distinti dai campi dei suoi span: `parole` descrive il risultato, `doc_id` identifica l'operazione. Se basta un avviso isolato, [[Programmazione/Rust/Pagine/Logging con log|log]] può essere sufficiente.

## Il confine asincrono

- **Blocco sincrono:** `span.in_scope(|| lavoro())` entra nello span solo per la durata della closure. Anche la guardia di `span.enter()` va bene se viene rilasciata prima di ogni `await`.
- **Future:** non conservare una guardia di `enter()` attraverso un `await`. Mentre la future è sospesa, un altro task può usare quel thread ed emettere eventi sotto lo span sbagliato. `#[instrument]` su una funzione async, o `future.instrument(span)`, entra nello span quando la future viene interrogata (*poll*) e ne esce quando quel poll termina.
- **Nuovo task:** `tokio::spawn(future)` non trasferisce automaticamente lo span corrente. Se il nuovo task fa parte della stessa operazione, usa `future.in_current_span()`; se deve avere un nome proprio, crea lo span figlio **nel contesto del chiamante** e applicalo con `.instrument(...)` prima dello spawn. Crearlo soltanto dentro un task già scollegato non ricostruisce il padre.

## Laboratorio: due documenti, un solo thread

Servono Rust/Cargo stabile con edition 2024 e un linker per l'host. Il programma non usa file o servizi esterni. Da una directory di prova:

```sh
cargo new --bin --vcs none trace-demo
```

```sh
cd trace-demo
```

Sotto `[dependencies]` in `Cargo.toml` inserisci:

```toml
tokio = { version = "=1.54.1", features = ["rt", "macros"] }
tracing = { version = "=0.1.44", features = ["attributes"] }
tracing-subscriber = { version = "=0.3.22", features = ["env-filter", "json"] }
```

Il primo build deve poter reperire le dipendenze. Per riprodurre le versioni transitive conserva anche `Cargo.lock`. Sostituisci `src/main.rs`:

```rust
use std::{env, io, process::ExitCode};
use tokio::task::{self, JoinError};
use tracing::{debug, info, info_span, instrument, Instrument};
use tracing_subscriber::EnvFilter;

fn init_tracing() -> Result<(), &'static str> {
    let filter = match env::var("RUST_LOG") {
        Ok(raw) => EnvFilter::try_new(raw).map_err(|_| "RUST_LOG: direttiva non valida")?,
        Err(env::VarError::NotPresent) => EnvFilter::new("info"),
        Err(env::VarError::NotUnicode(_)) => return Err("RUST_LOG: testo non Unicode"),
    };
    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .json()
        .without_time()
        .with_target(false)
        .with_current_span(false)
        .with_span_list(true)
        .with_writer(io::stderr)
        .try_init()
        .map_err(|_| "impossibile inizializzare il subscriber")
}

#[instrument(name = "documento", skip_all, fields(doc_id = id))]
async fn elabora(id: u64, testo: &'static str) -> Result<usize, JoinError> {
    debug!("preparazione");
    let lavoro = async move {
        task::yield_now().await;
        let parole = testo.split_whitespace().count();
        info!(parole, "conteggio completato");
        parole
    };
    let n = task::spawn(lavoro.instrument(info_span!("worker"))).await?;
    info!("documento pronto");
    Ok(n)
}

#[tokio::main(flavor = "current_thread")]
async fn main() -> ExitCode {
    if let Err(err) = init_tracing() {
        eprintln!("{err}");
        return ExitCode::FAILURE;
    }
    match tokio::join!(elabora(17, "prima bozza locale"), elabora(42, "seconda bozza")) {
        (Ok(a), Ok(b)) => {
            println!("{}", a + b);
            ExitCode::SUCCESS
        }
        (Err(err), _) | (_, Err(err)) => {
            eprintln!("task non completato: {err}");
            ExitCode::FAILURE
        }
    }
}
```

`join!` fa avanzare entrambe le elaborazioni sul runtime a un thread: c'è concorrenza, non parallelismo fra core. L'attributo `#[instrument]` crea uno span per **ogni chiamata**; `skip_all` evita la registrazione automatica degli argomenti e `fields(doc_id = id)` espone solo l'ID. Ogni `worker` nasce mentre il suo `documento` è corrente. Dopo lo spawn la macro `info!` nel task scrive quindi sotto `documento → worker`; l'evento successivo all'`await` nel chiamante torna sotto il solo `documento`.

### Leggere l'output

```sh
cargo run --quiet
```

Senza `RUST_LOG`, stdout contiene **`5`**. Su stderr trovi quattro eventi `INFO` in formato JSON, uno per riga. Ecco come leggere l'evento del primo worker (ordine delle chiavi non significativo):

```json
{
  "level": "INFO",
  "fields": { "message": "conteggio completato", "parole": 3 },
  "spans": [
    { "name": "documento", "doc_id": 17 },
    { "name": "worker" }
  ]
}
```

Per l'altro worker trovi `doc_id=42` e `parole=2`. Non dedurre la parentela dall'ordine degli eventi: cerca l'ID nella lista `spans`. Questa lista è una scelta del formatter; non significa che ogni evento dichiari di nuovo il campo `doc_id`. JSON e stderr sono anch'essi scelte esplicite, non proprietà intrinseche di `tracing`.

### Cambiare il filtro e isolare la propagazione

In una **PowerShell di prova** imposta il filtro per il target Rust del package (con underscore):

```powershell
$env:RUST_LOG = 'warn,trace_demo=debug'
```

```powershell
cargo run --quiet
```

Ai quattro eventi si aggiungono due `DEBUG preparazione`, uno per documento. In una shell POSIX l'equivalente per una sola invocazione è:

```sh
RUST_LOG=warn,trace_demo=debug cargo run --quiet
```

| Prova | Cosa deve cambiare | Cosa non deve cambiare |
| --- | --- | --- |
| `RUST_LOG=off` | Nessun evento del programma su stderr. | Il lavoro viene eseguito: stdout è `5`, codice 0. |
| Direttiva non valida, per esempio `trace_demo=inesistente` | La CLI segnala l'errore su stderr e termina prima di elaborare i documenti. | Il default `info` è per la variabile assente, non per riparare un refuso. |
| Sostituisci solo `lavoro.instrument(info_span!("worker"))` con `lavoro` nel progetto di prova e usa il filtro `info` | Gli eventi «conteggio completato» non hanno più la catena del documento; quelli «documento pronto» la conservano. | Conteggi e stdout sono identici. La strumentazione cambia la correlazione, non il calcolo. |

Chiudi la PowerShell di prova per non mantenere la variabile. Per misurare i canali del solo eseguibile avvialo direttamente dopo la compilazione: Cargo può aggiungere su stderr i propri avvisi, per esempio sugli import inutilizzati dopo la controprova.

## Limiti pratici

- **Dati sensibili:** `skip(argomento)` o `skip_all` controllano solo i campi automatici dell'attributo. Un evento esplicito come `debug!(?testo)` registrerebbe di nuovo il contenuto. Usa identificatori appropriati, non token, payload o credenziali.
- **Tempi:** lo span rappresenta un'operazione che può restare sospesa. La durata fino alla chiusura comprende anche attese e non misura il tempo CPU. Il laboratorio non registra durate; per localizzare lavoro costoso vedi [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]].
- **Composizione:** un layer può formattare in testo o JSON, un altro può esportare. Installa il subscriber globale nel binario una sola volta. L'integrazione con `log` dipende dal bridge configurato: non inizializzare due logger globali concorrenti.
- **Confine di processo:** strumentare una future propaga il contesto locale, non lo invia a un altro servizio. Il tracing distribuito richiede anche estrazione e iniezione del contesto nel protocollo e un esportatore appropriato.

## Fonti ufficiali

- [tracing 0.1.44: ciclo di vita degli span e avvertenza su enter in async](https://docs.rs/tracing/0.1.44/tracing/struct.Span.html#in-asynchronous-code)
- [tracing 0.1.44: Instrument e in_current_span](https://docs.rs/tracing/0.1.44/tracing/trait.Instrument.html)
- [tracing 0.1.44: attributo instrument, skip e fields](https://docs.rs/tracing/0.1.44/tracing/attr.instrument.html)
- [tracing-subscriber 0.3.22: formato JSON e contesto](https://docs.rs/tracing-subscriber/0.3.22/tracing_subscriber/fmt/format/struct.Json.html)
- [tracing-subscriber 0.3.22: EnvFilter](https://docs.rs/tracing-subscriber/0.3.22/tracing_subscriber/filter/struct.EnvFilter.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Logging con log|Logging con log]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]
- [[Programmazione/Rust/Pagine/Error reporting|Error reporting]]
- [[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]

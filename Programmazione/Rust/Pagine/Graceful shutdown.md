---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - concorrenza-e-asincronia
aliases:
  - Shutdown graceful
  - Graceful shutdown Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/select join e cancellation]]"
  - "[[Programmazione/Rust/Pagine/Channel async]]"
related:
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/Message passing]]"
  - "[[Programmazione/Rust/Pagine/Shared state]]"
title: Graceful shutdown
---

# Graceful shutdown

## Sintesi

Un graceful shutdown e un **protocollo di arresto**, non una chiamata a cancel o abort: interrompe l'ammissione di nuovo lavoro, comunica la richiesta, completa o scarta quello pendente secondo una politica esplicita, esegue il cleanup e attende le task.

Questa nota usa **Rust 1.99.1, edition 2024, Tokio 1.54.1 e tokio-util 0.7.20** come baseline verificata, non come MSRV o ultima versione. Gli esempi non richiedono rete o database; il segnale OS e opzionale.

La distinzione essenziale e fra **richiedere la fine** e **osservarne il completamento**. Uscire da main o perdere un handle non sostituisce la seconda fase.

## Quando usarlo

- Server che devono fermare l'accettazione di nuove connessioni.
- Worker con messaggi accodati e job gia iniziati.
- Task di background da fermare e attendere prima di chiudere risorse condivise.
- Applicazioni che devono reagire a Ctrl+C, errori interni o comandi amministrativi.
- Operazioni con una fase di flush, risposta finale o salvataggio esplicito.

Il protocollo non garantisce persistenza o rollback: se un job ha gia modificato un sistema esterno, eliminare la sua future non annulla l'effetto.

## Come funziona

### Le fasi e la politica

1. Individua il trigger: segnale, errore critico o richiesta interna.
2. Ferma l'ammissione: listener, producer, dispatcher o ingresso della coda.
3. Notifica le task coinvolte; specifica se terminare il job corrente, drenare o scartare.
4. Esegui il cleanup asincrono mentre il runtime e ancora attivo.
5. Attendi i risultati delle task e distingui errori applicativi, panic e cancellazione.
6. Alla scadenza del periodo di grazia, applica l'eventuale escalation e osservane l'esito.

L'ordine concreto dipende dalle dipendenze: per esempio non chiudere il consumer dei log prima delle task che devono scrivere gli ultimi messaggi. I produttori di nuove task devono fermarsi prima di considerare concluso il lavoro tracciato. [Panoramica Tokio](https://tokio.rs/tokio/topics/shutdown).

### Segnalare, chiudere, attendere

| Azione | Effetto |
| --- | --- |
| cancel | Rende osservabile una richiesta. |
| close della coda | Blocca nuovi ingressi, non svuota il buffer. |
| abort | Richiede la cancellazione della task async. |
| join | Osserva il completamento e il risultato. |

Un token gia cancellato resta osservabile anche dalle task che iniziano ad aspettare dopo. I clone condividono la cancellazione; un child_token la riceve dal padre, ma cancellare il figlio non cancella il padre. Nessuno dei due attende il cleanup. [CancellationToken](https://docs.rs/tokio-util/0.7.20/tokio_util/sync/struct.CancellationToken.html).

Un JoinHandle eliminato **distacca** la task. abort ne richiede la cancellazione, ma non la preempie in qualsiasi istruzione: serve che il runtime possa riprendere il controllo. Attendi l'handle anche dopo abort; la task potrebbe avere gia completato, quindi non presumere sempre un JoinError di cancellazione. [JoinHandle](https://docs.rs/tokio/1.54.1/tokio/task/struct.JoinHandle.html).

## API / Sintassi

### Cargo.toml

Ogni blocco Rust seguente e un programma autonomo da usare come src/main.rs con questo manifest, salvo il controesempio dichiarato non compilabile.

```toml
[package]
name = "shutdown-notes"
version = "0.1.0"
edition = "2024"

[dependencies]
tokio = { version = "=1.54.1", features = ["rt", "macros", "sync", "time", "signal"] }
tokio-util = { version = "=0.7.20", features = ["rt"] }
```

Tokio fornisce task, canali, timer e segnali. CancellationToken e TaskTracker appartengono a tokio-util, non alla crate Tokio; rt abilita il supporto necessario in tokio-util. signal serve soltanto all'ultimo esempio.

Le assert controllano le condizioni dimostrative; in un servizio gli errori vanno registrati e trattati con una politica esplicita.

### Strumenti e responsabilita

- watch: adatto a stato condiviso; leggere il valore iniziale e gestire la chiusura.
- CancellationToken: notifica cooperativa persistente, senza trasporto di una causa o risultato.
- TaskTracker: attesa della fine del gruppo; non raccoglie automaticamente gli esiti.
- JoinSet: task con output omogeneo, risultati raccolti con join_next.
- timeout_at: scadenza assoluta; non interrompe lavoro che monopolizza il thread.

TaskTracker::close **non impedisce nuovi spawn**. Rende possibile la conclusione di wait quando il tracker e vuoto. Ferma separatamente chi genera task; wait non promette nulla su task aggiunte dopo. Droppare il tracker non fa abort. [TaskTracker](https://docs.rs/tokio-util/0.7.20/tokio_util/task/task_tracker/struct.TaskTracker.html).

## Esempio pratico

### Watch: stato iniziale e canale chiuso

```rust
use tokio::sync::watch;

#[derive(Debug, PartialEq)]
enum StopReason {
    Requested,
    SenderGone,
}

async fn wait_for_stop(mut shutdown: watch::Receiver<bool>) -> StopReason {
    loop {
        let requested = { *shutdown.borrow_and_update() };
        if requested {
            return StopReason::Requested;
        }
        if shutdown.changed().await.is_err() {
            return StopReason::SenderGone;
        }
    }
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (_tx, rx) = watch::channel(true);
    assert_eq!(wait_for_stop(rx).await, StopReason::Requested);

    let (tx, rx) = watch::channel(false);
    let task = tokio::spawn(wait_for_stop(rx));
    tx.send(true).unwrap();
    assert_eq!(task.await.unwrap(), StopReason::Requested);

    let (tx, rx) = watch::channel(false);
    drop(tx);
    assert_eq!(wait_for_stop(rx).await, StopReason::SenderGone);
}
```

Qui la scomparsa dei sender causa l'arresto, ma rimane distinguibile da una richiesta true. La lettura iniziale gestisce anche un receiver creato quando lo stato era gia true. Il prestito del valore termina prima di await.

Ignorare Err di changed in un loop e scorretto: con canale chiuso e valore gia visto, l'attesa continua a essere pronta e puo creare un ciclo attivo. Per un flag di arresto usa una politica monotona false -> true: un successivo false puo nascondere un true non ancora osservato. [watch](https://docs.rs/tokio/1.54.1/tokio/sync/watch/index.html), [Receiver watch](https://docs.rs/tokio/1.54.1/tokio/sync/watch/struct.Receiver.html).

### Chiudere l'ingresso e drenare il lavoro ammesso

```rust
use tokio::sync::mpsc;
use tokio_util::sync::CancellationToken;

async fn process(value: u32, completed: &mut Vec<u32>) {
    tokio::task::yield_now().await;
    completed.push(value);
}

async fn worker(
    mut jobs: mpsc::Receiver<u32>,
    stop: CancellationToken,
) -> Vec<u32> {
    let mut completed = Vec::new();
    loop {
        tokio::select! {
            biased;
            _ = stop.cancelled() => {
                jobs.close();
                break;
            }
            next = jobs.recv() => {
                match next {
                    Some(value) => process(value, &mut completed).await,
                    None => return completed,
                }
            }
        }
    }
    while let Some(value) = jobs.recv().await {
        process(value, &mut completed).await;
    }
    completed
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (tx, rx) = mpsc::channel(3);
    for value in [10, 20, 30] {
        tx.send(value).await.unwrap();
    }

    let stop = CancellationToken::new();
    stop.cancel();
    let handle = tokio::spawn(worker(rx, stop));
    assert_eq!(handle.await.unwrap(), [10, 20, 30]);
    assert!(tx.send(40).await.is_err());
}
```

Il segnale e gia attivo per mostrare che chiudere l'ingresso non scarta il buffer. Il worker completa anche un job iniziato prima di osservare stop: mentre esegue process non torna a selezionare il segnale. Questo e intenzionale, non una garanzia che process termini.

Dopo close, i permit ottenuti in precedenza possono ancora inviare: vanno usati o rilasciati prima della fine del drenaggio. Un token da solo non chiude il canale e non arresta i produttori. Se serve una barriera precisa oltre la quale nessun lavoro e accettato, occorre coordinarla e confermarla nel protocollo. [Receiver mpsc](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/struct.Receiver.html#method.close).

La raccolta Vec e limitata ai tre job dimostrativi. In un servizio elabora o salva i risultati senza accumularli illimitatamente. Il periodo di grazia deve coprire anche il drenaggio.

### Notifica condivisa e cleanup tracciato

```rust
use std::sync::{
    Arc,
    atomic::{AtomicUsize, Ordering},
};
use tokio_util::{sync::CancellationToken, task::TaskTracker};

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let stop = CancellationToken::new();
    let tracker = TaskTracker::new();
    let cleaned = Arc::new(AtomicUsize::new(0));
    let mut handles = Vec::new();

    for id in 0..3 {
        let stop = stop.clone();
        let cleaned = cleaned.clone();
        handles.push(tracker.spawn(async move {
            stop.cancelled().await;
            tokio::task::yield_now().await;
            cleaned.fetch_add(1, Ordering::SeqCst);
            id
        }));
    }

    tracker.close();
    stop.cancel();
    tracker.wait().await;
    assert_eq!(cleaned.load(Ordering::SeqCst), 3);

    for (id, handle) in handles.into_iter().enumerate() {
        assert_eq!(handle.await.unwrap(), id);
    }
}
```

Il contatore rappresenta la fine di un cleanup dimostrativo, non un flush reale. La chiusura del tracker non cancella le task: il token le avvisa, wait attende che siano uscite e gli handle permettono di verificarne gli esiti.

Non affidare cleanup asincrono al solo Drop: un distruttore sincrono puo rilasciare memoria o lock, ma non attende un flush o una richiesta di rete. Il codice dopo un await interrotto da abort non viene eseguito.

## Varianti

### Token figli e ambito della cancellazione

```rust
use tokio_util::sync::CancellationToken;

fn main() {
    let root = CancellationToken::new();
    let child = root.child_token();
    let sibling = root.child_token();

    child.cancel();
    assert!(child.is_cancelled());
    assert!(!root.is_cancelled());
    assert!(!sibling.is_cancelled());

    let shared = root.clone();
    shared.cancel();
    assert!(root.is_cancelled());
    assert!(sibling.is_cancelled());
    assert!(root.child_token().is_cancelled());
}
```

Usa i figli per sottosistemi che possono fermarsi indipendentemente; usa i clone per la stessa richiesta condivisa. Eliminare semplicemente un token non equivale a cancel. La cancellazione si propaga, ma non e una transazione atomica osservabile simultaneamente da tutti i thread.

### Scadenza unica e raccolta degli esiti con JoinSet

```rust
use tokio::{
    sync::oneshot,
    task::{JoinError, JoinSet},
    time::{Duration, Instant, timeout_at},
};

#[derive(Debug, Default)]
struct Report {
    completed: usize,
    failed: usize,
    cancelled: usize,
    panicked: usize,
    forced: bool,
}

impl Report {
    fn observe(&mut self, result: Result<Result<(), &'static str>, JoinError>) {
        match result {
            Ok(Ok(())) => self.completed += 1,
            Ok(Err(_)) => self.failed += 1,
            Err(error) if error.is_cancelled() => self.cancelled += 1,
            Err(_) => self.panicked += 1,
        }
    }
}

async fn finish(
    tasks: &mut JoinSet<Result<(), &'static str>>,
    deadline: Instant,
) -> Report {
    let mut report = Report::default();
    loop {
        match timeout_at(deadline, tasks.join_next()).await {
            Ok(Some(result)) => report.observe(result),
            Ok(None) => return report,
            Err(_) => {
                report.forced = true;
                tasks.abort_all();
                break;
            }
        }
    }
    while let Some(result) = tasks.join_next().await {
        report.observe(result);
    }
    report
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let mut tasks = JoinSet::new();
    let (ready, started) = oneshot::channel();

    tasks.spawn(async move {
        ready.send(()).unwrap();
        std::future::pending::<Result<(), &'static str>>().await
    });
    started.await.unwrap();

    let deadline = Instant::now() + Duration::from_millis(10);
    let report = finish(&mut tasks, deadline).await;
    assert!(report.forced);
    assert_eq!(report.cancelled, 1);
    assert!(tasks.is_empty());
}
```

Questo programma dimostra l'escalation con una task che non collabora; nel flusso completo notifica prima lo stop cooperativo e passa a finish la deadline calcolata una volta. Riavviare un timeout intero per ogni risultato allunga il budget totale. I 10 ms servono soltanto alla demo, non sono una soglia consigliata.

join_next raccoglie in ordine di completamento, non di spawn. L'errore del job e distinto dal JoinError. Il report e volutamente minimo: un servizio deve conservare anche identificatori e cause. Un timeout cancella l'attesa di join_next, non le task rimaste nel set. [JoinSet](https://docs.rs/tokio/1.54.1/tokio/task/struct.JoinSet.html).

abort_all richiede l'interruzione; il secondo ciclo osserva la conclusione. Un risultato gia completato puo ancora essere Ok. JoinSet::shutdown equivale a abortire e attendere, ignorando i panic: **non e il periodo di grazia cooperativo**.

La deadline non e un limite rigido di tempo reale. Una future pronta puo riuscire anche oltre la scadenza; un poll bloccante non viene preemptato. Anche l'attesa successiva ad abort puo non finire se il lavoro non restituisce controllo. [timeout_at](https://docs.rs/tokio/1.54.1/tokio/time/fn.timeout_at.html), [timeout](https://docs.rs/tokio/1.54.1/tokio/time/fn.timeout.html).

### Trigger interno oppure Ctrl+C

```rust
use std::{future::Future, io};
use tokio_util::sync::CancellationToken;

async fn wait_trigger<F>(
    internal: &CancellationToken,
    external: F,
) -> io::Result<()>
where
    F: Future<Output = io::Result<()>>,
{
    tokio::select! {
        biased;
        _ = internal.cancelled() => Ok(()),
        result = external => result,
    }
}

#[tokio::main(flavor = "current_thread")]
async fn main() -> io::Result<()> {
    let stop = CancellationToken::new();
    let worker_stop = stop.clone();
    let worker = tokio::spawn(async move {
        worker_stop.cancelled().await;
        tokio::task::yield_now().await;
    });

    if !std::env::args().any(|arg| arg == "--listen") {
        stop.cancel();
    }

    let result = wait_trigger(&stop, tokio::signal::ctrl_c()).await;
    stop.cancel();
    worker.await.expect("cleanup terminato");
    result
}
```

Senza argomenti il trigger interno e gia pronto e, grazie a biased, ctrl_c non viene pollato: la demo termina senza installare un listener. Con --listen attende Ctrl+C; il worker viene segnalato e atteso anche se la registrazione del segnale fallisce, poi l'errore viene restituito.

ctrl_c e disponibile su Windows e Unix e restituisce un Result. Su Unix l'handler installato modifica il comportamento di SIGINT per tutta la vita del processo, anche se la future viene eliminata: non presumere che un secondo Ctrl+C ripristini automaticamente l'uscita predefinita. [ctrl_c](https://docs.rs/tokio/1.54.1/tokio/signal/fn.ctrl_c.html).

SIGTERM nei servizi Unix richiede un listener dedicato con signal::unix e codice condizionale; non e coperto da ctrl_c. Questo esempio non simula l'arresto di un server HTTP ne gestisce tutti i segnali del sistema.

### Lavoro blocking e arresto del runtime

Una closure spawn_blocking gia iniziata non si ferma con abort. Serve cooperazione nel codice sincrono, un'operazione con termine noto o isolamento in un processo gestito separatamente. Non trasformare l'attesa di un thread bloccato in una falsa promessa di shutdown entro una deadline. [spawn_blocking](https://docs.rs/tokio/1.54.1/tokio/task/fn.spawn_blocking.html).

Il drop del runtime non completa automaticamente il protocollo applicativo. shutdown_timeout limita l'attesa del runtime, non uccide il lavoro blocking rimasto. Mantieni il runtime disponibile per cleanup e join; evita process::exit come sostituto del cleanup, perche non esegue i distruttori delle stack attive. [Runtime](https://docs.rs/tokio/1.54.1/tokio/runtime/struct.Runtime.html#shutdown), [process::exit](https://doc.rust-lang.org/std/process/fn.exit.html).

## Errori comuni

### Perdere l'handle nel timeout

Il programma seguente **non compila**, errore E0382: timeout prende possesso dell'handle e non si puo piu usarlo per abort.

```rust
use tokio::time::{Duration, timeout};

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let handle = tokio::spawn(std::future::pending::<()>());
    let _ = timeout(Duration::ZERO, handle).await;
    handle.abort();
}
```

La forma corretta conserva un handle mutabile e passa &mut handle al timeout; alla scadenza richiede abort e attende l'handle. Passarlo per valore puo compilare se non lo riusi, ma alla scadenza lo elimina e distacca la task. Vedi [[Programmazione/Rust/Pagine/select join e cancellation|select, timeout e cancellazione]].

### Errori di protocollo

- Ignorare Err di watch::changed: un canale chiuso non e una pausa in attesa di aggiornamenti.
- Osservare soltanto le notifiche e non lo stato iniziale del segnale.
- Considerare TaskTracker::close una barriera contro nuovi spawn.
- Fare break e distruggere il receiver quando la politica richiede drenaggio.
- Lasciare permit o sender indispensabili alla fine del canale in task non segnalate.
- Attendere una task prima di inviarle il segnale necessario a farla terminare.
- Cancellare il job corrente senza verificare operazioni parziali e stato esterno.
- Fare return al primo errore di join lasciando le altre task senza supervisione.
- Usare abort o JoinSet::shutdown come sinonimi di cleanup cooperativo.
- Reimpostare il periodo di grazia per ogni task invece di condividere una deadline.
- Aspettare cleanup asincrono dai soli distruttori o dal drop del runtime.

## Checklist

- Chi rileva lo stop e chi ne conserva la causa?
- Quale componente smette di accettare nuovo lavoro?
- I segnali sono osservabili anche da task appena avviate?
- Finisco il job corrente, dreno la coda o scarto esplicitamente?
- Chi libera sender, permit e risorse necessarie ai consumer?
- Il cleanup puo attendere? Come gestisco un errore durante il cleanup?
- Tutte le task rilevanti sono tracciate e gli esiti vengono raccolti?
- La deadline e unica? Cosa succede se abort non basta?
- Il lavoro puo proseguire su thread blocking o processi esterni?
- I test coprono segnale anticipato, canale chiuso e task non collaborativa?

## Collegamenti

- [[Programmazione/Rust/Pagine/Channel async|Channel async]]
- [[Programmazione/Rust/Pagine/select join e cancellation|select, join e cancellazione]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async]]
- [[Programmazione/Rust/Pagine/Message passing|Message passing]]
- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop]]
- [[Programmazione/Rust/Pagine/Async Await|Async e await]]

## Fonti

- [Tokio: graceful shutdown](https://tokio.rs/tokio/topics/shutdown).
- [tokio-util 0.7.20: CancellationToken](https://docs.rs/tokio-util/0.7.20/tokio_util/sync/struct.CancellationToken.html), [TaskTracker](https://docs.rs/tokio-util/0.7.20/tokio_util/task/task_tracker/struct.TaskTracker.html).
- [Tokio 1.54.1: JoinHandle](https://docs.rs/tokio/1.54.1/tokio/task/struct.JoinHandle.html), [JoinSet](https://docs.rs/tokio/1.54.1/tokio/task/struct.JoinSet.html).
- [watch](https://docs.rs/tokio/1.54.1/tokio/sync/watch/index.html), [Receiver watch](https://docs.rs/tokio/1.54.1/tokio/sync/watch/struct.Receiver.html), [Receiver mpsc](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/struct.Receiver.html).
- [timeout_at](https://docs.rs/tokio/1.54.1/tokio/time/fn.timeout_at.html), [timeout](https://docs.rs/tokio/1.54.1/tokio/time/fn.timeout.html), [ctrl_c](https://docs.rs/tokio/1.54.1/tokio/signal/fn.ctrl_c.html).
- [spawn_blocking](https://docs.rs/tokio/1.54.1/tokio/task/fn.spawn_blocking.html), [Runtime](https://docs.rs/tokio/1.54.1/tokio/runtime/struct.Runtime.html), [process::exit](https://doc.rust-lang.org/std/process/fn.exit.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

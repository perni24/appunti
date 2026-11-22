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
  - Async channels
  - tokio::sync::mpsc
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Message passing]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
related:
  - "[[Programmazione/Rust/Pagine/select join e cancellation]]"
  - "[[Programmazione/Rust/Pagine/Async streams]]"
  - "[[Programmazione/Rust/Pagine/Graceful shutdown]]"
title: Channel async
---

# Channel async

## Sintesi

Un canale async coordina produttori e consumatori: quando non ci sono dati o spazio, le operazioni asincrone sospendono la task invece di occupare il thread in attesa. Non ogni metodo di un canale async richiede await: oneshot, broadcast, watch e mpsc unbounded hanno invii sincroni.

Questa nota usa **Tokio 1.54.1, Rust 1.99.1, edition 2024** come baseline verificata, non come versione minima o ultima disponibile. Gli esempi sono autonomi, senza rete o database.

Scegli il canale in base al protocollo: **coda di lavoro, risposta singola, eventi per piu osservatori o ultimo stato**. Non sono intercambiabili.

## Quando usarlo

- Per assegnare a una task la proprieta di una risorsa e ricevere comandi.
- Per limitare i messaggi accodati con mpsc bounded.
- Per ottenere una risposta specifica a una richiesta tramite oneshot.
- Per notificare eventi con broadcast, accettando o gestendo eventuali perdite.
- Per distribuire configurazione o stato di arresto con watch.

Non e una coda persistente: un crash puo perdere dati. Un invio riuscito non certifica che un lavoro sia stato eseguito; una risposta applicativa deve essere prodotta dopo l'operazione che conferma.

## Come funziona

### Scegliere il protocollo

| Canale | Lettori | Dati |
| --- | --- | --- |
| mpsc | Un consumer | Coda; bounded oppure unbounded. |
| oneshot | Un receiver | Al massimo un valore. |
| broadcast | Piu receiver | Eventi, con possibile lag. |
| watch | Piu receiver | Solo lo stato piu recente. |

mpsc accetta molti sender clonati, ma il receiver non e clonabile. broadcast non distribuisce job fra worker: ogni sottoscrittore ha un proprio cursore. Per dividere lavoro fra piu consumer serve un dispatcher o un canale MPMC adatto. [Tutorial Tokio](https://tokio.rs/tokio/tutorial/channels).

### Ownership, memoria e avanzamento

mpsc e oneshot trasferiscono il valore; clonare il sender non clona i payload. broadcast richiede valori clonabili per consegnarli ai receiver. watch offre un prestito dello stato: puoi copiarlo o clonarlo per elaborarlo fuori dal canale.

Il bound Send dipende dall'uso: per spostare task con tokio::spawn servono future Send e 'static, non semplicemente per creare ogni canale. Un canale non allunga la durata dei riferimenti.

La capacita bounded limita i posti nella coda, non i byte dei messaggi o il numero di task in attesa. Se il consumer svuota la coda spawnando lavoro illimitato, la pressione viene spostata altrove. Anche le dipendenze circolari fra code possono creare deadlock.

### Chiusura non significa elaborazione conclusa

Per mpsc, recv attende se il canale e vuoto ma aperto. Restituisce None quando non arriveranno altri valori: sender terminati e buffer svuotato, oppure chiusura esplicita seguita da drenaggio e rilascio dei permit.

Eliminare il receiver scarta i messaggi non letti. Per smettere di accettare lavoro conservando quello ammesso, usa close e continua a ricevere; i permit gia ottenuti possono ancora inviare. La chiusura non attende da sola le task: conserva e attendi i loro JoinHandle. [mpsc](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/index.html), [Receiver](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/struct.Receiver.html).

## API / Sintassi

### Cargo.toml

Usa questo manifest per ogni programma, incollando un solo esempio Rust alla volta in src/main.rs. Le assert e le expect rendono verificabili le condizioni dimostrative; in un servizio occorre una politica esplicita per gli errori.

```toml
[package]
name = "channel-notes"
version = "0.1.0"
edition = "2024"

[dependencies]
tokio = { version = "=1.54.1", features = ["rt", "macros", "sync"] }
```

La feature sync abilita i canali; rt e macros servono agli esempi con runtime current-thread. Non occorre abilitare tutte le feature di Tokio.

### Operazioni da distinguere

- mpsc bounded: send(value).await attende un posto; try_send(value) distingue Full da Closed senza attesa asincrona.
- mpsc unbounded: send(value) e sincrono, recv().await resta asincrono. Non c'e backpressure sul numero di messaggi.
- oneshot: send(value) consuma il sender e restituisce Result<(), T>; il receiver stesso e una Future.
- broadcast: send(value) e sincrono, recv().await distingue messaggio, Lagged e Closed.
- watch: send(value) pubblica uno stato; changed().await attende una versione non vista, non restituisce il valore.

Un send mpsc fallito restituisce il payload in SendError<T>. Il successo e solo accettazione nel canale. Concorrenza fra produttori non significa ordine deterministico fra le loro richieste. [Sender mpsc](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/struct.Sender.html), [Sender oneshot](https://docs.rs/tokio/1.54.1/tokio/sync/oneshot/struct.Sender.html).

## Esempio pratico

### Coda bounded con produttore atteso

```rust
use tokio::sync::mpsc;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (tx, mut rx) = mpsc::channel::<String>(2);
    let producer = tokio::spawn(async move {
        for name in ["alpha", "beta", "gamma"] {
            tx.send(name.to_owned()).await.expect("consumer attivo");
        }
    });

    let mut values = Vec::new();
    while let Some(value) = rx.recv().await {
        values.push(value);
    }
    producer.await.expect("produttore terminato");
    assert_eq!(values, ["alpha", "beta", "gamma"]);
}
```

L'ultimo sender viene eliminato alla fine della task. La raccolta e sicura qui perche i messaggi sono tre: non usare un Vec senza limite per un flusso infinito. Se una copia del sender sopravvive, il ciclo puo continuare ad attendere.

### Coda piena e recupero del valore

```rust
use tokio::sync::mpsc::{self, error::TrySendError};

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (tx, mut rx) = mpsc::channel(1);
    tx.send(String::from("first")).await.unwrap();

    let retry = match tx.try_send(String::from("second")) {
        Err(TrySendError::Full(value)) => value,
        other => panic!("atteso Full, ottenuto {other:?}"),
    };
    assert_eq!(rx.recv().await.as_deref(), Some("first"));
    tx.send(retry).await.unwrap();
    assert_eq!(rx.recv().await.as_deref(), Some("second"));

    rx.close();
    let error = tx.send(String::from("late")).await.unwrap_err();
    assert_eq!(error.0, "late");
    assert_eq!(rx.recv().await, None);
}
```

Full non e una disconnessione. Il chiamante puo attendere, rifiutare o conservare il valore: riprovare in un ciclo stretto consuma CPU. channel(0) non e un rendezvous Tokio: provoca panic, a differenza di std::sync::mpsc::sync_channel(0).

### Chiusura con permit gia acquisito

```rust
use tokio::sync::mpsc;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (tx, mut rx) = mpsc::channel(2);
    tx.send("queued").await.unwrap();
    let permit = tx.reserve().await.unwrap();

    rx.close();
    assert!(tx.is_closed());
    assert!(tx.send("new").await.is_err());
    permit.send("reserved");

    let mut drained = Vec::new();
    while let Some(value) = rx.recv().await {
        drained.push(value);
    }
    assert_eq!(drained, ["queued", "reserved"]);
}
```

Il permit riserva capacita, non e ancora un messaggio. Va usato o eliminato: tenerlo vivo puo impedire al receiver chiuso di arrivare a None. close non equivale a svuotare o distruggere la coda. [Receiver::close](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/struct.Receiver.html#method.close).

### Richiesta e risposta con oneshot

```rust
use tokio::sync::{mpsc, oneshot};

#[derive(Debug)]
enum Command {
    Count {
        input: String,
        reply: oneshot::Sender<Result<usize, &'static str>>,
    },
    Shutdown,
}

async fn worker(mut rx: mpsc::Receiver<Command>) -> usize {
    let mut processed = 0;
    while let Some(command) = rx.recv().await {
        match command {
            Command::Count { input, reply } => {
                let result = if input.is_empty() {
                    Err("empty input")
                } else {
                    Ok(input.chars().count())
                };
                processed += 1;
                // Il client puo essersene andato: il lavoro e gia concluso.
                let _ = reply.send(result);
            }
            Command::Shutdown => rx.close(),
        }
    }
    processed
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (tx, rx) = mpsc::channel(4);
    let handle = tokio::spawn(worker(rx));

    let (reply, response) = oneshot::channel();
    tx.send(Command::Count {
        input: String::from("rust"),
        reply,
    }).await.expect("worker attivo");

    let result = response.await.expect("risposta non abbandonata");
    assert_eq!(result, Ok(4));

    let (reply, response) = oneshot::channel();
    tx.send(Command::Count {
        input: String::new(),
        reply,
    }).await.unwrap();
    assert_eq!(response.await.unwrap(), Err("empty input"));

    tx.send(Command::Shutdown).await.unwrap();
    drop(tx);
    assert_eq!(handle.await.unwrap(), 2);
}
```

Il Result esterno di response.await segnala la disponibilita della risposta; quello interno rappresenta l'esito del lavoro. Un sender oneshot eliminato senza inviare produce un errore di ricezione.

Shutdown chiude l'ingresso ma il worker drena i comandi ammessi, inclusi quelli gia in coda dopo Shutdown; un break li scarterebbe. Il comando puo attendere dietro altri job: non e un segnale di arresto prioritario. Interrompere l'attesa della risposta non annulla automaticamente una richiesta gia accodata. [oneshot](https://docs.rs/tokio/1.54.1/tokio/sync/oneshot/index.html).

## Varianti

### Broadcast e ricevitore in ritardo

```rust
use tokio::sync::broadcast::{self, error::RecvError};

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (tx, mut fast) = broadcast::channel(2);
    let mut slow = tx.subscribe();

    for value in 1..=3 {
        assert_eq!(tx.send(value).unwrap(), 2);
        assert_eq!(fast.recv().await.unwrap(), value);
    }

    assert!(matches!(slow.recv().await, Err(RecvError::Lagged(1))));
    assert_eq!(slow.recv().await.unwrap(), 2);
    assert_eq!(slow.recv().await.unwrap(), 3);

    let mut late = tx.subscribe();
    tx.send(4).unwrap();
    drop(tx);
    assert_eq!(late.recv().await.unwrap(), 4);
    assert!(matches!(late.recv().await, Err(RecvError::Closed)));
}
```

Il consumer lento ha perso 1, non e stato disconnesso. Dopo Lagged puo riprendere dai valori ancora conservati; se ogni evento e necessario deve risincronizzarsi o fallire esplicitamente.

Il sender non aspetta che tutti leggano. Un nuovo subscriber non riceve lo storico. La capacita effettiva puo essere maggiore di quella richiesta: non usare un numero arbitrario per prevedere esattamente quando scatta il lag. [broadcast](https://docs.rs/tokio/1.54.1/tokio/sync/broadcast/index.html).

Il numero restituito da send conta i receiver sottoscritti, non le consegne confermate. Zero receiver rende l'invio fallito; nuove sottoscrizioni possono consentire invii successivi. [Sender broadcast](https://docs.rs/tokio/1.54.1/tokio/sync/broadcast/struct.Sender.html).

### Watch per lo stato corrente

```rust
use tokio::sync::watch;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (tx, mut rx) = watch::channel(String::from("starting"));
    assert_eq!(&*rx.borrow(), "starting");

    tx.send(String::from("working")).unwrap();
    tx.send(String::from("done")).unwrap();
    drop(tx);

    let mut observed = Vec::new();
    loop {
        let snapshot = { rx.borrow_and_update().clone() };
        observed.push(snapshot);
        if rx.changed().await.is_err() {
            break;
        }
    }
    assert_eq!(observed, ["done"]);
}
```

Gli aggiornamenti precedono intenzionalmente la lettura: working non e recuperabile. In un'app reale il ciclo elabora snapshot al posto di accumularli e legge lo stato prima della prima attesa, cosi non ignora il valore iniziale.

changed marca come vista una versione; borrow_and_update legge e marca quella effettivamente osservata, evitando di rielaborare lo stesso stato se arriva un nuovo invio fra notifica e lettura. Gli aggiornamenti intermedi possono comunque essere saltati. Un nuovo subscriber considera gia visto lo stato corrente.

Dopo la chiusura, changed puo ancora riuscire per un valore non visto; fallisce quando anche quello e visto. has_changed invece fallisce se il canale e chiuso, anche con un aggiornamento non visto. [watch](https://docs.rs/tokio/1.54.1/tokio/sync/watch/index.html).

Non mantenere il Ref di borrow/borrow_and_update attraverso await: trattiene un lock di lettura e puo bloccare gli invii. Lo scope dello snapshot nell'esempio rilascia il prestito prima dell'attesa. [Receiver watch](https://docs.rs/tokio/1.54.1/tokio/sync/watch/struct.Receiver.html).

send fallisce senza receiver e non salva il nuovo valore. send_replace aggiorna anche senza osservatori e restituisce il vecchio valore. send non confronta i valori per uguaglianza; se serve notificare soltanto modifiche effettive, valuta send_if_modified. [Sender watch](https://docs.rs/tokio/1.54.1/tokio/sync/watch/struct.Sender.html).

### Cancellare l'attesa senza perdere il payload

```rust
use tokio::sync::{mpsc, oneshot};

async fn enqueue_or_return(
    tx: &mpsc::Sender<String>,
    value: String,
    mut stop: oneshot::Receiver<()>,
) -> Result<(), String> {
    tokio::select! {
        biased;
        _ = &mut stop => Err(value),
        reserved = tx.reserve() => {
            match reserved {
                Ok(permit) => {
                    permit.send(value);
                    Ok(())
                }
                Err(_) => Err(value),
            }
        }
    }
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (tx, mut rx) = mpsc::channel(1);
    tx.send(String::from("first")).await.unwrap();
    let (signal, stop) = oneshot::channel();
    signal.send(()).unwrap();

    let value = enqueue_or_return(&tx, String::from("kept"), stop)
        .await.unwrap_err();
    assert_eq!(value, "kept");
    assert_eq!(rx.recv().await.as_deref(), Some("first"));

    let (signal, stop) = oneshot::channel();
    enqueue_or_return(&tx, value, stop).await.unwrap();
    drop(signal);
    assert_eq!(rx.recv().await.as_deref(), Some("kept"));
}
```

Qui anche la scomparsa del sender stop vale come richiesta di arresto; biased da precedenza al segnale se entrambi i rami sono pronti. Dopo la riserva il trasferimento non contiene await.

Se si seleziona direttamente send(value), la future possiede value: perdendo la selezione lo elimina. reserve evita quel trasferimento anticipato, ma cancellare la riserva perde il posto nella coda. **Se viene cancellata l'intera enqueue_or_return, anche il valore locale viene eliminato**: la garanzia riguarda solo i rami della selezione interna. [Sender mpsc](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/struct.Sender.html#method.reserve).

### Collegare codice sync e async

Per mpsc bounded, blocking_send e blocking_recv servono sul lato sincrono, non dentro una task async: questi metodi possono provocare panic nel contesto asincrono. Usa un thread dedicato o valuta spawn_blocking per lavoro bloccante finito, con una politica di arresto.

L'invio unbounded non attende spazio: senza limiti esterni puo esaurire la memoria. Un valore booleano watch puo rappresentare uno shutdown persistente per i nuovi osservatori; un evento broadcast inviato prima della sottoscrizione viene perso. Per la procedura completa vedi [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]].

## Errori comuni

### Il receiver mpsc non e clonabile

Questo programma **non compila**, errore E0599: due handle di lettura indipendenti non fanno parte del contratto mpsc Tokio.

```rust
use tokio::sync::mpsc;

fn main() {
    let (_tx, rx) = mpsc::channel::<u32>(1);
    let _other = rx.clone();
}
```

Un mutex attorno al receiver serializza l'accesso, non duplica messaggi e non realizza broadcast.

### Il sender oneshot si usa una volta

Questo programma **non compila**, errore E0382: il primo send consuma tx.

```rust
use tokio::sync::oneshot;

fn main() {
    let (tx, _rx) = oneshot::channel();
    let _ = tx.send(1);
    let _ = tx.send(2);
}
```

Per un'altra risposta crea una nuova coppia oppure scegli un canale con piu messaggi.

### Errori di protocollo

- Conservare sender inutilizzati: il consumer non vede la fine.
- Aspettare un send su coda piena prima di avviare il consumer nella stessa task: nessuno libera spazio.
- Considerare Closed, Lagged ed errore applicativo equivalenti: richiedono politiche differenti.
- Usare while let Ok(value) su broadcast: termina anche al primo lag, non soltanto alla chiusura.
- Conservare il guard di watch durante lavoro lento o await.
- Confondere recv cancellation-safe con una funzione che consuma piu messaggi: il progresso gia fatto non viene annullato.
- Ritentare una richiesta dopo un timeout come se non fosse mai partita: possono servire identificatori e deduplicazione.
- Ignorare JoinHandle: la chiusura del canale non certifica il completamento delle task.

## Checklist

- Si tratta di job, eventi, stato o risposta singola?
- Quanti consumer devono leggere ogni valore?
- Capacita e dimensione dei payload sono limitate? E le task in attesa?
- Come recupero Full, Closed, Lagged e risposta abbandonata?
- Chi elimina gli ultimi sender e rilascia i permit?
- All'arresto dreno, scarto o annullo il lavoro? Attendo le task?
- La cancellazione conserva il dato o lo elimina?
- Il successo conferma accodamento, elaborazione o persistenza?

## Collegamenti

- [[Programmazione/Rust/Pagine/Message passing|Message passing sincrono]]
- [[Programmazione/Rust/Pagine/Async Await|Async e await]]
- [[Programmazione/Rust/Pagine/select join e cancellation|select, join e cancellazione]]
- [[Programmazione/Rust/Pagine/Async streams|Async streams]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async]]

## Fonti

Riferimento delle API: Tokio 1.54.1. Gli esempi dimostrano contratti locali, non durabilita, prestazioni o tutti gli interleaving concorrenti.

- [Tutorial ufficiale: channels](https://tokio.rs/tokio/tutorial/channels).
- [mpsc](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/index.html), [Sender](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/struct.Sender.html), [Receiver](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/struct.Receiver.html).
- [oneshot](https://docs.rs/tokio/1.54.1/tokio/sync/oneshot/index.html), [Sender](https://docs.rs/tokio/1.54.1/tokio/sync/oneshot/struct.Sender.html).
- [broadcast](https://docs.rs/tokio/1.54.1/tokio/sync/broadcast/index.html), [Sender](https://docs.rs/tokio/1.54.1/tokio/sync/broadcast/struct.Sender.html).
- [watch](https://docs.rs/tokio/1.54.1/tokio/sync/watch/index.html), [Sender](https://docs.rs/tokio/1.54.1/tokio/sync/watch/struct.Sender.html), [Receiver](https://docs.rs/tokio/1.54.1/tokio/sync/watch/struct.Receiver.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

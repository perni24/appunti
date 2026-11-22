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
  - select!
  - join!
  - Cancellation async Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Future Trait]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
related:
  - "[[Programmazione/Rust/Pagine/Channel async]]"
  - "[[Programmazione/Rust/Pagine/Graceful shutdown]]"
  - "[[Programmazione/Rust/Pagine/Async streams]]"
title: select!, join! e cancellation
---

# select!, join! e cancellation

## Sintesi

Le macro **Tokio** coordinano future, non sono parole chiave Rust. `join!` raccoglie tutti i risultati; `try_join!` esce su errore; `select!` sceglie un ramo completato il cui pattern corrisponde. Nessuna delle tre crea automaticamente task separate.

Il punto decisivo della cancellazione e **chi possiede la future**: eliminarla, abbandonarne un prestito o scartare un JoinHandle non sono la stessa cosa. Cancellare non significa annullare gli effetti gia avvenuti.

Baseline degli esempi: **Rust 1.99.1, edition 2024, Tokio 1.54.1**. Non indica ultima versione o MSRV. Tutti i programmi usano un runtime current-thread e non richiedono server, file esterni o segnali del sistema operativo.

## Quando usarlo

| Strumento | Scelta pratica |
| --- | --- |
| `join!` | Servono tutti gli esiti, anche quando qualcuno e Err. |
| `try_join!` | Servono tutti gli Ok, ma un Err rende inutile continuare l'attesa comune. |
| `select!` | Si deve reagire a un evento fra dati, chiusura o scadenza. |
| `timeout` | Un'attesa ha un limite temporale, senza promettere interruzione forzata. |

Per task figlie da chiudere ordinatamente serve anche un protocollo di [[Programmazione/Rust/Pagine/Graceful shutdown|graceful shutdown]]: scegliere una macro non basta.

## Come funziona

### Concorrenza nella stessa task

I rami vengono pollati dalla task chiamante. Possono prendere in prestito dati locali, rispettando il borrow checker, senza i bound Send + static di spawn. Un ramo che blocca il thread blocca anche gli altri.

join restituisce una tupla nell'ordine dei rami, non nell'ordine di completamento. try_join richiede risultati con un tipo di errore comune e restituisce `Result<(A, B, ...), E>`; il primo Err osservato interrompe la combinazione. [join](https://docs.rs/tokio/1.54.1/tokio/macro.join.html), [try_join](https://docs.rs/tokio/1.54.1/tokio/macro.try_join.html).

### Cosa viene davvero eliminato

- **Future posseduta dalla combinazione:** il suo stato viene distrutto se abbandonato prima del completamento.
- **Prestito di una future conservata fuori:** termina quell'attesa; la future originale puo essere guidata di nuovo.
- **JoinHandle passato per valore:** perderlo distacca la task, non la interrompe.
- **`&mut JoinHandle`:** l'handle resta disponibile per attendere ancora o richiedere abort.

Drop puo rilasciare risorse, ma non esegue automaticamente una procedura async di salvataggio o un rollback remoto. Una richiesta potrebbe essere gia stata accettata dal destinatario. [Tutorial: cancellazione](https://tokio.rs/tokio/tutorial/select#cancellation), [JoinHandle](https://docs.rs/tokio/1.54.1/tokio/task/struct.JoinHandle.html).

### Pattern, guardie e ordine

In select, `value = future => handler` lega il risultato. Un pattern come `Some(value)` esclude invece None: quel ramo e disabilitato per **quella chiamata**. Gli handler devono produrre un tipo compatibile. Attenzione a `Ok(value)`: un Err non corrispondente viene scartato, non propagato. [Tutorial: pattern e risultati](https://tokio.rs/tokio/tutorial/select).

La guardia `if condizione` viene valutata prima del polling. Anche con false, l'espressione che costruisce la future e valutata, ma quella future non viene pollata. `else` scatta quando tutti i rami sono disabilitati, **non quando sono soltanto Pending**. Senza else, tutti disabilitati causano panic.

select sceglie normalmente un punto di partenza casuale; `biased;` impone l'ordine scritto. join e try_join normalmente ruotano il primo ramo pollato. Nessuna scelta garantisce tempi real-time: con biased e tua responsabilita evitare che un ramo sempre pronto nasconda lo shutdown. [select](https://docs.rs/tokio/1.54.1/tokio/macro.select.html), [join](https://docs.rs/tokio/1.54.1/tokio/macro.join.html).

## API / Sintassi

### Cargo.toml

Ogni blocco Rust e un programma indipendente da inserire in `src/main.rs`. Solo il programma etichettato come panic deve terminare con errore.

```toml
[package]
name = "select-notes"
version = "0.1.0"
edition = "2024"

[dependencies]
tokio = { version = "=1.54.1", features = ["rt", "macros", "time", "sync"] }
```

Conserva Cargo.lock per fissare anche le dipendenze transitive. Le feature coprono runtime, macro, timer e canali; rete, I/O esteso e segnali OS non fanno parte dei programmi. Per i builder e i driver vedi [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async]].

### Guardie: costruzione e polling

```rust
use std::cell::Cell;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let built = Cell::new(0);
    let polled = Cell::new(false);

    let fallback = tokio::select! {
        _ = {
            built.set(built.get() + 1);
            async { polled.set(true); }
        }, if false => false,
        else => true,
    };

    assert!(fallback);
    assert_eq!(built.get(), 1);
    assert!(!polled.get());
}
```

Non usare una guardia false per proteggere un unwrap nella costruzione del ramo. La costruzione deve essere valida comunque; soltanto il corpo async resta differito.

## Esempio pratico

### Join e try_join: errori diversi

```rust
use std::cell::Cell;
use std::future::pending;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let finished = Cell::new(false);
    let (first, second) = tokio::join!(
        async { Err::<u32, &str>("invalid input") },
        async {
            tokio::task::yield_now().await;
            finished.set(true);
            42
        }
    );

    assert_eq!(first, Err("invalid input"));
    assert_eq!(second, 42);
    assert!(finished.get());

    let result = tokio::try_join!(
        async { Err::<u32, &str>("invalid input") },
        pending::<Result<u32, &str>>()
    );
    assert_eq!(result, Err("invalid input"));
}
```

Il primo join non tratta Err come comando di arresto. Il secondo confronto usa intenzionalmente una future che non completa: try_join puo comunque tornare per l'errore dell'altro ramo.

Non applicare ingenuamente try_join a `JoinHandle<Result<T, E>>`: il Result esterno riguarda il join della task, quello interno l'applicazione. Un `Ok(Err(...))` non e un errore esterno. Anche appiattendo i due livelli, abbandonare altri handle per valore non cancella le rispettive task. [try_join](https://docs.rs/tokio/1.54.1/tokio/macro.try_join.html), [JoinHandle](https://docs.rs/tokio/1.54.1/tokio/task/struct.JoinHandle.html).

### Ricevere da due canali fino alla chiusura

```rust
use tokio::sync::mpsc;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (left_tx, mut left) = mpsc::channel(2);
    let (right_tx, mut right) = mpsc::channel(1);
    left_tx.try_send(10).unwrap();
    left_tx.try_send(20).unwrap();
    right_tx.try_send(30).unwrap();
    drop(left_tx);
    drop(right_tx);

    let mut values = Vec::new();
    loop {
        tokio::select! {
            Some(value) = left.recv() => values.push(value),
            Some(value) = right.recv() => values.push(value),
            else => break,
        }
    }

    values.sort_unstable();
    assert_eq!(values, [10, 20, 30]);
}
```

Un canale chiuso puo ancora contenere messaggi: recv produce None soltanto quando non ne rimangono e non ne arriveranno altri. Qui i sender vengono eliminati prima del ciclo. Se un canale resta aperto e vuoto, il ramo rimane in attesa e else non e una scorciatoia per uscire.

La singola attesa recv e cancellation-safe: se perde la selezione, non ha consumato un messaggio. Questo non certifica automaticamente una funzione che combina piu recv. [Receiver::recv](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/struct.Receiver.html#method.recv).

### Conservare una future tra due selezioni

```rust
use std::cell::Cell;
use tokio::sync::oneshot;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (tx, rx) = oneshot::channel::<u32>();
    let started = Cell::new(0);
    let work = async {
        started.set(started.get() + 1);
        rx.await.expect("producer closed")
    };
    tokio::pin!(work);

    tokio::select! {
        biased;
        _ = &mut work => panic!("producer has not sent yet"),
        _ = std::future::ready(()) => {}
    }
    assert_eq!(started.get(), 1);

    tx.send(42).unwrap();
    let value = tokio::select! {
        value = &mut work => value,
    };
    assert_eq!(value, 42);
    assert_eq!(started.get(), 1);
}
```

La prima selezione abbandona solo il prestito; il lavoro conserva il punto raggiunto. Pinning consente di riusare questo stato senza spostarlo. Dopo il completamento non ripollare arbitrariamente la stessa future: esci dal ciclo oppure disabilita il ramo con uno stato esplicito. Vedi [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]] e [[Programmazione/Rust/Pagine/Future Trait|Future Trait]].

### Una sola scadenza per tutto il ciclo

```rust
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (tx, mut rx) = mpsc::channel(3);
    for value in [10, 20, 30] {
        tx.try_send(value).unwrap();
    }

    let deadline = sleep(Duration::from_millis(5));
    tokio::pin!(deadline);
    let mut received = 0;

    loop {
        tokio::select! {
            biased;
            _ = &mut deadline => break,
            value = rx.recv() => {
                match value {
                    Some(_) => received += 1,
                    None => break,
                }
            }
        }
    }

    assert!(received <= 3);
    drop(tx);
}
```

Il sender resta vivo: dopo gli eventuali messaggi il timer consente l'uscita. Non si promette che tutti e tre vengano letti prima della scadenza. Sleep non e Unpin: qui viene pinnato e preso in prestito. Ricrearlo a ogni giro significherebbe invece riavviare l'intervallo; puo essere voluto per un timeout di inattivita, non per una scadenza complessiva. Per riutilizzare un Sleep gia completato, considera reset esplicito. [Sleep](https://docs.rs/tokio/1.54.1/tokio/time/struct.Sleep.html).

## Varianti

### Timeout di una task con arresto esplicito

```rust
use std::future::pending;
use tokio::time::{timeout, Duration};

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let mut task = tokio::spawn(pending::<()>());

    let result = timeout(Duration::from_millis(1), &mut task).await;
    assert!(result.is_err());

    task.abort();
    let error = task.await.expect_err("pending task cannot complete");
    assert!(error.is_cancelled());
}
```

timeout restituisce `Result<T, Elapsed>`: se T e gia un Result ci sono livelli distinti. Qui scade l'attesa di un handle preso in prestito, quindi la task esiste ancora. abort richiede la cancellazione; attendere l'handle ne osserva la conclusione. In un caso reale la task puo aver gia completato prima che abort abbia effetto.

Il timeout e cooperativo, non interrompe un poll che monopolizza il thread. Una future immediatamente pronta puo riuscire anche con durata zero. Non usarlo come garanzia di arresto di lavoro CPU o blocking. [timeout](https://docs.rs/tokio/1.54.1/tokio/time/fn.timeout.html), [abort](https://docs.rs/tokio/1.54.1/tokio/task/struct.JoinHandle.html#method.abort).

### Segnale cooperativo e cancellazione condivisa

Per terminare dopo un evento usa un ramo dedicato al segnale. `tokio::signal::ctrl_c()` richiede la feature signal e produce un Result: gestisci anche l'errore, non solo il completamento. Su Unix la registrazione cambia il trattamento di SIGINT per il processo; eliminare la future non ripristina automaticamente il comportamento precedente. [ctrl_c](https://docs.rs/tokio/1.54.1/tokio/signal/fn.ctrl_c.html).

`tokio_util::sync::CancellationToken` permette a piu task di osservare una richiesta condivisa. cancel segnala, non aspetta la fine del lavoro e non interrompe codice che ignora il segnale. Un clone condivide la cancellazione; un child_token puo essere cancellato senza cancellare il padre. Questa API appartiene a tokio-util, non alla crate Tokio del manifest sopra. [CancellationToken, tokio-util 0.7.20](https://docs.rs/tokio-util/0.7.20/tokio_util/sync/struct.CancellationToken.html).

La gestione di task figlie, buffer e scadenza finale e approfondita in [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]. Nessun segnale OS o token esterno e richiesto dagli esempi eseguibili qui.

## Errori comuni

### Due attese sicure non formano sempre un'operazione sicura

Questo programma termina correttamente, ma dimostra una **perdita logica del primo messaggio**:

```rust
use tokio::sync::mpsc;

async fn take_pair(rx: &mut mpsc::Receiver<u32>) -> Option<(u32, u32)> {
    let first = rx.recv().await?;
    let second = rx.recv().await?;
    Some((first, second))
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (tx, mut rx) = mpsc::channel(2);
    tx.try_send(10).unwrap();

    tokio::select! {
        biased;
        _ = take_pair(&mut rx) => panic!("second value is missing"),
        _ = std::future::ready(()) => {}
    }

    tx.try_send(20).unwrap();
    drop(tx);
    assert_eq!(rx.recv().await, Some(20));
    assert_eq!(rx.recv().await, None);
}
```

Il primo ramo consuma 10, poi si sospende aspettando il secondo valore. Quando perde, la future posseduta viene distrutta insieme al primo valore locale. Il canale non puo rimetterlo automaticamente in coda.

Per correggere il progetto, conserva il progresso fuori dalla future temporanea, oppure crea l'operazione una volta e seleziona su un suo prestito pinnato. Anche cosi devi decidere cosa fare quando il proprietario viene definitivamente eliminato.

Altri contratti da controllare singolarmente:

| Operazione | Rischio quando si abbandona l'attesa |
| --- | --- |
| mpsc send(value) | Se perde select, il valore non viene inviato ma viene eliminato con la future. Per conservarlo, valuta reserve prima di trasferirlo. |
| read_exact / write_all | Possono aver gia letto o scritto una parte; ripartire da zero non e un rollback. |
| Mutex lock | Cancellare l'attesa fa perdere il posto in coda; non significa corrompere il mutex. |

Fonti: [Sender](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/struct.Sender.html#method.send), [AsyncReadExt](https://docs.rs/tokio/1.54.1/tokio/io/trait.AsyncReadExt.html#method.read_exact), [AsyncWriteExt](https://docs.rs/tokio/1.54.1/tokio/io/trait.AsyncWriteExt.html#method.write_all), [Mutex](https://docs.rs/tokio/1.54.1/tokio/sync/struct.Mutex.html#method.lock).

### Tutti i rami disabilitati: panic

Questo programma **compila ma va in panic**:

```rust
#[tokio::main(flavor = "current_thread")]
async fn main() {
    tokio::select! {
        Some(_) = std::future::ready(None::<u32>) => {}
    }
}
```

None non corrisponde al pattern. Aggiungi else se l'assenza di rami validi e uno stato previsto, oppure tratta esplicitamente None. Non usare else come polling non bloccante: per un canale consulta try_recv. [select: panic](https://docs.rs/tokio/1.54.1/tokio/macro.select.html#panics).

### Altre confusioni

- Un errore ignorato da un pattern Ok puo nascondere la causa del fallimento.
- Droppare un handle o una future genitore non implica cancellare task figlie gia spawnate.
- Il ramo shutdown non viene piu monitorato mentre un handler scelto esegue altro lavoro lungo, anche con await.
- La cancellation safety di una singola API non garantisce atomicita dell'intero flusso applicativo.
- Fare abort non e un graceful shutdown e non annulla effetti esterni.
- Non disabilitare il timer con `if !deadline.is_elapsed()`: rischi proprio di escluderlo quando deve segnalare la scadenza. [Precondizioni e timer](https://docs.rs/tokio/1.54.1/tokio/macro.select.html#avoid-racy-if-preconditions).

## Checklist

- Servono tutti i risultati, tutti gli Ok o un solo evento?
- Quali errori vengono propagati e quali pattern li scartano?
- I rami possiedono future, prestiti o JoinHandle?
- Dove resta il progresso se un ramo perde?
- La scadenza e complessiva o riparte dopo ogni evento?
- Ogni future completata viene rimossa, disabilitata o reinizializzata secondo il suo contratto?
- L'ordine biased puo impedire di osservare la chiusura?
- Le task figlie vengono segnalate, eventualmente abortite e attese?

## Collegamenti

- [[Programmazione/Rust/Pagine/Async Await|Async e await]]
- [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async]]
- [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]]
- [[Programmazione/Rust/Pagine/Channel async|Channel async]]
- [[Programmazione/Rust/Pagine/Async streams|Async streams]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]

## Fonti

- [Tokio 1.54.1: select](https://docs.rs/tokio/1.54.1/tokio/macro.select.html), [join](https://docs.rs/tokio/1.54.1/tokio/macro.join.html), [try_join](https://docs.rs/tokio/1.54.1/tokio/macro.try_join.html).
- [Tokio: tutorial select](https://tokio.rs/tokio/tutorial/select).
- [Tokio 1.54.1: timeout](https://docs.rs/tokio/1.54.1/tokio/time/fn.timeout.html), [Sleep](https://docs.rs/tokio/1.54.1/tokio/time/struct.Sleep.html), [JoinHandle](https://docs.rs/tokio/1.54.1/tokio/task/struct.JoinHandle.html).
- [Tokio 1.54.1: mpsc](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/index.html).
- [tokio-util 0.7.20: CancellationToken](https://docs.rs/tokio-util/0.7.20/tokio_util/sync/struct.CancellationToken.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

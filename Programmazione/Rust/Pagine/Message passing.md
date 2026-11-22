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
  - Message passing Rust
  - std::sync::mpsc
prerequisites:
  - "[[Programmazione/Rust/Pagine/Threads]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
related:
  - "[[Programmazione/Rust/Pagine/Channel async]]"
  - "[[Programmazione/Rust/Pagine/Shared state]]"
  - "[[Programmazione/Rust/Pagine/Graceful shutdown]]"
title: Message passing
---

# Message passing

## Sintesi

Message passing organizza la comunicazione attraverso messaggi: un produttore trasferisce dati a un consumatore, che li elabora secondo un protocollo esplicito. In Rust `std::sync::mpsc` offre canali **multi-producer, single-consumer** per codice sincrono.

Un invio riuscito, una ricezione riuscita e un lavoro completato sono eventi diversi. Capacita della coda, ownership, chiusura e gestione degli errori fanno parte del progetto, non sono dettagli accessori.

## Quando usarlo

- Per affidare a un worker la proprieta di uno stato e inviargli comandi.
- Per raccogliere risultati da piu produttori in un unico consumatore.
- Per introdurre una coda con capacita controllata e backpressure.
- Per rendere espliciti eventi, richieste e risposte.

Non serve un canale per sostituire una semplice chiamata di funzione. Evitare lock espliciti nel codice applicativo non significa che il canale sia lock-free o che non possa causare deadlock.

## Come funziona

### Endpoint, ownership e ordine

`channel::<T>()` restituisce `(Sender<T>, Receiver<T>)`. Puoi clonare il sender per inviare nello stesso canale; non stai copiando il buffer o il messaggio. Il receiver non e clonabile e non e `Sync`; puoi trasferirlo a un altro thread quando `T: Send`.

`send(value)` prende il valore per ownership. Una `String` o un `Vec` non vengono clonati in profondita: vengono trasferiti i dati che ne rappresentano il proprietario. La memoria del contenuto resta comunque occupata finche il messaggio e vivo. Un tipo `Copy` puo invece essere riutilizzato dal chiamante.

I canali sono FIFO. Gli invii sequenziali dello stesso produttore mantengono l'ordine; l'interleaving di produttori concorrenti non e prevedibile dall'ordine in cui hai creato i thread. [Modulo mpsc](https://doc.rust-lang.org/std/sync/mpsc/index.html), [Rust Book](https://doc.rust-lang.org/book/ch16-02-message-passing.html).

### Capacita e backpressure

| Costruzione | Comportamento dell'invio | Uso tipico |
| --- | --- | --- |
| `channel()` | Nessuna attesa di spazio nel buffer | Flusso di volume controllato |
| `sync_channel(n)`, con `n > 0` | `send` attende se i posti sono esauriti | Limitare i messaggi in coda |
| `sync_channel(0)` | `send` attende il rendezvous con il ricevitore | Passaggio diretto senza buffer |

Un canale unbounded non ha memoria infinita: se produci piu velocemente di quanto consumi, la coda puo crescere fino a esaurire le risorse. Il limite di un canale bounded conta **messaggi**, non byte, e non include tutti i dati gia in elaborazione o posseduti dai produttori.

La parola "asynchronous" nella documentazione di `channel` indica il disaccoppiamento dell'invio dalla ricezione, non un'API basata su `Future` o `.await`. `recv` e `SyncSender::send` possono bloccare il thread. [channel](https://doc.rust-lang.org/std/sync/mpsc/fn.channel.html), [sync_channel](https://doc.rust-lang.org/std/sync/mpsc/fn.sync_channel.html).

### Chiusura e messaggi gia accodati

Non si chiude un canale standard chiamando `close()`: la disconnessione dipende dal rilascio degli endpoint.

- Quando tutti i sender, originale e cloni, sono distrutti, il ricevitore puo ancora consumare i messaggi nel buffer.
- Dopo lo svuotamento, `recv` restituisce `RecvError`.
- Con buffer vuoto e almeno un sender vivo, `recv` puo attendere indefinitamente.
- Quando il receiver viene distrutto, gli invii successivi falliscono. I messaggi ancora nel buffer non verranno elaborati.

`Sender::send` che restituisce `Ok(())` non promette che il ricevitore leggera il valore: puo essere distrutto subito dopo. Con un rendezvous riuscito il valore e stato ricevuto, ma il lavoro applicativo puo non essere ancora terminato. Serve una risposta o un acknowledgement per confermarlo. [Sender::send](https://doc.rust-lang.org/std/sync/mpsc/struct.Sender.html#method.send), [SyncSender::send](https://doc.rust-lang.org/std/sync/mpsc/struct.SyncSender.html#method.send).

## API / Sintassi

Gli esempi sono programmi autonomi per `src/main.rs`, senza crate esterne. Gli `expect` segnalano invarianti degli esempi didattici: in un servizio reale scegli una strategia per disconnessioni, panic e shutdown.

### Trasferire una String e attendere il produttore

```rust
use std::{sync::mpsc, thread};

fn main() {
    let (tx, rx) = mpsc::channel();
    let producer = thread::spawn(move || tx.send(String::from("ciao")));

    let message = rx.recv();
    let sent = producer.join().expect("producer panicked");
    sent.expect("receiver disconnected");
    assert_eq!(message.expect("sender disconnected"), "ciao");
    println!("received=ciao");
}
```

Ricevere un messaggio non equivale a fare `join`: il produttore potrebbe avere altro lavoro da eseguire. Qui controlliamo entrambi gli esiti.

### Distinguere vuoto, timeout e disconnessione

```rust
use std::sync::mpsc::{self, RecvTimeoutError, TryRecvError};
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel::<u8>();

    assert_eq!(rx.try_recv(), Err(TryRecvError::Empty));
    assert_eq!(
        rx.recv_timeout(Duration::ZERO),
        Err(RecvTimeoutError::Timeout)
    );

    tx.send(7).unwrap();
    drop(tx);

    assert_eq!(rx.recv(), Ok(7));
    assert_eq!(rx.try_recv(), Err(TryRecvError::Disconnected));
    assert_eq!(
        rx.recv_timeout(Duration::ZERO),
        Err(RecvTimeoutError::Disconnected)
    );
    assert!(rx.recv().is_err());
    println!("empty -> timeout -> value -> disconnected");
}
```

La durata zero rende il caso riproducibile senza aspettare lo scheduler. In un'applicazione scegli un tempo coerente con il protocollo. Un timeout non chiude il canale, non cancella il produttore e non dimostra che il lavoro sia fallito: il messaggio puo arrivare dopo.

`try_recv` distingue `Empty` da `Disconnected`; `recv_timeout` distingue `Timeout` da `Disconnected`. Evita cicli stretti su `try_recv` che consumano CPU senza fare altro. [TryRecvError](https://doc.rust-lang.org/std/sync/mpsc/enum.TryRecvError.html), [RecvTimeoutError](https://doc.rust-lang.org/std/sync/mpsc/enum.RecvTimeoutError.html).

### Gestire una coda piena senza perdere il valore

```rust
use std::sync::mpsc::{self, TrySendError};

fn main() {
    let (tx, rx) = mpsc::sync_channel(1);
    tx.send(String::from("first")).unwrap();

    let pending = match tx.try_send(String::from("second")) {
        Err(TrySendError::Full(value)) => value,
        other => panic!("expected a full queue, got {other:?}"),
    };

    assert_eq!(rx.recv().unwrap(), "first");
    tx.send(pending).unwrap();
    assert_eq!(rx.recv().unwrap(), "second");

    drop(rx);
    match tx.try_send(String::from("third")) {
        Err(TrySendError::Disconnected(value)) => assert_eq!(value, "third"),
        other => panic!("expected disconnection, got {other:?}"),
    }
    println!("full handled; pending value retained");
}
```

`SyncSender::try_send` restituisce subito `Full(T)` oppure `Disconnected(T)`. Entrambi conservano il messaggio non inviato: puoi riprovare, scartarlo consapevolmente o segnalarlo. Non riprovare in un loop infinito senza attesa o limite.

Anche `send` restituisce il valore in `SendError<T>`, accessibile tramite `error.0`, quando il receiver e disconnesso. Non e un errore "coda piena": il `send` bounded attende spazio. [TrySendError](https://doc.rust-lang.org/std/sync/mpsc/enum.TrySendError.html), [SendError](https://doc.rust-lang.org/std/sync/mpsc/struct.SendError.html).

### Usare un canale senza buffer

```rust
use std::{sync::mpsc, thread};

fn main() {
    let (tx, rx) = mpsc::sync_channel(0);
    let producer = thread::spawn(move || tx.send(String::from("ready")));

    let message = rx.recv().expect("sender disconnected");
    producer
        .join()
        .expect("producer panicked")
        .expect("receiver disconnected");

    assert_eq!(message, "ready");
    println!("rendezvous completed");
}
```

La ricezione precede il `join`. Se il chiamante attendesse prima il produttore, quest'ultimo resterebbe bloccato in `send` in attesa proprio del chiamante: deadlock.

## Esempio pratico

### Raccogliere messaggi da piu produttori

```rust
use std::{sync::mpsc, thread};

fn main() {
    let (tx, rx) = mpsc::channel();
    let mut producers = Vec::new();

    for name in ["a", "b"] {
        let sender = tx.clone();
        producers.push(thread::spawn(move || {
            for sequence in 0..3 {
                sender.send((name, sequence)).expect("receiver disconnected");
            }
        }));
    }
    drop(tx);

    let mut messages: Vec<_> = rx.iter().collect();
    let outcomes: Vec<_> = producers.into_iter().map(|h| h.join()).collect();
    assert!(outcomes.into_iter().all(|outcome| outcome.is_ok()));

    for name in ["a", "b"] {
        let order: Vec<_> = messages
            .iter()
            .filter(|(producer, _)| *producer == name)
            .map(|(_, sequence)| *sequence)
            .collect();
        assert_eq!(order, [0, 1, 2]);
    }

    messages.sort_unstable();
    assert_eq!(
        messages,
        [("a", 0), ("a", 1), ("a", 2), ("b", 0), ("b", 1), ("b", 2)]
    );
    println!("received={}", messages.len());
}
```

`rx.iter()` aspetta nuovi messaggi e termina dopo disconnessione e svuotamento. Il `drop(tx)` del sender originale e essenziale: senza di esso la raccolta non finirebbe, anche se tutti i produttori fossero terminati.

Anche `for message in rx` attende, ma consuma il receiver. `try_iter()` legge senza aspettare e termina quando non trova un messaggio: non certifica che i produttori abbiano finito. [Receiver](https://doc.rust-lang.org/std/sync/mpsc/struct.Receiver.html), [TryIter](https://doc.rust-lang.org/std/sync/mpsc/struct.TryIter.html).

### Definire comandi e arrestare un worker

```rust
use std::{sync::mpsc, thread};

#[derive(Debug)]
enum Command {
    Work(u64),
    Stop,
}

fn worker(rx: mpsc::Receiver<Command>) -> usize {
    let mut processed = 0;
    for command in rx {
        match command {
            Command::Work(id) => {
                println!("job {id}");
                processed += 1;
            }
            Command::Stop => break,
        }
    }
    processed
}

fn main() {
    let (tx, rx) = mpsc::sync_channel(2);
    let handle = thread::spawn(move || worker(rx));

    let sending = [Command::Work(7), Command::Work(9), Command::Stop]
        .into_iter()
        .try_for_each(|command| tx.send(command));
    drop(tx);

    let completion = handle.join();
    sending.expect("worker disconnected before all commands were sent");
    assert_eq!(completion.expect("worker panicked"), 2);
    println!("processed=2");
}
```

Con questo unico produttore, i due lavori precedono `Stop`. Il worker esce anche se tutti i sender scompaiono: il ciclo completa gli elementi gia accodati e termina.

`Stop` e un messaggio ordinario: puo attendere spazio nella coda e non interrompe il lavoro corrente. Con piu produttori devi prima impedire nuovi invii e coordinare l'arresto; eventuali comandi dopo `Stop` non vengono elaborati. `send(Stop)` non basta a provare che il worker sia terminato: per questo viene usato `join`.

## Varianti

### Richiesta e risposta esplicita

```rust
use std::{sync::mpsc, thread};

struct Request {
    text: String,
    reply: mpsc::Sender<usize>,
}

fn main() {
    let (tx, rx) = mpsc::sync_channel::<Request>(1);
    let worker = thread::spawn(move || {
        for request in rx {
            let count = request.text.chars().count();
            if request.reply.send(count).is_err() {
                eprintln!("requester no longer waiting");
            }
        }
    });

    let (reply_tx, reply_rx) = mpsc::channel();
    tx.send(Request {
        text: String::from("rust"),
        reply: reply_tx,
    })
    .expect("worker disconnected");
    drop(tx);

    let response = reply_rx.recv();
    let completion = worker.join();
    assert_eq!(response.expect("worker did not reply"), 4);
    completion.expect("worker panicked");
    println!("processed characters=4");
}
```

La risposta viene inviata **dopo** il conteggio: e una conferma applicativa, non soltanto un successo di accodamento. Il canale di risposta e usato una volta per convenzione; `std::sync::mpsc` non lo rende un tipo oneshot dedicato.

Se il richiedente abbandona il receiver di risposta, il worker rileva l'errore al momento dell'invio; il conteggio e gia avvenuto. Aggiungere un timeout non annulla automaticamente gli effetti del lavoro, e ripetere una richiesta potrebbe duplicarli.

### Altri modelli di canale

- **Async**: per task ed executor usa canali dedicati, come `tokio::sync::mpsc`, o le alternative descritte in [[Programmazione/Rust/Pagine/Channel async|Channel async]]. Non bloccare il thread dell'executor con `recv`.
- **Oneshot**: un solo risultato, per esempio una risposta.
- **Broadcast/watch**: consegna a piu osservatori o notifica dell'ultimo stato; non sono varianti intercambiabili con il receiver unico standard.
- **MPMC**: piu consumatori che si dividono il lavoro richiedono un'astrazione adatta. Mettere un receiver in `Arc<Mutex<_>>` serializza l'accesso; non crea broadcast.
- **Stato condiviso**: inviare `Arc<T>` condivide ownership, non rende il contenuto thread-safe e non elimina la necessaria sincronizzazione.

## Errori comuni

### Riutilizzare una String dopo send

Controesempio: **non compila**.

```rust
use std::sync::mpsc;

fn main() {
    let (tx, _rx) = mpsc::channel();
    let message = String::from("job");
    tx.send(message).unwrap();
    println!("{message}");
}
```

Il valore e stato mosso. Per conservare una copia devi scegliere esplicitamente `clone`, oppure riprogettare chi possiede il dato.

### Clonare il receiver standard

Controesempio: **non compila**.

```rust
use std::sync::mpsc;

fn main() {
    let (_tx, rx) = mpsc::channel::<u32>();
    let _other = rx.clone();
}
```

Clona il sender per avere piu produttori. Per piu consumatori scegli un modello diverso, senza confondere distribuzione dei job e invio a tutti.

### Problemi di protocollo

- Conservare un sender inutilizzato e attendere la chiusura del ricevitore.
- Fare `join` di un produttore bloccato su una coda piena prima di iniziare a consumare.
- Interpretare `Empty` o `Timeout` come disconnessione definitiva.
- Pensare che `Ok(())` da `send` significhi lavoro concluso.
- Trattenere un lock mentre un invio o una ricezione dipendono da chi deve acquisire lo stesso lock.
- Limitare la coda ma ignorare la dimensione dei messaggi e il numero di produttori.
- Trattare il canale come coda persistente: un crash del processo non conserva i messaggi.

## Checklist

- Chi possiede ciascun endpoint e chi lo distrugge?
- Serve un buffer limitato, un rendezvous o un flusso unbounded controllato?
- Errori di coda piena, disconnessione e timeout sono distinti?
- Il messaggio non inviato viene recuperato o scartato consapevolmente?
- Il consumatore continua a svuotare la coda mentre i produttori lavorano?
- Serve una risposta per confermare l'elaborazione?
- L'arresto impedisce nuovi lavori, gestisce quelli pendenti e attende i worker?

## Collegamenti

- [[Programmazione/Rust/Pagine/Threads|Threads]]
- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Channel async|Channel async]]
- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]

## Fonti

Documentazione della standard library consultata per **Rust 1.99.1**. Gli esempi usano API stable; non richiedono runtime async.

- [Rust Book: Message passing](https://doc.rust-lang.org/book/ch16-02-message-passing.html)
- [std::sync::mpsc](https://doc.rust-lang.org/std/sync/mpsc/index.html)
- [channel](https://doc.rust-lang.org/std/sync/mpsc/fn.channel.html)
- [sync_channel](https://doc.rust-lang.org/std/sync/mpsc/fn.sync_channel.html)
- [Sender](https://doc.rust-lang.org/std/sync/mpsc/struct.Sender.html)
- [SyncSender](https://doc.rust-lang.org/std/sync/mpsc/struct.SyncSender.html)
- [Receiver](https://doc.rust-lang.org/std/sync/mpsc/struct.Receiver.html)
- [SendError](https://doc.rust-lang.org/std/sync/mpsc/struct.SendError.html)
- [TrySendError](https://doc.rust-lang.org/std/sync/mpsc/enum.TrySendError.html)
- [TryRecvError](https://doc.rust-lang.org/std/sync/mpsc/enum.TryRecvError.html)
- [RecvTimeoutError](https://doc.rust-lang.org/std/sync/mpsc/enum.RecvTimeoutError.html)
- [TryIter](https://doc.rust-lang.org/std/sync/mpsc/struct.TryIter.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

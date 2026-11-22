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
  - Stream async
  - Async Stream Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Future Trait]]"
  - "[[Programmazione/Rust/Pagine/Iterator API]]"
related:
  - "[[Programmazione/Rust/Pagine/Channel async]]"
  - "[[Programmazione/Rust/Pagine/select join e cancellation]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
title: Async streams
---

# Async streams

## Sintesi

Uno **stream async** produce una sequenza di elementi, ciascuno disponibile subito oppure dopo un'attesa. Una Future termina con un solo Output; uno Stream puo produrre piu Item prima della fine.

Qui si usa il trait `futures_core::Stream`, riesportato anche da futures-util e tokio-stream. Gli adattatori aggiungono operazioni simili a quelle degli iteratori, ma **uno stream non e una future da attendere direttamente**: normalmente si attende la future restituita da next.

Baseline: **Rust 1.99.1, edition 2024**, **Tokio 1.54.1**, **futures-util 0.3.34**, **tokio-stream 0.1.19**. Non indica ultima versione o MSRV. Gli esempi non richiedono rete o database.

## Quando usarlo

- Per messaggi, righe, eventi o risultati che arrivano progressivamente.
- Per trasformare una sequenza senza raccoglierla subito interamente in memoria.
- Per collegare un consumer a una sorgente asincrona con un protocollo di chiusura.
- Per applicare concorrenza limitata a piu operazioni I/O.

Per un singolo risultato usa una Future. Se tutti i dati sono gia locali e l'elaborazione e sincrona, un Iterator puo bastare: trasformarlo in Stream non lo rende piu veloce.

## Come funziona

### Contratto di poll_next

La firma del metodo richiesto e `fn poll_next(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>>`.

Le varianti di Poll distinguono tre stati:

| Risultato | Significato |
| --- | --- |
| `Pending` | Nessun elemento pronto adesso; la task dovra essere risvegliata quando puo riprovare. |
| `Ready(Some(item))` | Un elemento e stato prodotto; lo stream puo continuare. |
| `Ready(None)` | Lo stream e terminato, non semplicemente vuoto per il momento. |

Il contratto generale non permette di presumere ulteriori poll validi dopo None. Usa fuse quando il consumer puo interrogare nuovamente la sorgente terminata. Non fare busy polling su Pending. [Stream](https://docs.rs/futures-core/0.3.34/futures_core/stream/trait.Stream.html).

### Polling, runtime e stato

next prende in prestito lo stream e restituisce una future con Output `Option<Item>`. L'await puo risolversi subito: non significa necessariamente sospensione.

Gli adattatori sono guidati dal polling del consumer. Un produttore gia spawnato puo invece proseguire indipendentemente, nei limiti del suo canale. Il solo trait Stream non impone Tokio: sono le risorse interne, per esempio i timer, a richiedere un runtime compatibile. [Tutorial Tokio](https://tokio.rs/tokio/tutorial/streams), [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async]].

Pinning stabilizza lo stato quando necessario, non lo rende Send o static. next richiede Unpin sul valore attraverso cui lo chiami: con un tipo non Unpin puoi usare un puntatore pinnato, senza rendere Unpin il contenuto. Vedi [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]].

## API / Sintassi

### Cargo.toml

Ogni blocco Rust e un programma indipendente per `src/main.rs`. I due controesempi in Errori comuni devono fallire in compilazione.

```toml
[package]
name = "stream-notes"
version = "0.1.0"
edition = "2024"

[dependencies]
tokio = { version = "=1.54.1", features = ["rt", "macros", "sync", "time"] }
futures-util = { version = "=0.3.34", default-features = false, features = ["std", "async-await"] }
tokio-stream = "=0.1.19"
```

Il manifest usa futures-util direttamente, senza importare l'intera facade futures. Conserva Cargo.lock per fissare anche le versioni transitive. Tokio-stream e una crate separata da tokio.

### Due StreamExt, non due Stream incompatibili

Entrambe le librerie estendono lo stesso trait Stream, ma i loro metodi non hanno sempre lo stesso contratto:

| Metodo | futures-util | tokio-stream |
| --- | --- | --- |
| next | Future che restituisce Option; richiede Unpin. | Stessa forma generale. |
| map | Calcolo sincrono sull'Item. | Calcolo sincrono sull'Item. |
| filter | Predicato che restituisce Future di bool. | Predicato che restituisce bool. |
| then | Attende la future prodotta per ciascun elemento. | Attende una future per elemento. |

Fonti: [futures-util StreamExt](https://docs.rs/futures-util/0.3.34/futures_util/stream/trait.StreamExt.html), [tokio-stream StreamExt](https://docs.rs/tokio-stream/0.1.19/tokio_stream/trait.StreamExt.html).

Importa normalmente un solo StreamExt per scope. Per usare un metodo dell'altro, chiamalo in forma qualificata come nell'esempio dei filtri. Rinominare entrambi gli import non elimina da solo l'ambiguita dei metodi.

## Esempio pratico

### Consumo generico con pinning locale

```rust
use futures_util::{stream, Stream, StreamExt};
use std::pin::pin;

async fn consume_numbers<S>(stream: S) -> Vec<u64>
where
    S: Stream<Item = u64>,
{
    let mut stream = pin!(stream);
    let mut values = Vec::new();
    while let Some(value) = stream.next().await {
        values.push(value);
    }
    values
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let source = stream::iter([1_u64, 2, 3]).then(|value| async move {
        tokio::task::yield_now().await;
        value * 10
    });

    assert_eq!(consume_numbers(source).await, [10, 20, 30]);
}
```

L'helper possiede e pinna localmente lo stream, quindi non impone Unpin al chiamante. Il tipo creato da then con questo blocco async puo essere consumato senza boxing. yield_now rende visibile una trasformazione asincrona dimostrativa; non simula una richiesta di rete.

La raccolta in Vec e adatta qui alla sorgente finita. Un consumer di eventi senza fine deve elaborare o scaricare progressivamente gli elementi, oppure applicare un limite esplicito.

### Filtri delle due librerie

```rust
use futures_util::{stream, StreamExt};

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let first: Vec<_> = stream::iter([1, 2, 3, 4])
        .filter(|&value| std::future::ready(value % 2 == 0))
        .map(|value| value * 10)
        .collect()
        .await;

    let second = tokio_stream::StreamExt::filter(
        tokio_stream::iter([1, 2, 3, 4]),
        |value| value % 2 == 0,
    );
    let second: Vec<_> = second.collect().await;

    assert_eq!(first, [20, 40]);
    assert_eq!(second, [2, 4]);
}
```

Il predicato futures-util riceve un riferimento: per il numero Copy, `|&value|` copia il valore prima di costruire la future. Per dati posseduti piu complessi, valuta cosa copiare o clonare invece di far sfuggire involontariamente il prestito del predicato.

map con una closure async produce uno **stream di future**, non di risultati. Per attenderle una alla volta usa then; per gestirne piu di una alla volta usa un adattatore di concorrenza.

### ReceiverStream e backpressure

```rust
use futures_util::StreamExt;
use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (tx, rx) = mpsc::channel(2);
    let producer = tokio::spawn(async move {
        for value in 0_u32..4 {
            if tx.send(value).await.is_err() {
                return;
            }
        }
    });

    let mut stream = ReceiverStream::new(rx);
    let mut values = Vec::new();
    while let Some(value) = stream.next().await {
        values.push(value);
    }
    producer.await.expect("producer failed");
    assert_eq!(values, [0, 1, 2, 3]);
}
```

ReceiverStream possiede il receiver. Il canale bounded applica pressione al produttore: send attende quando la capacita e esaurita. La capacita limita i messaggi nel canale, non la dimensione totale dei payload, delle task o del Vec del consumer. [mpsc](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/index.html).

Il ciclo termina quando il canale e chiuso e drenato. Un clone del sender rimasto vivo puo mantenerlo aperto. Eliminare il receiver fa fallire i send successivi, ma non interrompe arbitrariamente il codice del produttore: qui il produttore controlla l'errore.

Per una chiusura con drenaggio, ReceiverStream offre close; poi continua a ricevere fino a None. I permit gia ottenuti possono ancora inviare e devono essere consumati o rilasciati. [ReceiverStream](https://docs.rs/tokio-stream/0.1.19/tokio_stream/wrappers/struct.ReceiverStream.html).

### Errori come elementi oppure uscita anticipata

```rust
use futures_util::{stream, StreamExt, TryStreamExt};

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let input = [Ok(10), Err("invalid record"), Ok(30)];
    let mut source = stream::iter(input);
    let mut values = Vec::new();
    let mut errors = Vec::new();

    while let Some(item) = source.next().await {
        match item {
            Ok(value) => values.push(value),
            Err(error) => errors.push(error),
        }
    }
    assert_eq!(values, [10, 30]);
    assert_eq!(errors, ["invalid record"]);

    let result: Result<Vec<_>, _> = stream::iter(input).try_collect().await;
    assert_eq!(result, Err("invalid record"));
}
```

In `Stream<Item = Result<T, E>>`, `Some(Err(error))` e un elemento, non la fine della sequenza. Continuare ha senso solo se il protocollo della sorgente lo permette: l'array dimostrativo contiene davvero un elemento successivo.

try_collect sceglie invece fail-fast e scarta la raccolta parziale su errore. `try_next().await` restituisce `Result<Option<T>, E>`, distinguendo errore da fine stream; `?` decide se uscire dalla funzione chiamante. Nessun adattatore annulla effetti esterni gia eseguiti. [TryStreamExt](https://docs.rs/futures-util/0.3.34/futures_util/stream/trait.TryStreamExt.html).

## Varianti

### Concorrenza limitata e ordine

```rust
use futures_util::{stream, StreamExt};

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let mut results: Vec<_> = stream::iter([1_u32, 2, 3, 4])
        .map(|value| async move {
            tokio::task::yield_now().await;
            value * 10
        })
        .buffer_unordered(2)
        .collect()
        .await;

    results.sort_unstable();
    assert_eq!(results, [10, 20, 30, 40]);
}
```

Il limite positivo 2 controlla quante future l'adattatore mantiene contemporaneamente in corso. buffer_unordered non conserva l'ordine di ingresso; buffered lo conserva e puo trattenere risultati gia pronti dietro a un elemento lento. Nessuno dei due crea thread.

Il limite non governa task avviate altrove prima della pipeline. Usa una misura coerente con le risorse reali, per esempio connessioni o richieste, senza dedurre le prestazioni da questo esempio. [BufferUnordered](https://docs.rs/futures-util/0.3.34/futures_util/stream/struct.BufferUnordered.html), [adattatori di buffering](https://docs.rs/futures-util/0.3.34/futures_util/stream/trait.StreamExt.html#method.buffered).

### Fuse e terminazione osservabile

```rust
use futures_util::stream::{self, FusedStream, StreamExt};

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let mut source = stream::iter([10]).fuse();
    assert_eq!(source.next().await, Some(10));
    assert_eq!(source.next().await, None);
    assert!(source.is_terminated());
    assert_eq!(source.next().await, None);
}
```

L'adattatore fuse impedisce di interrogare nuovamente la sorgente interna dopo la fine. FusedStream espone is_terminated, ma questo trait non equivale a riavviare la sorgente.

Un ramo select che produce sempre None e comunque pronto: in un ciclo devi disabilitarlo o terminare, non aspettarti che fuse lo trasformi in Pending. [FusedStream](https://docs.rs/futures-core/0.3.34/futures_core/stream/trait.FusedStream.html), [[Programmazione/Rust/Pagine/select join e cancellation|select e cancellazione]].

### Boxing senza imporre static

```rust
use futures_util::stream::{self, LocalBoxStream, StreamExt};

fn labels<'a>(
    values: &'a [String],
    reverse: bool,
) -> LocalBoxStream<'a, &'a str> {
    if reverse {
        stream::iter(values.iter().rev().map(String::as_str)).boxed_local()
    } else {
        stream::iter(values.iter().map(String::as_str)).boxed_local()
    }
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let values = vec![String::from("first"), String::from("second")];
    let result: Vec<_> = labels(&values, true).collect().await;
    assert_eq!(result, ["second", "first"]);
}
```

Il boxing uniforma tipi di stream diversi tramite dispatch dinamico e allocazione. LocalBoxStream non richiede Send; BoxStream aggiunge Send, non static. Il lifetime esplicito continua a vincolare il prestito: nessuno dei due alias prolunga la vita dei dati. [LocalBoxStream](https://docs.rs/futures-util/latest/futures_util/stream/type.LocalBoxStream.html), [[Programmazione/Rust/Pagine/Future Trait|Future Trait]].

## Errori comuni

### Next su un tipo non Unpin

Questo programma **non compila**:

```rust
use futures_util::{stream, StreamExt};

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let mut source = stream::iter([1_u32]).then(|value| async move { value });
    let _ = source.next().await;
}
```

Pinna il valore e chiama next attraverso il puntatore pinnato, come nell'helper generico. Aggiungere Unpin come bound a un'API puo essere una scelta, ma esclude questi stream invece di risolverne il pinning.

### Due trait di estensione nello stesso scope

Anche questo programma **non compila**:

```rust
use futures_util::StreamExt;
use tokio_stream::StreamExt as TokioStreamExt;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let mut source = tokio_stream::iter([1_u32]);
    let _ = source.next().await;
}
```

Entrambi i trait offrono next: il nome alternativo dell'import non decide quale metodo usare. Importane uno solo oppure scrivi `futures_util::StreamExt::next(&mut source).await`.

### Risorse, cancellazione e memoria

- Unbounded non significa memoria illimitata disponibile: manca il freno dato dalla capacita.
- collect su una sequenza infinita non restituisce il risultato finale; una sequenza finita enorme puo comunque consumare troppa memoria.
- Costruire una pipeline senza guidarla non ne esegue automaticamente il lavoro.
- Eliminare lo stream proprietario puo chiudere una sorgente, ma non cancella genericamente task o richieste remote.
- Cancellare next che prende in prestito uno stream non equivale a cancellare tutto lo stream. Una funzione che attende un elemento e poi un'altra operazione puo comunque perdere progresso locale se abbandonata.
- Non aggiungere spawn per ogni elemento senza limiti: il consumer potrebbe drenare rapidamente il canale e spostare l'accumulo nelle task.
- Nel protocollo di un'implementazione personalizzata, Pending richiede il corretto uso del Waker. Preferisci adattatori esistenti quando coprono la sorgente.

Per la cancellazione delle operazioni composte e il rapporto con le task figlie vedi [[Programmazione/Rust/Pagine/select join e cancellation|select e cancellazione]]; per la chiusura ordinata vedi [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]].

## Checklist

- La sorgente richiede un runtime specifico?
- Pending, None ed Err sono trattati come stati diversi?
- Quale StreamExt fornisce il metodo chiamato?
- La pipeline contiene valori o future ancora da attendere?
- Serve pinning, un bound Unpin oppure boxing?
- Il consumer limita memoria, messaggi in coda e operazioni in corso?
- L'ordine dei risultati deve seguire quello degli input?
- I sender rimasti vivi e i permit possono ritardare la chiusura?
- Cosa resta attivo quando il consumer si ferma?

## Collegamenti

- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]
- [[Programmazione/Rust/Pagine/Async Await|Async e await]]
- [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async]]
- [[Programmazione/Rust/Pagine/Channel async|Channel async]]
- [[Programmazione/Rust/Pagine/select join e cancellation|select e cancellazione]]
- [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]

## Fonti

- [futures-core 0.3.34: Stream](https://docs.rs/futures-core/0.3.34/futures_core/stream/trait.Stream.html), [FusedStream](https://docs.rs/futures-core/0.3.34/futures_core/stream/trait.FusedStream.html).
- [futures-util 0.3.34: StreamExt](https://docs.rs/futures-util/0.3.34/futures_util/stream/trait.StreamExt.html), [TryStreamExt](https://docs.rs/futures-util/0.3.34/futures_util/stream/trait.TryStreamExt.html).
- [tokio-stream 0.1.19: StreamExt](https://docs.rs/tokio-stream/0.1.19/tokio_stream/trait.StreamExt.html), [ReceiverStream](https://docs.rs/tokio-stream/0.1.19/tokio_stream/wrappers/struct.ReceiverStream.html).
- [Tokio: tutorial streams](https://tokio.rs/tokio/tutorial/streams), [mpsc](https://docs.rs/tokio/1.54.1/tokio/sync/mpsc/index.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

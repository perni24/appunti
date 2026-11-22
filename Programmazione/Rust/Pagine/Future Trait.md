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
  - Future
  - std::future::Future
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Pin e Unpin]]"
related:
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/select join e cancellation]]"
  - "[[Programmazione/Rust/Pagine/Async streams]]"
title: Future Trait
---

# Future Trait

## Sintesi

`Future` descrive un calcolo che puo produrre un valore attraverso `poll`. Non e un thread e non promette di completare: per esempio `std::future::pending()` rimane sempre in attesa. Una `async fn` genera automaticamente un tipo che implementa il trait. [Future](https://doc.rust-lang.org/std/future/trait.Future.html), [pending](https://doc.rust-lang.org/std/future/fn.pending.html).

Questa nota riguarda il contratto fra future ed executor. Per sintassi async, catture e composizione di task vedi [[Programmazione/Rust/Pagine/Async Await|Async e await]].

## Quando usarlo

- Progettare un'API generica che riceve o restituisce un'operazione asincrona.
- Conservare future di tipi diversi in una stessa collezione.
- Adattare una primitiva che espone polling a un'API async.
- Capire una future che resta sospesa, un errore Unpin o un bound Send.

Nelle applicazioni preferisci `async fn` e primitive esistenti. Implementare Future manualmente serve soprattutto nei livelli di integrazione, non per ogni funzione async.

## Come funziona

### Contratto di poll

La firma del metodo e `fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>`. Si implementa `std::future::Future`: non bisogna dichiarare un proprio trait omonimo.

- `Ready(value)` conclude la future e consegna l'output.
- `Pending` indica che non c'e ancora un output: quando diventa possibile avanzare deve essere predisposto un risveglio.
- `poll` deve restituire rapidamente, senza attese bloccanti o cicli continui di controllo.
- Dopo Ready il chiamante non deve effettuare altri poll. Il comportamento successivo non e garantito, ma una chiamata safe non puo legittimare undefined behavior. [Future::poll](https://doc.rust-lang.org/std/future/trait.Future.html#tymethod.poll).

`Output` puo essere qualsiasi tipo, anche `()`, `Option<T>` o `Result<T, E>`. `Ready(Err(error))` significa **completata con errore applicativo**, non "ancora in attesa". Pending non e un errore. [Poll](https://doc.rust-lang.org/std/task/enum.Poll.html).

### Waker, task e risveglio

`Context` fornisce il Waker della task corrente. `wake()` richiede che l'executor la riprenda; non contiene il risultato dell'operazione. `wake_by_ref()` non consuma il Waker. Piu notifiche possono essere accorpate e una notifica non garantisce che il prossimo poll produca Ready. [Context](https://doc.rust-lang.org/std/task/struct.Context.html), [Waker](https://doc.rust-lang.org/std/task/struct.Waker.html).

Se una primitiva conserva il Waker, deve aggiornare quello associato all'ultimo poll: la future puo essere attesa da un'altra task. Se invece delega il polling a una future interna, puo delegarle anche questa registrazione, passando lo stesso contesto.

Il controllo dello stato e la registrazione devono evitare un **risveglio perso**: l'evento potrebbe arrivare fra un controllo "non pronto" e una registrazione tardiva. Un protocollo corretto coordina le due operazioni; clonare un Waker in un campo non basta. Qui si usa un canale Tokio gia implementato, senza costruire una primitiva concorrente da zero. [Async Book: wakeups](https://rust-lang.github.io/async-book/02_execution/03_wakeups.html).

`.await` effettua il polling nel contesto corrente. Se trova Ready prosegue; con Pending sospende il contesto async. Non crea automaticamente una task separata e non e un yield obbligatorio. [Await expressions](https://doc.rust-lang.org/reference/expressions/await-expr.html).

### Pin e stato della future

`Pin<&mut Self>` permette il polling anche di future che dipendono da un indirizzo stabile. Non tutti i tipi Future sono `!Unpin`: un wrapper di un receiver Unpin puo essere Unpin a sua volta.

`Box::pin(future)` e `pin!(future)` consentono di pinnare anche future non Unpin. Il primo conserva un proprietario indiretto, il secondo una vista sullo storage locale. Muovere un `Pin<Box<F>>` non estrae F dall'allocazione. Pin non aggiunge Send e non estende i lifetime. [Pin](https://doc.rust-lang.org/std/pin/struct.Pin.html).

Per proiezione ai campi e wrapper generici vedi [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]].

## API / Sintassi

### Cargo.toml

Gli esempi usano **Rust 1.99.1, edition 2024** e **Tokio 1.54.1**. Questa e la baseline verificata, non una dichiarazione di ultima versione o MSRV. Ogni blocco Rust e un `src/main.rs` indipendente; i due controesempi sono segnalati.

```toml
[package]
name = "future-notes"
version = "0.1.0"
edition = "2024"

[dependencies]
tokio = { version = "=1.54.1", features = ["rt", "macros", "sync"] }
```

Le feature abilitano il runtime current-thread, le macro e il canale oneshot. `#[tokio::main]` configura l'executor, non fa parte del linguaggio. Conserva anche Cargo.lock per fissare le dipendenze transitive. [Tokio main](https://docs.rs/tokio/1.54.1/tokio/attr.main.html).

### Quale forma esporre

| Forma | Quando usarla |
| --- | --- |
| `async fn f() -> T` | Funzione async ordinaria; il risultato della chiamata e una future. |
| `F: Future<Output = T>` | Helper generico, senza richiedere un tipo concreto al chiamante. |
| `impl Future<Output = T>` | Ritorno con tipo concreto nascosto, senza imporre boxing. |
| `Pin<Box<dyn Future<Output = T> + 'a>>` | Tipi diversi dietro un'interfaccia comune con lifetime esplicito. |
| `Pin<Box<dyn Future<Output = T> + Send + 'a>>` | Come sopra, ma la future deve poter essere trasferita fra thread. |

`impl Future` non significa "qualunque tipo scelto a runtime": i rami di ritorno devono produrre lo stesso tipo concreto. Due blocchi async distinti hanno tipi distinti; spesso basta mettere la scelta **dentro un unico blocco async**, senza boxing. Il parametro generico, invece, viene scelto dal chiamante. [Impl trait](https://doc.rust-lang.org/reference/types/impl-trait.html).

### Helper generico che usa davvero la future

```rust
use std::future::Future;

fn map_future<F, M, U>(future: F, map: M) -> impl Future<Output = U>
where
    F: Future,
    M: FnOnce(F::Output) -> U,
{
    async move { map(future.await) }
}

async fn value() -> i32 {
    10
}

fn make_future() -> impl Future<Output = i32> {
    value()
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let future = map_future(make_future(), |number| number * 2);
    assert_eq!(future.await, 20);
}
```

`map_future` prende ownership degli argomenti e restituisce una nuova future: non esegue il calcolo al momento della chiamata. Attende F e applica la closure all'output, una volta sola. Un helper che facesse soltanto `let _ = future` non guiderebbe il polling.

Qui non servono `Send`, `'static` o `Unpin` come bound: non stiamo creando una task separata. Se F produce Result, la closure riceve l'intero Result; la propagazione dell'errore va scelta esplicitamente.

## Esempio pratico

### Future manuale che adatta un receiver

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use tokio::sync::oneshot;

type JobResult = Result<u32, &'static str>;

struct ReceiveJob {
    receiver: oneshot::Receiver<JobResult>,
}

impl Future for ReceiveJob {
    type Output = JobResult;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let state = self.get_mut();
        Pin::new(&mut state.receiver)
            .poll(cx)
            .map(|received| received.unwrap_or(Err("producer stopped")))
    }
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (sender, receiver) = oneshot::channel();
    let producer = async move {
        sender.send(Ok(42)).expect("receiver dropped");
    };

    let (result, ()) = tokio::join!(ReceiveJob { receiver }, producer);
    assert_eq!(result, Ok(42));
}
```

Il receiver implementa gia Future e gestisce il Waker. Il wrapper conserva Pending e converte soltanto l'output: `Ok(Err("invalid"))` mantiene l'errore applicativo; un canale chiuso senza messaggio diventa `Err("producer stopped")`. `Poll::map` non invoca la closure se il valore e Pending. [Poll::map](https://doc.rust-lang.org/std/task/enum.Poll.html#method.map), [Tokio Receiver](https://docs.rs/tokio/1.54.1/tokio/sync/oneshot/struct.Receiver.html).

`ReceiveJob` e Unpin perche il suo campo lo e: get_mut e Pin::new sono leciti, senza unsafe. Sostituire il campo con una F generica non Unpin richiederebbe una rappresentazione o proiezione diversa.

Join guida produttore e ricevitore nella stessa task. Il canale trasporta un solo risultato; il demo non avvia lavoro CPU pesante, rete o database. Il receiver puo restituire Pending anche in presenza di notifiche: non usare un numero fisso di poll come protocollo. [Tokio Receiver](https://docs.rs/tokio/1.54.1/tokio/sync/oneshot/struct.Receiver.html).

Se devi soltanto attendere un risultato, una async fn che faccia `receiver.await` e piu semplice. L'implementazione manuale mostra il confine fra polling delegato, pinning e trasformazione del risultato.

## Varianti

### Future boxed eterogenee e prestiti

```rust
use std::future::Future;
use std::pin::Pin;

type BoxFuture<'a, T> = Pin<Box<dyn Future<Output = T> + Send + 'a>>;

fn byte_length(text: &str) -> BoxFuture<'_, usize> {
    Box::pin(async move { text.len() })
}

fn char_count(text: &str) -> BoxFuture<'_, usize> {
    Box::pin(async move { text.chars().count() })
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let text = String::from("caff\u{e8}");
    let jobs: Vec<BoxFuture<'_, usize>> =
        vec![byte_length(&text), char_count(&text)];
    let mut results = Vec::new();

    for job in jobs {
        results.push(job.await);
    }

    assert_eq!(results, vec![6, 5]);
    assert_eq!(text, "caff\u{e8}");
}
```

BoxFuture e un **alias definito qui**, non un tipo fornito da std. Uniforma due tipi async diversi con lo stesso Output. Il lifetime permette di prendere in prestito text: Send non significa static.

Il ciclo attende i job **in sequenza**, non in parallelo. Il boxing introduce indirezione e dispatch dinamico; non crea concorrenza. In questo esempio le operazioni sarebbero normalmente sincrone: servono a mostrare eterogeneita, prestito e differenza fra byte e caratteri.

### Future locale senza Send

```rust
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;

type LocalBoxFuture<'a, T> = Pin<Box<dyn Future<Output = T> + 'a>>;

fn local_value(value: Rc<u32>) -> LocalBoxFuture<'static, u32> {
    Box::pin(async move { *value })
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    assert_eq!(local_value(Rc::new(7)).await, 7);
}
```

Questa future possiede Rc: e static ma non Send. Si puo attendere direttamente qui; per task locali separate Tokio offre LocalSet e spawn_local. `tokio::spawn` richiede Future e Output Send + static **anche su current-thread**. Una future Send puo produrre un output non Send: il bound sull'output e distinto. Nessuno di questi bound e aggiunto automaticamente da Pin. [Tokio spawn](https://docs.rs/tokio/1.54.1/tokio/task/fn.spawn.html).

### Adattare poll con poll_fn

```rust
use std::future::{Future, poll_fn};
use std::pin::Pin;
use tokio::sync::oneshot;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (sender, mut receiver) = oneshot::channel::<u32>();
    let mut polls = 0;
    let receive = poll_fn(|cx| {
        polls += 1;
        Pin::new(&mut receiver).poll(cx)
    });
    let producer = async move {
        sender.send(42).expect("receiver dropped");
    };

    let (result, ()) = tokio::join!(receive, producer);
    assert_eq!(result, Ok(42));
    assert!(polls >= 1);
}
```

`poll_fn` costruisce una future dalla closure, eseguita a ogni poll. Evita una struct quando basta un adattamento locale. Il receiver continua a registrare il risveglio; poll_fn non trasforma un controllo sincrono arbitrario in un'attesa corretta.

Il contatore misura quante chiamate sono avvenute, non lavoro completato o prestazioni. Non si impone un numero esatto: dipende dall'ordine di polling e dall'implementazione. La closure non ricrea il receiver a ogni chiamata. [poll_fn](https://doc.rust-lang.org/std/future/fn.poll_fn.html).

## Errori comuni

### Box senza Pin per un trait object Future

Questo programma **non compila**:

```rust
use std::future::Future;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let future: Box<dyn Future<Output = u32>> = Box::new(async { 42 });
    let _ = future.await;
}
```

L'implementazione di Future per Box richiede il contenuto Unpin, non garantito dal trait object. Usa `Pin<Box<dyn Future<Output = u32>>>` costruito con Box::pin. Un Box normale puo bastare per un contenuto realmente Unpin; non e un divieto generale sui Box. [Implementazioni di Future](https://doc.rust-lang.org/std/future/trait.Future.html#implementors).

### Boxing non rende Send una future

Questo programma **non compila**:

```rust
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;

fn boxed(value: Rc<u32>) -> Pin<Box<dyn Future<Output = u32> + Send>> {
    Box::pin(async move { *value })
}

fn main() {}
```

La future cattura un Rc non Send. Usa l'alias locale se non devi trasferirla oppure scegli dati Send quando l'architettura richiede tale proprieta. La conversione a trait object non cambia i vincoli del contenuto.

### Altre confusioni da evitare

- Non usare sleep bloccanti, I/O sincrono o un loop "finche Ready" dentro poll.
- Non chiamare wake continuamente se non esiste nuovo lavoro: puo produrre un busy loop.
- Non conservare soltanto il primo Waker ricevuto, e non rimpiazzarlo con un no-op in produzione.
- Non ricreare a ogni poll la future interna: perderesti lo stato della precedente attesa.
- Droppare la future posseduta interrompe la sua progressione, ma non annulla effetti gia avvenuti o lavoro esterno.
- Un JoinHandle e una future su una task gia avviata: droppare l'handle Tokio la **distacca**, non la cancella. [JoinHandle](https://docs.rs/tokio/1.54.1/tokio/task/struct.JoinHandle.html).
- Non assumere che ogni Future sia clonabile, riutilizzabile o obbligata a completare.

## Checklist

- Chi guida il polling: l'executor, un'altra future oppure un test controllato?
- Ogni Pending che puo sbloccarsi ha un percorso corretto di risveglio?
- La registrazione usa l'ultimo Waker ed evita notifiche perse?
- Dopo Ready il chiamante smette di effettuare poll?
- Pinning, lifetime e Send sono valutati separatamente?
- L'Output distingue errori applicativi da attesa e cancellazione?
- Il boxing serve davvero o basta async fn / impl Future?
- Il drop interrompe lavoro posseduto oppure elimina soltanto un handle?

## Collegamenti

- [[Programmazione/Rust/Pagine/Async Await|Async e await]]
- [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]]
- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async: Tokio e async-std]]
- [[Programmazione/Rust/Pagine/select join e cancellation|select!, join! e cancellazione]]
- [[Programmazione/Rust/Pagine/Channel async|Channel async]]
- [[Programmazione/Rust/Pagine/Async streams|Async streams]]

## Fonti

- [Rust std: Future](https://doc.rust-lang.org/std/future/trait.Future.html).
- [Rust std: Poll](https://doc.rust-lang.org/std/task/enum.Poll.html), [Context](https://doc.rust-lang.org/std/task/struct.Context.html), [Waker](https://doc.rust-lang.org/std/task/struct.Waker.html).
- [Async Book: task wakeups](https://rust-lang.github.io/async-book/02_execution/03_wakeups.html).
- [Rust std: Pin](https://doc.rust-lang.org/std/pin/struct.Pin.html), [poll_fn](https://doc.rust-lang.org/std/future/fn.poll_fn.html).
- [Rust Reference: await](https://doc.rust-lang.org/reference/expressions/await-expr.html), [impl Trait](https://doc.rust-lang.org/reference/types/impl-trait.html).
- [Tokio 1.54.1: main](https://docs.rs/tokio/1.54.1/tokio/attr.main.html), [oneshot Receiver](https://docs.rs/tokio/1.54.1/tokio/sync/oneshot/struct.Receiver.html).
- [Tokio 1.54.1: spawn](https://docs.rs/tokio/1.54.1/tokio/task/fn.spawn.html), [JoinHandle](https://docs.rs/tokio/1.54.1/tokio/task/struct.JoinHandle.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

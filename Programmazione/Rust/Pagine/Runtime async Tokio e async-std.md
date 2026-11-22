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
  - Tokio
  - async-std
  - Runtime async Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Future Trait]]"
related:
  - "[[Programmazione/Rust/Pagine/Channel async]]"
  - "[[Programmazione/Rust/Pagine/select join e cancellation]]"
  - "[[Programmazione/Rust/Pagine/Graceful shutdown]]"
title: "Runtime async: Tokio e async-std"
---

# Runtime async: Tokio e async-std

## Sintesi

`async` e `.await` sono costrutti del linguaggio; `Future` e definito dalla standard library. Un runtime fornisce servizi per eseguire le task e gestire attese come timer e I/O: queste funzionalita non sono aggiunte automaticamente dalla sintassi async. [Future](https://doc.rust-lang.org/std/future/trait.Future.html), [Tokio runtime](https://docs.rs/tokio/1.54.1/tokio/runtime/index.html).

**Stato verificato il 2026-11-16:** async-std e stato **dismesso**. I manutentori raccomandano la migrazione a **smol**. Qui resta documentato per leggere e mantenere progetti esistenti, non come scelta equivalente per un nuovo progetto. [Annuncio nel repository ufficiale](https://github.com/async-rs/async-std).

La baseline degli esempi e **Rust 1.99.1, edition 2024**, con **Tokio 1.54.1** e, nel confronto legacy, **async-std 1.13.2**. Non e una dichiarazione di ultima versione o MSRV.

## Quando usarlo

- Scegli il runtime richiesto dalle librerie di rete, database o framework che vuoi usare.
- Usa Tokio quando la tua applicazione dipende dal suo ecosistema e dai suoi driver.
- Studia async-std per interpretare codice esistente e pianificarne la migrazione.
- Usa un builder quando un'applicazione sincrona deve ospitare una parte async o quando servono impostazioni esplicite.

Non scegliere contando soltanto i thread. Una GUI, un server I/O e un'elaborazione CPU hanno esigenze diverse; usare async non rende automaticamente piu veloce il calcolo.

## Come funziona

### Scheduler, driver e pool blocking

In Tokio sono distinti:

- **Scheduler:** decide quali task pronte pollare.
- **Driver I/O:** integra le notifiche del sistema operativo per le risorse asincrone.
- **Driver timer:** gestisce scadenze e risveglia le task in attesa.
- **Pool blocking:** esegue lavoro sincrono che non deve occupare i worker async.

Una task avanza finche il suo poll restituisce; non viene interrotta arbitrariamente a meta di un lungo calcolo. Un await gia pronto puo continuare nello stesso poll. Non dedurre ordine, alternanza o parallelismo osservando solo i punti await. [Runtime Tokio](https://docs.rs/tokio/1.54.1/tokio/runtime/index.html), [[Programmazione/Rust/Pagine/Future Trait|Future Trait]].

### Current-thread, multi-thread e task locali

**Current-thread** esegue le task async sul thread che guida `Runtime::block_on`, senza worker async di background. Quando block_on ritorna, tali task non avanzano finche il runtime non viene guidato di nuovo. Questo non vieta thread ausiliari: spawn_blocking usa comunque un pool separato. [Integrazione sincrona](https://tokio.rs/tokio/topics/bridging), [spawn_blocking](https://docs.rs/tokio/1.54.1/tokio/task/fn.spawn_blocking.html).

**Multi-thread** usa piu worker e puo distribuire task diverse fra thread. Non divide automaticamente il corpo di una singola task in lavoro parallelo. `worker_threads(2)` limita i worker async, non il numero totale di thread del processo. [Runtime Tokio](https://docs.rs/tokio/1.54.1/tokio/runtime/index.html).

**LocalSet** guida task locali, anche non Send, sullo stesso thread. Scegliere current-thread non elimina i bound di `tokio::spawn`: future e output devono ancora essere Send + static. Per una task separata non Send si usa spawn_local in un contesto locale appropriato. [LocalSet](https://docs.rs/tokio/1.54.1/tokio/task/struct.LocalSet.html), [spawn](https://docs.rs/tokio/1.54.1/tokio/task/fn.spawn.html).

## API / Sintassi

### Cargo.toml per Tokio

Ogni blocco Rust Tokio qui sotto e un programma indipendente da collocare in `src/main.rs`. I tre controesempi nella sezione errori compilano ma producono intenzionalmente un panic.

```toml
[package]
name = "runtime-notes"
version = "0.1.0"
edition = "2024"

[dependencies]
tokio = { version = "=1.54.1", features = ["rt-multi-thread", "macros", "time", "sync"] }
```

| Feature | Cosa abilita |
| --- | --- |
| `rt` | Runtime current-thread, spawn e API di base delle task. |
| `rt-multi-thread` | Scheduler multi-thread; include rt. |
| `macros` | Attributi main/test e macro come join/select. |
| `time` | Timer, sleep e timeout. |
| `sync` | Canali e primitive async di sincronizzazione. |
| `net` | API di rete, non usate nei programmi della nota. |
| `io-util` | Helper I/O come i trait di estensione read/write. |

`features = ["full"]` e una scorciatoia per molte funzionalita, non un requisito di ogni applicazione. In una libreria abilita soltanto cio che serve. Il manifest precedente non abilita rete o helper I/O; conserva Cargo.lock per fissare anche le dipendenze transitive. [Feature flags](https://docs.rs/tokio/1.54.1/tokio/index.html#feature-flags).

Con un **builder** servono due livelli distinti: compilare la feature e attivare il driver nel runtime. `enable_time()` abilita i timer; `enable_io()` abilita l'I/O disponibile; `enable_all()` abilita i driver disponibili nella build, **non modifica le feature Cargo**. [Builder](https://docs.rs/tokio/1.54.1/tokio/runtime/struct.Builder.html).

### Entrata nel runtime e handle

`#[tokio::main]` trasforma la funzione in un ingresso sincrono che costruisce un runtime e usa block_on. Il flavor predefinito e multi-thread; per current-thread va indicato esplicitamente. La macro abilita i driver disponibili. Non applicarla a ogni helper: altrimenti ogni chiamata costruisce un nuovo runtime. [Tokio main](https://docs.rs/tokio/1.54.1/tokio/attr.main.html).

`Runtime` e il proprietario del runtime; un `Handle` permette di accedere al runtime esistente. `enter()` imposta il contesto corrente, ma **non esegue da solo le task**. Sul current-thread `Handle::block_on` non guida i driver I/O/timer come Runtime::block_on: non e una sostituzione indiscriminata. [Handle](https://docs.rs/tokio/1.54.1/tokio/runtime/struct.Handle.html).

## Esempio pratico

### Task concorrenti con timer

```rust
use tokio::time::{sleep, Duration};

async fn do_work(id: u32) -> u32 {
    sleep(Duration::from_millis(5)).await;
    id * 2
}

#[tokio::main(flavor = "multi_thread", worker_threads = 2)]
async fn main() -> Result<(), tokio::task::JoinError> {
    let first = tokio::spawn(do_work(10));
    let second = tokio::spawn(do_work(21));

    let (first, second) = tokio::join!(first, second);
    assert_eq!(first?, 20);
    assert_eq!(second?, 42);
    Ok(())
}
```

Entrambe le task vengono create prima dell'attesa. join attende i due handle; `?` propaga un eventuale JoinError. Il timer introduce un'attesa asincrona, ma puo essere gia scaduto al momento del polling: non garantisce una sospensione o un particolare interleaving. Il demo non misura prestazioni e non rappresenta una chiamata di rete.

Un `JoinHandle<T>` Tokio produce `Result<T, JoinError>`; se T e gia un Result, ci sono due livelli di errore. Eliminare l'handle distacca la task: non equivale a cancellarla. [JoinHandle](https://docs.rs/tokio/1.54.1/tokio/task/struct.JoinHandle.html).

### Builder e confine sincrono

```rust
use tokio::runtime::Builder;
use tokio::time::{sleep, Duration};

fn main() {
    let runtime = Builder::new_current_thread()
        .enable_time()
        .build()
        .expect("runtime creation failed");

    let task = runtime.block_on(async {
        tokio::spawn(async {
            sleep(Duration::from_millis(5)).await;
            42
        })
    });

    assert!(!task.is_finished());
    let result = runtime.block_on(task).expect("task failed");
    assert_eq!(result, 42);
}
```

Il primo block_on restituisce subito l'handle. In questo esempio current-thread, spawn non polla sincronicamente la task e il blocco chiamante non si sospende: la task non e ancora partita. Il secondo block_on guida anche il timer fino al risultato. Non trasferire l'assert intermedio a un runtime multi-thread, dove i worker possono gia eseguire la task. [spawn](https://docs.rs/tokio/1.54.1/tokio/task/fn.spawn.html), [Bridging](https://tokio.rs/tokio/topics/bridging).

Questo confine serve da codice **sincrono**. Dentro codice async usa await; non annidare block_on per aspettare un'altra operazione.

## Varianti

### LocalSet per una task con Rc

```rust
use std::rc::Rc;
use tokio::runtime::Builder;
use tokio::task::{LocalSet, spawn_local, yield_now};

fn main() {
    let runtime = Builder::new_current_thread()
        .build()
        .expect("runtime creation failed");
    let local = LocalSet::new();
    let value = Rc::new(String::from("local"));

    let result = runtime.block_on(local.run_until(async move {
        let task = spawn_local(async move {
            yield_now().await;
            value.len()
        });
        task.await.expect("local task failed")
    }));

    assert_eq!(result, 5);
}
```

Rc viene posseduto dalla task locale anche attraverso una sospensione. spawn_local non richiede Send, ma richiede ancora static: move di un riferimento preso in prestito non lo rende static. LocalSet non elimina le regole di ownership e non puo essere spostato liberamente fra thread. [LocalSet](https://docs.rs/tokio/1.54.1/tokio/task/struct.LocalSet.html).

Qui il builder non abilita timer o I/O perche il programma non li usa. run_until termina quando termina la future passata: non promette di attendere tutte le altre task locali. Nell'esempio l'handle viene atteso esplicitamente.

### Lavoro bloccante e shutdown

Per una chiamata sincrona finita usa spawn_blocking con una closure **sincrona** e dati posseduti Send + static. Per molto lavoro CPU limita la concorrenza o valuta [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon]]. Un job blocking gia iniziato non si ferma chiamando abort; un servizio bloccante permanente puo richiedere un thread dedicato. [spawn_blocking](https://docs.rs/tokio/1.54.1/tokio/task/fn.spawn_blocking.html).

Droppare Runtime non e un graceful shutdown dell'applicazione. Le task async non sono garantite complete; i job blocking continuano fino al ritorno e il drop puo attendere indefinitamente. shutdown_timeout limita l'attesa del chiamante, non termina forzatamente il lavoro rimasto. Prima ferma l'accettazione di nuovo lavoro, segnala la chiusura e attendi le task necessarie. [Shutdown di Runtime](https://docs.rs/tokio/1.54.1/tokio/runtime/struct.Runtime.html#shutdown).

Per esempi di lavoro bloccante vedi [[Programmazione/Rust/Pagine/Async Await|Async e await]]; per il protocollo completo vedi [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]].

### Cargo.toml per il confronto legacy

Questo e un **progetto separato** dal precedente, dedicato a leggere codice async-std esistente:

```toml
[package]
name = "legacy-runtime-notes"
version = "0.1.0"
edition = "2024"

[dependencies]
async-std = { version = "=1.13.2", features = ["attributes"] }
```

La feature attributes abilita `#[async_std::main]`. In alternativa l'API `async_std::task::block_on` puo costituire l'ingresso sincrono senza quella macro. [async-std main](https://docs.rs/async-std/1.13.2/async_std/attr.main.html), [block_on](https://docs.rs/async-std/1.13.2/async_std/task/fn.block_on.html).

### Esempio async-std esistente

```rust
use async_std::task;
use std::time::Duration;

#[async_std::main]
async fn main() {
    let task = task::spawn(async {
        task::sleep(Duration::from_millis(5)).await;
        42
    });
    let result = task.await;
    assert_eq!(result, 42);
}
```

L'handle async-std produce direttamente T, non il Result di join di Tokio. Non copiare quindi automaticamente `handle.await.unwrap()` da un runtime all'altro. Anche lo spawn async-std richiede future e output Send + static. [JoinHandle async-std](https://docs.rs/async-std/1.13.2/async_std/task/struct.JoinHandle.html), [spawn async-std](https://docs.rs/async-std/1.13.2/async_std/task/fn.spawn.html).

L'esempio serve al confronto, non e una raccomandazione per nuovo codice. La migrazione a smol indicata dai manutentori va valutata su dipendenze, I/O, task e gestione degli errori: non consiste soltanto nel rinominare un import. [Stato del progetto](https://github.com/async-rs/async-std).

### Interoperabilita non significa sostituzione automatica

Una future composta solo da logica indipendente dal runtime puo essere guidata da executor diversi. Un timer o una socket Tokio possono invece richiedere il relativo contesto e driver: implementare Future non rende ogni operazione indipendente dal runtime.

Non vale nemmeno il contrario, "ogni API Tokio richiede Tokio": le primitive di `tokio::sync` sono generalmente indipendenti dal runtime; le varianti che usano timeout Tokio richiedono il timer Tokio. Verifica il contratto della singola API. [Compatibilita delle primitive sync](https://docs.rs/tokio/1.54.1/tokio/sync/index.html#runtime-compatibility).

Conserva un runtime principale e confini espliciti. Non creare un secondo runtime dentro ogni richiesta come rimedio a errori di contesto.

## Errori comuni

### Timer senza driver

Questo programma **compila, ma va in panic**:

```rust
use tokio::runtime::Builder;
use tokio::time::{sleep, Duration};

fn main() {
    let runtime = Builder::new_current_thread().build().unwrap();
    runtime.block_on(async {
        sleep(Duration::from_millis(1)).await;
    });
}
```

La feature time e presente, ma manca enable_time o enable_all nel builder. Se invece manca la feature Cargo, l'API non e disponibile gia in compilazione. [sleep: panic](https://docs.rs/tokio/1.54.1/tokio/time/fn.sleep.html#panics).

### Timer costruito fuori dal contesto

Anche questo programma **compila, ma va in panic**:

```rust
use tokio::runtime::Builder;
use tokio::time::{sleep, Duration};

fn main() {
    let runtime = Builder::new_current_thread()
        .enable_time()
        .build()
        .unwrap();
    runtime.block_on(sleep(Duration::from_millis(1)));
}
```

Gli argomenti sono valutati prima della chiamata: sleep viene costruito fuori dal contesto Tokio. La forma corretta e `runtime.block_on(async { sleep(...).await })`, come nel programma con builder. enable_time non rende il runtime corrente in ogni riga del programma. [sleep](https://docs.rs/tokio/1.54.1/tokio/time/fn.sleep.html).

### Block_on annidato nel runtime

Questo programma **compila, ma va in panic**:

```rust
#[tokio::main(flavor = "current_thread")]
async fn main() {
    let handle = tokio::runtime::Handle::current();
    let _ = handle.block_on(async { 42 });
}
```

block_on blocca il thread chiamante; non e un'alternativa ad await dentro una task. Se una libreria espone soltanto API sincrone, progetta il confine esplicitamente invece di annidare runtime. [Handle::block_on](https://docs.rs/tokio/1.54.1/tokio/runtime/struct.Handle.html#method.block_on).

### Altre confusioni

- std::thread::sleep e I/O sincrono bloccano anche se scritti dentro una async fn.
- Il runtime multi-thread non giustifica task che monopolizzano i worker.
- current-thread non trasforma tokio::spawn in spawn_local.
- Chiamare enter non avvia un event loop.
- Scartare un JoinHandle non garantisce completamento e non richiede la cancellazione.
- Non contare sul termine di main per salvare, scaricare buffer o completare operazioni ancora pendenti.

## Checklist

- Il progetto del runtime e ancora mantenuto?
- Quale runtime richiedono le librerie scelte?
- Ho abilitato sia le feature Cargo sia i driver necessari?
- Le risorse sono create nel contesto corretto?
- Current-thread, worker async e pool blocking sono distinti?
- Future e output soddisfano separatamente i bound di spawn?
- Le task locali vengono guidate e attese?
- Errori di join, errori applicativi e shutdown sono gestiti esplicitamente?

## Collegamenti

- [[Programmazione/Rust/Pagine/Async Await|Async e await]]
- [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]
- [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon e parallel iterators]]
- [[Programmazione/Rust/Pagine/Channel async|Channel async]]
- [[Programmazione/Rust/Pagine/select join e cancellation|select!, join! e cancellazione]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]

## Fonti

- [Tokio 1.54.1: runtime](https://docs.rs/tokio/1.54.1/tokio/runtime/index.html), [Builder](https://docs.rs/tokio/1.54.1/tokio/runtime/struct.Builder.html), [Handle](https://docs.rs/tokio/1.54.1/tokio/runtime/struct.Handle.html).
- [Tokio: integrazione con codice sincrono](https://tokio.rs/tokio/topics/bridging).
- [Tokio 1.54.1: feature](https://docs.rs/tokio/1.54.1/tokio/index.html#feature-flags), [main](https://docs.rs/tokio/1.54.1/tokio/attr.main.html), [sleep](https://docs.rs/tokio/1.54.1/tokio/time/fn.sleep.html).
- [Tokio 1.54.1: LocalSet](https://docs.rs/tokio/1.54.1/tokio/task/struct.LocalSet.html), [spawn_blocking](https://docs.rs/tokio/1.54.1/tokio/task/fn.spawn_blocking.html), [Runtime e shutdown](https://docs.rs/tokio/1.54.1/tokio/runtime/struct.Runtime.html).
- [Repository async-std: dismissione e migrazione](https://github.com/async-rs/async-std).
- [async-std 1.13.2](https://docs.rs/async-std/1.13.2/async_std/), [JoinHandle](https://docs.rs/async-std/1.13.2/async_std/task/struct.JoinHandle.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

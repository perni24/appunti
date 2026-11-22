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
  - async await Rust
  - Async/Await
prerequisites:
  - "[[Programmazione/Rust/Pagine/Future Trait]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes avanzati]]"
related:
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/select join e cancellation]]"
  - "[[Programmazione/Rust/Pagine/Pin e Unpin]]"
title: Async/Await
---

# Async/Await

## Sintesi

`async` permette di descrivere un calcolo che puo sospendersi senza bloccare il thread durante un'attesa. Una `async fn` restituisce una **future**: chiamarla non esegue ancora il corpo. Il lavoro avanza quando un executor effettua il polling.

**`.await` non sospende sempre**: se la future restituisce subito `Ready`, il codice continua nello stesso poll. Se restituisce `Pending`, l'esecuzione puo tornare all'executor, che la riprendera quando viene notificato. Un ciclo CPU lungo non diventa cooperativo solo perche e dentro una funzione async. [Await expressions](https://doc.rust-lang.org/reference/expressions/await-expr.html).

## Quando usarlo

- Molte operazioni I/O concorrenti: rete, timer, database e canali con API async.
- Attese durante le quali il thread puo eseguire altro lavoro.
- Composizione di operazioni asincrone senza creare un thread OS per ogni richiesta.

Per lavoro CPU-bound considera [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon]] o un pool dedicato. Per una chiamata bloccante occasionale serve un confine come `spawn_blocking`, non soltanto la parola `async`.

## Come funziona

### Cargo.toml

I programmi della nota usano **Rust 1.99.1, edition 2024** e **Tokio 1.54.1**. Ogni blocco Rust e un `src/main.rs` indipendente; i due controesempi sono dichiarati non compilabili.

```toml
[package]
name = "async-notes"
version = "0.1.0"
edition = "2024"

[dependencies]
tokio = { version = "=1.54.1", features = ["rt", "macros", "sync", "time"] }
```

`rt` abilita il runtime current-thread e le task; `macros` le macro usate qui, `sync` i canali, `time` i timer. Il runtime multi-thread richiede anche `rt-multi-thread`. La macro `#[tokio::main(flavor = "current_thread")]` crea il runtime e guida la future principale: non e sintassi del linguaggio Rust. Per fissare anche le transitive conserva `Cargo.lock`. [Tokio main](https://docs.rs/tokio/1.54.1/tokio/attr.main.html).

### Creazione lazy e primo polling

```rust
use std::cell::Cell;

async fn fetch(calls: &Cell<u32>) -> String {
    calls.set(calls.get() + 1);
    String::from("data")
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let calls = Cell::new(0);

    let unused = fetch(&calls);
    assert_eq!(calls.get(), 0);
    drop(unused);
    assert_eq!(calls.get(), 0);

    let future = fetch(&calls);
    let data = future.await;
    assert_eq!(data, "data");
    assert_eq!(calls.get(), 1);
}
```

`fetch` e una dimostrazione del polling, non una richiesta HTTP. Gli argomenti di una chiamata sono valutati subito e quelli posseduti vengono trasferiti nella future; e il **corpo** della `async fn` a essere differito. Droppare la future mai avviata non esegue quel corpo, ma puo distruggere gli argomenti posseduti.

Il compilatore genera una macchina a stati che conserva quanto serve fra sospensioni. Future, task e thread non sono sinonimi: una future puo essere attesa dentro un'altra senza creare una task separata. [Async functions](https://doc.rust-lang.org/reference/items/functions.html#async-functions).

### Await pronto non significa yield

```rust
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let ran = Arc::new(AtomicBool::new(false));
    let flag = Arc::clone(&ran);
    let handle = tokio::spawn(async move {
        flag.store(true, Ordering::Relaxed);
    });

    let answer = std::future::ready(42).await;
    assert_eq!(answer, 42);
    assert!(!ran.load(Ordering::Relaxed));

    handle.await.expect("worker panicked");
    assert!(ran.load(Ordering::Relaxed));
}
```

Qui il runtime ha un solo thread per l'esecuzione async e `spawn` non effettua il polling sincrono della nuova task. L'await di `ready` non lascia spazio al worker; attendere l'handle permette invece al runtime di completarlo. Non trasferire l'assert intermedio a un runtime multi-thread, dove il worker potrebbe essere gia in esecuzione.

Una future in `Pending` deve predisporre il risveglio tramite `Waker`; non si risolve facendo polling continuo in un ciclo. Per il contratto dettagliato vedi [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]. [Future](https://doc.rust-lang.org/std/future/trait.Future.html), [Tokio spawn](https://docs.rs/tokio/1.54.1/tokio/task/fn.spawn.html).

## API / Sintassi

| Costrutto | Significato |
| --- | --- |
| `async fn f() -> T` | Chiamare `f()` produce una future con output `T`. |
| `async { ... }` | Crea una future con catture inferite dal corpo. |
| `async move { ... }` | Trasferisce nella future i valori catturati; un riferimento resta un riferimento. |
| `future.await` | Attende l'output nel contesto async corrente, senza creare una task. |
| `tokio::spawn(future)` | Schedula una task distinta e restituisce un `JoinHandle`. |
| `#[tokio::main(...)]` | Configura l'ingresso nell'applicazione tramite un runtime Tokio. |

### Prestiti, move e Result

```rust
#[tokio::main(flavor = "current_thread")]
async fn main() {
    let name = String::from("Rust");
    let borrowed = async { name.len() };
    assert_eq!(borrowed.await, 4);
    assert_eq!(name, "Rust");

    let owned = async move { name.to_uppercase() };
    assert_eq!(owned.await, "RUST");

    let result = async {
        let number = "21".parse::<u32>()?;
        Ok::<u32, std::num::ParseIntError>(number * 2)
    }.await;
    assert_eq!(result.unwrap(), 42);
}
```

`async move` non clona `name` e non rende static un prestito locale. I vincoli di ownership valgono gia alla creazione della future, non soltanto al suo primo await.

Il `?` restituisce l'errore dalla future del blocco in cui si trova. Non esce magicamente dal chiamante; questo riceve un `Result` e decide come gestirlo. Il tipo di errore puo richiedere un'annotazione come `Ok::<_, ParseIntError>(...)`. [Async blocks](https://doc.rust-lang.org/reference/expressions/block-expr.html#async-blocks).

## Esempio pratico

### Ricevere un risultato e propagare gli errori

Il canale oneshot consegna un solo risultato da una task produttrice. L'attesa e realmente asincrona, ma non c'e un database o un servizio HTTP nascosto nell'esempio.

```rust
use tokio::sync::oneshot;

type UserResult = Result<String, &'static str>;

async fn load_user(reply: oneshot::Receiver<UserResult>) -> UserResult {
    reply.await.map_err(|_| "producer stopped")?
}

async fn handler(reply: oneshot::Receiver<UserResult>) -> UserResult {
    let user = load_user(reply).await?;
    Ok(format!("Hello, {user}"))
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (tx, rx) = oneshot::channel();
    let worker = tokio::spawn(async move {
        let result = Ok(String::from("user-7"));
        let _ = tx.send(result);
    });

    let response = handler(rx).await;
    worker.await.expect("worker panicked");
    assert_eq!(response, Ok(String::from("Hello, user-7")));
}
```

Ci sono tre livelli distinti:

- `Err("user not found")` potrebbe essere un risultato applicativo inviato dal produttore.
- `Err("producer stopped")` indica che il sender e stato distrutto senza inviare.
- Un panic della task produttrice viene osservato come `JoinError` attendendo il suo handle.

Il produttore ignora esplicitamente il fallimento di `send` quando il ricevitore non esiste piu. In un'applicazione reale scegli se registrare questo evento; non interpretarlo come consegna riuscita.

`load_user` distingue canale chiuso e risposta applicativa; `handler` usa `?` per propagare entrambi. `&'static str` mantiene compatto l'esempio: per un'API pubblica valuta un tipo di errore dedicato. [Oneshot](https://docs.rs/tokio/1.54.1/tokio/sync/oneshot/), [JoinHandle](https://docs.rs/tokio/1.54.1/tokio/task/struct.JoinHandle.html).

## Varianti

### Attese sequenziali e join

Creare due future e poi attenderle una dopo l'altra **non** avanza automaticamente la seconda durante l'attesa della prima. `tokio::join!` guida invece entrambi i rami nella task corrente:

```rust
use tokio::sync::oneshot;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let (tx, rx) = oneshot::channel::<u32>();
    let receive = async move { rx.await.expect("sender dropped") };
    let produce = async move {
        tx.send(7).expect("receiver dropped");
    };

    let (value, ()) = tokio::join!(receive, produce);
    assert_eq!(value, 7);
}
```

Attendere prima `receive` e solo dopo `produce` lascerebbe questo esempio in attesa senza un sender attivo. `join!` consente concorrenza, non parallelismo fra i rami: se uno blocca il thread, blocca anche l'altro. Non richiede `Send + 'static` come `spawn` e attende tutti i rami anche se uno produce `Err`. [Tokio join](https://docs.rs/tokio/1.54.1/tokio/macro.join.html).

`try_join!` puo interrompersi su errore; `select!` sceglie un ramo completato che corrisponde al pattern. Non sono parole chiave Rust: semantica e cancellazione dipendono dalla macro usata. Approfondimento in [[Programmazione/Rust/Pagine/select join e cancellation|select!, join! e cancellation]].

### Spawn, durata e cancellazione

`tokio::spawn` richiede `Send + 'static` sia alla future sia al suo output, anche sul runtime current-thread. `'static` non significa vivere per sempre: significa non dipendere da prestiti piu brevi. Attendere subito l'handle non elimina questo requisito. Per future non `Send` servono API locali e il contesto appropriato.

Se la task restituisce `Result<T, E>`, `handle.await` restituisce `Result<Result<T, E>, JoinError>`: errore applicativo ed errore della task vanno gestiti separatamente. Vedi [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]] e [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async]].

Droppare una future posseduta che stai guidando ne interrompe l'avanzamento e distrugge lo stato conservato, ma non annulla gli effetti gia avvenuti o il lavoro esterno avviato. **Droppare un JoinHandle Tokio non cancella la task**: la distacca. `abort` richiede la cancellazione; attendere l'handle permette di osservarne l'esito. Non presumere che lo shutdown lasci completare tutte le task. [Spawn](https://docs.rs/tokio/1.54.1/tokio/task/fn.spawn.html), [JoinHandle](https://docs.rs/tokio/1.54.1/tokio/task/struct.JoinHandle.html).

### Separare lavoro bloccante

```rust
#[tokio::main(flavor = "current_thread")]
async fn main() {
    let values: Vec<u32> = (1..=10_000).collect();
    let handle = tokio::task::spawn_blocking(move || {
        values.into_iter().map(u64::from).sum::<u64>()
    });

    let total = handle.await.expect("blocking worker panicked");
    assert_eq!(total, 50_005_000);
}
```

Il calcolo e piccolo per essere verificabile: l'esempio mostra il confine, non uno speedup. `spawn_blocking` esegue una closure sincrona su thread dedicati; non passargli un blocco async aspettandoti che lo esegua.

Per molti job CPU-bound limita la concorrenza o usa un pool specializzato. Un job bloccante gia avviato non viene fermato da `abort`; anche un timeout sull'attesa non lo interrompe. Per le attese temporali async usa `tokio::time::sleep(...).await`, non `std::thread::sleep`. [spawn_blocking](https://docs.rs/tokio/1.54.1/tokio/task/fn.spawn_blocking.html).

## Errori comuni

### Await fuori da un contesto async

Controesempio completo, **non compila**:

```rust
fn main() {
    let _value = std::future::ready(42).await;
}
```

`.await` e ammesso in un contesto async; una `main` sincrona ordinaria non lo e. La macro Tokio e un modo per predisporre l'ingresso, non un modo per rendere async ogni funzione chiamata.

### Move di un riferimento non lo rende static

Anche questo programma **non compila**:

```rust
#[tokio::main(flavor = "current_thread")]
async fn main() {
    let name = String::from("Rust");
    let view = name.as_str();
    let handle = tokio::spawn(async move { view.len() });
    let _length = handle.await.unwrap();
}
```

Il blocco possiede `view`, ma `view` continua a riferirsi alla `String` locale. Sposta `name` nella task, clona i dati necessari oppure attendi la future direttamente senza spawn se la task separata non serve.

### Blocco del thread e stato sospeso

- Mettere `async` davanti a una funzione non trasforma I/O sincrono o CPU lunga in lavoro non bloccante.
- Una future immediatamente pronta non garantisce fairness. `yield_now` e una richiesta allo scheduler, non una garanzia che una task specifica abbia gia lavorato.
- Non mantenere una guard standard attraverso `.await` senza valutarne i vincoli: puo rendere la future non `Send` o causare deadlock. Crea uno scope breve per il lock prima dell'attesa; non sostituire ogni mutex con uno async automaticamente.
- Non creare un runtime ad ogni operazione ne chiamare `block_on` annidato dentro un runtime per evitare `await`.
- Una future completata non va pollata di nuovo. `await` normalmente consuma la future; per ripetere l'operazione crea una nuova istanza.
- Gli oggetti rimasti vivi fra attese occupano memoria finche servono o finche la future viene distrutta. Non conservare buffer o prestiti inutili.

## Checklist

- So chi guida la future e quale runtime richiedono le API?
- Mi serve una task separata oppure basta un await diretto?
- Sto distinguendo concorrenza, parallelismo e I/O bloccante?
- Le catture e l'output rispettano i bound dello spawn scelto?
- Ho gestito errori applicativi, JoinError e canali chiusi?
- La cancellazione lascia invarianti valide e non perde effetti importanti?
- Le guard e i dati mantenuti attraverso await sono davvero necessari?

## Collegamenti

- [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async: Tokio e async-std]]
- [[Programmazione/Rust/Pagine/select join e cancellation|select!, join! e cancellation]]
- [[Programmazione/Rust/Pagine/Pin e Unpin|Pin e Unpin]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex e RwLock]]
- [[Programmazione/Rust/Pagine/Channel async|Channel async]]
- [[Programmazione/Rust/Pagine/Async streams|Async streams]]
- [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon e parallel iterators]]

## Fonti

- [Rust Reference: async functions](https://doc.rust-lang.org/reference/items/functions.html#async-functions), [async blocks](https://doc.rust-lang.org/reference/expressions/block-expr.html#async-blocks) e [await](https://doc.rust-lang.org/reference/expressions/await-expr.html).
- [std::future::Future](https://doc.rust-lang.org/std/future/trait.Future.html): polling, wakeup e completamento.
- [Tokio 1.54.1: main](https://docs.rs/tokio/1.54.1/tokio/attr.main.html), [spawn](https://docs.rs/tokio/1.54.1/tokio/task/fn.spawn.html) e [JoinHandle](https://docs.rs/tokio/1.54.1/tokio/task/struct.JoinHandle.html).
- [Tokio oneshot](https://docs.rs/tokio/1.54.1/tokio/sync/oneshot/), [join](https://docs.rs/tokio/1.54.1/tokio/macro.join.html), [select](https://docs.rs/tokio/1.54.1/tokio/macro.select.html).
- [Tokio spawn_blocking](https://docs.rs/tokio/1.54.1/tokio/task/fn.spawn_blocking.html) e [yield_now](https://docs.rs/tokio/1.54.1/tokio/task/fn.yield_now.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

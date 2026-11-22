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
  - Thread Rust
  - std::thread
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Move semantics]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Message passing]]"
  - "[[Programmazione/Rust/Pagine/Shared state]]"
  - "[[Programmazione/Rust/Pagine/Mutex RwLock e Atomics]]"
title: Threads
---

# Threads

## Sintesi

`std::thread` crea thread del sistema operativo: piu attivita possono avanzare in modo concorrente e, quando le risorse lo consentono, in parallelo. Creare thread non garantisce un aumento di velocita.

Le decisioni fondamentali sono **chi possiede i dati**, **chi attende la conclusione** e **come vengono gestiti errori e arresto**. `spawn` restituisce un `JoinHandle<T>`; `join` attende il risultato. Per prestare dati locali senza renderli `'static`, usa `thread::scope`.

## Quando usarlo

- Per pochi worker dedicati o operazioni bloccanti da separare dal chiamante.
- Per lavoro CPU-bound divisibile in parti abbastanza grandi da compensare il costo dei thread.
- Per usare canali e primitive sincrone senza introdurre un runtime async.

Per tanti piccoli lavori ripetuti, valuta un pool; per parallelismo sui dati vedi [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon]]. Per molte operazioni I/O concorrenti vedi [[Programmazione/Rust/Pagine/Async Await|Async/Await]]: un task async non coincide con un thread OS.

## Come funziona

### Concorrenza, parallelismo e ordine

Concorrenza significa che piu attivita possono avanzare nello stesso intervallo; parallelismo significa esecuzione simultanea. Il modello della standard library e 1:1: ogni thread Rust creato da queste API corrisponde a un thread OS.

Lo scheduler decide quando eseguirli. Non dedurre l'ordine dalle chiamate a `println!` o dalla posizione di `spawn`. Rust sicuro impedisce le data race, ma non elimina deadlock, errori di protocollo o risultati dipendenti dall'ordine. [Rust Book: Threads](https://doc.rust-lang.org/book/ch16-01-threads.html).

### Ownership e durata dei dati

Per `thread::spawn`, sia la closure sia il risultato devono essere `Send + 'static`. La closure e `FnOnce`: puo consumare le proprie catture.

- `Send` permette il trasferimento tra thread; vale anche per il valore restituito.
- `'static` come bound non significa che un oggetto debba restare allocato per sempre: una `String` posseduta puo essere distrutta al termine del lavoro.
- `move` trasferisce le catture per valore; non clona i dati, non rende un tipo `Send` e non prolunga la vita del valore a cui punta un riferimento.
- Per trasferire `&T` serve che `T` sia `Sync`, oltre al vincolo di durata appropriato.

Approfondimenti: [[Programmazione/Rust/Pagine/Move semantics|Move semantics]] e [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync]]. [Firma di spawn](https://doc.rust-lang.org/std/thread/fn.spawn.html).

### Attesa, distacco e conclusione del processo

`join(self)` consuma l'handle: non puoi chiamarlo due volte. Blocca il chiamante, non gli altri worker. La conclusione del thread sincronizza con il ritorno di `join`: le operazioni del worker precedono quelle successive all'attesa.

Eliminare un normale `JoinHandle` **distacca il thread**, non lo ferma e non lo attende. Quando termina `main`, termina il processo: non fare affidamento sul completamento dei worker lasciati attivi. [JoinHandle](https://doc.rust-lang.org/std/thread/struct.JoinHandle.html), [modulo thread](https://doc.rust-lang.org/std/thread/index.html).

`is_finished()` e una verifica non bloccante, non recupera il risultato e non cancella il lavoro. Per attendere usa `join`, non un ciclo continuo di polling. `sleep` sospende il thread corrente per almeno la durata richiesta, ma non dimostra che un altro thread abbia finito. [sleep](https://doc.rust-lang.org/std/thread/fn.sleep.html).

## API / Sintassi

Tutti i blocchi validi qui sotto sono programmi autonomi per `src/main.rs`, senza crate esterne. I due controesempi sono indicati esplicitamente come non compilabili.

### Trasferire dati e ricevere un risultato

```rust
use std::thread;

fn main() {
    let data = String::from("rust");
    let handle = thread::spawn(move || {
        let count = data.chars().count();
        (data.to_uppercase(), count)
    });

    let (text, count) = handle.join().expect("worker panicked");
    assert_eq!(text, "RUST");
    assert_eq!(count, 4);
    println!("{text}: {count}");
}
```

`data` non e piu utilizzabile dal chiamante dopo il move. Il risultato torna attraverso l'handle, senza variabili globali o mutex. Qui `expect` e una scelta didattica: un panic del worker diventa un panic del chiamante.

### Distinguere un errore applicativo da un panic

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| "42".parse::<u32>());

    match handle.join() {
        Ok(Ok(value)) => println!("value={value}"),
        Ok(Err(error)) => println!("invalid input: {error}"),
        Err(_) => eprintln!("worker panicked"),
    }
}
```

Il tipo e `thread::Result<Result<u32, ParseIntError>>`: il primo livello descrive la terminazione del thread, il secondo l'esito del parsing. Un `Err` restituito dalla funzione del worker non e un panic.

### Osservare un panic senza rilanciarlo

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| -> () {
        panic!("demo worker failure");
    });

    let outcome = handle.join();
    assert!(outcome.is_err());
    println!("panic observed; main continues");
}
```

Con unwinding, `join` restituisce il panic payload nell'`Err`. Il panic hook predefinito stampa comunque su stderr: vedere quel messaggio non significa che il chiamante sia terminato in errore. Con `panic = "abort"` viene invece terminato il processo e non puoi recuperare il panic con `join`. Vedi [[Programmazione/Rust/Pagine/panic|panic!]] e [panic hook](https://doc.rust-lang.org/std/panic/fn.set_hook.html).

### Configurare nome, stack e fallimento di creazione

```rust
use std::{io, thread};

fn main() -> io::Result<()> {
    let handle = thread::Builder::new()
        .name(String::from("sum-worker"))
        .stack_size(2 * 1024 * 1024)
        .spawn(|| {
            assert_eq!(thread::current().name(), Some("sum-worker"));
            (1..=3).sum::<u32>()
        })?;

    match handle.join() {
        Ok(total) => println!("total={total}"),
        Err(_) => return Err(io::Error::other("worker panicked")),
    }
    Ok(())
}
```

`Builder::spawn` restituisce `io::Result<JoinHandle<T>>`: il `?` gestisce l'errore OS di creazione, distinto dal panic del worker. `thread::spawn` invece va in panic se la creazione fallisce.

Lo stack e espresso in byte; 2 MiB e una scelta dimostrativa, non una raccomandazione universale. La piattaforma puo imporre un minimo maggiore. Un nome con byte nullo causa panic anche usando il builder. [Builder](https://doc.rust-lang.org/std/thread/struct.Builder.html).

## Esempio pratico

### Sommare pochi blocchi con ownership separata

Il chiamante prepara al massimo quattro blocchi. Ogni worker prende ownership del proprio `Vec<i64>`. Lo scope assicura l'attesa dei worker creati anche se il controllo esce anticipatamente; tutti gli handle vengono inoltre attesi esplicitamente prima di esaminare i risultati.

```rust
use std::thread;

#[derive(Debug, PartialEq)]
enum SumError {
    TooManyWorkers,
    Overflow,
    WorkerPanicked,
}

fn parallel_sum(chunks: Vec<Vec<i64>>) -> Result<i64, SumError> {
    if chunks.len() > 4 {
        return Err(SumError::TooManyWorkers);
    }

    thread::scope(|scope| {
        let handles: Vec<_> = chunks
            .into_iter()
            .map(|chunk| {
                scope.spawn(move || {
                    chunk
                        .into_iter()
                        .try_fold(0_i64, |sum, value| sum.checked_add(value))
                })
            })
            .collect();

        // Attendi tutti i worker prima di propagare un errore.
        let outcomes: Vec<_> = handles.into_iter().map(|h| h.join()).collect();
        let mut total = 0_i64;
        for outcome in outcomes {
            let partial = outcome
                .map_err(|_| SumError::WorkerPanicked)?
                .ok_or(SumError::Overflow)?;
            total = total.checked_add(partial).ok_or(SumError::Overflow)?;
        }
        Ok(total)
    })
}

fn main() {
    let chunks = vec![vec![1, 2, 3], vec![4, 5, 6]];
    assert_eq!(parallel_sum(chunks), Ok(21));
    assert_eq!(parallel_sum(Vec::new()), Ok(0));
    assert_eq!(
        parallel_sum(vec![vec![i64::MAX], vec![1]]),
        Err(SumError::Overflow)
    );
    println!("sum=21; empty=0; overflow detected");
}
```

I thread sono avviati tutti prima dei `join`. Fare `spawn(...).join()` a ogni giro di un ciclo renderebbe sequenziale quel lavoro.

Il limite di quattro e didattico: non e un pool, non garantisce quattro core disponibili e non giustifica il parallelismo per vettori cosi piccoli. `thread::available_parallelism()` offre una stima fallibile, non il numero ottimale per qualsiasi carico. [available_parallelism](https://doc.rust-lang.org/std/thread/fn.available_parallelism.html).

`checked_add` controlla ogni somma parziale e quella finale, anche in release. Se una somma intermedia non entra in `i64`, l'esempio restituisce errore anche se numeri successivi avrebbero compensato l'eccesso.

Limite intenzionale: `Scope::spawn` puo ancora andare in panic per un fallimento di creazione OS. Per trattarlo come errore recuperabile usa `Builder::spawn_scoped` e gestisci il relativo `io::Result`. Non provocare esaurimento di risorse per provarlo. [Scope::spawn](https://doc.rust-lang.org/std/thread/struct.Scope.html#method.spawn).

## Varianti

### Prestare dati locali con thread scoped

```rust
use std::thread;

fn main() {
    let mut values = [1, 2, 3, 4];

    thread::scope(|scope| {
        let (left, right) = values.split_at_mut(2);
        scope.spawn(move || {
            for value in left {
                *value += 10;
            }
        });
        scope.spawn(move || {
            for value in right {
                *value *= 2;
            }
        });
    });

    assert_eq!(values, [11, 12, 6, 8]);
    println!("{values:?}");
}
```

`split_at_mut` produce prestiti mutabili disgiunti: ogni worker modifica una parte diversa. `move` trasferisce i riferimenti alle slice, non l'array; dopo lo scope il chiamante puo riusarlo.

I thread scoped possono prendere in prestito dati locali che restano validi per lo scope. `Send` resta necessario. Gli handle non attesi manualmente vengono attesi alla fine dello scope, e un loro panic provoca un panic di `scope`. Un `join` esplicito permette invece di gestirlo.

`thread::scope` e disponibile da Rust 1.63. Nella documentazione 1.99.1 l'attesa automatica garantisce la conclusione delle funzioni dei worker, ma non necessariamente di tutti i distruttori thread-local; non affidare a questi ultimi operazioni che devono essere concluse al ritorno. Il `join` esplicito attende anche tali distruttori. [scope](https://doc.rust-lang.org/std/thread/fn.scope.html), [ScopedJoinHandle::join](https://doc.rust-lang.org/std/thread/struct.ScopedJoinHandle.html#method.join).

### Pool, comunicazione e arresto

- **Pool/Rayon**: riusa un numero controllato di thread per molti job. Non avviare un thread illimitato per ogni richiesta.
- **Canali**: trasferisci messaggi e definisci chi chiude il canale o invia il comando di arresto. Vedi [[Programmazione/Rust/Pagine/Message passing|Message passing]].
- **Stato condiviso**: usa `Arc` per ownership condivisa e primitive adatte per l'accesso ai dati. `Arc` da solo non rende thread-safe un tipo interno. Vedi [[Programmazione/Rust/Pagine/Shared state|Shared state]].
- **Arresto cooperativo**: segnala la chiusura, rendi possibile l'uscita dai blocchi di attesa, poi fai `join`. La standard library non offre un `kill` sicuro del thread; attendere non equivale a cancellare. Vedi [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]].
- **Async**: `join`, `sleep` e I/O sincrono bloccano il thread che li esegue; non inserirli indiscriminatamente nei task di un executor.

## Errori comuni

### Spostare un riferimento non lo rende statico

Controesempio: **non compila**, anche se il `join` segue subito lo `spawn`.

```rust
use std::thread;

fn main() {
    let data = String::from("rust");
    let borrowed = &data;
    let handle = thread::spawn(move || borrowed.len());
    handle.join().unwrap();
}
```

Il riferimento resta legato a `data`. Sposta la `String` stessa oppure usa uno scope: il compilatore non sostituisce il contratto `'static` di `spawn` con un'analisi del successivo `join`.

### Spostare Rc non lo rende Send

Controesempio: **non compila**.

```rust
use std::{rc::Rc, thread};

fn main() {
    let data = Rc::new(String::from("rust"));
    let handle = thread::spawn(move || data.len());
    handle.join().unwrap();
}
```

Per ownership condivisa tra thread valuta `Arc` con dati adatti; se serve solo trasferire una `String`, non occorre alcun contatore condiviso. Vedi [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc e Arc]].

### Altri errori da evitare

- Fare `join` mantenendo un lock di cui il worker ha bisogno: possibile deadlock.
- Trattare l'ordine di creazione come ordine di completamento.
- Usare `sleep` per sincronizzare test: usa canali, barrier o risultati attesi.
- Abbandonare gli altri handle al primo errore senza una strategia di attesa.
- Aspettarsi che la memory safety garantisca prestazioni o correttezza del protocollo.

## Checklist

- Il carico giustifica thread OS, oppure basta codice sequenziale, un pool o async?
- Numero di worker e memoria di stack sono limitati?
- I dati vengono trasferiti, prestati nello scope o condivisi intenzionalmente?
- Errori OS, errori applicativi e panic sono distinti?
- Tutti i worker necessari vengono attesi, anche sui percorsi di errore?
- Lo shutdown sblocca le attese prima di fare `join`?
- I test evitano assunzioni sull'ordine dello scheduler?

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Message passing|Message passing]]
- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
- [[Programmazione/Rust/Pagine/Mutex RwLock e Atomics|Mutex, RwLock e Atomics]]
- [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon e parallel iterators]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]

## Fonti

Documentazione della standard library consultata per **Rust 1.99.1**. Gli esempi usano API stable; la data della nota non certifica una revisione dell'utente.

- [Rust Book: Threads](https://doc.rust-lang.org/book/ch16-01-threads.html)
- [std::thread e ciclo di vita](https://doc.rust-lang.org/std/thread/index.html)
- [spawn: vincoli e creazione](https://doc.rust-lang.org/std/thread/fn.spawn.html)
- [JoinHandle: join, detach e is_finished](https://doc.rust-lang.org/std/thread/struct.JoinHandle.html)
- [Builder: nome, stack e spawn_scoped](https://doc.rust-lang.org/std/thread/struct.Builder.html)
- [scope: prestiti, attesa automatica e panic](https://doc.rust-lang.org/std/thread/fn.scope.html)
- [Scope::spawn](https://doc.rust-lang.org/std/thread/struct.Scope.html#method.spawn)
- [ScopedJoinHandle::join](https://doc.rust-lang.org/std/thread/struct.ScopedJoinHandle.html#method.join)
- [available_parallelism: stima e limiti](https://doc.rust-lang.org/std/thread/fn.available_parallelism.html)
- [sleep: attesa bloccante](https://doc.rust-lang.org/std/thread/fn.sleep.html)
- [panic hook](https://doc.rust-lang.org/std/panic/fn.set_hook.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

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
  - Mutex
  - RwLock
  - Atomics
prerequisites:
  - "[[Programmazione/Rust/Pagine/Shared state]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
related:
  - "[[Programmazione/Rust/Pagine/Mutex T e RwLock T]]"
  - "[[Programmazione/Rust/Pagine/Threads]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
title: Mutex, RwLock e Atomics
---

# Mutex, RwLock e Atomics

## Sintesi

`Mutex<T>`, `RwLock<T>` e tipi atomici permettono di coordinare accessi concorrenti, ma proteggono **unita diverse di lavoro**:

- Un mutex protegge una sezione critica, anche su piu campi correlati.
- Un read-write lock permette piu lettori oppure uno scrittore esclusivo.
- Un'operazione atomica riguarda il singolo valore su cui opera, non automaticamente l'intero algoritmo.

La scelta dipende dall'invariante da preservare, dal tipo di accesso e dal carico misurato. `RwLock` e atomici non sono ottimizzazioni garantite.

Questa nota confronta le primitive e approfondisce gli atomici. Per API delle guard, poisoning e lock multipli vedi [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex e RwLock]]; per progettare lo stato vedi [[Programmazione/Rust/Pagine/Shared state|Shared state]].

## Quando usarlo

- **Mutex:** stato composto e operazioni che devono controllare e modificare insieme piu valori.
- **RwLock:** letture che possono davvero procedere insieme; valuta costo del lock, durata delle letture e attesa dei writer.
- **Atomici:** contatori indipendenti, flag semplici e transizioni su un singolo valore con un protocollo dimostrabile.
- **Messaggi o dati locali:** quando un proprietario unico o l'aggregazione dei risultati rendono inutile condividere stato mutabile.

Un numero elevato di letture non basta a giustificare `RwLock`; la politica verso lettori e scrittori dipende dalla piattaforma. [RwLock](https://doc.rust-lang.org/std/sync/struct.RwLock.html).

## Come funziona

### Lock per stato composto

```rust
use std::sync::{Arc, Mutex, RwLock};
use std::thread;

fn main() {
    let entries = Arc::new(Mutex::new(Vec::<String>::new()));
    let worker_entries = Arc::clone(&entries);
    let worker = thread::spawn(move || {
        worker_entries.lock().unwrap().push(String::from("ready"));
    });
    worker.join().unwrap();

    let snapshot = entries.lock().unwrap().clone();
    assert_eq!(snapshot, ["ready"]);

    let label = RwLock::new(String::from("old"));
    {
        let read = label.read().unwrap();
        assert_eq!(read.as_str(), "old");
    }
    {
        let mut write = label.write().unwrap();
        *write = String::from("new");
    }
    assert_eq!(label.read().unwrap().as_str(), "new");
}
```

Le guard delimitano gli accessi; `Arc` mantiene ownership condivisa e `join` attende il worker. La read guard viene rilasciata **prima** di chiedere il write lock: non e un upgrade atomico.

Qui `unwrap` tratta il poisoning come un errore fatale. In un servizio devi scegliere se propagare l'errore o riparare lo stato; il poisoning non ripristina le modifiche. Un panic sotto read guard di `RwLock` non lo avvelena, uno sotto write guard puo farlo. [Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html), [RwLock](https://doc.rust-lang.org/std/sync/struct.RwLock.html#poisoning).

### Atomicita non significa transazione

`load` e `store` sono singolarmente atomici, ma altri thread possono intervenire fra i due. Per incrementare usa un'operazione read-modify-write, come `fetch_add`; per un aggiornamento condizionale considera compare-and-exchange (CAS).

Aumentare l'ordering non unisce istruzioni separate. Se l'invariante coinvolge piu campi, un lock puo essere piu chiaro di un protocollo atomico.

Gli atomici non eliminano i vincoli su aliasing, validita dei puntatori e accessi concorrenti non atomici. In codice unsafe, mescolare accessi incompatibili puo introdurre data race e undefined behavior. [Modello di memoria degli atomici](https://doc.rust-lang.org/std/sync/atomic/index.html#memory-model-for-atomic-accesses).

## API / Sintassi

### Operazioni su un singolo atomico

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

fn main() {
    let value = AtomicUsize::new(0);
    value.store(10, Ordering::Relaxed);
    assert_eq!(value.load(Ordering::Relaxed), 10);

    assert_eq!(value.fetch_add(2, Ordering::Relaxed), 10);
    assert_eq!(value.swap(20, Ordering::Relaxed), 12);

    assert_eq!(
        value.compare_exchange(20, 30, Ordering::Relaxed, Ordering::Relaxed),
        Ok(20),
    );
    assert_eq!(
        value.compare_exchange(20, 99, Ordering::Relaxed, Ordering::Relaxed),
        Err(30),
    );
    assert_eq!(value.load(Ordering::Relaxed), 30);
}
```

`fetch_add` e `swap` restituiscono il valore precedente. CAS restituisce `Ok` se scrive, `Err` con il valore osservato altrimenti. Il valore puo cambiare ancora dopo la restituzione.

Gli incrementi atomici interi fanno wrapping in overflow: non usarli come ID univoci illimitati. [API atomiche](https://doc.rust-lang.org/std/sync/atomic/struct.Atomic.html).

### Gli ordering

| Ordering | Significato da ricordare |
|---|---|
| `Relaxed` | Atomicita del valore; non pubblica da solo scritture su altri dati. |
| `Release` | La scrittura puo pubblicare le operazioni precedenti. |
| `Acquire` | La lettura acquisisce quanto pubblicato dalla release che osserva. |
| `AcqRel` | Combina acquire e release in una read-modify-write. |
| `SeqCst` | Aggiunge un ordine totale comune alle operazioni SeqCst. |

L'abbinamento non e solo nominale: per sincronizzarsi tramite un flag, l'acquire deve osservare la scrittura release pertinente, o una relativa release sequence. `SeqCst` non significa "leggi sempre il dato piu recente" e non crea transazioni su piu variabili.

Nelle read-modify-write, `Acquire` lascia relaxed la parte di scrittura; `Release` lascia relaxed quella di lettura. `AcqRel` e `SeqCst` includono entrambi gli effetti. [Ordering](https://doc.rust-lang.org/std/sync/atomic/enum.Ordering.html), [Rustonomicon: atomics](https://doc.rust-lang.org/nomicon/atomics.html).

Ordering ammessi dalle API usate qui:

- `load`: `Relaxed`, `Acquire`, `SeqCst`.
- `store`: `Relaxed`, `Release`, `SeqCst`.
- `swap`, `fetch_add` e successo di CAS: tutti e cinque.
- Fallimento di CAS: `Relaxed`, `Acquire`, `SeqCst`; non scrive, quindi niente `Release` o `AcqRel`.

I due ordering di CAS descrivono successo e fallimento, non semplicemente "prima" e "dopo". [Firme e vincoli delle operazioni](https://doc.rust-lang.org/std/sync/atomic/struct.Atomic.html).

## Esempio pratico

### Flag di arresto cooperativo

Un flag che comunica soltanto "fermati" non deve pubblicare altri dati: in questo contratto `Relaxed` basta.

```rust
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;

#[derive(Default)]
struct StopFlag {
    stopped: AtomicBool,
}

impl StopFlag {
    fn stop(&self) {
        self.stopped.store(true, Ordering::Relaxed);
    }

    fn is_stopped(&self) -> bool {
        self.stopped.load(Ordering::Relaxed)
    }
}

fn main() {
    let stop = Arc::new(StopFlag::default());
    let worker_stop = Arc::clone(&stop);

    let worker = thread::spawn(move || {
        let mut processed = 0;
        for _ in 0..1_000 {
            if worker_stop.is_stopped() {
                break;
            }
            processed += 1;
        }
        processed
    });

    stop.stop();
    let processed = worker.join().unwrap();
    assert!(stop.is_stopped());
    assert!(processed <= 1_000);
}
```

Il numero di iterazioni dipende dallo scheduling: il worker puo finire prima della richiesta. Il flag **non conferma la terminazione**, non sveglia un thread bloccato e non garantisce una latenza di arresto; qui e il `join` ad attendere la conclusione.

La versione con `Release`/`Acquire` sarebbe piu forte del necessario per questo solo booleano. Se il flag deve invece segnalare che altri dati sono pronti, serve un protocollo diverso. Per code, I/O e task sospesi vedi [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]].

### Pubblicare un valore con Release e Acquire

Qui il flag comunica "il risultato e pronto". Un solo produttore scrive il risultato una sola volta; il flag non viene azzerato o riutilizzato.

```rust
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::thread;
use std::time::{Duration, Instant};

fn main() {
    let result = AtomicUsize::new(0);
    let ready = AtomicBool::new(false);

    thread::scope(|scope| {
        let writer = scope.spawn(|| {
            result.store(42, Ordering::Relaxed);
            ready.store(true, Ordering::Release);
        });

        let deadline = Instant::now() + Duration::from_secs(5);
        while !ready.load(Ordering::Acquire) {
            assert!(Instant::now() < deadline, "publication timeout");
            thread::yield_now();
        }

        assert_eq!(result.load(Ordering::Relaxed), 42);
        writer.join().unwrap();
    });
}
```

La catena da giustificare e:

1. Scrittura del risultato prima della release sul flag.
2. Acquire che osserva quel `true`.
3. Lettura del risultato dopo l'acquire.

La lettura del risultato avviene prima del `join`: non stiamo usando l'attesa del thread per giustificare la pubblicazione. Tutti i dati dell'esempio sono atomici; non viene introdotto un contenitore unsafe.

Togliendo la coppia release/acquire, l'osservazione di `true` non garantisce da sola il risultato 42. Un test che continua a passare sul tuo processore non prova il contrario.

Il polling con deadline e solo dimostrativo. La scadenza non annulla il writer e l'uscita dallo scope deve comunque attenderlo. Per attese reali preferisci notifiche o canali; non trasformare questo esempio in uno spinlock. [Rustonomicon: acquire/release](https://doc.rust-lang.org/nomicon/atomics.html#acquire-release), [spin_loop e attesa attiva](https://doc.rust-lang.org/std/hint/fn.spin_loop.html).

### Consumare una quota con compare_exchange_weak

L'operazione richiesta e "decrementa soltanto se resta almeno un elemento". Il controllo deve far parte dell'aggiornamento atomico.

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::thread;

fn try_take(quota: &AtomicUsize) -> bool {
    let mut current = quota.load(Ordering::Relaxed);
    loop {
        if current == 0 {
            return false;
        }
        match quota.compare_exchange_weak(
            current,
            current - 1,
            Ordering::Relaxed,
            Ordering::Relaxed,
        ) {
            Ok(_) => return true,
            Err(observed) => current = observed,
        }
    }
}

fn main() {
    let quota = AtomicUsize::new(3);
    let accepted = thread::scope(|scope| {
        let mut handles = Vec::new();
        for _ in 0..8 {
            handles.push(scope.spawn(|| try_take(&quota)));
        }
        let outcomes: Vec<_> = handles.into_iter().map(|h| h.join()).collect();
        outcomes.into_iter()
            .map(|result| usize::from(result.unwrap()))
            .sum::<usize>()
    });

    assert_eq!(accepted, 3);
    assert_eq!(quota.load(Ordering::Relaxed), 0);
}
```

La versione `weak` puo fallire anche senza una modifica concorrente: va gestita nel retry. Il nuovo tentativo usa il valore osservato. Qui la quota e indipendente, quindi entrambi gli ordering sono relaxed.

Non e un semaforo: non restituisce permessi, non attende rifornimenti e non garantisce equita o un numero massimo di tentativi per chiamante.

### Aggiornamento condizionale con try_update

Per esprimere la stessa trasformazione senza scrivere il ciclo CAS:

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

fn try_take(quota: &AtomicUsize) -> bool {
    quota.try_update(
        Ordering::Relaxed,
        Ordering::Relaxed,
        |current| current.checked_sub(1),
    ).is_ok()
}

fn main() {
    let quota = AtomicUsize::new(2);
    assert!(try_take(&quota));
    assert!(try_take(&quota));
    assert!(!try_take(&quota));
    assert_eq!(quota.load(Ordering::Relaxed), 0);
}
```

`try_update` e stable da Rust 1.95. Il nome precedente `fetch_update` e deprecato da 1.99, ma resta utile da riconoscere nel codice con MSRV piu vecchia. La closure puo essere rivalutata: deve calcolare il candidato, senza pagamenti, invii o altri effetti da eseguire una volta sola. [Documentazione di try_update](https://doc.rust-lang.org/std/sync/atomic/struct.Atomic.html).

## Varianti

### Portabilita e garanzie di progresso

Gli atomici disponibili in `std::sync::atomic` sono documentati come lock-free, non necessariamente wait-free. La disponibilita di tipi e operazioni dipende dal target; non presumere che un esempio desktop sia compilabile su ogni microcontrollore.

La garanzia di una primitiva non certifica quella dell'intero programma: un algoritmo puo aggiungere attese, retry o lavoro bloccante. [Portabilita degli atomici](https://doc.rust-lang.org/std/sync/atomic/index.html#portability).

### Puntatori, inizializzazione e notifiche

- `AtomicPtr<T>` rende atomico il valore del puntatore, non protegge automaticamente `T` ne ne mantiene viva l'allocazione.
- Un CAS riuscito verifica il valore corrente, non tutta la sua storia: la sequenza A-B-A puo nascondere cambiamenti intermedi. Non improvvisare gestione della memoria lock-free.
- Per inizializzare e condividere dati una volta, considera [[Programmazione/Rust/Pagine/OnceLock e LazyLock|OnceLock e LazyLock]].
- Per scambiare dati o notificare eventi senza polling, considera [[Programmazione/Rust/Pagine/Message passing|message passing]].
- `fence` richiede un protocollo di sincronizzazione preciso; non e una barriera universale da aggiungere per "rendere sicuro" il codice.

Riferimenti: [AtomicPtr](https://doc.rust-lang.org/std/sync/atomic/type.AtomicPtr.html), [CAS e ABA](https://doc.rust-lang.org/std/sync/atomic/struct.Atomic.html), [fence](https://doc.rust-lang.org/std/sync/atomic/fn.fence.html).

### Prestazioni da misurare

Un atomico molto conteso puo essere costoso anche senza mutex. Prima di introdurre piu complessita, confronta stato locale con aggregazione finale, minore frequenza degli aggiornamenti e sezioni critiche brevi.

Per `RwLock`, conta anche la durata reale delle letture e l'attesa delle scritture. Nessuno degli esempi e un benchmark. Procedura: [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]].

## Errori comuni

### SeqCst non rende atomico load piu store

**Controesempio logicamente errato, anche se compila.** Due incrementi producono uno solo: la barriera forza entrambi i worker a leggere prima delle scritture.

```rust
use std::sync::Barrier;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::thread;

fn main() {
    let counter = AtomicUsize::new(0);
    let read = Barrier::new(2);

    thread::scope(|scope| {
        for _ in 0..2 {
            let counter = &counter;
            let read = &read;
            scope.spawn(move || {
                let old = counter.load(Ordering::SeqCst);
                read.wait();
                counter.store(old + 1, Ordering::SeqCst);
            });
        }
    });

    assert_eq!(counter.load(Ordering::SeqCst), 1);
}
```

Non c'e una data race: manca una singola operazione di incremento. La correzione e `fetch_add` o una sezione critica, non un ordering ancora piu forte.

### Ordering non ammesso

Controesempio: **rifiutato dal compilatore** nella baseline della nota.

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

fn main() {
    let value = AtomicUsize::new(1);
    let _ = value.load(Ordering::Release);
}
```

Una lettura non ha una scrittura da pubblicare. Per ordering determinati a runtime, i valori non validi causano panic; non provare le combinazioni a tentativi.

### Altri errori

- Usare relaxed per un flag di pubblicazione senza dimostrare la relazione con gli altri dati.
- Modificare il risultato dopo il segnale di pronto, riutilizzando un protocollo pensato per una sola pubblicazione.
- Confondere richiesta di stop con conferma di arresto o risveglio di un worker bloccato.
- Ignorare overflow e wrapping nei contatori.
- Dare effetti non ripetibili alla closure di un aggiornamento con retry.
- Tenere una guard durante I/O, chiamate rientranti o `.await`; in async scegli la primitiva in base al contratto, non soltanto al nome.
- Curare con atomici un problema di ownership che sarebbe piu semplice risolvere con messaggi.

## Checklist

- Quale operazione deve essere indivisibile: una modifica numerica o piu campi?
- Il flag trasporta solo una decisione oppure pubblica altri dati?
- Quale release viene osservata dalla lettura acquire?
- L'ordering e valido per quell'operazione e motivato dal protocollo?
- CAS e retry ricalcolano il candidato senza effetti duplicati?
- Overflow, arresto, attese e possibile riuso del segnale sono definiti?
- I dati puntati restano validi indipendentemente dall'atomicita del puntatore?
- La primitiva esiste sul target e nella versione Rust richiesta?
- Le prestazioni sono state misurate rispetto a una soluzione piu semplice?

## Collegamenti

- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex e RwLock]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync]]
- [[Programmazione/Rust/Pagine/Threads|Threads]]
- [[Programmazione/Rust/Pagine/Message passing|Message passing]]
- [[Programmazione/Rust/Pagine/OnceLock e LazyLock|OnceLock e LazyLock]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]

## Fonti

Consultate il 2026-11-10; baseline Rust 1.99.1, edition 2024. Le pagine std seguono la versione stabile corrente; disponibilita sul target e MSRV vanno ricontrollate per il progetto reale.

- [std::sync::atomic: modello e portabilita](https://doc.rust-lang.org/std/sync/atomic/index.html).
- [Ordering](https://doc.rust-lang.org/std/sync/atomic/enum.Ordering.html) e [Rustonomicon: atomics](https://doc.rust-lang.org/nomicon/atomics.html).
- [API delle operazioni atomiche](https://doc.rust-lang.org/std/sync/atomic/struct.Atomic.html), [AtomicBool](https://doc.rust-lang.org/std/sync/atomic/type.AtomicBool.html), [AtomicPtr](https://doc.rust-lang.org/std/sync/atomic/type.AtomicPtr.html).
- [Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html), [RwLock](https://doc.rust-lang.org/std/sync/struct.RwLock.html).
- [fence](https://doc.rust-lang.org/std/sync/atomic/fn.fence.html), [spin_loop](https://doc.rust-lang.org/std/hint/fn.spin_loop.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

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
  - Stato condiviso Rust
  - Shared mutable state
prerequisites:
  - "[[Programmazione/Rust/Pagine/Rc T e Arc T]]"
  - "[[Programmazione/Rust/Pagine/Mutex RwLock e Atomics]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Message passing]]"
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
  - "[[Programmazione/Rust/Pagine/Graceful shutdown]]"
title: Shared state
---

# Shared state

## Sintesi

Shared state e il modello in cui piu thread o task accedono agli stessi dati. **Condividere non significa necessariamente modificare**: dati immutabili possono essere letti tramite prestiti condivisi; la mutazione concorrente richiede primitive appropriate.

`Arc<T>` gestisce ownership condivisa; `Mutex<T>`, `RwLock<T>` e gli atomici regolano accessi e aggiornamenti. Sono responsabilita distinte: `Arc` da solo non rende thread-safe il contenuto.

La regola pratica: condividi il meno possibile e mantieni brevi le sezioni critiche, **senza separare controllo e modifica se devono costituire un'unica operazione**.

## Quando usarlo

- Piu worker aggiornano una cache, un contatore o uno stato comune.
- Piu lettori consultano una configurazione coerente che puo essere sostituita.
- Un registry deve essere accessibile da piu parti del programma.
- Un protocollo a messaggi renderebbe meno chiara l'operazione richiesta.

Valuta prima dati immutabili, risultati locali da aggregare e [[Programmazione/Rust/Pagine/Message passing|message passing]]. Un contatore conteso da tutti i worker puo annullare il beneficio del parallelismo.

## Come funziona

### Ownership, accesso e invarianti

Distingui tre domande:

1. **Chi mantiene vivi i dati?** Un proprietario esterno con thread scoped, oppure piu proprietari tramite `Arc`.
2. **Chi puo accedervi?** I bound `Send` e `Sync` definiscono quali trasferimenti e prestiti tra thread sono ammessi.
3. **Quale operazione deve essere indivisibile?** La sincronizzazione deve proteggere l'intera invariante applicativa, non soltanto ciascuna istruzione.

Un lock impedisce accessi incompatibili finche esiste la guard. Non impone ordine di esecuzione ai worker, non attende la loro terminazione e non rende corretto un protocollo sbagliato.

### Condividere dati immutabili senza Arc

I thread scoped possono prendere in prestito dati locali. Qui entrambi leggono lo stesso vettore, senza copie del contenuto o lock:

```rust
use std::thread;

fn main() {
    let values = vec![10_u64, 20, 30];

    thread::scope(|scope| {
        let sum = scope.spawn(|| values.iter().sum::<u64>());
        let count = scope.spawn(|| values.len());

        assert_eq!(sum.join().unwrap(), 60);
        assert_eq!(count.join().unwrap(), 3);
    });

    assert_eq!(values, [10, 20, 30]);
}
```

Un `&T` puo essere trasferito tra thread se `T: Sync`; il prestito deve anche restare valido. `thread::scope` permette di rispettare questa durata senza imporre `'static` ai dati presi in prestito. Se invece i worker devono possedere autonomamente un riferimento allo stesso dato, considera `Arc<T>`. [Documentazione di scope](https://doc.rust-lang.org/std/thread/fn.scope.html), [Arc e thread safety](https://doc.rust-lang.org/std/sync/struct.Arc.html#thread-safety).

### Durata della guard

`lock()` restituisce una guard che permette di accedere al valore; la sua distruzione rilascia il mutex. Un blocco lessicale rende evidente dove termina la sezione critica. [MutexGuard](https://doc.rust-lang.org/std/sync/struct.MutexGuard.html).

Prepara input e lavoro costoso prima di acquisire il lock; estrai un risultato posseduto e svolgi I/O dopo averlo rilasciato. Non restituire un riferimento al contenuto di una guard locale: il riferimento non puo sopravvivere alla protezione che lo rende valido.

Una copia sotto lock e uno **snapshot**, non un accesso vivo ai dati. Puo essere gia superato quando inizi a usarlo.

## API / Sintassi

### Aggiornamento e snapshot

L'alias descrive la combinazione di ownership e sincronizzazione. La funzione `update`, pero, richiede soltanto `&Mutex<_>`: non ha bisogno di clonare o possedere un `Arc`.

```rust
use std::sync::{Arc, Mutex};
use std::thread;

type Shared<T> = Arc<Mutex<T>>;

fn update(shared: &Mutex<Vec<String>>, value: String) -> Result<(), &'static str> {
    let mut items = shared.lock().map_err(|_| "mutex poisoned")?;
    items.push(value);
    Ok(())
}

fn main() -> Result<(), &'static str> {
    let items: Shared<Vec<String>> = Arc::new(Mutex::new(Vec::new()));
    let worker_items = Arc::clone(&items);

    let worker = thread::spawn(move || {
        update(&worker_items, String::from("ready"))
    });
    worker.join().map_err(|_| "worker panicked")??;

    let snapshot = {
        let guard = items.lock().map_err(|_| "mutex poisoned")?;
        guard.clone()
    };

    println!("{}", snapshot.join(", "));
    Ok(())
}
```

`&worker_items` viene convertito tramite deref coercion in `&Mutex<Vec<String>>`. I due `?` distinguono il fallimento di `join` dal `Result` restituito dalla funzione del worker. La stampa avviene senza mantenere il lock.

Per grandi collezioni, clonare ogni volta puo essere costoso: valuta uno snapshot piu piccolo, dati immutabili condivisi o un protocollo a messaggi.

## Esempio pratico

### Contatore con attesa di tutti i worker

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn count_parallel(workers: usize, increments: usize) -> Result<u64, &'static str> {
    if workers > 8 {
        return Err("too many workers");
    }

    let counter = Arc::new(Mutex::new(0_u64));
    let mut handles = Vec::new();

    for _ in 0..workers {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || -> Result<(), &'static str> {
            for _ in 0..increments {
                let mut value = counter.lock().map_err(|_| "mutex poisoned")?;
                *value = value.checked_add(1).ok_or("counter overflow")?;
            }
            Ok(())
        }));
    }

    // Prima attendiamo tutti; poi propaghiamo gli eventuali errori.
    let outcomes: Vec<_> = handles.into_iter().map(|h| h.join()).collect();
    for outcome in outcomes {
        outcome.map_err(|_| "worker panicked")??;
    }

    let snapshot = *counter.lock().map_err(|_| "mutex poisoned")?;
    Ok(snapshot)
}

fn main() -> Result<(), &'static str> {
    assert_eq!(count_parallel(4, 100)?, 400);
    assert_eq!(count_parallel(0, 100)?, 0);
    assert_eq!(count_parallel(2, 0)?, 0);
    assert_eq!(count_parallel(9, 1), Err("too many workers"));
    println!("400");
    Ok(())
}
```

Il limite di otto worker e una scelta didattica, non un limite Rust. Ogni incremento comprende lettura, verifica dell'overflow e scrittura sotto la stessa guard.

Raccogliere prima tutti i risultati di `join` evita che un `?` nel ciclo abbandoni handle non ancora attesi. Non significa annullare gli aggiornamenti gia eseguiti: un errore non introduce rollback. Un worker bloccato indefinitamente bloccherebbe anche l'attesa.

`thread::spawn` puo fare panic se il sistema non riesce a creare il thread; questo esempio non recupera tale errore. Per spawn fallibile e gestione dei worker gia avviati vedi [[Programmazione/Rust/Pagine/Threads|Threads]].

Il binding `snapshot` chiarisce quando viene distrutta la guard ed evita di dipendere dalle differenze fra edition 2021 e 2024 sui temporanei nelle espressioni finali. [Rust Edition Guide](https://doc.rust-lang.org/edition-guide/rust-2024/temporary-tail-expr-scope.html).

### Proteggere una invariante applicativa

Un inventario conserva quantita disponibile e prenotata. Una prenotazione deve verificare la disponibilita e aggiornare **entrambi i campi** sotto lo stesso lock.

```rust
use std::sync::{Arc, Mutex};
use std::thread;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct Stock {
    available: u32,
    reserved: u32,
}

#[derive(Debug, PartialEq, Eq)]
enum ReserveError {
    Poisoned,
    InsufficientStock,
    Overflow,
}

struct Inventory {
    state: Mutex<Stock>,
}

impl Inventory {
    fn new(available: u32) -> Self {
        Self {
            state: Mutex::new(Stock { available, reserved: 0 }),
        }
    }

    fn reserve(&self, quantity: u32) -> Result<(), ReserveError> {
        let mut stock = self.state.lock().map_err(|_| ReserveError::Poisoned)?;
        if quantity > stock.available {
            return Err(ReserveError::InsufficientStock);
        }

        let reserved = stock.reserved
            .checked_add(quantity)
            .ok_or(ReserveError::Overflow)?;

        stock.available -= quantity;
        stock.reserved = reserved;
        Ok(())
    }

    fn snapshot(&self) -> Result<Stock, ReserveError> {
        let stock = self.state.lock().map_err(|_| ReserveError::Poisoned)?;
        Ok(*stock)
    }
}

fn main() {
    let inventory = Arc::new(Inventory::new(10));
    let mut handles = Vec::new();

    for _ in 0..4 {
        let inventory = Arc::clone(&inventory);
        handles.push(thread::spawn(move || inventory.reserve(3)));
    }

    let outcomes: Vec<_> = handles.into_iter().map(|h| h.join()).collect();
    let mut accepted = 0;
    let mut rejected = 0;
    for outcome in outcomes {
        match outcome.expect("worker panicked") {
            Ok(()) => accepted += 1,
            Err(ReserveError::InsufficientStock) => rejected += 1,
            Err(error) => panic!("unexpected error: {error:?}"),
        }
    }

    assert_eq!((accepted, rejected), (3, 1));
    assert_eq!(
        inventory.snapshot().unwrap(),
        Stock { available: 1, reserved: 9 },
    );
}
```

Non sappiamo quale worker verra rifiutato; sappiamo che solo tre prenotazioni possono riuscire. `snapshot` copia insieme i due campi mentre lo stesso mutex li protegge.

Tutti i controlli fallibili di `reserve` precedono le modifiche. Negli errori restituiti lo stato resta invariato **per come abbiamo scritto questa funzione**, non per una proprieta automatica di `Mutex` o `Result`. Non sono implementati rollback generale, persistenza o transazioni con un database.

## Varianti

### RwLock per snapshot di configurazione

`RwLock` permette piu lettori oppure un solo scrittore. Non e automaticamente piu veloce di `Mutex`: costo, contesa e politica di scheduling dipendono dal carico e dalla piattaforma; non c'e una garanzia generale di priorita dei writer. [Documentazione di RwLock](https://doc.rust-lang.org/std/sync/struct.RwLock.html).

```rust
use std::sync::{Arc, RwLock};
use std::thread;

#[derive(Clone, Debug, PartialEq, Eq)]
struct Settings {
    label: String,
    enabled: bool,
}

fn main() {
    let settings = Arc::new(RwLock::new(Settings {
        label: String::from("old"),
        enabled: false,
    }));

    let before = {
        let guard = settings.read().unwrap();
        guard.clone()
    };

    let writer_settings = Arc::clone(&settings);
    let writer = thread::spawn(move || {
        let replacement = Settings {
            label: String::from("new"),
            enabled: true,
        };
        *writer_settings.write().unwrap() = replacement;
    });
    writer.join().unwrap();

    let after = settings.read().unwrap().clone();
    assert_eq!(before.label, "old");
    assert!(!before.enabled);
    assert_eq!(after.label, "new");
    assert!(after.enabled);
}
```

La nuova configurazione viene preparata prima del write lock e sostituita interamente sotto lock. Lo snapshot precedente resta indipendente.

Se una modifica dipende da uno snapshot letto prima, **ricontrolla la condizione o una versione sotto il write lock**. Lasciare la read guard e acquisire una write guard sono due operazioni distinte; mantenere la read guard mentre si chiede il write lock puo causare deadlock. Vedi [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex e RwLock]].

### Atomico per un contatore indipendente

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::thread;

fn main() {
    let completed = AtomicUsize::new(0);

    thread::scope(|scope| {
        for _ in 0..4 {
            let completed = &completed;
            scope.spawn(move || {
                for _ in 0..100 {
                    completed.fetch_add(1, Ordering::Relaxed);
                }
            });
        }
    });

    assert_eq!(completed.load(Ordering::Relaxed), 400);
}
```

`fetch_add` aggiorna il valore con una singola operazione atomica; una coppia `load` + `store` non e un incremento atomico. Qui `Relaxed` basta per il solo contatore indipendente e il valore finale viene letto dopo l'attesa dei worker.

Non usare questo ragionamento per un flag che segnala la disponibilita di altri dati: `Relaxed` non pubblica quelle scritture. `fetch_add` inoltre esegue wrapping in overflow; il totale limitato dell'esempio evita tale caso. La disponibilita di `AtomicUsize` dipende dal target. [Ordering](https://doc.rust-lang.org/std/sync/atomic/enum.Ordering.html), [atomici](https://doc.rust-lang.org/std/sync/atomic/index.html), [AtomicUsize](https://doc.rust-lang.org/std/sync/atomic/type.AtomicUsize.html).

Usare un tipo atomico non basta a dimostrare che l'intero algoritmo sia corretto o abbia determinate garanzie di progresso. Per memory ordering e operazioni composte vedi [[Programmazione/Rust/Pagine/Mutex RwLock e Atomics|Mutex, RwLock e Atomics]].

### Inizializzazione e task async

- `OnceLock` e `LazyLock` servono per inizializzare un valore condiviso, non sostituiscono la sincronizzazione necessaria per modificarlo dopo. Vedi [[Programmazione/Rust/Pagine/OnceLock e LazyLock|OnceLock e LazyLock]].
- In async, un mutex standard puo andare bene per sezioni brevi, poco contese e senza `.await`. Acquisirlo blocca il thread dell'executor.
- Non mantenere una guard standard attraverso `.await`: oltre ai rischi di blocco, `MutexGuard` non e `Send` e puo rendere il future non accettabile per uno spawn che richiede `Send`.
- Se serve davvero mantenere la guard attraverso `.await`, valuta un mutex async o un task proprietario con messaggi. Il mutex async evita l'attesa bloccante del lock, ma non elimina deadlock o contesa.

Questa nota non richiede un runtime async. Criteri e differenze: [Tokio Mutex 1.54.1](https://docs.rs/tokio/1.54.1/tokio/sync/struct.Mutex.html#which-kind-of-mutex-should-you-use).

## Errori comuni

### Check-then-act: codice sicuro ma logicamente sbagliato

**Controesempio intenzionalmente errato, da non riutilizzare.** I due worker possono entrambi vedere l'ultimo elemento disponibile e prenotarlo. Ogni accesso e protetto, ma controllo e aggiornamento sono separati.

```rust
use std::sync::{Barrier, Mutex};
use std::thread;

fn main() {
    let remaining = Mutex::new(1_i32);
    let checked = Barrier::new(2);

    thread::scope(|scope| {
        for _ in 0..2 {
            let remaining = &remaining;
            let checked = &checked;
            scope.spawn(move || {
                let can_reserve = *remaining.lock().unwrap() > 0;
                checked.wait();

                if can_reserve {
                    *remaining.lock().unwrap() -= 1;
                }
            });
        }
    });

    assert_eq!(*remaining.lock().unwrap(), -1);
}
```

La barriera serve soltanto a forzare l'interleaving: entrambi completano la lettura prima delle scritture. Non ci sono accessi alla memoria non sincronizzati, ma il risultato viola il requisito `remaining >= 0`.

La correzione e tenere **controllo e decremento nella stessa sezione critica**, come in `Inventory::reserve`. Non spostare la barriera dentro il lock: il primo worker attenderebbe il secondo impedendogli di acquisire lo stesso mutex.

### Poisoning non significa rollback

Un panic durante la detenzione del mutex puo segnalarlo come poisoned. E un avviso su una possibile inconsistenza, non un meccanismo di transazione e nemmeno una garanzia di rilevare ogni panic. Un normale ritorno `Err` non causa da solo poisoning.

Gli esempi fallibili rifiutano l'accesso quando ricevono `PoisonError`; gli esempi introduttivi con `unwrap` interrompono il programma. Non sono strategie equivalenti per un servizio.

`into_inner()` sull'errore permette di ottenere la guard, ma non ripara i dati. Un eventuale recupero deve ripristinare le invarianti prima di considerare sano lo stato; vedi [[Programmazione/Rust/Pagine/Mutex T e RwLock T|gestione del poisoning]]. [Documentazione di Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html#poisoning).

### Altri errori di progettazione

- **Arc come soluzione universale:** `Arc<RefCell<T>>` non rende sincronizzate le verifiche di borrow di `RefCell`.
- **Un lock per ogni campo correlato:** puo impedire di osservare o aggiornare insieme uno stato coerente.
- **Join, send bloccante o I/O sotto lock:** il lavoro atteso potrebbe richiedere proprio quel lock.
- **Callback arbitraria sotto guard:** puo rientrare nello stesso componente o acquisire lock in ordine opposto.
- **Piu lock senza ordine comune:** stabilisci un ordine globale quando non puoi ricondurre l'operazione a un solo lock.
- **Ottimizzare prima di misurare:** confronta lavoro locale e aggregazione, snapshot, messaggi o suddivisione dello stato sulla base del carico reale.

## Checklist

- Lo stato puo essere immutabile o posseduto da un solo worker?
- Servono proprietari indipendenti oppure bastano prestiti scoped?
- Quale invariante deve restare valida a ogni rilascio della guard?
- Controllo, calcolo e aggiornamento sono protetti come una sola operazione?
- La funzione puo restituire un errore dopo aver modificato parzialmente lo stato?
- Snapshot e loro eventuale obsolescenza sono espliciti?
- Panic, poisoning e terminazione di tutti i worker sono gestiti?
- Si evitano attese, callback e I/O mentre si mantiene il lock?
- La scelta di RwLock o atomici e motivata, non solo presunta piu veloce?

## Collegamenti

- [[Programmazione/Rust/Pagine/Threads|Threads e join]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc e Arc]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex e RwLock]]
- [[Programmazione/Rust/Pagine/Mutex RwLock e Atomics|Mutex, RwLock e Atomics]]
- [[Programmazione/Rust/Pagine/Message passing|Message passing]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/OnceLock e LazyLock|OnceLock e LazyLock]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]

## Fonti

Riferimenti consultati il 2026-11-10; esempi della standard library verificati con Rust 1.99.1, edition 2024. Le pagine `std` seguono la versione stabile corrente.

- [The Rust Book: Shared-State Concurrency](https://doc.rust-lang.org/book/ch16-03-shared-state.html).
- [Arc](https://doc.rust-lang.org/std/sync/struct.Arc.html), [Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html), [MutexGuard](https://doc.rust-lang.org/std/sync/struct.MutexGuard.html), [RwLock](https://doc.rust-lang.org/std/sync/struct.RwLock.html).
- [Scoped threads](https://doc.rust-lang.org/std/thread/fn.scope.html), [JoinHandle e sincronizzazione](https://doc.rust-lang.org/std/thread/struct.JoinHandle.html#method.join), [Barrier](https://doc.rust-lang.org/std/sync/struct.Barrier.html).
- [Modulo atomic](https://doc.rust-lang.org/std/sync/atomic/index.html), [Ordering](https://doc.rust-lang.org/std/sync/atomic/enum.Ordering.html), [operazioni di Atomic](https://doc.rust-lang.org/std/sync/atomic/struct.Atomic.html).
- [Temporanei delle espressioni finali, edition 2024](https://doc.rust-lang.org/edition-guide/rust-2024/temporary-tail-expr-scope.html).
- [Tokio Mutex 1.54.1](https://docs.rs/tokio/1.54.1/tokio/sync/struct.Mutex.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

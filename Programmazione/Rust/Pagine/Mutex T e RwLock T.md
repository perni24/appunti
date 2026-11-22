---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - smart-pointers-e-interior-mutability
aliases:
  - Mutex<T>
  - RwLock<T>
  - Lock Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
  - "[[Programmazione/Rust/Pagine/Rc T e Arc T]]"
  - "[[Programmazione/Rust/Pagine/Threads]]"
related:
  - "[[Programmazione/Rust/Pagine/Mutex RwLock e Atomics]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
  - "[[Programmazione/Rust/Pagine/Shared state]]"
title: Mutex<T> e RwLock<T>
---

# Mutex<T> e RwLock<T>

## Sintesi

`std::sync::Mutex<T>` permette un accesso esclusivo al contenuto, anche se vuoi soltanto leggerlo. `std::sync::RwLock<T>` distingue accesso condiviso in lettura ed esclusivo in scrittura.

Questi lock forniscono **sincronizzazione**, non ownership condivisa: `Arc` risolve un problema diverso. Le guardie collegano accesso al dato e durata del lock; il rilascio normale avviene al loro `Drop`, non automaticamente dopo l'ultima lettura.

Esempi riferiti a **Rust 1.99.1, edition 2024**: sette programmi eseguibili, di cui uno con panic intenzionale in un worker, e due controesempi che non compilano. La baseline non indica la versione minima supportata. Questa nota tratta le API standard; il confronto con Tokio e documentale.

## Quando usarlo

- Parti da `Mutex<T>` per aggiornamenti brevi di uno stato condiviso.
- Valuta `RwLock<T>` se letture contemporanee abbastanza lunghe possono ripagare il costo di coordinamento. Molte letture, da sole, non dimostrano un vantaggio.
- Usa `Arc<Mutex<T>>` quando diversi proprietari devono mantenere vivo lo stesso stato.
- Se i thread sono scoped, un prestito del lock puo bastare: `Arc` non e obbligatorio.
- Considera ownership esclusiva, message passing o atomici prima di aggiungere lock ovunque.

Un lock protegge soltanto le operazioni che rispettano lo stesso protocollo. Due operazioni singolarmente protette non diventano per questo un'unica transazione.

## Come funziona

### La guardia resta viva fino al rilascio

```rust
use std::sync::{Mutex, TryLockError};
use std::thread;

fn main() {
    let value = Mutex::new(10);
    let mut guard = value.lock().unwrap();
    *guard += 1;
    assert_eq!(*guard, 11);

    thread::scope(|scope| {
        scope.spawn(|| {
            assert!(matches!(value.try_lock(), Err(TryLockError::WouldBlock)));
        }).join().unwrap();
    });

    drop(guard);
    assert_eq!(*value.lock().unwrap(), 11);
}
```

Il worker usa un tentativo non bloccante e osserva che la guardia del chiamante e ancora viva. L'ultima lettura di `guard` non l'ha distrutta. `drop(guard)` o la fine di un blocco ne rendono esplicito il rilascio.

Una `MutexGuard` permette `&T` e, se la guardia e mutabile, `&mut T`. I riferimenti ottenuti non possono sopravvivere alla guardia. Dimenticarla con `mem::forget` non e un modo per sbloccare: il suo distruttore non viene eseguito.

### Lettori e scrittori

```rust
use std::sync::{RwLock, TryLockError};
use std::thread;

fn main() {
    let text = RwLock::new(String::from("rust"));
    {
        let first = text.read().unwrap();
        thread::scope(|scope| {
            scope.spawn(|| {
                let second = text.read().unwrap();
                assert_eq!(&*second, "rust");
            }).join().unwrap();
        });
        assert_eq!(&*first, "rust");
        assert!(matches!(text.try_write(), Err(TryLockError::WouldBlock)));
    }
    {
        let mut writer = text.write().unwrap();
        writer.push('!');
        assert!(matches!(text.try_read(), Err(TryLockError::WouldBlock)));
    }
    assert_eq!(&*text.read().unwrap(), "rust!");
}
```

Qui nessuno scrittore e in attesa durante le due letture. Non generalizzare l'esempio a una riacquisizione ricorsiva: uno scrittore in coda puo impedire ulteriori letture, secondo la politica della piattaforma.

`RwLock` standard non promette FIFO, priorita fissa o assenza di starvation. Una read guard non consente mutazione ordinaria del dato; la write guard si comporta come accesso esclusivo. [Contratto di RwLock](https://doc.rust-lang.org/std/sync/struct.RwLock.html).

## API / Sintassi

| API | Risultato e uso |
| --- | --- |
| `Mutex::lock` | Attende e restituisce `LockResult<MutexGuard<'_, T>>`. |
| `Mutex::try_lock` | Non attende; distingue lock occupato e poisoning. |
| `RwLock::read` / `write` | Attendono una guardia di lettura o scrittura. |
| `try_read` / `try_write` | Tentativi senza attesa, non prenotazioni. |
| `get_mut(&mut self)` | Accesso esclusivo verificato staticamente; niente acquisizione del lock. |
| `into_inner(self)` | Consuma il lock e restituisce il contenuto. |
| `is_poisoned` | Osservazione del flag, non validazione del dato. |
| `clear_poison` | Cancella il flag; non ripara il contenuto. |

`LockResult<G>` e un `Result<G, PoisonError<G>>`: anche l'errore di acquisizione per poisoning **contiene la guardia del lock acquisito**. Conservarlo puo quindi mantenere il lock occupato. `PoisonError::into_inner` recupera quel contenuto, non annulla le modifiche precedenti.

`TryLockError::WouldBlock` significa che ora l'accesso non e disponibile. `TryLockError::Poisoned` contiene invece una guardia acquisita su stato avvelenato. Non trattarli come lo stesso caso e non trasformare un tentativo fallito in un ciclo di polling continuo. [TryLockError](https://doc.rust-lang.org/std/sync/enum.TryLockError.html), [PoisonError](https://doc.rust-lang.org/std/sync/struct.PoisonError.html).

`get_mut` e `into_inner` restituiscono anch'essi un `LockResult`: ownership esclusiva non cancella un poisoning precedente. Nel primo caso l'errore contiene `&mut T`, nel secondo `T`.

## Esempio pratico

### Contatore concorrente con attesa esplicita

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0_u32));
    let mut workers = Vec::new();

    for _ in 0..4 {
        let counter = Arc::clone(&counter);
        workers.push(thread::spawn(move || {
            for _ in 0..250 {
                let mut value = counter.lock().unwrap();
                *value = value.checked_add(1).expect("counter overflow");
            }
        }));
    }

    for worker in workers {
        worker.join().unwrap();
    }
    assert_eq!(*counter.lock().unwrap(), 1000);
}
```

Lettura, calcolo e scrittura avvengono sotto la stessa guardia: nessun aggiornamento puo inserirsi fra quelle operazioni. Il conteggio e deterministico anche se l'ordine dei worker non lo e.

`Arc::clone` condivide il lock, non copia il contatore. `join` attende il worker e rende visibili le sue operazioni; scartare un `JoinHandle` lo distacca, non lo attende. Non chiamare `join` tenendo un lock che il worker deve acquisire. [JoinHandle](https://doc.rust-lang.org/std/thread/struct.JoinHandle.html).

Gli `unwrap` sono una scelta didattica fail-fast: un panic del worker o un lock avvelenato fanno fallire il demo. Non sono una politica universale di gestione degli errori.

### Registro condiviso con snapshot indipendente

```rust
use std::sync::{Arc, Mutex};
use std::thread;

#[derive(Clone, Default)]
struct SharedLog {
    entries: Arc<Mutex<Vec<String>>>,
}

impl SharedLog {
    fn push(&self, entry: String) -> Result<(), &'static str> {
        let mut entries = self.entries.lock().map_err(|_| "log poisoned")?;
        entries.push(entry);
        Ok(())
    }

    fn len(&self) -> Result<usize, &'static str> {
        let entries = self.entries.lock().map_err(|_| "log poisoned")?;
        Ok(entries.len())
    }

    fn snapshot(&self) -> Result<Vec<String>, &'static str> {
        let entries = self.entries.lock().map_err(|_| "log poisoned")?;
        Ok(entries.clone())
    }
}

fn main() {
    let log = SharedLog::default();
    log.push(String::from("started")).unwrap();

    let worker_log = log.clone();
    thread::spawn(move || {
        worker_log.push(String::from("worker done")).unwrap();
    }).join().unwrap();

    let snapshot = log.snapshot().unwrap();
    for entry in &snapshot {
        log.push(format!("archived: {entry}")).unwrap();
    }
    assert_eq!(snapshot, ["started", "worker done"]);
    assert_eq!(log.len().unwrap(), 4);
}
```

La copia dello snapshot avviene sotto lock; il ciclo successivo no. Questo consente al codice chiamante di rientrare in `push` senza mantenere una guardia precedente. Lo snapshot non riflette nuovi inserimenti e non certifica un ordine globale fra produttori concorrenti.

`map_err` scarta l'errore con la sua guardia e restituisce un errore indipendente dal lock. L'esempio rifiuta lo stato avvelenato: non lo ripara e non lo ignora. Per un'API pubblica usa un tipo d'errore appropriato.

La durata della sezione critica include anche allocazioni e clone. Uno snapshot di un log enorme puo essere costoso; evita inoltre I/O, callback arbitrarie e distruttori costosi sotto lock quando il progetto consente di spostarli fuori.

### Riparare uno stato avvelenato

Il worker seguente fa intenzionalmente panic dopo aver violato un'invariante. Il programma principale lo osserva tramite `join` e ripristina un valore noto:

```rust
use std::sync::{Arc, Mutex};
use std::thread;

#[derive(Debug, PartialEq)]
struct Bounds {
    lower: i32,
    upper: i32,
}

fn main() {
    let bounds = Arc::new(Mutex::new(Bounds { lower: 0, upper: 5 }));
    let worker_bounds = Arc::clone(&bounds);

    let worker = thread::spawn(move || {
        let mut state = worker_bounds.lock().unwrap();
        state.lower = 10;
        panic!("interrupted update");
    });
    assert!(worker.join().is_err());
    assert!(bounds.is_poisoned());

    {
        let error = bounds.lock().unwrap_err();
        let mut state = error.into_inner();
        assert!(state.lower > state.upper);
        *state = Bounds { lower: 0, upper: 5 };
        bounds.clear_poison();
    }

    assert!(!bounds.is_poisoned());
    assert_eq!(*bounds.lock().unwrap(), Bounds { lower: 0, upper: 5 });
}
```

Il messaggio di panic su stderr e atteso. La prova presuppone unwinding: con `panic=abort` non si arriva al recupero. La sostituzione dell'intero stato e accettabile solo se il dominio permette di perdere il lavoro incompleto.

Il poisoning segnala un possibile problema di consistenza, non esegue rollback. E un meccanismo consultivo, non una garanzia che ogni panic venga rilevato o che l'assenza del flag implichi validita. Non usarlo come fondamento della sicurezza di codice unsafe.

Restituire normalmente `Err` da una funzione non avvelena il lock: anche in quel caso puoi aver lasciato modifiche parziali. Le invarianti e l'eventuale rollback spettano all'applicazione.

Per `RwLock` il poisoning riguarda il panic con guardia **di scrittura**, non un normale panic con sola guardia di lettura. `clear_poison` va chiamato dopo la verifica/riparazione, mantenendo l'accesso esclusivo; recuperare la guardia da solo non cancella il flag. [Mutex e poisoning](https://doc.rust-lang.org/std/sync/struct.Mutex.html#poisoning).

## Varianti

### Accesso esclusivo senza acquisire il lock

```rust
use std::sync::{Mutex, RwLock};

fn main() {
    let mut text = Mutex::new(String::from("rust"));
    text.get_mut().unwrap().push('!');
    assert_eq!(text.into_inner().unwrap(), "rust!");

    let mut values = RwLock::new(vec![1, 2]);
    values.get_mut().unwrap().push(3);
    assert_eq!(values.into_inner().unwrap(), [1, 2, 3]);
}
```

`&mut Mutex<T>` e `&mut RwLock<T>` sono gia esclusivi. Non puoi ottenere quell'accesso da un semplice `&Arc<_>`; la proprieta condivisa e il prestito esclusivo restano concetti distinti.

### Dal controllo in lettura alla modifica

```rust
use std::sync::RwLock;

fn initialize_if_absent(slot: &RwLock<Option<String>>, candidate: String) -> String {
    {
        let current = slot.read().unwrap();
        if let Some(value) = &*current {
            return value.clone();
        }
    }

    let mut current = slot.write().unwrap();
    current.get_or_insert(candidate).clone()
}

fn main() {
    let slot = RwLock::new(None);
    assert_eq!(initialize_if_absent(&slot, String::from("first")), "first");
    assert_eq!(initialize_if_absent(&slot, String::from("second")), "first");
}
```

La guardia di lettura viene rilasciata prima della scrittura. **Fra i due accessi lo stato puo cambiare**: `get_or_insert` ricontrolla sotto write lock e conserva il valore eventualmente inserito da un altro thread. Un'assegnazione incondizionata lo sovrascriverebbe.

Questo non e un upgrade atomico e non garantisce che il candidato venga costruito una sola volta. Per inizializzazione singola valuta `OnceLock`; per altri protocolli occorre ricontrollare le loro condizioni sotto lock.

### Bound e codice asincrono

| Tipo | `Send` quando | `Sync` quando |
| --- | --- | --- |
| `Mutex<T>` | `T: Send` | `T: Send` |
| `RwLock<T>` | `T: Send` | `T: Send + Sync` |

Il mutex serializza gli accessi anche a tipi non `Sync`, per esempio `Cell<u32>`. Un `RwLock<Cell<u32>>` puo esistere, ma non e `Sync`: i lettori potrebbero accedere contemporaneamente alla cella. Nemmeno un mutex rende `Rc<T>` trasferibile tra thread.

Le guardie standard `MutexGuard`, `RwLockReadGuard` e `RwLockWriteGuard` sono `!Send`. Sposta/clona il contenitore adatto e acquisisci la guardia nel thread che la usera; non spostare la guardia stessa.

In codice async, un lock standard puo essere adatto per sezioni sincrone brevi, con contesa limitata e **nessuna guardia attraverso un punto di sospensione**. La sua attesa blocca comunque il thread del runtime. Un task non `Send` non elimina il rischio di deadlock.

`tokio::sync::Mutex` attende in modo asincrono e permette una guardia attraverso `.await`, ma non elimina deadlock, contesa o invarianti rotte. Non applica il poisoning standard. Quando possibile, isola l'accesso in metodi sincroni brevi o assegna la risorsa a un task proprietario con messaggi. [Confronto ufficiale Tokio, documentazione consultata 1.54.1](https://docs.rs/tokio/latest/tokio/sync/struct.Mutex.html).

## Errori comuni

### Restituire un riferimento dopo aver rilasciato la guardia

Questo programma **non compila**:

```rust
use std::sync::Mutex;

fn text(value: &Mutex<String>) -> &str {
    &value.lock().unwrap()
}

fn main() {}
```

Il riferimento dipenderebbe da una guardia temporanea gia distrutta. Restituisci una copia posseduta oppure una guardia con un contratto esplicito; esporre una guardia significa lasciare al chiamante il controllo della durata del lock.

### Modificare attraverso una read guard

Questo programma **non compila**:

```rust
use std::sync::RwLock;

fn main() {
    let text = RwLock::new(String::from("rust"));
    let mut reader = text.read().unwrap();
    reader.push('!');
}
```

`mut reader` non aggiunge `DerefMut` a una read guard. Serve una write guard. Non tentare di acquisirla conservando quella di lettura.

### Confondere sicurezza della memoria e assenza di deadlock

- Acquisire di nuovo lo stesso `Mutex` dal thread che lo possiede non e un uso supportato: la seconda `lock` non ritorna normalmente; puo bloccare o fare panic.
- Leggere e poi chiamare `write` sullo stesso `RwLock` senza rilasciare la read guard crea un'attesa incompatibile. Non e una conversione.
- Due lock acquisiti in ordine opposto possono creare un ciclo. Definisci un ordine globale o racchiudi l'invariante in un unico stato protetto.
- Un callback, un distruttore o un `join` eseguito sotto lock puo rientrare nello stesso protocollo. Scope breve non significa automaticamente scope sicuro.
- Una condizione verificata sotto una prima guardia puo non essere piu vera sotto la seconda: mantieni il lock per l'intera operazione logica o ricontrolla.
- `is_poisoned() == false` e soltanto un'osservazione: un altro thread potrebbe avvelenare il lock successivamente. Gestisci il risultato dell'acquisizione.
- Le API nightly per accesso diretto al valore o proiezione delle guardie non vanno scambiate per API stable: nella baseline `get_cloned` e `MutexGuard::map` richiedono ancora feature sperimentali.

## Checklist

- Sto condividendo ownership oppure sincronizzando accesso?
- Ho scelto un lock per l'intera invariante, non soltanto per ogni campo?
- La guardia viene rilasciata prima di I/O, callback, join e sospensioni?
- Distinguo `WouldBlock` da poisoning?
- So come rifiutare, verificare o riparare lo stato dopo un panic?
- Il passaggio da lettura a scrittura ricontrolla le condizioni?
- Esiste un ordine coerente per acquisire piu lock?
- Ho atteso i worker e verificato gli errori?
- Ho misurato prima di preferire RwLock ad un mutex?

## Collegamenti

- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc<T> e Arc<T>]]
- [[Programmazione/Rust/Pagine/RefCell T|RefCell<T>]]
- [[Programmazione/Rust/Pagine/Cell T|Cell<T>]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Mutex RwLock e Atomics|Mutex, RwLock e atomici]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
- [[Programmazione/Rust/Pagine/Threads|Threads]]
- [[Programmazione/Rust/Pagine/OnceLock e LazyLock|OnceLock e LazyLock]]
- [[Programmazione/Rust/Pagine/Message passing|Message passing]]
- [[Programmazione/Rust/Pagine/Async Await|Async/Await]]

## Fonti

- [Standard library: Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html).
- [Standard library: RwLock](https://doc.rust-lang.org/std/sync/struct.RwLock.html).
- [Standard library: MutexGuard](https://doc.rust-lang.org/std/sync/struct.MutexGuard.html).
- [Standard library: RwLockReadGuard](https://doc.rust-lang.org/std/sync/struct.RwLockReadGuard.html).
- [Standard library: RwLockWriteGuard](https://doc.rust-lang.org/std/sync/struct.RwLockWriteGuard.html).
- [Standard library: PoisonError](https://doc.rust-lang.org/std/sync/struct.PoisonError.html).
- [Standard library: TryLockError](https://doc.rust-lang.org/std/sync/enum.TryLockError.html).
- [Standard library: JoinHandle](https://doc.rust-lang.org/std/thread/struct.JoinHandle.html).
- [Standard library: thread::scope](https://doc.rust-lang.org/std/thread/fn.scope.html).
- [Tokio: Mutex e scelta del lock, documentazione consultata 1.54.1](https://docs.rs/tokio/latest/tokio/sync/struct.Mutex.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

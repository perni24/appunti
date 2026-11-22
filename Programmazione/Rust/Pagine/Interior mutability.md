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
  - Interior mutability
  - Mutabilita interna
prerequisites:
  - "[[Programmazione/Rust/Pagine/Mutabilita]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
related:
  - "[[Programmazione/Rust/Pagine/Cell T]]"
  - "[[Programmazione/Rust/Pagine/RefCell T]]"
  - "[[Programmazione/Rust/Pagine/Mutex T e RwLock T]]"
title: Interior mutability
---

# Interior mutability

## Sintesi

L'interior mutability permette di cambiare **una parte dello stato interno attraverso un riferimento condiviso**. Per esempio `&Cell<u64>` puo aggiornare il numero contenuto: non significa che un generico `&u64` diventi scrivibile. Il contratto e quello del contenitore, non un'esenzione generale dalle regole di Rust. [Rust Reference](https://doc.rust-lang.org/reference/interior-mutability.html).

Non tutti questi tipi spostano il borrow checking a runtime: `Cell` evita di esporre prestiti del contenuto attraverso `&self`; `RefCell` controlla prestiti dinamici; i lock sincronizzano gli accessi; le celle once limitano la sostituzione dopo l'inizializzazione. Ownership e lifetime restano controllati staticamente.

Questa nota e una mappa del modello e delle scelte. Per API, panic e casi limite specifici consulta le note collegate.

Esempi verificati con **Rust 1.99.1, edition 2024**: sei programmi eseguibili e due controesempi di compilazione esplicitamente segnalati. La baseline non indica una MSRV.

## Quando usarlo

- Un metodo deve accettare `&self` ma registrare chiamate, aggiornare una metrica o inizializzare una cache.
- Un grafo o modello condiviso nello stesso thread richiede modifiche accessibili da piu proprietari.
- Il protocollo di accesso dipende da decisioni runtime difficili da esprimere con prestiti esclusivi statici.
- Piu thread devono aggiornare lo stesso stato attraverso una primitiva sincronizzata.

Prima valuta `&mut self`, una diversa separazione dei campi, il trasferimento di ownership o il passaggio di messaggi. Un errore del compilatore non dimostra da solo che serva `RefCell`.

## Come funziona

### Condiviso non significa privo di effetti

Un metodo con `&self` non promette purezza: puo modificare celle interne, scrivere su un file o inviare messaggi. Documenta gli effetti osservabili.

Il binding non deve necessariamente essere `mut` per chiamare `Cell::set`: il metodo richiede `&self`. Al contrario, `get_mut(&mut self)` richiede accesso esclusivo al contenitore e puo affidarsi al controllo statico.

### Il ruolo di UnsafeCell

`UnsafeCell<T>` e la primitiva su cui si costruisce la mutabilita interna: rende possibile modificare il contenuto attraverso accessi condivisi alla cella. Da sola **non fornisce** borrow checking, esclusione reciproca o operazioni atomiche.

Non elimina l'esclusivita di `&mut T`, non prolunga i lifetime e non rende lecite le data race. Anche ottenere un raw pointer con `get` non autorizza qualunque uso del puntatore. Chi implementa un'astrazione deve mantenere i contratti di tutti i riferimenti esposti. Per l'uso ordinario preferisci i contenitori safe della standard library; un cast da `&T` a `&mut T` non e una scorciatoia valida. [Contratto di UnsafeCell](https://doc.rust-lang.org/std/cell/struct.UnsafeCell.html).

### Ownership, accesso e sincronizzazione sono decisioni diverse

- `Rc` / `Arc` rispondono a **chi possiede** un valore condiviso.
- `Cell`, `RefCell`, lock e atomici definiscono **come si accede** allo stato modificabile.
- Lifetime e `Send` / `Sync` limitano **dove e per quanto tempo** quegli accessi sono validi.

`Rc<RefCell<T>>` combina proprietari multipli e prestiti dinamici nello stesso thread. `Arc<Mutex<T>>` combina proprietari multipli e accesso esclusivo sincronizzato, se i bound sono soddisfatti. Non ogni mutex richiede un Arc: con thread scoped possono bastare riferimenti al contenitore locale. [Arc e thread safety](https://doc.rust-lang.org/std/sync/struct.Arc.html#thread-safety).

## API / Sintassi

### Scegliere il protocollo di accesso

| Esigenza | Strumento | Limite da ricordare |
| --- | --- | --- |
| Modifica esclusiva gia esprimibile | `&mut T` | Non richiede interior mutability. |
| Copia o sostituzione di un valore | `Cell<T>` | `get` richiede Copy, non il tipo Cell in generale. |
| Prestiti dinamici nello stesso thread | `RefCell<T>` | Guardia; conflitto come panic oppure Result. |
| Un accesso esclusivo sincronizzato | `Mutex<T>` | Guardia e possibile attesa; poisoning da gestire. |
| Lettori simultanei o uno scrittore | `RwLock<T>` | Non garantisce prestazioni migliori di Mutex. |
| Inizializzazione differita | `OnceCell` / `LazyCell` | Nessuna condivisione per riferimento fra thread. |
| Inizializzazione differita sincronizzata | `OnceLock` / `LazyLock` | Non abilita modifiche arbitrarie successive via &self. |
| Operazioni atomiche su valori supportati | Tipi `Atomic*` | Ordering e protocollo complessivo restano da progettare. |

Gli atomici non rendono atomica una sequenza composta di lettura e scrittura: `load` seguito da `store` non equivale a una singola operazione read-modify-write. `Relaxed` non pubblica automaticamente altri dati; disponibilita e dimensioni dei tipi dipendono dal target. [Modulo atomic](https://doc.rust-lang.org/std/sync/atomic/index.html).

### Cell e RefCell non applicano lo stesso controllo

```rust
use std::cell::{Cell, RefCell};

fn main() {
    let flag = Cell::new(false);
    let first = &flag;
    let second = &flag;
    first.set(true);
    assert!(second.get());

    let values = RefCell::new(vec![1]);
    let read = values.borrow();
    assert!(values.try_borrow_mut().is_err());
    drop(read);
    values.try_borrow_mut().unwrap().push(2);
    assert_eq!(*values.borrow(), vec![1, 2]);

    let mut exclusive = RefCell::new(vec![3]);
    exclusive.get_mut().push(4);
    assert_eq!(exclusive.into_inner(), vec![3, 4]);
}
```

`Cell` qui copia un bool senza una guardia di prestito. `RefCell` restituisce guardie: `try_borrow_mut` segnala subito il conflitto, senza attendere. Con `borrow_mut` lo stesso conflitto causerebbe panic.

`drop(read)` rilascia la guardia dinamica. Il solo ultimo utilizzo di una variabile non anticipa necessariamente il suo distruttore. Il caso `get_mut` mostra che il controllo statico non e scomparso. [Modulo cell](https://doc.rust-lang.org/std/cell/index.html), [API RefCell](https://doc.rust-lang.org/std/cell/struct.RefCell.html).

## Esempio pratico

### Metrica locale con overflow esplicito

```rust
use std::cell::Cell;

#[derive(Default)]
struct RequestStats {
    seen: Cell<u64>,
}

impl RequestStats {
    fn record(&self) -> Result<(), &'static str> {
        let next = self.seen.get().checked_add(1).ok_or("counter overflow")?;
        self.seen.set(next);
        Ok(())
    }

    fn seen(&self) -> u64 {
        self.seen.get()
    }
}

fn main() {
    let stats = RequestStats::default();
    assert_eq!(stats.record(), Ok(()));
    assert_eq!(stats.record(), Ok(()));
    assert_eq!(stats.seen(), 2);

    let full = RequestStats { seen: Cell::new(u64::MAX) };
    assert_eq!(full.record(), Err("counter overflow"));
    assert_eq!(full.seen(), u64::MAX);
}
```

La metrica modifica stato osservabile attraverso `&self`: non e logicamente immutabile. Il calcolo precede l'aggiornamento, quindi l'errore di overflow lascia il contatore invariato. Questo esempio non e un contatore condivisibile per riferimento fra thread.

### Cache derivata con invalidazione esclusiva

```rust
use std::cell::OnceCell;

struct Document {
    text: String,
    word_count: OnceCell<usize>,
}

impl Document {
    fn new(text: String) -> Self {
        Self { text, word_count: OnceCell::new() }
    }

    fn word_count(&self) -> usize {
        *self.word_count.get_or_init(|| self.text.split_whitespace().count())
    }

    fn replace_text(&mut self, text: String) {
        self.word_count.take();
        self.text = text;
    }
}

fn main() {
    let mut document = Document::new(String::from("hello Rust"));
    assert!(document.word_count.get().is_none());
    assert_eq!(document.word_count(), 2);
    assert_eq!(document.word_count.get(), Some(&2));
    assert_eq!(document.word_count(), 2);

    document.replace_text(String::from("one"));
    assert!(document.word_count.get().is_none());
    assert_eq!(document.word_count(), 1);
}
```

Qui cambia lo stato fisico della cache, ma il conteggio per lo stesso testo resta uguale. `OnceCell` basta per un dato derivato che non deve essere riscritto attraverso `&self`; non serve una guardia `Ref`. `take` richiede `&mut self` e permette l'invalidazione esclusiva. [OnceCell](https://doc.rust-lang.org/std/cell/struct.OnceCell.html).

I campi devono restare privati: ogni modifica del testo deve invalidare la cache. Il calcolo conta segmenti separati da whitespace, non parole linguistiche; il demo non misura un guadagno di prestazioni.

## Varianti

### Piu proprietari nello stesso thread

```rust
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    let original = Rc::new(RefCell::new(vec![String::from("first")]));
    let shared = Rc::clone(&original);
    shared.borrow_mut().push(String::from("second"));

    assert!(Rc::ptr_eq(&original, &shared));
    assert_eq!(original.borrow().len(), 2);
}
```

Si clona il proprietario Rc, non il Vec. Prestiti incompatibili restano possibili a runtime; eventuali cicli di riferimenti forti non vengono risolti da RefCell. Per i dettagli vedi [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc<T> e Arc<T>]].

### Trasferire non equivale a condividere

```rust
use std::cell::RefCell;
use std::thread;

fn main() {
    let values = RefCell::new(vec![1]);
    let worker = thread::spawn(move || {
        values.borrow_mut().push(2);
        values.into_inner()
    });
    assert_eq!(worker.join().unwrap(), vec![1, 2]);
}
```

`RefCell<T>` e `Send` quando `T: Send`: qui viene spostato nel worker, e il chiamante non conserva accesso alla cella. Rimane `!Sync`: condividere `&RefCell<T>` fra thread non e consentito. Anche `Cell<T>` distingue questi due casi. Non e corretto vietare genericamente ogni uso di RefCell in un programma multithread. [Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html), [Send per RefCell](https://doc.rust-lang.org/std/cell/struct.RefCell.html#impl-Send-for-RefCell%3CT%3E).

### Una protezione esterna puo cambiare il contratto

```rust
use std::cell::RefCell;
use std::sync::Mutex;
use std::thread;

fn main() {
    let state = Mutex::new(RefCell::new(Vec::new()));
    thread::scope(|scope| {
        let first = scope.spawn(|| {
            let guard = state.lock().unwrap();
            guard.borrow_mut().push(1);
        });
        let second = scope.spawn(|| {
            let guard = state.lock().unwrap();
            guard.borrow_mut().push(2);
        });
        first.join().unwrap();
        second.join().unwrap();
    });

    let mut values = state.into_inner().unwrap().into_inner();
    values.sort_unstable();
    assert_eq!(values, vec![1, 2]);
}
```

`Mutex<RefCell<T>>` puo essere Sync se `T: Send`, perche il mutex impedisce accessi contemporanei alla cella interna. Non rende RefCell stesso Sync. Qui e deliberatamente ridondante: **per questo Vec basta Mutex<Vec<_>>**. L'annidamento puo servire per integrare un tipo esistente, ma introduce due protocolli da capire.

L'ordine degli inserimenti non e deterministico: l'ordinamento serve solo all'asserzione. `join` attende i worker; `unwrap` sceglie di propagare panic o poisoning nel demo, non implementa una strategia di recupero. [Bound e poisoning di Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html).

## Errori comuni

### Far uscire il riferimento dalla sua guardia

Questo programma **non compila**:

```rust
use std::cell::RefCell;

fn first(values: &RefCell<Vec<i32>>) -> &i32 {
    &values.borrow()[0]
}

fn main() {}
```

Il riferimento dipenderebbe da una guardia temporanea distrutta al ritorno. Restituisci un valore posseduto, una guardia opportunamente proiettata oppure usa una callback con contratto chiaro. Il borrow checker resta attivo. Il codice inoltre presuppone un Vec non vuoto: correggere il lifetime non risolve quel requisito.

### Scambiare Arc per sincronizzazione del contenuto

Questo programma **non compila**:

```rust
use std::cell::RefCell;
use std::sync::Arc;
use std::thread;

fn main() {
    let values = Arc::new(RefCell::new(vec![1]));
    let shared = Arc::clone(&values);
    thread::spawn(move || {
        shared.borrow_mut().push(2);
    }).join().unwrap();
}
```

Il reference counting atomico di Arc non protegge il contatore dei prestiti di RefCell. Se serve condivisione modificabile fra thread, scegli un contenitore sincronizzato adatto al dato; se basta un proprietario, trasferiscilo.

### Confondere memory safety e correttezza applicativa

- Una sequenza di modifiche non diventa una transazione: un errore o panic puo lasciare effetti parziali. Prepara e valida il nuovo stato prima di pubblicarlo quando serve questa garanzia.
- Non tenere guardie durante callback non controllati: una rientranza puo provocare un conflitto RefCell o un blocco sul lock. Gli stessi problemi possono emergere attraverso `.await`.
- Un lock non impedisce deadlock tra piu risorse. Definisci un ordine di acquisizione e limita le sezioni critiche.
- Il poisoning e un segnale da valutare, non rollback o prova che ogni invariante sia integra. Le celle RefCell non hanno quel protocollo.
- Non cambiare liberamente chiavi di mappe o insiemi tramite interior mutability: se cambiano le proprieta usate da Hash, Eq o Ord, il contenitore puo non comportarsi piu come previsto. [HashMap](https://doc.rust-lang.org/std/collections/struct.HashMap.html), [BTreeMap](https://doc.rust-lang.org/std/collections/struct.BTreeMap.html).
- Una cache puo essere memory-safe e restituire risultati vecchi: la politica di invalidazione fa parte del suo contratto.

## Checklist

- Basta un prestito esclusivo oppure serve davvero un metodo con &self?
- Chi possiede il dato e chi deve poterlo osservare mentre cambia?
- Mi serve sostituire un valore, prestarlo o inizializzarlo una volta?
- Sto trasferendo ownership fra thread oppure condividendo riferimenti?
- Ho verificato i bound del tipo completo, non solo del wrapper esterno?
- Qual e il comportamento su conflitto, overflow, panic o poisoning?
- Guardie, callback e sospensioni possono provocare rientranza o deadlock?
- Le invarianti applicative e l'invalidazione della cache sono esplicite?

## Collegamenti

- [[Programmazione/Rust/Pagine/Mutabilita|Mutabilita]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/Cell T|Cell<T>]]
- [[Programmazione/Rust/Pagine/RefCell T|RefCell<T>]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex<T> e RwLock<T>]]
- [[Programmazione/Rust/Pagine/OnceLock e LazyLock|OnceLock e LazyLock]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc<T> e Arc<T>]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Invariants|Invariants]]

## Fonti

- [Rust Reference: interior mutability](https://doc.rust-lang.org/reference/interior-mutability.html).
- [Standard library: UnsafeCell](https://doc.rust-lang.org/std/cell/struct.UnsafeCell.html).
- [Standard library: modulo cell](https://doc.rust-lang.org/std/cell/index.html).
- [Standard library: RefCell](https://doc.rust-lang.org/std/cell/struct.RefCell.html).
- [Standard library: OnceCell](https://doc.rust-lang.org/std/cell/struct.OnceCell.html).
- [Standard library: Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html).
- [Standard library: Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html).
- [Standard library: Arc](https://doc.rust-lang.org/std/sync/struct.Arc.html).
- [Standard library: atomici](https://doc.rust-lang.org/std/sync/atomic/index.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

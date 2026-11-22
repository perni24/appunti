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
  - Rc<T>
  - Arc<T>
  - Reference counting Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Box T]]"
  - "[[Programmazione/Rust/Pagine/Threads]]"
related:
  - "[[Programmazione/Rust/Pagine/RefCell T]]"
  - "[[Programmazione/Rust/Pagine/Mutex T e RwLock T]]"
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
title: Rc<T> e Arc<T>
---

# Rc<T> e Arc<T>

## Sintesi

`Rc<T>` e `Arc<T>` permettono a piu proprietari di condividere un valore tramite **reference counting**. Clonare l'handle incrementa il contatore: non richiede `T: Clone` e non duplica il contenuto.

`Rc` usa contatori non atomici e non si trasferisce ne si condivide tra thread. `Arc` usa contatori atomici, ma **non rende automaticamente thread-safe il contenuto**. Con l'allocatore standard, `Arc<T>` e `Send` e `Sync` quando `T` soddisfa entrambi i bound.

L'accesso ordinario e condiviso. Per modificare il dato puoi scegliere accesso esclusivo con `get_mut`, clone-on-write con `make_mut` oppure interior mutability: sono contratti diversi.

Programmi verificati con **Rust 1.99.1, edition 2024**. Dieci esempi sono compilabili e i tre in `Errori comuni` sono intenzionalmente rifiutati. La versione e una baseline, non una MSRV.

## Quando usarlo

- `Rc<T>` per ownership condivisa nello stesso thread: nodi, modelli UI, dati letti da piu componenti.
- `Arc<T>` quando proprietari in thread diversi devono mantenere vivo lo stesso dato.
- `Weak<T>` per collegamenti che non devono mantenere vivo il destinatario.
- `Rc<RefCell<T>>` per modifiche condivise single-thread controllate a runtime.
- `Arc<Mutex<T>>` o `Arc<RwLock<T>>` per accesso condiviso sincronizzato.

Prima valuta ownership semplice, `Box<T>` o borrowing. Una funzione che legge un dato puo ricevere `&T`: non deve necessariamente conoscere o clonare il suo smart pointer.

## Come funziona

### Clonare gli handle e osservare il rilascio

```rust
use std::cell::Cell;
use std::rc::Rc;

struct Node<'a> {
    name: String,
    drops: &'a Cell<usize>,
}

impl Drop for Node<'_> {
    fn drop(&mut self) {
        self.drops.set(self.drops.get() + 1);
    }
}

fn main() {
    let drops = Cell::new(0);
    let root = Rc::new(Node {
        name: String::from("root"),
        drops: &drops,
    });
    let left_owner = Rc::clone(&root);
    let right_owner = Rc::clone(&root);

    assert!(Rc::ptr_eq(&root, &left_owner));
    assert!(Rc::ptr_eq(&root, &right_owner));
    assert_eq!(Rc::strong_count(&root), 3);

    drop(root);
    assert_eq!(left_owner.name, "root");
    assert_eq!(drops.get(), 0);

    drop(left_owner);
    assert_eq!(Rc::strong_count(&right_owner), 1);
    drop(right_owner);
    assert_eq!(drops.get(), 1);
}
```

`Node` non implementa `Clone`: vengono clonati gli handle, non il nodo. La stessa distinzione vale per `Arc::clone`. Il move di un handle ne trasferisce la proprieta senza aggiungere un proprietario; un semplice prestito `&Rc<T>` non incrementa il contatore.

Con la distruzione ordinaria degli handle, `T` viene distrutto quando sparisce l'ultimo riferimento forte. Estrarre `T` con `try_unwrap` e un caso diverso: il valore continua a vivere sotto il nuovo proprietario.

`ptr_eq` confronta l'identita dell'allocazione, non l'uguaglianza del contenuto. Due allocazioni distinte possono contenere valori uguali.

### Weak non e un proprietario forte

```rust
use std::rc::{Rc, Weak};

fn main() {
    let value = Rc::new(String::from("cached"));
    let weak = Rc::downgrade(&value);

    assert_eq!(Rc::strong_count(&value), 1);
    assert_eq!(Rc::weak_count(&value), 1);

    let temporary_owner = weak.upgrade().unwrap();
    assert!(Rc::ptr_eq(&value, &temporary_owner));
    assert_eq!(Rc::strong_count(&value), 2);

    drop(value);
    assert_eq!(&*temporary_owner, "cached");

    drop(temporary_owner);
    assert!(weak.upgrade().is_none());

    let empty: Weak<String> = Weak::new();
    assert!(empty.upgrade().is_none());
}
```

`downgrade` non consuma l'handle forte. `upgrade` restituisce `Option<Rc<T>>` e, quando riesce, crea un proprietario forte da conservare per tutto l'uso del dato. Non dereferenziare un `Weak` come se fosse `&T`.

`std::rc::Weak` e `std::sync::Weak` sono tipi distinti: il secondo si usa con `Arc`. Il debole non mantiene vivo `T`, ma mantiene l'allocazione gestita finche esiste; le risorse possedute da `T` possono essere gia state rilasciate. `Weak::new`, invece, rappresenta un debole vuoto senza allocazione.

Con `Arc`, i contatori possono cambiare mentre un altro thread clona, distrugge o promuove un handle. `strong_count` e `weak_count` servono per osservazione e diagnostica: non usarli come lock o come prova manuale di unicita. Usa le API che verificano il contratto.

## API / Sintassi

| Operazione | Contratto da ricordare |
| --- | --- |
| `Rc::clone(&p)` / `Arc::clone(&p)` | Un altro proprietario della stessa allocazione. |
| `downgrade` / `Weak::upgrade` | Collegamento debole e promozione fallibile a forte. |
| `get_mut(&mut p)` | `Some(&mut T)` solo senza altri forti o deboli. Non clona. |
| `make_mut(&mut p)` | Accesso esclusivo, clonando il dato quando serve. |
| `try_unwrap(p)` | Estrae `T` con un solo forte; altrimenti restituisce l'handle in `Err`. |
| `into_inner(p)` | Estrae `T` oppure consuma l'handle restituendo `None`. |
| `ptr_eq` | Identita dell'allocazione, non confronto del valore. |

Le funzioni associate evitano collisioni con i metodi di `T`. Per leggere questi ultimi entra in gioco `Deref`, non un'ereditarieta dei trait.

### get_mut senza interior mutability

```rust
use std::sync::Arc;

fn main() {
    let mut text = Arc::new(String::from("rust"));
    Arc::get_mut(&mut text).unwrap().push('!');

    let other = Arc::clone(&text);
    assert!(Arc::get_mut(&mut text).is_none());
    drop(other);

    let weak = Arc::downgrade(&text);
    assert!(Arc::get_mut(&mut text).is_none());
    drop(weak);

    Arc::get_mut(&mut text).unwrap().push('?');
    assert_eq!(&*text, "rust!?");
}
```

La stessa regola vale per `Rc::get_mut`. Serve `&mut` all'handle e non devono esistere altri handle forti **ne deboli** verso l'allocazione. `T: Clone` non e richiesto.

Scrivere `let mut text` da solo non rende disponibile `DerefMut`: consente di modificare l'handle, non di ottenere arbitrariamente accesso esclusivo al contenuto condiviso.

### make_mut e separazione alla prima modifica

```rust
use std::rc::Rc;

fn main() {
    let mut draft = Rc::new(String::from("base"));
    let snapshot = Rc::clone(&draft);

    Rc::make_mut(&mut draft).push_str("-edit");
    assert_eq!(&*snapshot, "base");
    assert_eq!(&*draft, "base-edit");
    assert!(!Rc::ptr_eq(&draft, &snapshot));

    let weak = Rc::downgrade(&draft);
    assert!(Rc::get_mut(&mut draft).is_none());

    Rc::make_mut(&mut draft).push('!');
    assert_eq!(&*draft, "base-edit!");
    assert!(weak.upgrade().is_none());
    assert_eq!(&*snapshot, "base");
}
```

Con altri forti, `make_mut` separa l'handle clonando il contenuto. Con un solo forte ma dei deboli, li dissocia senza clonare `T`: i vecchi deboli non seguono il valore nella nuova situazione. Senza altri handle non serve clonare.

Il demo usa `String`, che supporta `Clone`. `Arc::make_mut` offre lo stesso modello. Non e aggiornamento condiviso: gli altri proprietari continuano a vedere il loro valore precedente. Inoltre `T::clone` non implica sempre copia profonda; eventuali campi `Rc`/`Arc` possono restare condivisi.

## Esempio pratico

### Mutazione condivisa nello stesso thread

```rust
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    let entries = Rc::new(RefCell::new(vec![String::from("first")]));
    let editor = Rc::clone(&entries);

    {
        let mut items = editor.borrow_mut();
        items.push(String::from("second"));
    }

    let view = entries.borrow();
    assert_eq!(view.len(), 2);
    assert!(editor.try_borrow_mut().is_err());
    drop(view);

    editor.borrow_mut().push(String::from("third"));
    assert_eq!(entries.borrow().len(), 3);
}
```

`Rc` mantiene vivo il contenitore; `RefCell` gestisce i prestiti a runtime. Le modifiche sono visibili dagli altri handle. `borrow_mut` puo fare panic in caso di conflitto; `try_borrow_mut` permette di gestirlo come errore. Le guardie devono essere rilasciate, non soltanto smettere di essere lette.

Per dati adatti a letture/sostituzioni per valore puo bastare `Rc<Cell<T>>`. Le differenze sono approfondite nelle note dedicate.

### Condivisione in lettura tra thread con join

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![10_i32, 20, 30]);
    let worker_data = Arc::clone(&data);

    let worker = thread::spawn(move || {
        worker_data.iter().sum::<i32>()
    });

    assert_eq!(worker.join().unwrap(), 60);
    assert_eq!(data.len(), 3);
    assert_eq!(Arc::strong_count(&data), 1);
}
```

Il clone viene spostato nella closure, mentre il chiamante conserva il proprio handle. `join` aspetta il risultato e permette di rilevare un panic del worker. Qui il conteggio finale e verificabile perche il worker e terminato e non ha lasciato altri proprietari.

Abbandonare il `JoinHandle` non aspetta il thread. `unwrap` e una semplificazione del demo, non una politica di gestione degli errori.

`Arc` non rende `'static` un riferimento interno: `Arc<&str>` puo ancora dipendere da una `String` locale. Il bound di `thread::spawn` riguarda i prestiti contenuti nella closure e nel risultato, non impone di conservare ogni oggetto per l'intera durata del programma.

### Stato mutabile condiviso con Arc e Mutex

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0_u64));
    let mut workers = Vec::new();

    for _ in 0..4 {
        let local = Arc::clone(&counter);
        workers.push(thread::spawn(move || {
            for _ in 0..250 {
                let mut value = local.lock().unwrap();
                *value += 1;
            }
        }));
    }

    for worker in workers {
        worker.join().unwrap();
    }

    assert_eq!(*counter.lock().unwrap(), 1_000);
    assert_eq!(Arc::strong_count(&counter), 1);
}
```

`Arc` gestisce ownership; `Mutex` rende esclusivo l'accesso durante ciascun incremento. Il lock termina con la guardia alla fine dell'iterazione, non con il rilascio dell'ultimo `Arc`.

Questo e un demo limitato a mille incrementi: non un benchmark o un servizio con gestione completa dei fallimenti. Un'applicazione deve decidere come trattare poisoning e panic, evitare lock mantenuti durante attese o callback e completare correttamente i worker anche sui percorsi di errore. Per un singolo contatore puo essere appropriato un atomico, con un contratto di ordering esplicito.

### Collegamento al padre senza ciclo forte

```rust
use std::cell::RefCell;
use std::rc::{Rc, Weak};

struct Node {
    name: String,
    parent: RefCell<Weak<Node>>,
    children: RefCell<Vec<Rc<Node>>>,
}

fn main() {
    let child = Rc::new(Node {
        name: String::from("child"),
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(Vec::new()),
    });

    {
        let parent = Rc::new(Node {
            name: String::from("parent"),
            parent: RefCell::new(Weak::new()),
            children: RefCell::new(vec![Rc::clone(&child)]),
        });
        *child.parent.borrow_mut() = Rc::downgrade(&parent);

        let upgraded = child.parent.borrow().upgrade().unwrap();
        assert!(Rc::ptr_eq(&upgraded, &parent));
        assert_eq!(parent.children.borrow().len(), 1);
    }

    assert!(child.parent.borrow().upgrade().is_none());
    assert_eq!(child.name, "child");
    assert_eq!(Rc::strong_count(&child), 1);
}
```

Il padre possiede i figli; il collegamento inverso non possiede il padre. Se entrambi i versi fossero forti, i contatori potrebbero restare positivi anche senza proprietari esterni. Anche `Arc` puo formare cicli: contatori atomici non sono un garbage collector.

Questo esempio costruisce una sola relazione. Non implementa un albero generale con validazione di reparenting, duplicati o cicli tra figli; `Weak` in un campo non impedisce altri cicli forti creati altrove. Se un `upgrade` riesce, l'handle ottenuto mantiene vivo il padre fino al proprio rilascio.

## Varianti

### Recuperare ownership del contenuto

```rust
use std::rc::Rc;
use std::sync::Arc;
use std::thread;

fn main() {
    let shared = Rc::new(String::from("payload"));
    let peer = Rc::clone(&shared);

    let recovered = Rc::try_unwrap(shared).unwrap_err();
    assert!(Rc::ptr_eq(&recovered, &peer));
    drop(peer);

    let weak = Rc::downgrade(&recovered);
    let owned = Rc::try_unwrap(recovered).unwrap();
    assert_eq!(owned, "payload");
    assert!(weak.upgrade().is_none());

    let first = Arc::new(String::from("result"));
    let second = Arc::clone(&first);
    let first_worker = thread::spawn(move || Arc::into_inner(first));
    let second_worker = thread::spawn(move || Arc::into_inner(second));

    let results = [
        first_worker.join().unwrap(),
        second_worker.join().unwrap(),
    ];
    let values: Vec<String> = results.into_iter().flatten().collect();
    assert_eq!(values, ["result"]);
}
```

`try_unwrap` non richiede `Clone` e permette di conservare l'handle se ci sono altri proprietari. I deboli non impediscono l'estrazione: il risultato e un `T` posseduto, non un nuovo forte promuovibile dai vecchi deboli. Questa regola e diversa da `get_mut`.

`into_inner` invece consuma comunque l'handle. Nel demo tutti i forti sono passati ad `Arc::into_inner`: esattamente una chiamata recupera il valore. Non assumere quale thread vinca.

`Arc::try_unwrap(p).ok()` non offre la stessa garanzia concorrente: due chiamanti potrebbero entrambi ricevere `Err` e scartarlo, distruggendo il valore senza recuperarlo. `Rc::into_inner` non presenta questa differenza concorrente. Per ottenere comunque un `T: Clone`, `unwrap_or_clone` estrae quando possibile oppure clona.

### Riferimento debole a se stessi con new_cyclic

```rust
use std::rc::{Rc, Weak};

struct Node {
    self_ref: Weak<Node>,
}

fn main() {
    let node = Rc::new_cyclic(|weak| {
        assert!(weak.upgrade().is_none());
        Node { self_ref: Weak::clone(weak) }
    });

    let owner = node.self_ref.upgrade().unwrap();
    assert!(Rc::ptr_eq(&node, &owner));
    drop(owner);

    let observer = Weak::clone(&node.self_ref);
    drop(node);
    assert!(observer.upgrade().is_none());
}
```

La closure riceve un debole prima che il valore sia pronto: il suo `upgrade` restituisce `None` durante la costruzione. Dopo il ritorno, il collegamento puo essere promosso normalmente. Esiste anche `Arc::new_cyclic`.

Non e pinning e non autorizza a costruire riferimenti Rust diretti a campi ancora non inizializzati. Per costruttori che hanno gia tutto il contenuto basta `new`.

### Costi, tipi unsized e piattaforme

`Rc<str>`, `Arc<[T]>` e smart pointer verso `dyn Trait` sono possibili. Le coercizioni e i bound del trait object restano distinti dalla condivisione; per un oggetto condiviso tra thread devi mantenere i requisiti necessari, per esempio `dyn Trait + Send + Sync`.

Allocazione, aggiornamento dei contatori e localita dei dati hanno costi. `Arc` aggiunge operazioni atomiche, soprattutto rilevanti con contesa; non dedurre un rapporto di prestazioni senza misurare il carico reale.

`Arc` richiede supporto per atomiche della dimensione di un puntatore, verificabile con `target_has_atomic = "ptr"`. Non trasferire automaticamente gli esempi desktop a ogni target embedded.

## Errori comuni

### Mutare direttamente attraverso un handle mutabile

Questo programma **non compila**, anche con un solo proprietario forte.

```rust
use std::rc::Rc;

fn main() {
    let mut value = Rc::new(String::from("rust"));
    value.push('!');
}
```

`Rc` non implementa `DerefMut`. Per questo esempio unico usa `Rc::get_mut(&mut value)`; per copie alla modifica o mutazione condivisa scegli esplicitamente `make_mut` oppure interior mutability.

### Spostare Rc in un thread

Questo programma **non compila**:

```rust
use std::rc::Rc;
use std::thread;

fn main() {
    let value = Rc::new(7);
    let worker = thread::spawn(move || *value);
    assert_eq!(worker.join().unwrap(), 7);
}
```

Nemmeno un `Rc` con un solo proprietario diventa `Send`. Per questo contenuto puoi usare `Arc` oppure spostare direttamente il valore se non serve condivisione.

### Pensare che Arc renda RefCell thread-safe

Questo programma **non compila**:

```rust
use std::cell::RefCell;
use std::sync::Arc;
use std::thread;

fn main() {
    let value = Arc::new(RefCell::new(0));
    let worker_value = Arc::clone(&value);
    let worker = thread::spawn(move || {
        *worker_value.borrow_mut() += 1;
    });
    worker.join().unwrap();
}
```

`RefCell` non e `Sync`: il contatore atomico di `Arc` non sincronizza il suo borrow state. Usa un meccanismo appropriato, come `Mutex`, oppure mantieni il dato in un singolo thread. Anche `Arc<Mutex<Rc<_>>>` resta inadatto al trasferimento: il lock non rende `Send` un contenuto che non lo e.

## Checklist

- Serve ownership condivisa o basta un prestito?
- Il clone riguarda l'handle o il contenuto?
- Voglio modificare lo stesso valore o separare una copia?
- get_mut puo fallire per altri forti o per Weak ancora esistenti?
- I collegamenti deboli sono promossi e conservati per tutta l'operazione?
- Il grafo puo ancora contenere cicli forti?
- I bound Send/Sync del contenuto sono soddisfatti?
- I thread vengono attesi e i loro errori gestiti?
- Sto trattando i contatori come osservazioni, non come sincronizzazione?
- I riferimenti interni rispettano ancora i loro lifetime?

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/Box T|Box<T>]]
- [[Programmazione/Rust/Pagine/Deref Trait|Deref Trait]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/RefCell T|RefCell<T>]]
- [[Programmazione/Rust/Pagine/Cell T|Cell<T>]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex<T> e RwLock<T>]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Threads|Threads]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]

## Fonti

- [Standard library: modulo rc](https://doc.rust-lang.org/std/rc/index.html).
- [Standard library: Rc](https://doc.rust-lang.org/std/rc/struct.Rc.html).
- [Standard library: Arc](https://doc.rust-lang.org/std/sync/struct.Arc.html).
- [Standard library: rc::Weak](https://doc.rust-lang.org/std/rc/struct.Weak.html).
- [Standard library: sync::Weak](https://doc.rust-lang.org/std/sync/struct.Weak.html).
- [The Rust Book: Rc e ownership condivisa](https://doc.rust-lang.org/book/ch15-04-rc.html).
- [The Rust Book: cicli e collegamenti deboli](https://doc.rust-lang.org/book/ch15-06-reference-cycles.html).
- [The Rust Book: stato condiviso tra thread](https://doc.rust-lang.org/book/ch16-03-shared-state.html).
- [Standard library: RefCell](https://doc.rust-lang.org/std/cell/struct.RefCell.html).
- [Standard library: Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html).
- [Standard library: thread::spawn](https://doc.rust-lang.org/std/thread/fn.spawn.html).
- [Standard library: JoinHandle::join](https://doc.rust-lang.org/std/thread/struct.JoinHandle.html#method.join).
- [Standard library: Send](https://doc.rust-lang.org/std/marker/trait.Send.html).
- [Standard library: Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

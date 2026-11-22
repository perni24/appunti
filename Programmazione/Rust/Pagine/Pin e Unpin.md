---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - smart-pointers-e-interior-mutability
aliases:
  - Pin
  - Unpin
  - Pinning Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Box T]]"
  - "[[Programmazione/Rust/Pagine/Move semantics]]"
  - "[[Programmazione/Rust/Pagine/Async Await]]"
related:
  - "[[Programmazione/Rust/Pagine/Future Trait]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
  - "[[Programmazione/Rust/Pagine/Memory layout e alignment]]"
title: Pin e Unpin
---

# Pin e Unpin

## Sintesi

`Pin<P>` avvolge un **puntatore**, non direttamente il dato. Per un contenuto non `Unpin`, il contratto impedisce di spostarlo fuori dalla sua posizione o invalidarlo senza rispettarne la distruzione. Non e una protezione hardware e non rende immutabile il valore. [Pin](https://doc.rust-lang.org/std/pin/struct.Pin.html).

`Unpin` indica che un tipo **non dipende dalle garanzie di pinning**. Non e un'operazione per "sbloccare" un oggetto. La distinzione essenziale e fra il valore puntato e il puntatore: spostare un `Pin<Box<T>>` puo essere lecito anche se `T` non e Unpin. [Unpin](https://doc.rust-lang.org/std/marker/trait.Unpin.html).

Esempi verificati con **Rust 1.99.1, edition 2024**: sei programmi eseguibili e due controesempi di compilazione segnalati. Nessuna dipendenza esterna; la baseline non certifica una MSRV.

## Quando usarlo

- Devi fornire `Pin<&mut F>` a `Future::poll`.
- Una struttura dipende dal proprio indirizzo, per esempio attraverso riferimenti interni o collegamenti intrusivi.
- Un'API richiede un valore mantenuto nella stessa posizione durante il suo utilizzo.
- Scrivi un wrapper di future o un'astrazione con un contratto di pinning esplicito.

Nel normale codice asincrono `.await` e il runtime gestiscono buona parte del lavoro. Non aggiungere Pin a ogni Box: ownership, allocazione e pinning risolvono problemi diversi.

## Come funziona

### Unpin permette l'accesso mutabile ordinario

```rust
use std::mem;
use std::pin::Pin;

fn main() {
    let mut text = String::from("before");
    let mut pinned = Pin::new(&mut text);
    let old = mem::replace(pinned.as_mut().get_mut(), String::from("after"));
    assert_eq!(old, "before");
    assert_eq!(pinned.as_ref().get_ref(), "after");

    let boxed = Box::pin(String::from("owned"));
    let ordinary: Box<String> = Pin::into_inner(boxed);
    let value: String = *ordinary;
    assert_eq!(value, "owned");
}
```

`String: Unpin`: queste API non devono impedirne il move. Il compilatore implementa normalmente Unpin per tipi i cui campi lo sono. Un tipo non Unpin, invece, puo ancora essere mosso **prima** di essere pinnato: il marker non vieta tutti i move del linguaggio.

### PhantomPinned non pinna il valore

```rust
use std::cell::Cell;
use std::marker::PhantomPinned;
use std::pin::Pin;

struct Entry {
    name: String,
    active: Cell<bool>,
    _pin: PhantomPinned,
}

impl Entry {
    fn new(name: &str) -> Self {
        Self {
            name: String::from(name),
            active: Cell::new(false),
            _pin: PhantomPinned,
        }
    }

    fn activate(self: Pin<&Self>) {
        self.get_ref().active.set(true);
    }
}

fn main() {
    let original = Entry::new("example");
    let moved = original;
    let boxed = Box::new(moved);
    let address: *const Entry = &*boxed;
    let pinned = Box::into_pin(boxed);
    let relocated_owner = pinned;

    assert_eq!(address, relocated_owner.as_ref().get_ref() as *const Entry);
    relocated_owner.as_ref().activate();
    assert!(relocated_owner.active.get());
    assert_eq!(relocated_owner.name, "example");
}
```

`PhantomPinned` impedisce l'implementazione automatica di Unpin per Entry. Non crea riferimenti a se stesso, non inizializza nulla e non rende illegali i primi move del demo. Un'implementazione manuale di Unpin sarebbe una scelta di contratto diversa: non va aggiunta per silenziare un errore se l'astrazione dipende da un indirizzo stabile. [PhantomPinned](https://doc.rust-lang.org/std/marker/struct.PhantomPinned.html).

`Box::into_pin` converte il box esistente senza spostare il dato nella sua allocazione. Dopo il pinning spostiamo solo il proprietario. Il confronto usa raw pointer senza dereferenziarli; Entry non e realmente autoreferenziale. `Cell` mostra che una mutazione interna puo essere compatibile con l'indirizzo stabile. [Box::into_pin](https://doc.rust-lang.org/std/boxed/struct.Box.html#method.into_pin).

### Il contratto non termina alla fine di un prestito

Per un valore che si affida al pinning, il vincolo dura fino alla sua distruzione, non soltanto durante una singola chiamata a `poll`. Eliminare una vista `Pin<&mut T>` non autorizza a muovere il dato originario.

La posizione deve restare valida fino all'esecuzione del distruttore prima di liberarla o riutilizzarla. Questo non promette che ogni valore venga distrutto: per esempio un leak puo conservarne la memoria. Il codice unsafe che gestisce manualmente lo storage deve rispettare anche questa parte del contratto. [Garanzia di Drop](https://doc.rust-lang.org/std/pin/index.html#subtle-details-and-the-drop-guarantee).

## API / Sintassi

### Operazioni principali

| Operazione | Risultato o requisito |
| --- | --- |
| `Pin::new(pointer)` | Costruzione safe quando il valore puntato e Unpin. |
| `Box::pin(value)` | `Pin<Box<T>>`, anche per T non Unpin. |
| `Box::into_pin(boxed)` | Converte un Box esistente senza riallocare. |
| `pin!(value)` | `Pin<&mut T>` legato allo storage locale. |
| `as_ref()` / `as_mut()` | Nuove viste pinnate, condivisa o esclusiva. |
| `get_ref()` | `&T` da `Pin<&T>`, senza richiedere Unpin. |
| `get_mut()` | `&mut T` da `Pin<&mut T>`, richiede T: Unpin. |
| `Pin::into_inner(pin)` | Recupera P, richiede che `P::Target` sia Unpin. |
| `set(value)` | Distrugge in posizione il vecchio dato, poi installa il nuovo. |

Non basta che sia Unpin il **puntatore**: i bound di new, get_mut e into_inner riguardano il contenuto indicato nella tabella. `as_mut` e utile quando un metodo consuma la vista `Pin<&mut T>` e vuoi richiamarlo senza perdere il proprietario. [API Pin](https://doc.rust-lang.org/std/pin/struct.Pin.html).

### Pinning locale senza una nuova allocazione Box

```rust
use std::future::Future;
use std::pin::pin;
use std::task::{Context, Poll, Waker};

fn main() {
    let future = async { 42 };
    let mut pinned = pin!(future);
    let mut context = Context::from_waker(Waker::noop());

    assert_eq!(pinned.as_mut().poll(&mut context), Poll::Ready(42));
}
```

`pin!` non crea un'allocazione heap aggiuntiva e restituisce una vista che non puo sopravvivere allo storage locale. Parlare di "stack pinning" e una semplificazione: in una funzione async quel locale puo appartenere allo stato di un future allocato altrove. La macro e stabile da Rust **1.68**. [pin!](https://doc.rust-lang.org/std/pin/macro.pin.html).

Qui il future completa al primo poll: `Waker::noop`, stabile da **1.85**, e sufficiente per questa prova. Non e un executor e non risveglierebbe una vera operazione I/O sospesa. [Waker::noop](https://doc.rust-lang.org/std/task/struct.Waker.html#method.noop).

## Esempio pratico

### Wrapper di future con puntatore pinnato interno

```rust
use std::future::Future;
use std::pin::Pin;
use std::sync::{Arc, atomic::{AtomicUsize, Ordering}};
use std::task::{Context, Poll, Wake, Waker};

struct Stored<F> {
    inner: Pin<Box<F>>,
}

impl<F> Stored<F> {
    fn new(future: F) -> Self {
        Self { inner: Box::pin(future) }
    }
}

impl<F: Future> Future for Stored<F> {
    type Output = F::Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        self.get_mut().inner.as_mut().poll(cx)
    }
}

struct YieldOnce {
    yielded: bool,
}

impl Future for YieldOnce {
    type Output = ();

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        let state = self.get_mut();
        if state.yielded {
            Poll::Ready(())
        } else {
            state.yielded = true;
            cx.waker().wake_by_ref();
            Poll::Pending
        }
    }
}

#[derive(Default)]
struct WakeCounter(AtomicUsize);

impl Wake for WakeCounter {
    fn wake(self: Arc<Self>) {
        self.0.fetch_add(1, Ordering::Relaxed);
    }
}

fn main() {
    let future = async {
        let text = String::from("Rust");
        let view = &text;
        YieldOnce { yielded: false }.await;
        view.len()
    };

    let mut stored = Stored::new(future);
    let wakes = Arc::new(WakeCounter::default());
    let waker = Waker::from(Arc::clone(&wakes));
    let mut context = Context::from_waker(&waker);

    assert_eq!(Pin::new(&mut stored).poll(&mut context), Poll::Pending);
    assert_eq!(wakes.0.load(Ordering::Relaxed), 1);

    let mut moved_owner = stored;
    assert_eq!(Pin::new(&mut moved_owner).poll(&mut context), Poll::Ready(4));
}
```

`Stored<F>` puo essere Unpin anche se F non lo e: contiene un puntatore proprietario pinnato, non F direttamente. `self.get_mut()` accede al wrapper; `inner.as_mut()` produce la vista pinnata di F senza estrarlo. Il move tra i due poll sposta il wrapper, non il future nell'allocazione.

Il future async conserva `view` attraverso una sospensione. Questo rende concreto il motivo per cui il polling deve rispettare il pinning, senza scrivere manualmente una struttura autoreferenziale unsafe.

`YieldOnce` e invece Unpin: aggiorna normalmente il proprio bool. La firma di poll e la stessa per entrambi i casi; non tutti i tipi Future sono non Unpin. Dopo `Ready` il chiamante non effettua altri poll. [Future::poll](https://doc.rust-lang.org/std/future/trait.Future.html).

Il contatore registra una richiesta di risveglio, ma **non pianifica task**: il secondo poll e eseguito esplicitamente dal test. Non ci sono loop di busy polling, timer o I/O; per l'applicazione reale serve un executor. Relaxed basta per questo conteggio, non e un protocollo di pubblicazione di altri dati. [Wake](https://doc.rust-lang.org/std/task/trait.Wake.html).

Questo wrapper paga l'indirezione del Box. Un wrapper che conservasse F direttamente avrebbe bisogno di una proiezione appropriata, non della sola sostituzione del campo.

## Varianti

### Sostituire non equivale a estrarre il vecchio valore

```rust
use std::cell::RefCell;
use std::marker::PhantomPinned;

struct Tracked<'a> {
    id: &'static str,
    log: &'a RefCell<Vec<&'static str>>,
    _pin: PhantomPinned,
}

impl Drop for Tracked<'_> {
    fn drop(&mut self) {
        self.log.borrow_mut().push(self.id);
    }
}

fn main() {
    let log = RefCell::new(Vec::new());
    let mut pinned = Box::pin(Tracked { id: "old", log: &log, _pin: PhantomPinned });
    let address = pinned.as_ref().get_ref() as *const Tracked<'_>;

    pinned.as_mut().set(Tracked { id: "new", log: &log, _pin: PhantomPinned });
    assert_eq!(*log.borrow(), vec!["old"]);
    assert_eq!(pinned.id, "new");
    assert_eq!(address, pinned.as_ref().get_ref() as *const Tracked<'_>);

    drop(pinned);
    assert_eq!(*log.borrow(), vec!["old", "new"]);
}
```

`Pin::set` non restituisce il vecchio Tracked: ne esegue Drop in posizione prima di sovrascriverlo. Questo e diverso da `mem::replace`, che estrarrebbe il vecchio valore. Non significa che un oggetto autoreferenziale gia attivo possa essere costruito altrove e trasportato senza vincoli nella destinazione. [Pin::set](https://doc.rust-lang.org/std/pin/struct.Pin.html#method.set).

Il log serve solo a osservare l'ordine: nessun prestito del RefCell e trattenuto durante Drop. In produzione un distruttore dovrebbe evitare operazioni fallibili non necessarie.

### Collezione di proprietari pinnati

```rust
use std::marker::PhantomPinned;

struct Item {
    value: String,
    _pin: PhantomPinned,
}

fn main() {
    let first = Box::pin(Item { value: String::from("stable"), _pin: PhantomPinned });
    let address = first.as_ref().get_ref() as *const Item;
    let mut items = vec![first];
    items.reserve(128);
    let extracted_owner = items.pop().unwrap();
    let moved_owner = extracted_owner;

    assert_eq!(address, moved_owner.as_ref().get_ref() as *const Item);
    assert_eq!(moved_owner.value, "stable");
}
```

Il tipo inferito e `Vec<Pin<Box<Item>>>`. La crescita puo spostare i puntatori conservati nel buffer, non gli Item nelle allocazioni dei box. Anche pop estrae un proprietario pinnato, non Item. `reserve` non promette che il buffer cambi effettivamente indirizzo: il test non dipende da quel dettaglio. [Garanzie di Vec](https://doc.rust-lang.org/std/vec/struct.Vec.html#guarantees).

Pinnare un contenitore non significa pinnare ricorsivamente ogni dato raggiungibile: conta il contratto delle proiezioni esposte. Non assumere nemmeno che `Vec<T>` sia sempre Unpin: nella baseline il relativo bound dipende da T. Questa rappresentazione evita di estrarre T dal suo proprietario pinnato, al costo di allocazioni separate per elementi non zero-sized.

### Proiezione ai campi

Una proiezione decide se da `Pin<&mut Parent>` puoi ottenere `Pin<&mut Field>` oppure un normale `&mut Field`. Non segue automaticamente dal fatto che Field sia contenuto nella struct.

Una proiezione strutturale deve mantenere coerenti accesso ai campi, Unpin e distruzione del parent. Esporre anche un metodo capace di estrarre quel campo puo contraddire la promessa. `get_unchecked_mut` e `map_unchecked_mut` trasferiscono questa responsabilita all'autore: non sono correzioni ordinarie degli errori del compilatore.

Crate come **pin-project** generano proiezioni distinguendo campi pinnati e non pinnati e impongono regole anche al distruttore. Qui il confronto e documentale, riferito alla versione **1.1.13**: nessuna macro della crate e installata o eseguita negli esempi. [Documentazione pin-project](https://docs.rs/pin-project/1.1.13/pin_project/), [regole dell'attributo](https://docs.rs/pin-project/latest/pin_project/attr.pin_project.html).

## Errori comuni

### Pin::new non pinna arbitrariamente un tipo non Unpin

Questo programma **non compila**:

```rust
use std::marker::PhantomPinned;
use std::pin::Pin;

struct Entry {
    _pin: PhantomPinned,
}

fn main() {
    let mut value = Entry { _pin: PhantomPinned };
    let _pinned = Pin::new(&mut value);
}
```

Usa `pin!(value)` per lo storage locale oppure `Box::pin(value)` per un proprietario indiretto. Un eventuale `Pin::new_unchecked` richiederebbe di provare il contratto, anche dopo la fine della vista; non basta "non spostarlo in questa funzione".

Analogamente `get_mut` e `Pin::into_inner` non diventano validi per il contenuto non Unpin solo perche il puntatore esterno e mobile.

### Restituire una vista su storage locale

Questo programma **non compila**:

```rust
use std::pin::{Pin, pin};

fn make() -> Pin<&'static mut String> {
    pin!(String::from("temporary"))
}

fn main() {}
```

Pin non estende il lifetime. Qui puoi restituire un `Pin<Box<String>>` posseduto, oppure prendere in prestito storage del chiamante quando l'API lo consente. Non serve un leak per restituire un valore posseduto.

### Altre confusioni da evitare

- Un Box normale non impedisce di estrarre il contenuto; Box::pin non e una promessa generale di costruzione direttamente nella destinazione finale.
- Pin non aggiunge Send, Sync, sincronizzazione o durata static. Un future non Send resta tale anche se boxed e pinnato.
- Pin non mette in sicurezza da solo un raw pointer autoreferenziale: inizializzazione, accessi e Drop devono rispettare le invarianti.
- `repr(packed)` e proiezioni a campi pinnati richiedono particolare attenzione: gli spostamenti dovuti alla distruzione di campi non allineati sono incompatibili con il contratto; pin-project rifiuta struct packed.
- Il pinning non impedisce il drop di un future sospeso e non garantisce il completamento del suo lavoro. Gli effetti gia prodotti non vengono annullati automaticamente.

## Checklist

- Qual e il valore da mantenere in posizione, distinto dal suo puntatore?
- Il tipo si affida al pinning oppure e Unpin?
- Il valore e stato davvero pinnato o contiene soltanto PhantomPinned?
- Serve storage locale oppure ownership trasferibile con Pin<Box<T>>?
- La proiezione ai campi preserva anche Drop e Unpin?
- Posso evitare unsafe con un contenitore o una crate appropriata?
- Lifetime, Send/Sync e cancellazione sono verificati separatamente?
- Il codice di prova e un executor reale oppure solo polling controllato?

## Collegamenti

- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Box T|Box<T>]]
- [[Programmazione/Rust/Pagine/Deref Trait|Deref Trait]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]
- [[Programmazione/Rust/Pagine/Async Await|Async/Await]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Invariants|Invariants]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]

## Fonti

- [Standard library: modello del pinning](https://doc.rust-lang.org/std/pin/index.html).
- [Standard library: API Pin](https://doc.rust-lang.org/std/pin/struct.Pin.html).
- [Standard library: Unpin](https://doc.rust-lang.org/std/marker/trait.Unpin.html).
- [Standard library: PhantomPinned](https://doc.rust-lang.org/std/marker/struct.PhantomPinned.html).
- [Standard library: macro pin!](https://doc.rust-lang.org/std/pin/macro.pin.html).
- [Standard library: Box](https://doc.rust-lang.org/std/boxed/struct.Box.html).
- [Standard library: Future](https://doc.rust-lang.org/std/future/trait.Future.html).
- [Standard library: Waker](https://doc.rust-lang.org/std/task/struct.Waker.html).
- [Standard library: Wake](https://doc.rust-lang.org/std/task/trait.Wake.html).
- [Standard library: Vec](https://doc.rust-lang.org/std/vec/struct.Vec.html).
- [pin-project 1.1.13](https://docs.rs/pin-project/1.1.13/pin_project/).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

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
  - Send
  - Sync
  - Marker trait concorrenza
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Threads]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
related:
  - "[[Programmazione/Rust/Pagine/Unsafe traits]]"
  - "[[Programmazione/Rust/Pagine/Rc T e Arc T]]"
  - "[[Programmazione/Rust/Pagine/Mutex RwLock e Atomics]]"
title: Send e Sync Traits
---

# Send e Sync Traits

## Sintesi

`Send` e `Sync` sono **auto trait** che descrivono quali trasferimenti fra thread sono sicuri:

- `T: Send`: un valore di tipo `T` puo essere trasferito a un altro thread.
- `T: Sync`: un riferimento condiviso `&T` puo essere trasferito a un altro thread.

Sono marker trait: non hanno metodi da chiamare. Non eseguono sincronizzazione e non garantiscono assenza di deadlock o correttezza delle operazioni applicative.

Di solito il compilatore li determina in base alla composizione del tipo. Implementarli manualmente richiede `unsafe impl` e una giustificazione che valga per tutta l'API esposta, non soltanto per un esempio che sembra funzionare.

## Quando usarlo

- Leggere un errore su closure, thread o task che non sono `Send`.
- Scegliere se trasferire un dato oppure condividerlo.
- Definire bound minimi nelle API generiche e nei trait object.
- Capire perche `Arc<RefCell<T>>` non risolve la condivisione concorrente.
- Valutare wrapper di risorse native, raw pointer o tipi con vincoli di thread.

## Come funziona

### Send e Sync sono proprieta diverse

`Sync` non significa "mutabile da piu thread": significa che gli accessi ammessi attraverso riferimenti condivisi sono sicuri. Un `Mutex<T>` offre mutazione sincronizzata; una `String` puo semplicemente essere letta da piu thread.

Le relazioni da ricordare sono:

- `&T: Send` se e solo se `T: Sync`.
- `&mut T: Send` se e solo se `T: Send`.
- `&T` e `&mut T` sono `Sync` se e solo se `T: Sync`.

Condividere un `&&mut T` non permette a tutti di ottenere accesso mutabile a `T`: le normali regole dei prestiti restano valide. [Definizione di Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html).

Un tipo puo essere `Send` ma non `Sync`, come `RefCell<String>`. Esistono anche tipi `Sync` ma non `Send`, come una `std::sync::MutexGuard<'_, String>`: la guard standard non puo essere trasferita a un altro thread. I due trait non si implicano a vicenda.

### Auto trait: nessun derive necessario

Una struct ordinaria acquisisce gli auto trait quando i suoi campi soddisfano le condizioni pertinenti, salvo implementazioni esplicite. Per un wrapper generico la risposta dipende dal parametro concreto.

```rust
use std::cell::RefCell;

struct Packet<T> {
    payload: T,
}

fn assert_send<T: Send + ?Sized>() {}
fn assert_sync<T: Sync + ?Sized>() {}

fn main() {
    assert_send::<Packet<String>>();
    assert_sync::<Packet<String>>();
    assert_send::<Packet<RefCell<String>>>();

    let packet = Packet { payload: String::from("ready") };
    assert_eq!(packet.payload, "ready");
}
```

Le due funzioni vuote sono **asserzioni di tipo a compile time**: non provano una sincronizzazione a runtime. `Packet<RefCell<String>>` e `Send`, ma un'asserzione `Sync` per lo stesso tipo verrebbe rifiutata.

Non servono `#[derive(Send)]` o `#[derive(Sync)]`; non sono derive standard. Una modifica ai campi puo cambiare gli auto trait di un tipo pubblico e quindi rompere codice dei suoi utilizzatori. [Rust Reference: auto traits](https://doc.rust-lang.org/reference/special-types-and-traits.html#auto-traits).

### Tipi comuni e condizioni

Per i contenitori con allocatore, la tabella assume quello standard. `T` rappresenta il contenuto.

| Tipo | Send | Sync |
|---|---|---|
| `String`, `u64` | Si | Si |
| `Vec<T>`, `Box<T>` | Se `T: Send` | Se `T: Sync` |
| `Rc<T>` | No | No |
| `Cell<T>`, `RefCell<T>` | Se `T: Send` | No |
| `Arc<T>` | Se `T: Send + Sync` | Se `T: Send + Sync` |
| `Mutex<T>` | Se `T: Send` | Se `T: Send` |
| `RwLock<T>` | Se `T: Send` | Se `T: Send + Sync` |
| `*const T`, `*mut T` | No | No |
| `MutexGuard<'_, T>` | No | Se `T: Sync` |

`Rc` aggiorna contatori non atomici. `Arc` rende atomico il reference counting, **non l'accesso al contenuto**. Per questo `Arc<RefCell<T>>` non e un sostituto di `Arc<Mutex<T>>`. Un mutex puo serializzare l'accesso a un tipo non `Sync`, ma non rende trasferibile un contenuto non `Send`, come `Rc<T>`.

Riferimenti: [Send](https://doc.rust-lang.org/std/marker/trait.Send.html), [RefCell](https://doc.rust-lang.org/std/cell/struct.RefCell.html), [Arc](https://doc.rust-lang.org/std/sync/struct.Arc.html), [Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html), [RwLock](https://doc.rust-lang.org/std/sync/struct.RwLock.html), [MutexGuard](https://doc.rust-lang.org/std/sync/struct.MutexGuard.html).

## API / Sintassi

### Bound di una funzione che avvia un thread

```rust
use std::thread::{self, JoinHandle};

fn spawn_work<F, R>(work: F) -> JoinHandle<R>
where
    F: FnOnce() -> R + Send + 'static,
    R: Send + 'static,
{
    thread::spawn(work)
}

fn main() {
    let text = String::from("ready");
    let worker = spawn_work(move || text.len());
    assert_eq!(worker.join().unwrap(), 5);
}
```

L'helper esegue davvero la closure e restituisce l'handle. Non richiede `Sync`: il lavoro e trasferito, non condiviso per essere eseguito contemporaneamente da piu thread.

`F: Send` permette di trasferire le catture; `R: Send` permette di riportare il risultato al chiamante. `'static` esclude prestiti di breve durata contenuti nel lavoro o nel risultato: **non obbliga un valore posseduto a vivere per sempre**.

`move` decide come vengono catturati i valori, non concede `Send` e non prolunga la vita del dato puntato da un riferimento. Per prestare dati locali usa `thread::scope`, che elimina quel requisito `'static` ma mantiene i vincoli di trasferimento. Gestione di panic, errori di creazione e join multipli: [[Programmazione/Rust/Pagine/Threads|Threads]]. [Firma di spawn](https://doc.rust-lang.org/std/thread/fn.spawn.html).

### Trait object con Send esplicito

```rust
use std::thread;

type Job = Box<dyn FnOnce() -> usize + Send + 'static>;

fn main() {
    let text = String::from("ready");
    let job: Job = Box::new(move || text.len());
    let worker = thread::spawn(job);
    assert_eq!(worker.join().unwrap(), 5);
}
```

`Box<dyn FnOnce() -> usize>` non promette `Send`, anche se una particolare closure inserita nel box lo era. Mantieni il bound al momento della conversione in trait object. Per altri trait puo anche essere ereditato da un supertrait.

`dyn Trait + Send + Sync` serve solo se il contratto richiede entrambe le proprieta; non aggiungere `Sync` per abitudine. [Rust Reference: trait objects](https://doc.rust-lang.org/reference/types/trait-object.html).

## Esempio pratico

### Trasferire RefCell senza condividerla

```rust
use std::cell::RefCell;
use std::thread;

fn main() {
    let items = RefCell::new(vec![String::from("first")]);

    let worker = thread::spawn(move || {
        items.borrow_mut().push(String::from("second"));
        items.into_inner()
    });

    let items = worker.join().unwrap();
    assert_eq!(items, ["first", "second"]);
}
```

Il thread principale cede la `RefCell`; non conserva un riferimento per accedervi mentre lavora il worker. Il contenuto e `Send`, quindi anche la cella lo e. Questo **non** permette di condividere `&RefCell<_>` fra thread: tale riferimento richiederebbe `Sync`.

### Condividere una String con Arc

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(String::from("shared"));
    let worker_data = Arc::clone(&data);

    let worker = thread::spawn(move || worker_data.len());
    assert_eq!(data.as_str(), "shared");
    assert_eq!(worker.join().unwrap(), 6);
}
```

I due proprietari leggono lo stesso contenuto; non e richiesto un mutex. `Arc::clone` duplica l'handle, non la stringa. Il `join` rende esplicita l'attesa.

Per mutazione condivisa e invarianti applicative vedi [[Programmazione/Rust/Pagine/Shared state|Shared state]].

## Varianti

### Future Send e dati conservati attraverso await

Un future puo essere trasferito fra thread solo se il suo stato lo consente. Contano i dati catturati inizialmente e quelli mantenuti attraverso un possibile punto di sospensione. Non basta vedere la parola `async` o eliminare un singolo `.await`.

Un valore non `Send` creato durante il polling puo essere usato in un blocco che termina prima di `.await`:

```rust
use std::future::{self, Future};
use std::rc::Rc;

fn requires_send<F>(future: F) -> F
where
    F: Future + Send + 'static,
{
    future
}

async fn name_length() -> usize {
    let length = {
        let name = Rc::new(String::from("ready"));
        name.len()
    };
    future::ready(()).await;
    length
}

fn main() {
    let future = requires_send(name_length());
    drop(future);
}
```

**Questo programma controlla il tipo, non esegue `name_length`.** L'helper restituisce il future senza poll o spawn; `drop` lo distrugge. Per avanzare il calcolo serve polling, normalmente tramite un executor. Il nome `requires_send` indica soltanto una verifica del bound. [Future e polling](https://doc.rust-lang.org/std/future/trait.Future.html).

L'helper non controlla `F::Output: Send`. Un future `Send` puo produrre un valore non `Send`; sono contratti separati. Per esempio `tokio::spawn` richiede sia `F: Send + 'static` sia `F::Output: Send + 'static`, ma non richiede che il future sia `Sync`.

Quel requisito appartiene all'API anche quando il runtime Tokio usa un solo thread. Un future locale non `Send` puo essere eseguito in un contesto locale appropriato, per esempio con `LocalSet` e `spawn_local`; quest'ultimo richiede comunque `'static`. Non basta sostituire una funzione senza predisporre il contesto. [Tokio spawn](https://docs.rs/tokio/latest/tokio/task/fn.spawn.html), [spawn_local](https://docs.rs/tokio/latest/tokio/task/fn.spawn_local.html), [tutorial sui task](https://tokio.rs/tokio/tutorial/spawning).

Anche `async move` con un `Rc` catturato dall'esterno puo produrre un future non `Send`: il valore e gia nel suo stato prima del primo poll. Per una guard standard attraverso `.await` vedi [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex e RwLock]].

### Limitare gli auto trait su stable

La documentazione puo mostrare `impl !Send` o `impl !Sync`. Scrivere una negative impl nel proprio codice richiede ancora la feature instabile `negative_impls` nella baseline Rust 1.99.1; non e sintassi stable disponibile solo perche compare nella documentazione di `std`.

Su stable, un campo marker puo impedire gli auto trait non desiderati:

```rust
use std::marker::PhantomData;
use std::rc::Rc;

struct LocalToken {
    id: u64,
    _local: PhantomData<Rc<()>>,
}

impl LocalToken {
    fn id(&self) -> u64 {
        self.id
    }
}

fn main() {
    let token = LocalToken { id: 7, _local: PhantomData };
    assert_eq!(token.id(), 7);
}
```

`PhantomData<Rc<()>>` non alloca un `Rc`, ma fa si che questo tipo non acquisisca automaticamente ne `Send` ne `Sync`. E una scelta di API, non un controllo dell'identita del thread a runtime.

Il marker non sostituisce i vincoli di una risorsa nativa: costruzione, accesso e distruzione devono rispettarne il contratto. [Negative impls](https://doc.rust-lang.org/unstable-book/language-features/negative-impls.html), [PhantomData](https://doc.rust-lang.org/std/marker/struct.PhantomData.html).

### Implementazioni unsafe: una promessa al compilatore

`unsafe impl Send` e `unsafe impl Sync` non aggiungono lock e non correggono i raw pointer. Sono dichiarazioni su cui altro codice unsafe puo fare affidamento; una promessa sbagliata puo rendere possibile undefined behavior tramite un'API apparentemente sicura.

Prima di valutarle per un wrapper, devi dimostrare almeno:

- Chi possiede la risorsa e per quanto tempo ogni puntatore resta valido.
- Se trasferimento e distruzione su un altro thread sono ammessi.
- Come tutti gli accessi attraverso riferimenti condivisi rispettano aliasing e sincronizzazione.
- Quali bound sui parametri generici sono necessari.
- Che nessun metodo sicuro possa violare tali condizioni.

Preferisci componenti che implementano gia correttamente questi trait. Una prova di compilazione o un test che passa non dimostra la soundness di un'implementazione manuale. Non aggiungere `unsafe impl` per silenziare un errore di spawn. [Rustonomicon: Send and Sync](https://doc.rust-lang.org/nomicon/send-and-sync.html).

## Errori comuni

### Move non rende Rc trasferibile

Controesempio: **non compila**.

```rust
use std::rc::Rc;
use std::thread;

fn main() {
    let data = Rc::new(String::from("local"));
    let worker = thread::spawn(move || drop(data));
    worker.join().unwrap();
}
```

`drop(data)` usa realmente la cattura. Il fatto che questa istanza abbia un solo proprietario non cambia i trait del tipo. Sposta direttamente la stringa se non serve condivisione, oppure scegli `Arc` se i bound del contenuto lo consentono.

Attenzione ai falsi esempi: `let _ = value;` non forza il trasferimento o la distruzione di una variabile come fa `drop(value)`. Una closure cattura cio che usa realmente, anche quando e `move`; puo quindi non testare il vincolo che pensavi di dimostrare. [Catture delle closure](https://doc.rust-lang.org/reference/types/closure.html#capture-precision).

### Uno scope non rende RefCell condivisibile

Controesempio: **non compila**.

```rust
use std::cell::RefCell;
use std::thread;

fn main() {
    let data = RefCell::new(0);

    thread::scope(|scope| {
        let worker = scope.spawn(|| *data.borrow());
        assert_eq!(worker.join().unwrap(), 0);
    });
}
```

La durata del prestito e corretta, ma la closure cattura `&RefCell<i32>`, che non e `Send` perche la cella non e `Sync`. Non importa che il corpo sembri soltanto leggere: il contratto viene controllato sul tipo. Trasferisci la cella, estrai prima un valore indipendente o scegli una sincronizzazione adatta.

### Rc conservato nel future

Controesempio: **non compila**.

```rust
use std::future::{self, Future};
use std::rc::Rc;

fn require_send<F: Future + Send>(_: F) {}

async fn name_length() -> usize {
    let name = Rc::new(String::from("ready"));
    future::ready(()).await;
    name.len()
}

fn main() {
    require_send(name_length());
}
```

Il valore resta necessario dopo `.await`. Il controllo del tipo rifiuta il future anche se l'await dell'esempio e immediatamente pronto: non usare ipotesi sul comportamento dello scheduler per aggirare i bound. Il blocco lessicale nell'esempio valido evita di conservare `Rc` nello stato sospendibile.

### Altri equivoci

- **Send e uguale a static:** un `&str` locale puo essere `Send` senza soddisfare `'static`.
- **Serve sempre Send + Sync:** un dato trasferito con ownership esclusiva puo richiedere solo `Send`.
- **Qualsiasi uso di RefCell e vietato nei thread:** puo essere trasferita se il contenuto e `Send`; il problema e condividerne i riferimenti senza sincronizzazione.
- **Sync significa accesso mutabile libero:** borrowing, interior mutability e lock restano necessari secondo il tipo.
- **Thread-safe significa logicamente corretto:** deadlock, aggiornamenti persi e protocolli sbagliati restano possibili in codice safe.

## Checklist

- Stai trasferendo `T`, condividendo `&T` o trasferendo `&mut T`?
- Il requisito fallito riguarda il contenitore, il contenuto, una guard o il risultato?
- La closure cattura davvero il valore che intendi trasferire?
- `Send` e durata dei prestiti sono stati verificati separatamente?
- Gli auto trait necessari sopravvivono alla conversione in trait object?
- Il future conserva valori non `Send` prima del primo poll o attraverso `.await`?
- L'API richiede anche un output `Send`? Serve un contesto locale?
- Un eventuale `unsafe impl` ha una giustificazione valida per tutta l'API?

## Collegamenti

- [[Programmazione/Rust/Pagine/Threads|Threads]]
- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc e Arc]]
- [[Programmazione/Rust/Pagine/RefCell T|RefCell]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex e RwLock]]
- [[Programmazione/Rust/Pagine/Mutex RwLock e Atomics|Mutex, RwLock e Atomics]]
- [[Programmazione/Rust/Pagine/Unsafe traits|Unsafe traits]]
- [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]

## Fonti

Consultate il 2026-11-10. Esempi standard verificati con Rust 1.99.1, edition 2024; riferimenti Tokio consultati nella versione 1.54.1, senza usare un runtime Tokio negli esempi.

- [Send](https://doc.rust-lang.org/std/marker/trait.Send.html), [Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html), [Rust Reference: auto traits](https://doc.rust-lang.org/reference/special-types-and-traits.html#auto-traits).
- [std::thread::spawn](https://doc.rust-lang.org/std/thread/fn.spawn.html), [catture e trait delle closure](https://doc.rust-lang.org/reference/types/closure.html), [trait objects](https://doc.rust-lang.org/reference/types/trait-object.html).
- [RefCell](https://doc.rust-lang.org/std/cell/struct.RefCell.html), [Arc](https://doc.rust-lang.org/std/sync/struct.Arc.html), [MutexGuard](https://doc.rust-lang.org/std/sync/struct.MutexGuard.html).
- [Future](https://doc.rust-lang.org/std/future/trait.Future.html), [Tokio spawn](https://docs.rs/tokio/latest/tokio/task/fn.spawn.html), [Tokio spawn_local](https://docs.rs/tokio/latest/tokio/task/fn.spawn_local.html).
- [Negative impls](https://doc.rust-lang.org/unstable-book/language-features/negative-impls.html), [PhantomData](https://doc.rust-lang.org/std/marker/struct.PhantomData.html), [Rustonomicon: Send and Sync](https://doc.rust-lang.org/nomicon/send-and-sync.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

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
  - Drop
  - RAII Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Box T]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Deref Trait]]"
  - "[[Programmazione/Rust/Pagine/File descriptor]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
title: Drop Trait
---

# Drop Trait

## Sintesi

`Drop` permette di aggiungere codice alla distruzione di un valore. E parte del modello **RAII**: una risorsa e legata a un proprietario o a una guardia, e il suo rilascio segue la distruzione di quel valore.

Non e un garbage collector, non significa "all'ultimo utilizzo" e non garantisce che il cleanup avvenga in qualunque situazione. Nella maggior parte delle struct basta lasciare che i campi gestiscano le proprie risorse.

Gli esempi sono programmi autonomi verificati con **Rust 1.99.1, edition 2024**, non una dichiarazione di MSRV. I tre programmi in `Errori comuni` non devono compilare; l'esempio sull'unwinding genera intenzionalmente un panic e lo intercetta.

## Quando usarlo

- Per capire quando vengono rilasciati memoria, lock, file e altre risorse possedute.
- Per aggiungere cleanup a un tipo che gestisce direttamente una risorsa.
- Per progettare guardie con rilascio automatico e operazioni esplicite di completamento.
- Per distinguere distruzione, trasferimento di ownership e fine di un prestito.

Se una struct contiene `String`, `Vec` o `File`, non serve un `impl Drop` soltanto per distruggere quei campi. Evita anche un bound generico `T: Drop` per significare "tipo che necessita cleanup": un contenitore puo avere campi da distruggere senza implementare direttamente il trait.

## Come funziona

### Distruttore del tipo e distruzione dei campi

L'implementazione ordinaria usa `fn drop(&mut self)`. Mentre il metodo viene eseguito, i campi sono ancora disponibili; dopo, Rust esegue automaticamente la loro distruzione. Questa parte generata dal compilatore viene spesso chiamata *drop glue*.

Il seguente programma registra l'ordine senza affidarsi alla lettura dell'output della console.

```rust
use std::cell::RefCell;

struct Tracked<'a> {
    name: &'static str,
    events: &'a RefCell<Vec<&'static str>>,
}

impl Drop for Tracked<'_> {
    fn drop(&mut self) {
        self.events.borrow_mut().push(self.name);
    }
}

struct Envelope<'a> {
    first: Tracked<'a>,
    second: Tracked<'a>,
    events: &'a RefCell<Vec<&'static str>>,
}

impl Drop for Envelope<'_> {
    fn drop(&mut self) {
        assert_eq!(self.first.name, "first");
        assert_eq!(self.second.name, "second");
        self.events.borrow_mut().push("envelope");
    }
}

fn main() {
    let events = RefCell::new(Vec::new());

    {
        let _local = Tracked { name: "local", events: &events };
        let _envelope = Envelope {
            first: Tracked { name: "first", events: &events },
            second: Tracked { name: "second", events: &events },
            events: &events,
        };
        assert!(events.borrow().is_empty());
    }

    assert_eq!(*events.borrow(), ["envelope", "first", "second", "local"]);
}
```

Il log e strumentazione didattica: `borrow_mut`, allocazione e asserzioni possono fallire. Non e un modello di distruttore infallibile da copiare per una risorsa critica.

### Ordine e scope

| Oggetto | Regola utile |
| --- | --- |
| Variabili locali nello stesso scope | Ordine inverso di dichiarazione. |
| Campi di una struct | Dopo il suo `Drop`, nell'ordine di dichiarazione dei campi. |
| Campi della variante attiva di un enum | Ordine di dichiarazione. |
| Elementi di tuple, array e slice possedute | Dal primo all'ultimo. |
| Catture per move di una closure | Non assumere un ordine di distruzione. |

Non estendere automaticamente queste regole a qualsiasi collezione. Per esempio, non costruire un protocollo di cleanup che dipenda dall'ordine di distruzione degli elementi di un `Vec`.

I temporanei hanno regole proprie: "tutto vive fino alla fine della funzione" e sbagliato. Edition 2024 modifica gli scope di alcuni temporanei di `if let` e delle espressioni finali dei blocchi. Per rendere evidente la durata di una guardia usa un binding nominato, un blocco o `drop(guard)`; consulta le fonti per le regole complete.

## API / Sintassi

### Move, riassegnamento e rilascio anticipato

`std::mem::drop(value)` e una funzione che riceve il valore **per valore**. Non e una chiamata diretta al metodo `Drop::drop`: il parametro viene distrutto quando la funzione termina.

```rust
use std::cell::Cell;

struct Counted<'a>(&'a Cell<usize>);

impl Drop for Counted<'_> {
    fn drop(&mut self) {
        self.0.set(self.0.get() + 1);
    }
}

fn main() {
    let drops = Cell::new(0);
    let original = Counted(&drops);
    let moved = original;
    assert_eq!(drops.get(), 0);

    drop(&moved);
    assert_eq!(drops.get(), 0);

    drop(moved);
    assert_eq!(drops.get(), 1);

    {
        let mut slot = Counted(&drops);
        assert_eq!(slot.0.get(), 1);
        slot = Counted(&drops);
        assert_eq!(drops.get(), 2);
        assert_eq!(slot.0.get(), 2);
    }
    assert_eq!(drops.get(), 3);

    let _ = Counted(&drops);
    assert_eq!(drops.get(), 4);

    {
        let _guard = Counted(&drops);
        assert_eq!(drops.get(), 4);
    }
    assert_eq!(drops.get(), 5);
}
```

Il move non distrugge il contenuto: cambia chi ne e proprietario. Il riassegnamento distrugge il vecchio valore del binding; `drop(moved)` anticipa il rilascio e rende `moved` inutilizzabile.

`drop(&moved)` distrugge solo il riferimento, non il referente; rustc segnala questa chiamata inutile. Con un tipo `Copy` viene passata una copia, quindi l'originale resta disponibile.

`_guard` e un binding che conserva il valore. `let _ = Counted(...)` non lo conserva: quel temporaneo viene distrutto alla fine dell'istruzione. Attenzione alla distinzione: `let _ = existing_guard` non sposta automaticamente un valore gia associato a un binding e non equivale a `drop(existing_guard)`.

### Una guardia mantiene il lock fino alla distruzione

```rust
use std::sync::{Mutex, TryLockError};

fn main() {
    let counter = Mutex::new(0);
    let mut guard = counter.lock().unwrap();
    *guard += 1;

    assert!(matches!(counter.try_lock(), Err(TryLockError::WouldBlock)));

    drop(guard);

    let next = counter.try_lock().unwrap();
    assert_eq!(*next, 1);
}
```

Il lock e ancora occupato dopo l'ultimo accesso a `*guard`: la fine dell'uso non distrugge la `MutexGuard`. `drop(guard)` la consuma e sblocca il mutex; non distrugge il mutex o il contatore.

Il demo usa `try_lock` per osservare il conflitto senza restare bloccato e `unwrap` per abbreviare la gestione del poisoning. In un'applicazione il comportamento dopo un panic va deciso esplicitamente. Non serve scrivere un distruttore proprio per usare una guardia standard.

Un nuovo lock assegnato direttamente a `_` viene anche segnalato dal lint `let_underscore_lock`, negato di default sulla baseline: conserva una guardia nominata per proteggere davvero un'operazione.

## Esempio pratico

### Annullare aggiunte non confermate a un vettore

Questa transazione **in memoria** ripristina la lunghezza iniziale se non viene confermata. Non stampa soltanto "rollback": le asserzioni verificano il risultato.

```rust
mod batch {
    pub struct AppendTransaction<'a> {
        target: &'a mut Vec<i32>,
        initial_len: usize,
        committed: bool,
    }

    impl<'a> AppendTransaction<'a> {
        pub fn new(target: &'a mut Vec<i32>) -> Self {
            let initial_len = target.len();
            Self { target, initial_len, committed: false }
        }

        pub fn push(&mut self, value: i32) {
            self.target.push(value);
        }

        pub fn commit(mut self) {
            self.committed = true;
        }
    }

    impl Drop for AppendTransaction<'_> {
        fn drop(&mut self) {
            if !self.committed {
                self.target.truncate(self.initial_len);
            }
        }
    }
}

use batch::AppendTransaction;

fn append_nonnegative(target: &mut Vec<i32>, values: &[i32]) -> Result<(), &'static str> {
    let mut transaction = AppendTransaction::new(target);

    for &value in values {
        if value < 0 {
            return Err("negative value");
        }
        transaction.push(value);
    }

    transaction.commit();
    Ok(())
}

fn main() {
    let mut values = vec![10];

    {
        let mut transaction = AppendTransaction::new(&mut values);
        transaction.push(20);
    }
    assert_eq!(values, [10]);

    assert_eq!(append_nonnegative(&mut values, &[20, -1, 30]), Err("negative value"));
    assert_eq!(values, [10]);

    assert_eq!(append_nonnegative(&mut values, &[20, 30]), Ok(()));
    assert_eq!(values, [10, 20, 30]);
}
```

`commit` consuma la guardia, ma **non disattiva il suo distruttore**: imposta lo stato in modo che il successivo `Drop` non tronchi il vettore. Il ritorno anticipato con `Err` distrugge la guardia come una normale uscita dallo scope; anche `?` puo provocare questa uscita.

La API espone solo aggiunte; il vettore resta preso in prestito esclusivamente e non viene modificato nei valori preesistenti. Con `i32`, troncare non invoca distruttori applicativi degli elementi. Non generalizzare la stessa garanzia a un `Vec<T>` arbitrario.

Limiti: non e una transazione database, non offre persistenza, concorrenza o rollback di effetti esterni. Ripristina il contenuto iniziale, non necessariamente la capacita del vettore. Il rilascio saltato, per esempio con `mem::forget`, puo lasciare le aggiunte non confermate: RAII non e una garanzia contro leak o terminazione improvvisa.

### Cleanup fallibile con un'operazione esplicita

```rust
use std::io::{self, BufWriter, Write};

fn write_report<W: Write>(target: W) -> io::Result<()> {
    let mut writer = BufWriter::new(target);
    writer.write_all(b"result=ok\n")?;
    writer.flush()
}

fn main() -> io::Result<()> {
    let mut bytes = Vec::new();
    write_report(&mut bytes)?;
    assert_eq!(bytes, b"result=ok\n");
    Ok(())
}
```

`flush` propaga un errore al chiamante; affidarsi solo al `Drop` di `BufWriter` perderebbe gli errori del tentativo automatico di svuotamento. Il vettore serve a verificare il demo senza scrivere file: bufferizzarlo non e un'ottimizzazione utile.

Un errore non implica rollback dei byte gia scritti; il distruttore puo tentare ancora di svuotare dati rimasti nel buffer. Il codice non promette atomicita o semantica "una sola scrittura".

Per un file, `flush` non equivale a sincronizzazione durevole sul dispositivo: valuta anche `File::sync_all` e i suoi errori. La chiusura della risorsa e il completamento riuscito dell'operazione sono contratti distinti.

## Varianti

### Estrarre un campo lasciando uno stato valido

```rust
use std::cell::Cell;
use std::mem;

struct Payload<'a> {
    text: String,
    remaining: &'a Cell<usize>,
}

impl Payload<'_> {
    fn into_inner(mut self) -> String {
        mem::take(&mut self.text)
    }
}

impl Drop for Payload<'_> {
    fn drop(&mut self) {
        self.remaining.set(self.text.len());
    }
}

fn main() {
    let remaining = Cell::new(usize::MAX);
    let payload = Payload {
        text: String::from("rust"),
        remaining: &remaining,
    };

    let text = payload.into_inner();
    assert_eq!(text, "rust");
    assert_eq!(remaining.get(), 0);
}
```

`mem::take` restituisce la `String` precedente e lascia `String::default()`, cioe una stringa vuota, al distruttore del wrapper. Non clona il buffer e richiede `Default`. Qui il distruttore ammette lo stato vuoto.

Se lo stato corretto e "risorsa assente", un campo `Option<T>` e `take()` possono essere piu espressivi, senza richiedere `T: Default`. `mem::replace` permette un altro sostituto esplicito. Non scegliere un placeholder che violi le invarianti usate durante `Drop`.

### Sospendere la distruzione non equivale a liberare

```rust
use std::cell::Cell;
use std::mem::{self, ManuallyDrop};

struct Counted<'a>(&'a Cell<usize>);

impl Drop for Counted<'_> {
    fn drop(&mut self) {
        self.0.set(self.0.get() + 1);
    }
}

fn main() {
    let drops = Cell::new(0);

    mem::forget(Counted(&drops));
    assert_eq!(drops.get(), 0);

    {
        let _suppressed = ManuallyDrop::new(Counted(&drops));
    }
    assert_eq!(drops.get(), 0);

    let recoverable = ManuallyDrop::new(Counted(&drops));
    let owned = ManuallyDrop::into_inner(recoverable);
    drop(owned);
    assert_eq!(drops.get(), 1);
}
```

Il demo salta il distruttore di valori senza risorse esterne. Con una risorsa reale, `forget` o un `ManuallyDrop` abbandonato possono causare leak: non sono sostituti del cleanup.

La chiamata `drop(wrapper)` su un `ManuallyDrop<T>` non distruggerebbe il contenuto ed e bloccata di default dal lint `undropped_manually_drops`. Il blocco del demo rende osservabile la normale uscita dallo scope senza disabilitare il lint.

`ManuallyDrop::into_inner` recupera ownership del valore ancora valido e permette la normale distruzione. Invece `ManuallyDrop::drop` e `take` sono API unsafe con obblighi sullo stato successivo; non usarle per aggirare un errore del borrow checker. `ManuallyDrop<T>` non rende valido un `T` non inizializzato: quel problema riguarda `MaybeUninit<T>`.

### Unwinding e limiti del cleanup

```rust
use std::panic;
use std::sync::atomic::{AtomicUsize, Ordering};

struct Guard<'a>(&'a AtomicUsize);

impl Drop for Guard<'_> {
    fn drop(&mut self) {
        self.0.fetch_add(1, Ordering::Relaxed);
    }
}

fn main() {
    let drops = AtomicUsize::new(0);

    let result = panic::catch_unwind(|| {
        let _guard = Guard(&drops);
        panic!("demo unwind");
    });

    assert!(result.is_err());
    assert_eq!(drops.load(Ordering::Relaxed), 1);
}
```

Il programma richiede una strategia di panic con **unwinding**: il distruttore viene eseguito mentre si risale lo stack. L'hook predefinito puo stampare il panic anche se `catch_unwind` lo intercetta. Il contatore atomico serve a osservare il risultato, non e un esempio di concorrenza.

`catch_unwind` non intercetta un abort. Non contare sui distruttori degli stack dopo `process::exit`, crash o terminazione forzata. Anche cicli forti di `Rc`/`Arc` possono trattenere risorse. I valori `static` non eseguono `Drop` alla fine del programma.

Evita panic nei distruttori: un secondo panic durante l'unwinding puo terminare il processo. Per errori ordinari usa operazioni esplicite con `Result`, non `catch_unwind` come sostituto del normale contratto fallibile.

## Errori comuni

### Chiamare direttamente il metodo drop

Il programma **non compila**: la chiamata esplicita al distruttore e vietata.

```rust
struct Marker;

impl Drop for Marker {
    fn drop(&mut self) {}
}

fn main() {
    let mut marker = Marker;
    marker.drop();
}
```

Usa `drop(marker)` o `std::mem::drop(marker)`. Nemmeno `Drop::drop(&mut marker)` rende lecita la chiamata: il problema non e la sintassi del metodo.

### Combinare Copy e Drop

Il programma **non compila**: lo stesso tipo non puo implementare entrambi.

```rust
#[derive(Clone, Copy)]
struct Marker;

impl Drop for Marker {
    fn drop(&mut self) {}
}

fn main() {
    let _marker = Marker;
}
```

`Clone` e `Drop` possono coesistere, ma clonare una risorsa esterna deve rispettare ownership e protocollo di rilascio. Copiare soltanto il numero di un handle non crea automaticamente due risorse possedute indipendenti.

### Muovere direttamente un campo non Copy

Il programma **non compila**, anche se `into_inner` consuma `self` e il distruttore ha corpo vuoto.

```rust
struct Payload {
    text: String,
}

impl Drop for Payload {
    fn drop(&mut self) {}
}

impl Payload {
    fn into_inner(self) -> String {
        self.text
    }
}

fn main() {
    let payload = Payload { text: String::from("rust") };
    assert_eq!(payload.into_inner(), "rust");
}
```

Il wrapper deve restare valido per il suo distruttore. Usa una vista, una copia deliberata, `Option::take` o un sostituto valido come nel demo con `mem::take`. La restrizione non impedisce di trasferire l'intero wrapper o leggere copiandolo un campo `Copy`.

Anche i prestiti nei campi devono restare validi se il distruttore li usa: l'ultimo uso esplicito della variabile non elimina l'uso implicito in `Drop`. Questo controllo (*drop check*) non va confuso con un prolungamento artificiale della vita del dato.

## Checklist

- Basta il cleanup automatico dei campi?
- Il proprietario viene distrutto, trasferito o soltanto preso in prestito?
- La guardia resta viva per tutta l'operazione protetta?
- Il codice dipende da un ordine garantito oppure soltanto osservato?
- Il distruttore accetta anche lo stato lasciato da take/replace o da un errore?
- Close, commit, flush o shutdown devono restituire un Result esplicito?
- Il cleanup puo fare panic o invocare codice fallibile?
- Sono gestiti effetti parziali, leak e terminazione senza unwinding?
- Gli esempi sui temporanei sono coerenti con l'edition utilizzata?

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/Box T|Box<T>]]
- [[Programmazione/Rust/Pagine/Deref Trait|Deref Trait]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc<T> e Arc<T>]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex<T> e RwLock<T>]]
- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/panic|Panic e unwinding]]
- [[Programmazione/Rust/Pagine/File I O|File I/O]]
- [[Programmazione/Rust/Pagine/File descriptor|File descriptor]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]

## Fonti

- [Standard library: Drop](https://doc.rust-lang.org/std/ops/trait.Drop.html).
- [Rust Reference: destructors e drop scopes](https://doc.rust-lang.org/reference/destructors.html).
- [Rust Reference: static items](https://doc.rust-lang.org/reference/items/static-items.html).
- [Standard library: garanzie di Vec](https://doc.rust-lang.org/std/vec/struct.Vec.html#guarantees).
- [The Rust Book: Drop e rilascio anticipato](https://doc.rust-lang.org/book/ch15-03-drop.html).
- [Standard library: mem::drop](https://doc.rust-lang.org/std/mem/fn.drop.html).
- [Standard library: MutexGuard](https://doc.rust-lang.org/std/sync/struct.MutexGuard.html).
- [Standard library: BufWriter](https://doc.rust-lang.org/std/io/struct.BufWriter.html).
- [Standard library: Write::flush](https://doc.rust-lang.org/std/io/trait.Write.html#tymethod.flush).
- [Standard library: File::sync_all](https://doc.rust-lang.org/std/fs/struct.File.html#method.sync_all).
- [Standard library: mem::take](https://doc.rust-lang.org/std/mem/fn.take.html).
- [Standard library: Option::take](https://doc.rust-lang.org/std/option/enum.Option.html#method.take).
- [Standard library: mem::forget](https://doc.rust-lang.org/std/mem/fn.forget.html).
- [Standard library: ManuallyDrop](https://doc.rust-lang.org/std/mem/struct.ManuallyDrop.html).
- [rustc: lint negati di default](https://doc.rust-lang.org/rustc/lints/listing/deny-by-default.html).
- [Standard library: catch_unwind](https://doc.rust-lang.org/std/panic/fn.catch_unwind.html).
- [Standard library: process::exit](https://doc.rust-lang.org/std/process/fn.exit.html).
- [Rust error index: E0509](https://doc.rust-lang.org/error_codes/E0509.html).
- [Edition Guide: temporanei di if let](https://doc.rust-lang.org/edition-guide/rust-2024/temporary-if-let-scope.html).
- [Edition Guide: temporanei nelle espressioni finali](https://doc.rust-lang.org/edition-guide/rust-2024/temporary-tail-expr-scope.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

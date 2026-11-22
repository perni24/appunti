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
  - Cell<T>
  - Cell Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
  - "[[Programmazione/Rust/Pagine/Copy e Clone]]"
  - "[[Programmazione/Rust/Pagine/Mutabilita]]"
related:
  - "[[Programmazione/Rust/Pagine/RefCell T]]"
  - "[[Programmazione/Rust/Pagine/OnceLock e LazyLock]]"
  - "[[Programmazione/Rust/Pagine/Send e Sync Traits]]"
title: Cell<T>
---

# Cell<T>

## Sintesi

`Cell<T>` fornisce mutabilita interna **senza guardie di prestito runtime**. Attraverso `&Cell<T>` puoi copiare il contenuto se e `Copy`, oppure sostituirlo e spostarlo fuori lasciando un altro valore valido.

`Cell` **non richiede in generale `T: Copy`**: `Cell<String>` e valido, ma non offre `get`. Inoltre "non restituisce riferimenti" vale per l'accesso condiviso ordinario: `get_mut(&mut self)` puo restituire `&mut T` grazie all'esclusivita gia verificata dal compilatore.

Come `RefCell`, e `!Sync` ma puo essere `Send` quando lo e `T`. Non e una variabile atomica e non aggiunge ownership condivisa.

Esempi verificati con **Rust 1.99.1, edition 2024**: otto programmi validi e tre controesempi che non compilano. La versione e una baseline, non una MSRV.

## Quando usarlo

- Flag, contatori locali e piccoli stati letti o aggiornati tramite `&self`.
- Cache semplici di risultati `Copy`, per esempio `Cell<Option<u64>>`, con invalidazione esplicita.
- Un valore non `Copy` deve essere estratto o sostituito per intero, senza conservarne riferimenti interni.
- Vuoi una vista modificabile per elemento a partire da un array o una slice gia presi in prestito esclusivamente.

Se serve lavorare a lungo su `&T` o `&mut T` ottenuti tramite `&self`, valuta `RefCell<T>`. Se basta un normale `&mut self`, non aggiungere mutabilita interna senza un motivo.

## Come funziona

### Copiare il valore non significa prenderlo in prestito

```rust
use std::cell::Cell;

fn main() {
    let counter = Cell::new(10_u32);
    let reader = &counter;
    let writer = &counter;

    let snapshot = reader.get();
    writer.set(20);
    assert_eq!(snapshot, 10);
    assert_eq!(reader.get(), 20);

    let independent = counter.clone();
    independent.set(30);
    assert_eq!(counter.get(), 20);
    assert_eq!(independent.get(), 30);
}
```

`get` restituisce un `T` per valore e richiede `T: Copy`. Lo snapshot non cambia quando cambia la cella. Non c'e una `Ref` da rilasciare, perche il chiamante non ha ottenuto un riferimento allo spazio interno.

Clonare un `Cell<T>` richiede anch'esso `T: Copy` e produce una cella indipendente. Il tipo `Cell<T>` non e `Copy`: assegnarlo a un nuovo binding normalmente lo muove. Clonare invece un `Rc<Cell<T>>` con `Rc::clone` aggiunge un proprietario della stessa cella.

La sicurezza non deriva da un controllo dopo ogni operazione: l'API condivisa evita di esporre riferimenti ordinari al contenuto sostituibile. Ownership e lifetime restano controllati staticamente.

## API / Sintassi

| API | Requisito o effetto |
| --- | --- |
| `get` | Copia `T`; richiede `T: Copy`. |
| `set` | Installa il nuovo `T` e distrugge il precedente. |
| `replace` | Installa un sostituto e restituisce il vecchio `T`. |
| `take` | Estrae `T` lasciando `T::default()`; richiede `Default`. |
| `swap` | Scambia i contenuti di due celle senza `&mut`. |
| `get_mut` | Restituisce `&mut T` da `&mut Cell<T>`. |
| `into_inner` | Consuma la cella ed estrae `T`. |
| `update` | Calcola e imposta un nuovo valore `Copy` tramite callback. |
| `from_mut` | Converte un prestito `&mut T` in una vista `&Cell<T>`. |

Non confondere `set` con `replace`: il primo non restituisce il vecchio valore. Anche `take` e una modifica, non una lettura.

### Sostituire ed estrarre una String

```rust
use std::cell::Cell;

fn main() {
    let text = Cell::new(String::from("first"));

    let old = text.replace(String::from("second"));
    assert_eq!(old, "first");

    let taken = text.take();
    assert_eq!(taken, "second");
    assert_eq!(text.take(), "");

    text.set(String::from("last"));
    assert_eq!(text.into_inner(), "last");
}
```

`String` non e `Copy`, ma viene trasferita, non duplicata. Il valore estratto diventa responsabilita del chiamante; la cella continua a possedere il sostituto. `take` su `String` lascia una stringa vuota.

Per un tipo senza `Default` puoi usare `replace` con un sostituto adatto, oppure `Cell<Option<T>>`. `set`, `replace` e `into_inner` non impongono che `T` sia clonabile.

### Accesso per riferimento quando sei esclusivo

```rust
use std::cell::Cell;

fn main() {
    let mut text = Cell::new(String::from("rust"));
    let content = text.get_mut();
    content.push('!');

    let owned = text.into_inner();
    assert_eq!(owned, "rust!");
}
```

Qui non stai ottenendo `&mut String` attraverso un riferimento condiviso: il compilatore ha verificato un prestito esclusivo della cella. Non puoi usare `set` mentre un riferimento ricavato da `get_mut` e ancora necessario.

`as_ptr` restituisce un puntatore raw con una chiamata sicura, ma dereferenziarlo richiede `unsafe` e il rispetto di aliasing e lifetime. Non e una scorciatoia per ottenere un riferimento condiviso permanente.

## Esempio pratico

### Contatore con overflow esplicito

```rust
use std::cell::Cell;

#[derive(Default)]
struct Metrics {
    calls: Cell<u64>,
}

impl Metrics {
    fn record_call(&self) -> Option<u64> {
        let next = self.calls.get().checked_add(1)?;
        self.calls.set(next);
        Some(next)
    }

    fn calls(&self) -> u64 {
        self.calls.get()
    }
}

fn main() {
    let metrics = Metrics::default();
    assert_eq!(metrics.record_call(), Some(1));
    assert_eq!(metrics.record_call(), Some(2));
    assert_eq!(metrics.calls(), 2);

    let full = Metrics { calls: Cell::new(u64::MAX) };
    assert_eq!(full.record_call(), None);
    assert_eq!(full.calls(), u64::MAX);
}
```

`record_call` usa `&self` ma aggiorna il contatore. Il risultato e il nuovo conteggio oppure `None` se non e rappresentabile; in quel caso il valore resta invariato.

`checked_add` rende la politica indipendente dai controlli di overflow della compilazione. La versione con `get() + 1` non specificava questa scelta. Se il dominio richiede saturazione o wrapping, deve dichiararlo esplicitamente: non sono comportamenti equivalenti.

Questa API non chiama callback tra lettura e scrittura e non viene condivisa fra thread. Non e un contatore concorrente: per quello serve un atomico o un lock con un contratto appropriato.

### Uno slot opzionale senza Clone o Default del contenuto

```rust
use std::cell::Cell;

struct Job {
    name: String,
}

fn main() {
    let pending = Cell::new(Some(Job {
        name: String::from("build"),
    }));

    let job = pending.take().unwrap();
    assert_eq!(job.name, "build");
    assert!(pending.take().is_none());

    pending.set(Some(job));
    let previous = pending.replace(Some(Job {
        name: String::from("test"),
    })).unwrap();

    assert_eq!(previous.name, "build");
    assert_eq!(pending.take().unwrap().name, "test");
}
```

`Option<Job>` ha come default `None` anche se `Job` non implementa `Default`. Nel demo il primo `take` libera lo slot e trasferisce il lavoro al chiamante; il secondo rileva che non c'e niente da estrarre.

Questo non e un meccanismo automatico di prestito o rollback. Se estrai il valore, esegui codice fallibile e non lo rimetti, la cella rimane vuota. Un callback puo osservare o cambiare quello stato intermedio: un successivo `set` puo sovrascriverne l'aggiornamento. Scegli un contratto chiaro invece di simulare un `RefMut` con `take`/`set`.

## Varianti

### Viste per elemento di slice e array

```rust
use std::cell::Cell;

fn clear_negative(values: &mut [i32]) {
    let cells = Cell::from_mut(values).as_slice_of_cells();
    for cell in cells.iter().filter(|cell| cell.get() < 0) {
        cell.set(0);
    }
}

fn main() {
    let mut values = [-2, 0, 5, -1];
    clear_negative(&mut values);
    assert_eq!(values, [0, 0, 5, 0]);

    let array = Cell::new([10, 20]);
    let cells: &[Cell<i32>; 2] = array.as_array_of_cells();
    cells[1].set(30);
    assert_eq!(array.get(), [10, 30]);
}
```

`from_mut` non copia l'array: crea una vista legata al prestito originale. `as_slice_of_cells` permette l'accesso per elemento della stessa memoria; la prima funzione mostra un filtro che legge gli elementi mentre l'operazione li modifica tramite `Cell`.

`as_array_of_cells` conserva anche la lunghezza nel tipo. Queste API espongono `&Cell<T>`, non `&T` interni liberamente sostituibili. La vista non puo vivere oltre il proprietario ne autorizza l'uso incompatibile del prestito originale.

`update` e stabile da Rust **1.88**, `as_array_of_cells` da **1.91**. Entrambe sono incluse nella baseline verificata. Non confondere la stabilita di una funzione con la disponibilita in contesti `const`.

### Trasferire una cella a un worker

Questo programma e valido anche se `String` non e `Copy`:

```rust
use std::cell::Cell;
use std::thread;

fn main() {
    let text = Cell::new(String::from("queued"));

    let worker = thread::spawn(move || {
        text.set(String::from("done"));
        text.into_inner()
    });

    assert_eq!(worker.join().unwrap(), "done");
}
```

La cella e spostata nel worker: il chiamante non ne conserva l'accesso. `Cell<T>: Send` richiede `T: Send`; i requisiti di `thread::spawn` sui riferimenti contenuti restano applicabili. `join` attende il risultato; `unwrap` e una semplificazione del demo, non una politica completa per i panic.

`Cell<T>` non e `Sync`. `Rc<Cell<T>>` permette ownership condivisa single-thread, mentre sostituire `Rc` con `Arc` non rende da solo la cella condivisibile fra thread.

### Scegliere il tipo in base all'accesso

- `Cell<T>`: copia o sostituzione del valore senza guardie runtime.
- `RefCell<T>`: accesso tramite riferimenti protetti da `Ref`/`RefMut` e controlli dinamici.
- Atomici: operazioni concorrenti su tipi supportati; l'ordering va scelto in base al protocollo.
- `Mutex<T>` / `RwLock<T>`: accesso sincronizzato a stato condiviso piu articolato.
- `OnceCell<T>`: inizializzazione singola attraverso accesso condiviso e lettura con `&T` in ambito single-thread.
- `OnceLock<T>`: corrispondente sincronizzato. Un `Cell<Option<T>>` riscrivibile non offre lo stesso contratto.

Copiare o spostare un valore grande puo avere un costo; assenza di guardie non significa prestazioni sempre migliori. Misura il percorso reale. La mutabilita interna osservabile deve essere chiara nell'API.

## Errori comuni

### Usare get su un tipo soltanto Clone

Questo programma **non compila**:

```rust
use std::cell::Cell;

fn main() {
    let text = Cell::new(String::from("rust"));
    let _copy = text.get();
}
```

`String: Clone` non basta per `get` o per l'implementazione ordinaria di `Clone` di `Cell<String>`. Usa `replace`/`take` per trasferire il valore, oppure valuta `RefCell` se vuoi leggerlo tramite riferimento o clonarlo mentre e preso in prestito.

Nella baseline, `Cell::get_cloned` e ancora un'API sperimentale nightly: non e una sostituzione stabile generale da inserire in questi esempi.

### Chiedere get_mut attraverso un riferimento condiviso

Questo programma **non compila**:

```rust
use std::cell::Cell;

fn change(text: &Cell<String>) {
    text.get_mut().push('!');
}

fn main() {}
```

La mutabilita interna non trasforma `&Cell<T>` in `&mut Cell<T>`. Se il contratto puo richiedere accesso esclusivo, cambia la firma a `&mut Cell<String>`; altrimenti scegli sostituzione del valore o un tipo adatto al prestito dinamico.

### Condividere Cell tra thread

Questo programma **non compila**, anche usando thread scoped:

```rust
use std::cell::Cell;
use std::thread;

fn main() {
    let value = Cell::new(0);
    thread::scope(|scope| {
        scope.spawn(|| value.set(1));
    });
}
```

Lo scope garantisce la durata del prestito, non la sincronizzazione. Per condividere questo contatore puoi usare un tipo atomico; non basta aggiungere un `Arc`.

### Trattare update come una transazione

Questo programma e valido, ma mostra un aggiornamento intermedio sovrascritto:

```rust
use std::cell::Cell;

fn main() {
    let value = Cell::new(1_u32);
    value.update(|previous| previous + 1);
    assert_eq!(value.get(), 2);

    value.update(|previous| {
        value.set(100);
        previous + 1
    });
    assert_eq!(value.get(), 3);
}
```

La callback riceve una copia del valore iniziale. Il risultato finale viene poi impostato nella cella: il `100` scritto durante la callback non si somma al valore iniziale. Non servono thread per avere rientranza e aggiornamenti logicamente persi.

`update` restituisce `()`, non il nuovo valore, e richiede `T: Copy`. Non e un'operazione atomica concorrente, non acquisisce lock e non offre rollback. Se la callback fa panic, non viene applicato il suo risultato, ma eventuali suoi effetti precedenti restano.

### Pensare che assenza di borrow check significhi assenza di panic

`Cell` non produce `BorrowError`, ma il codice che esegue puo fallire: callback di `update`, `Default` usato da `take` o distruttore del vecchio valore in `set` possono fare panic. Le asserzioni e l'aritmetica hanno a loro volta i propri contratti.

`swap` con la stessa identica cella e un'operazione senza effetto, diversamente da `RefCell::swap`. Il caso di celle distinte parzialmente sovrapposte fa panic: e un confine rilevante per costruzioni unsafe, non una sovrapposizione da creare nei normali esempi safe.

## Checklist

- Sto copiando, spostando o prendendo in prestito il contenuto?
- Il bound richiesto dall'API e `Copy`, `Default` o nessuno dei due?
- Il vecchio valore deve essere restituito oppure distrutto?
- `take` lascia uno stato valido e accettabile per l'applicazione?
- Una callback puo modificare la cella durante l'operazione?
- La politica di overflow e esplicita?
- Voglio muovere la cella o condividere riferimenti tra thread?
- Se servono riferimenti tramite `&self`, sarebbe piu adatto `RefCell`?
- Le API usate sono disponibili nella versione minima del progetto?

## Collegamenti

- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/RefCell T|RefCell<T>]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/Mutabilita|Mutabilita]]
- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc<T> e Arc<T>]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/OnceLock e LazyLock|OnceLock e LazyLock]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Mutex RwLock e Atomics|Mutex, RwLock e atomici]]

## Fonti

- [Standard library: Cell e versioni delle API](https://doc.rust-lang.org/std/cell/struct.Cell.html).
- [Standard library: modulo cell](https://doc.rust-lang.org/std/cell/index.html).
- [Implementazione ufficiale di Cell](https://doc.rust-lang.org/src/core/cell.rs.html).
- [Standard library: Copy](https://doc.rust-lang.org/std/marker/trait.Copy.html).
- [Standard library: Option](https://doc.rust-lang.org/std/option/enum.Option.html).
- [Standard library: u64::checked_add](https://doc.rust-lang.org/std/primitive.u64.html#method.checked_add).
- [Standard library: Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html).
- [Standard library: thread::spawn](https://doc.rust-lang.org/std/thread/fn.spawn.html).
- [Standard library: atomici](https://doc.rust-lang.org/std/sync/atomic/index.html).
- [Standard library: OnceCell](https://doc.rust-lang.org/std/cell/struct.OnceCell.html).
- [Standard library: OnceLock](https://doc.rust-lang.org/std/sync/struct.OnceLock.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

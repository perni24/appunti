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
  - RefCell<T>
  - Borrow checking runtime
prerequisites:
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Rc T e Arc T]]"
related:
  - "[[Programmazione/Rust/Pagine/Cell T]]"
  - "[[Programmazione/Rust/Pagine/Mutex T e RwLock T]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
title: RefCell<T>
---

# RefCell<T>

## Sintesi

`RefCell<T>` consente di modificare il proprio contenuto attraverso `&self`, controllando a runtime i prestiti ottenuti tramite le sue API. **Non disattiva il borrow checker**: ownership, lifetime e riferimenti ricavati dalle guardie continuano a essere controllati dal compilatore.

`borrow` e `borrow_mut` fanno panic quando il prestito richiesto entra in conflitto con quelli attivi. `try_borrow` e `try_borrow_mut` restituiscono invece un `Result`: un conflitto non implica sempre un panic.

`RefCell` possiede il dato, ma non aggiunge reference counting o sincronizzazione. E `!Sync`; puo essere `Send` quando lo e `T`. Trasferire ownership a un thread e diverso da condividere `&RefCell<T>` tra thread.

Esempi verificati con **Rust 1.99.1, edition 2024**: otto programmi validi, due panic intenzionali e due errori di compilazione, indicati nelle rispettive sezioni. Questa e una baseline, non una MSRV.

## Quando usarlo

- Un'API richiede `&self`, ma l'implementazione deve aggiornare stato interno, per esempio un mock che registra chiamate.
- La forma dei prestiti dipende da scelte runtime difficili da esprimere con soli `&mut T`.
- Serve mutazione condivisa single-thread, eventualmente insieme a `Rc`.
- Vuoi restituire una vista protetta da una guardia, con un contratto esplicito sulla sua durata.

Prima valuta se bastano `&mut self`, prestiti piu corti o una diversa divisione dei dati. Un conflitto ripetuto di borrowing puo segnalare un problema nel flusso dell'applicazione, non la necessita di aggiungere altri contenitori.

## Come funziona

### Guardie e rilascio del prestito

`Ref<T>` permette lettura tramite `Deref`; `RefMut<T>` anche scrittura tramite `DerefMut`. Un nuovo prestito condiviso e ammesso se non esiste un prestito mutabile; uno mutabile richiede che non ci siano altri prestiti attivi.

```rust
use std::cell::{Ref, RefCell};

fn main() {
    let value = RefCell::new(10);
    let first = value.borrow();
    let second = Ref::clone(&first);

    assert_eq!(*first + *second, 20);
    assert!(value.try_borrow_mut().is_err());

    drop(first);
    assert!(value.try_borrow_mut().is_err());
    drop(second);

    {
        let mut write = value.borrow_mut();
        *write += 1;
        assert!(value.try_borrow().is_err());
        assert!(value.try_borrow_mut().is_err());
    }

    assert_eq!(*value.borrow(), 11);
}
```

La guardia nominata rimane viva fino alla sua distruzione, anche dopo l'ultima lettura. `drop` la consuma; uno scope corto rende esplicito il rilascio. `Ref::clone` duplica la guardia condivisa, non il contenuto: entrambe devono essere rilasciate prima di ottenere un nuovo prestito mutabile.

Il contenitore non richiede `mut` per usare `borrow_mut(&self)`. Il binding della guardia deve invece essere mutabile quando ne usi `DerefMut`, come `let mut write` nel demo.

La regola riguarda la cella intera. Proiettare una guardia su un campo non rende disponibili agli altri chiamanti i campi rimanenti. La divisione di una guardia mutabile in porzioni disgiunte e un'operazione diversa, mostrata piu avanti.

## API / Sintassi

| API | Risultato ed effetto |
| --- | --- |
| `borrow` / `borrow_mut` | Guardia; panic in caso di conflitto. |
| `try_borrow` / `try_borrow_mut` | `Result` con guardia oppure errore di prestito. Non attendono. |
| `get_mut(&mut self)` | `&mut T` senza controllo dinamico: l'esclusivita e gia statica. |
| `into_inner(self)` | Consuma la cella ed estrae `T`. |
| `replace` / `take` | Restituiscono il vecchio valore; richiedono assenza di prestiti attivi. |
| `replace_with` / `swap` | Calcolo del sostituto o scambio; possono fare panic. |

### Gestire il conflitto come risultato

```rust
use std::cell::{BorrowMutError, RefCell};

fn append(
    messages: &RefCell<Vec<String>>,
    message: &str,
) -> Result<(), BorrowMutError> {
    let mut items = messages.try_borrow_mut()?;
    items.push(message.to_owned());
    Ok(())
}

fn main() {
    let messages = RefCell::new(Vec::new());
    let view = messages.borrow();

    assert!(append(&messages, "blocked").is_err());
    assert!(view.is_empty());
    drop(view);

    append(&messages, "saved").unwrap();
    assert_eq!(&*messages.borrow(), &["saved"]);
}
```

Il tentativo fallito non ha aggiunto il messaggio: `?` esce prima della modifica. `BorrowMutError` e un errore utilizzabile con `Result`, non un permesso di ignorare l'operazione richiesta.

Decidi se propagare il conflitto, ripianificare il lavoro o correggere gli scope. Riprovare in un ciclo senza rilasciare la guardia che causa il conflitto non risolve nulla. Le varianti `try_` evitano il panic **del controllo di prestito**, non qualunque panic nel codice successivo.

### Accesso esclusivo, sostituzione ed estrazione

```rust
use std::cell::RefCell;

fn main() {
    let mut text = RefCell::new(String::from("rust"));
    text.get_mut().push('!');

    let previous = text.replace(String::from("next"));
    assert_eq!(previous, "rust!");

    let taken = text.take();
    assert_eq!(taken, "next");
    assert!(text.borrow().is_empty());

    text.get_mut().push_str("owned");
    let owned = text.into_inner();
    assert_eq!(owned, "owned");
}
```

`take` lascia `T::default()` e richiede `T: Default`. `replace` accetta un sostituto esplicito. Nessuna delle due API richiede `Clone`, ma entrambe fanno panic con una guardia attiva. Non sono letture: cambiano il contenuto della cella.

`replace_with` riceve `&mut T` e calcola il nuovo valore; la callback non deve tentare un prestito incompatibile della stessa cella. `swap` fallisce anche se i due argomenti indicano la medesima cella.

Se disponi gia di `&mut RefCell<T>`, `get_mut` evita una guardia runtime. Per estrarre il dato con `into_inner` devi invece poter muovere la cella: non puoi consumarla mentre una guardia ancora utilizzata la prende in prestito.

## Esempio pratico

### Logger con snapshot prima del callback

```rust
use std::cell::{BorrowMutError, RefCell};

#[derive(Default)]
struct Logger {
    messages: RefCell<Vec<String>>,
}

impl Logger {
    fn log(&self, message: &str) -> Result<(), BorrowMutError> {
        let mut messages = self.messages.try_borrow_mut()?;
        messages.push(message.to_owned());
        Ok(())
    }

    fn count(&self) -> usize {
        self.messages.borrow().len()
    }

    fn snapshot(&self) -> Vec<String> {
        self.messages.borrow().clone()
    }

    fn visit(&self, mut visitor: impl FnMut(&str)) {
        let messages = self.snapshot();
        for message in &messages {
            visitor(message);
        }
    }
}

fn main() {
    let logger = Logger::default();
    logger.log("start").unwrap();
    logger.log("ready").unwrap();

    let mut seen = Vec::new();
    logger.visit(|message| {
        seen.push(message.to_owned());
        logger.log(&format!("seen: {message}")).unwrap();
    });

    assert_eq!(seen, ["start", "ready"]);
    assert_eq!(logger.count(), 4);
    assert_eq!(
        logger.snapshot(),
        ["start", "ready", "seen: start", "seen: ready"],
    );
}
```

`log` modifica la lista tramite `&self`. In `snapshot`, `clone()` agisce sul `Vec<String>` attraverso `Deref`: copia i messaggi, non clona una `Ref`. La guardia temporanea e rilasciata prima del ritorno dal metodo.

`visit` non conserva prestiti della cella durante il callback. Il callback puo quindi chiamare nuovamente `log`: questa e **rientranza**, possibile anche senza thread. I nuovi messaggi non entrano nella visita corrente, perche si visita uno snapshot.

Il campo e privato: l'API decide quanto durano i prestiti. `count` e `snapshot` usano `borrow`, quindi farebbero panic se una futura modifica dell'implementazione li chiamasse durante un prestito mutabile. `log` sceglie invece di restituire il conflitto. Questa politica va mantenuta esplicita.

Il demo e in memoria, senza persistenza o limite di crescita. Lo snapshot ha costo proporzionale ai dati; non e un logger di produzione. Se il callback fallisce dopo alcune aggiunte, quelle gia effettuate restano: non c'e rollback automatico.

## Varianti

### Restituire una vista con Ref::map

```rust
use std::cell::{Ref, RefCell};

struct Profile {
    name: String,
    visits: u32,
}

fn name(profile: &RefCell<Profile>) -> Ref<'_, str> {
    Ref::map(profile.borrow(), |value| value.name.as_str())
}

fn main() {
    let profile = RefCell::new(Profile {
        name: String::from("Ada"),
        visits: 0,
    });

    let label = name(&profile);
    assert_eq!(&*label, "Ada");
    assert!(profile.try_borrow_mut().is_err());
    drop(label);

    profile.borrow_mut().visits += 1;
    assert_eq!(profile.borrow().visits, 1);

    let values = RefCell::new(vec![10, 20]);
    let missing = Ref::filter_map(values.borrow(), |v| v.get(8));
    let original = missing.unwrap_err();
    assert_eq!(original.len(), 2);
    assert!(values.try_borrow_mut().is_err());
    drop(original);
    values.borrow_mut().push(30);
}
```

La firma restituisce una guardia che mantiene il prestito, non un `&str` scollegato dalla protezione. `map` consuma la guardia iniziale e ne restituisce una proiettata; il prestito della cella continua senza interruzioni.

`filter_map` gestisce una proiezione opzionale: se non trova il componente, restituisce la **guardia originale in Err**. Conservare quel risultato conserva il prestito. `RefMut::map` e `RefMut::filter_map` offrono le versioni mutabili. Una callback di proiezione puo comunque fare panic per i propri errori.

### Dividere una guardia su parti disgiunte

```rust
use std::cell::{RefCell, RefMut};

fn main() {
    let values = RefCell::new([1, 2, 3, 4]);
    let (mut left, mut right) =
        RefMut::map_split(values.borrow_mut(), |items| {
            items.split_at_mut(2)
        });

    left[0] = 10;
    right[0] = 30;
    drop(left);
    assert!(values.try_borrow().is_err());
    drop(right);

    assert_eq!(*values.borrow(), [10, 2, 30, 4]);
}
```

`map_split` deriva due guardie per zone disgiunte dal prestito gia acquisito. Non sono due chiamate indipendenti a `borrow_mut` sullo stesso oggetto. Il compilatore controlla che la closure produca riferimenti mutabili validi; qui lo garantisce `split_at_mut`.

La cella resta occupata fino al rilascio di entrambe le guardie. La regola introduttiva "un prestito mutabile" non significa che esista sempre un solo oggetto `RefMut`: una guardia puo essere suddivisa senza introdurre alias mutabili sulla stessa zona.

### Trasferire ownership non e condividere riferimenti

Questo programma e valido:

```rust
use std::cell::RefCell;
use std::thread;

fn main() {
    let values = RefCell::new(vec![1, 2]);
    let worker = thread::spawn(move || {
        values.borrow_mut().push(3);
        values.into_inner()
    });

    assert_eq!(worker.join().unwrap(), [1, 2, 3]);
}
```

Il chiamante non conserva accesso alla cella: la muove nel worker e attende il risultato. `RefCell<T>: Send` richiede `T: Send`, oltre ai requisiti del contesto che avvia il thread. `Ref` e `RefMut` non sono invece trasferibili tra thread.

Per condividere stato mutabile tra thread usa un meccanismo sincronizzato, normalmente `Mutex<T>` o `RwLock<T>`. `Arc<RefCell<T>>` da solo non soddisfa i requisiti: il reference counting atomico non sincronizza i prestiti interni.

### Scegliere il contenitore e il clone

- `Cell<T>`: letture per copia quando `T: Copy`, oppure sostituzione/move dell'intero valore. Non richiede che ogni `T` sia `Copy`.
- `Rc<RefCell<T>>`: `Rc` gestisce i proprietari, `RefCell` i prestiti. I cicli forti richiedono ancora una progettazione con `Weak` dove opportuno.
- `Mutex<T>` e `RwLock<T>`: protezione sincronizzata, con contratti diversi da un errore immediato di borrowing.
- `RefCell::clone`: clona `T` in una nuova cella; non condivide automaticamente la cella originale.
- `Rc::clone` su `Rc<RefCell<T>>`: aggiunge un proprietario della medesima cella.

Non serve riprodurre qui grafi e reference counting: vedi [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc<T> e Arc<T>]].

## Errori comuni

### Confondere ultimo uso e distruzione

Questo programma **compila ma fa panic**:

```rust
use std::cell::RefCell;

fn main() {
    let value = RefCell::new(10);
    let read = value.borrow();
    assert_eq!(*read, 10);

    *value.borrow_mut() += 1;
}
```

Il binding `read` non e stato distrutto. Inserisci `drop(read)` prima della scrittura oppure limita la guardia a uno scope. Il fatto che un prestito statico possa terminare all'ultimo utilizzo non implica l'esecuzione anticipata del distruttore della guardia.

### Nascondere una guardia temporanea in if let

Anche questo programma **compila ma fa panic**:

```rust
use std::cell::RefCell;

fn main() {
    let values = RefCell::new(vec![1, 2]);

    if let Some(last) = values.borrow_mut().pop() {
        values.borrow_mut().push(last + 10);
    };
}
```

Il temporaneo `RefMut` nello scrutinee resta vivo nel ramo `Some`. La modifica dell'edition 2024 riguarda il rilascio prima del ramo `else`: non rende valido questo doppio prestito nel ramo positivo.

### Rendere esplicito il confine del prestito

Versione corretta, indipendente da quel dettaglio di edition:

```rust
use std::cell::RefCell;

fn main() {
    let values = RefCell::new(vec![1, 2]);
    let last = {
        let mut items = values.borrow_mut();
        items.pop()
    };

    if let Some(last) = last {
        values.borrow_mut().push(last + 10);
    }

    assert_eq!(*values.borrow(), [1, 12]);
}
```

`pop` restituisce un valore posseduto. Uscendo dal blocco, la guardia puo essere rilasciata prima di acquisirne un'altra. Non generalizzare questa soluzione a un riferimento che dipende ancora dalla guardia.

### Restituire un riferimento senza la guardia

Questo programma **non compila**:

```rust
use std::cell::RefCell;

fn text(value: &RefCell<String>) -> &str {
    value.borrow().as_str()
}

fn main() {}
```

Il riferimento dipende da una guardia temporanea distrutta al ritorno. Le alternative sono una guardia proiettata con `Ref::map`, un valore posseduto come `String`, oppure un callback eseguito mentre il prestito e attivo. Quest'ultima scelta deve documentare la possibile rientranza.

### Condividere una cella attraverso un riferimento

Questo programma **non compila**, anche se i thread sono scoped:

```rust
use std::cell::RefCell;
use std::thread;

fn main() {
    let value = RefCell::new(0);
    thread::scope(|scope| {
        scope.spawn(|| {
            *value.borrow_mut() += 1;
        });
    });
}
```

Lo scope risolve il vincolo di durata dei prestiti, non aggiunge `Sync`. Per questa operazione puoi trasferire ownership, usare un prestito esclusivo appropriato oppure scegliere un contenitore sincronizzato.

### Confondere sicurezza della memoria e coerenza dei dati

- `RefCell` non e una transazione: le modifiche fatte prima di un errore o panic non vengono annullate.
- Durante unwinding le guardie vengono normalmente distrutte, ma non esiste poisoning automatico come politica di recupero. Non usare `catch_unwind` per nascondere invarianti violate; `&RefCell<T>` non e `UnwindSafe`.
- Un `Ref`/`RefMut` dimenticato con `mem::forget` non esegue il rilascio del prestito runtime. `get_mut` non ripristina quel contatore.
- Evita guardie mantenute durante callback non controllati o sospensioni `.await`: il problema puo essere rientranza o prestiti troppo lunghi anche in esecuzione single-thread.
- Ottenere un puntatore con `as_ptr` e sicuro, dereferenziarlo richiede invece `unsafe`. Non e una soluzione ordinaria ai conflitti: rispettare aliasing e lifetime resta obbligatorio.

## Checklist

- Mi serve mutabilita interna oppure basta `&mut self`?
- Sto propagando il conflitto o l'ho deciso esplicitamente come panic?
- Le guardie sono rilasciate prima di rientrare nella stessa API?
- Un `Result` di proiezione conserva ancora una guardia?
- Sto confondendo clone della guardia, del contenuto e del proprietario?
- Il riferimento restituito rimane protetto per tutto il suo uso?
- Voglio trasferire ownership a un thread oppure condividere riferimenti?
- Errori e panic possono lasciare aggiornamenti parziali?
- Gli esempi negativi sono riconosciuti come tali?

## Collegamenti

- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/Cell T|Cell<T>]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc<T> e Arc<T>]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex<T> e RwLock<T>]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/Deref Trait|Deref Trait]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/panic|panic!]]

## Fonti

- [Standard library: RefCell](https://doc.rust-lang.org/std/cell/struct.RefCell.html).
- [Standard library: Ref](https://doc.rust-lang.org/std/cell/struct.Ref.html).
- [Standard library: RefMut](https://doc.rust-lang.org/std/cell/struct.RefMut.html).
- [Standard library: modulo cell](https://doc.rust-lang.org/std/cell/index.html).
- [Standard library: BorrowMutError](https://doc.rust-lang.org/std/cell/struct.BorrowMutError.html).
- [The Rust Book: interior mutability](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html).
- [Rust Reference: distruzione e temporanei](https://doc.rust-lang.org/reference/destructors.html).
- [Edition Guide: temporanei di if let](https://doc.rust-lang.org/edition-guide/rust-2024/temporary-if-let-scope.html).
- [Standard library: Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html).
- [Standard library: thread::spawn](https://doc.rust-lang.org/std/thread/fn.spawn.html).
- [Standard library: UnwindSafe](https://doc.rust-lang.org/std/panic/trait.UnwindSafe.html).
- [Standard library: RefUnwindSafe](https://doc.rust-lang.org/std/panic/trait.RefUnwindSafe.html).
- [Standard library: mem::forget](https://doc.rust-lang.org/std/mem/fn.forget.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

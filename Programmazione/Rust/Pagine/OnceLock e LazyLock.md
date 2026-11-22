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
  - OnceLock
  - LazyLock
  - Lazy initialization Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
  - "[[Programmazione/Rust/Pagine/Mutex T e RwLock T]]"
  - "[[Programmazione/Rust/Pagine/const e static]]"
related:
  - "[[Programmazione/Rust/Pagine/Cell T]]"
  - "[[Programmazione/Rust/Pagine/Configurazione applicativa]]"
  - "[[Programmazione/Rust/Pagine/Shared state]]"
title: OnceLock e LazyLock
---

# OnceLock e LazyLock

## Sintesi

`OnceLock<T>` e `LazyLock<T, F>` coordinano l'inizializzazione di un valore condiviso. Dopo il completamento puoi ottenere `&T` senza conservare una guardia come quella di un mutex.

- **OnceLock** parte vuoto: il chiamante fornisce un valore a `set` oppure una funzione a `get_or_init`.
- **LazyLock** conserva gia l'inizializzatore: dereferenziazione o `LazyLock::force` lo eseguono al primo bisogno.
- Un panic lascia **OnceLock riutilizzabile**, ma avvelena **LazyLock**: le successive forzature fanno panic.

Non sono necessariamente globali, non rendono qualsiasi `T` thread-safe e non sono un sistema di aggiornamento della configurazione.

Esempi verificati con **Rust 1.99.1, edition 2024**: otto programmi eseguibili, uno dei quali intercetta panic intenzionali, e due controesempi che non compilano. La baseline non e una MSRV.

## Quando usarlo

- `OnceLock`: configurazione validata all'avvio, dato ricevuto da un produttore o calcolo con input forniti dal chiamante.
- `LazyLock`: tabella o struttura costruita con una funzione gia nota, rinviando il costo fino al primo uso.
- Un campo in una struct: inizializzazione separata dalla costruzione del proprietario, senza imporre uno static globale.
- `OnceCell` / `LazyCell` in `std::cell`: accesso condiviso nello stesso thread, quando la sincronizzazione non serve.

Per dipendenze obbligatorie spesso e piu chiaro costruire una configurazione normale e passarla ai componenti. Se il valore deve cambiare durante il servizio, progetta un protocollo di aggiornamento con ownership, messaggi o lock.

## Come funziona

### Impostare un valore e osservare il rifiuto

```rust
use std::sync::OnceLock;

fn main() {
    let name = OnceLock::new();
    assert!(name.get().is_none());

    assert_eq!(name.set(String::from("primary")), Ok(()));
    let rejected = name.set(String::from("secondary")).unwrap_err();
    assert_eq!(rejected, "secondary");

    let current = name.get_or_init(|| panic!("initializer must not run"));
    assert_eq!(current, "primary");
    assert!(std::ptr::eq(current, name.get().unwrap()));
}
```

Il secondo `set` restituisce il **nuovo valore rifiutato**, non quello conservato. Scrivere `set(value).ok()` e ignorare il risultato nasconde un conflitto: scegli se rifiutarlo, segnalarlo o accettare esplicitamente il vincitore.

L'argomento di `set` viene costruito prima della chiamata. Il corpo della closure di `get_or_init`, invece, viene eseguito solo se necessario. Anche una closure non eseguita puo possedere catture che verranno distrutte.

Il riferimento ottenuto e legato al proprietario della cella. Qui e locale, non `'static`; non puoi usarlo dopo aver distrutto `name`.

### Inizializzatore dichiarato con LazyLock

```rust
use std::collections::BTreeMap;
use std::sync::LazyLock;

static CONTENT_TYPES: LazyLock<BTreeMap<&'static str, &'static str>> =
    LazyLock::new(|| {
        BTreeMap::from([
            ("css", "text/css"),
            ("html", "text/html"),
            ("json", "application/json"),
        ])
    });

fn main() {
    assert!(LazyLock::get(&CONTENT_TYPES).is_none());
    let types = LazyLock::force(&CONTENT_TYPES);
    assert_eq!(types.get("html"), Some(&"text/html"));
    assert_eq!(CONTENT_TYPES.get("json"), Some(&"application/json"));
    assert!(std::ptr::eq(types, LazyLock::force(&CONTENT_TYPES)));
}
```

`CONTENT_TYPES.get("json")` e il metodo della mappa, raggiunto tramite dereferenziazione: puo inizializzare il valore. `LazyLock::get(&CONTENT_TYPES)` e invece un'ispezione del contenitore che non forza l'inizializzazione.

`&CONTENT_TYPES` da solo prende un riferimento al wrapper. Per ottenere il dato usa `force` o una dereferenziazione. In una funzione puoi creare un `LazyLock` locale che cattura valori locali: la closure non deve essere per forza una funzione globale.

## API / Sintassi

| API | Cosa ricordare |
| --- | --- |
| `OnceLock::get` | Restituisce un valore opzionale; non attende e non inizializza. |
| `get_or_init` | Fornisce il dato, inizializzandolo se necessario. Puo attendere. |
| `set` | Tenta di installare il valore; puo attendere un inizializzatore concorrente. |
| `wait` | Attende che qualcuno completi l'inizializzazione; non la avvia. |
| `get_mut` | Con accesso esclusivo, legge un eventuale riferimento mutabile. |
| `take` | Richiede accesso esclusivo; estrae e lascia OnceLock vuoto. |
| `into_inner` | Consuma OnceLock e restituisce il valore opzionale. |
| `LazyLock::force` | Forza la funzione memorizzata e restituisce il dato. |
| `LazyLock::get` | Ispeziona senza forzare; None anche se il lazy e avvelenato. |
| `LazyLock::force_mut` | Forza e restituisce accesso mutabile con un prestito esclusivo. |

`OnceLock::get` restituisce `None` anche **durante** un'inizializzazione in corso. Non significa che il dato non arrivera mai. `wait` puo attendere indefinitamente se nessuno pubblica il valore.

Versioni delle API usate o confrontate:

- `OnceLock` e API fondamentali: stable da **1.70**.
- `LazyLock` e `force`: da **1.80**.
- `OnceLock::wait`: da **1.86**.
- `LazyLock::get`, `get_mut` e `force_mut`: da **1.94**.
- Nella baseline `OnceLock::get_or_try_init`, `get_mut_or_init`, `try_insert` e `LazyLock::into_inner` sono ancora nightly.

La stabilita di un tipo non rende automaticamente stabili tutti i metodi visibili nella documentazione. Controlla anche la versione minima del progetto. [OnceLock](https://doc.rust-lang.org/std/sync/struct.OnceLock.html), [LazyLock](https://doc.rust-lang.org/std/sync/struct.LazyLock.html).

## Esempio pratico

### Una sola inizializzazione riuscita fra piu thread

```rust
use std::sync::{OnceLock, atomic::{AtomicUsize, Ordering}};
use std::thread;

fn main() {
    let value = OnceLock::new();
    let calls = AtomicUsize::new(0);

    thread::scope(|scope| {
        for _ in 0..8 {
            scope.spawn(|| {
                let text = value.get_or_init(|| {
                    calls.fetch_add(1, Ordering::Relaxed);
                    String::from("ready")
                });
                assert_eq!(text, "ready");
            });
        }
    });

    assert_eq!(calls.load(Ordering::Relaxed), 1);
    assert_eq!(value.get().map(String::as_str), Some("ready"));
}
```

I thread scoped sono attesi prima delle asserzioni finali. Il contatore misura soltanto le esecuzioni della closure; la pubblicazione del dato e coordinata da `OnceLock`, non da quel contatore con ordering `Relaxed`.

Senza panic un solo inizializzatore viene eseguito e tutti osservano il valore conservato. Se i chiamanti propongono risultati diversi, non scegliere il vincitore basandoti sull'ordine di creazione dei thread.

Metti il lavoro costoso dentro la closure: calcolare prima un candidato in ogni thread e poi passarlo a `get_or_init` non evita calcoli duplicati.

### Osservare un'inizializzazione in corso

```rust
use std::sync::{OnceLock, mpsc};
use std::thread;

fn main() {
    let value = OnceLock::new();
    let (started_tx, started_rx) = mpsc::channel();
    let (release_tx, release_rx) = mpsc::channel();

    thread::scope(|scope| {
        let cell = &value;
        let producer = scope.spawn(move || {
            cell.get_or_init(|| {
                started_tx.send(()).unwrap();
                release_rx.recv().unwrap();
                String::from("published")
            })
        });

        started_rx.recv().unwrap();
        assert!(value.get().is_none());
        release_tx.send(()).unwrap();

        assert_eq!(value.wait(), "published");
        assert_eq!(producer.join().unwrap(), "published");
    });
}
```

I canali rendono osservabile lo stato intermedio senza affidarsi a pause temporali: prima del messaggio di rilascio, l'inizializzatore non puo terminare. `get` non resta in attesa.

Dopo il rilascio, `wait` restituisce il valore completo, che potrebbe essere gia pronto quando viene chiamato. Non chiamarlo prima di sbloccare un produttore che dipende da te: creeresti un ciclo di attesa.

### Configurazione esplicita prima di avviare il servizio

```rust
use std::sync::OnceLock;

#[derive(Debug)]
struct Settings {
    port: u16,
}

static SETTINGS: OnceLock<Settings> = OnceLock::new();

fn install_settings(raw_port: &str) -> Result<(), &'static str> {
    let port = raw_port.parse::<u16>().map_err(|_| "invalid port")?;
    if port == 0 {
        return Err("port must be nonzero");
    }
    SETTINGS.set(Settings { port }).map_err(|_| "already configured")
}

fn settings() -> Option<&'static Settings> {
    SETTINGS.get()
}

fn main() {
    assert!(settings().is_none());
    assert_eq!(install_settings("bad"), Err("invalid port"));
    assert!(settings().is_none());

    assert_eq!(install_settings("8080"), Ok(()));
    assert_eq!(settings().unwrap().port, 8080);
    assert_eq!(install_settings("9090"), Err("already configured"));
    assert_eq!(settings().unwrap().port, 8080);
}
```

Il parsing fallisce **prima** di occupare la cella. Nessun default viene scelto accidentalmente dal primo consumer: il chiamante valida e installa, poi avvia i componenti. In questo dominio la porta zero e vietata deliberatamente; non e una regola generale delle API di rete.

Il riferimento e `'static` perche lo e `SETTINGS`, non perche ogni `OnceLock` prolunghi la vita dei dati. Il demo non legge file o ambiente e non apre connessioni.

In un progetto reale conviene un tipo d'errore e, quando possibile, una `Settings` passata esplicitamente. Uno static e condiviso anche dai test nello stesso processo: crea istanze locali quando servono configurazioni indipendenti.

### Memorizzare un errore e una scelta diversa dal retry

```rust
use std::sync::OnceLock;

fn main() {
    let port: OnceLock<Result<u16, &'static str>> = OnceLock::new();

    let first = port.get_or_init(|| {
        "invalid".parse::<u16>().map_err(|_| "invalid port")
    });
    assert_eq!(first, &Err("invalid port"));

    let second = port.get_or_init(|| Ok(8080));
    assert_eq!(second, &Err("invalid port"));
    assert!(std::ptr::eq(first, second));
}
```

Qui `Err` e il **valore memorizzato**: la cella e inizializzata e la seconda closure non riprova il parsing. Lo stesso principio vale per `LazyLock<Result<T, E>>`: un normale `Err` non e un panic e non avvelena il lazy.

Per un retry esplicito su stable puoi validare prima e usare `set`, come nell'esempio di configurazione. Con piu produttori questo puo duplicare il lavoro: gestisci il valore rifiutato e non spacciare il pattern per una versione generale di `get_or_try_init`.

Se servono tentativi serializzati, scadenze o invalidazione, progetta uno stato esplicito protetto da lock o usa un'API verificata che offra proprio quel contratto.

## Varianti

### Panic: nuovo tentativo o poisoning permanente

Questo programma intercetta panic intenzionali su dati locali controllati:

```rust
use std::panic::catch_unwind;
use std::sync::{LazyLock, OnceLock};

fn main() {
    let once = OnceLock::<u32>::new();
    assert!(catch_unwind(|| {
        once.get_or_init(|| panic!("once failed"))
    }).is_err());

    assert!(once.get().is_none());
    assert_eq!(once.get_or_init(|| 42), &42);

    let lazy: LazyLock<u32> = LazyLock::new(|| panic!("lazy failed"));
    assert!(catch_unwind(|| LazyLock::force(&lazy)).is_err());
    assert!(catch_unwind(|| LazyLock::force(&lazy)).is_err());
    assert!(LazyLock::get(&lazy).is_none());
}
```

I messaggi su stderr sono attesi. Il secondo accesso al lazy non richiama la closure: fallisce per il poisoning permanente. Non esiste un recupero analogo a `Mutex::clear_poison` per riusare quel medesimo inizializzatore.

Un nuovo tentativo su OnceLock non annulla gli effetti esterni di quello fallito. Non trasformare quindi “inizializzazione singola” in una promessa di esecuzione esattamente una volta di I/O o altre azioni.

`catch_unwind` serve qui a osservare il comportamento, non come strategia ordinaria per errori previsti. Intercetta unwinding, non `panic=abort`, e non sopprime il panic hook. [catch_unwind](https://doc.rust-lang.org/std/panic/fn.catch_unwind.html).

### Accesso esclusivo a contenitori locali

```rust
use std::sync::{LazyLock, OnceLock};

fn main() {
    let mut once = OnceLock::new();
    once.set(String::from("first")).unwrap();
    once.get_mut().unwrap().push('!');

    assert_eq!(once.take().as_deref(), Some("first!"));
    assert!(once.get().is_none());
    once.set(String::from("second")).unwrap();
    assert_eq!(once.into_inner().as_deref(), Some("second"));

    let prefix = String::from("local");
    let mut lazy = LazyLock::new(move || prefix);
    assert!(LazyLock::get_mut(&mut lazy).is_none());
    LazyLock::force_mut(&mut lazy).push('!');
    assert_eq!(&*lazy, "local!");
}
```

`OnceLock::take` richiede `&mut self`: non puo invalidare riferimenti condivisi ancora in uso. Questo permette riuso di una cella **locale ed esclusiva**, non reset concorrente di uno static condiviso.

Analogamente `LazyLock::force_mut` richiede un prestito esclusivo. Non reinizializza la closure: consente di modificare il valore. Il tipo completo e `LazyLock<T, F>`; nelle closure con catture il compilatore puo inferire `F`, mentre la forma annotata `LazyLock<T>` usa per default un puntatore a funzione.

### Sincronizzazione e ciclo di vita

- `OnceLock<T>` e `Send` se `T: Send`, ed e `Sync` se `T: Send + Sync`.
- Per `LazyLock<T, F>` conta anche l'inizializzatore: per `Send` servono `T: Send` e `F: Send`; per `Sync`, anche `T: Sync`.
- `OnceCell` e `LazyCell` sono `!Sync`: non si condividono per riferimento fra thread. Questo non significa che nessuna loro istanza possa essere trasferita con ownership.
- Per ownership condivisa puoi usare `Arc`; clonare direttamente un `OnceLock<T>` clonabile crea un'altra cella, non un nuovo proprietario della stessa.
- `OnceLock<Mutex<T>>` o `LazyLock<Mutex<T>>` inizializzano il contenitore una volta; le modifiche successive seguono il protocollo del mutex.
- I contenitori locali distruggono normalmente cio che possiedono. Gli static non eseguono `Drop` alla fine del processo: non affidare a uno static il flush o la chiusura applicativa indispensabile. [Static items](https://doc.rust-lang.org/reference/items/static-items.html).

## Errori comuni

### Credere che il risultato sia sempre statico

Questo programma **non compila**:

```rust
use std::sync::OnceLock;

fn name() -> &'static str {
    let value = OnceLock::new();
    value.get_or_init(|| String::from("local")).as_str()
}

fn main() {}
```

Il contenitore viene distrutto quando la funzione termina. Restituisci una `String` posseduta, oppure usa una cella appartenente al chiamante e collega il risultato al suo lifetime.

### Pensare che la cella sincronizzata renda ogni dato Sync

Questo programma **non compila**:

```rust
use std::cell::Cell;
use std::sync::OnceLock;

static COUNTER: OnceLock<Cell<u32>> = OnceLock::new();

fn main() {}
```

Dopo l'inizializzazione i lettori potrebbero ottenere contemporaneamente `&Cell<u32>`, ma `Cell` non e `Sync`. Per aggiornamenti condivisi serve un tipo adatto, per esempio un atomico o un dato protetto da mutex.

### Dipendenze circolari, const e lavoro bloccante

- Non inizializzare ricorsivamente la stessa cella, nemmeno indirettamente tramite un altro lazy. Per OnceLock l'esito preciso della rientranza non e specificato: puo bloccarsi. Non usarla come meccanismo di attesa.
- Se A attende B e B attende A, la sincronizzazione non risolve il ciclo. Rendi esplicito l'ordine di costruzione.
- Usa `static`, non `const`, per un'unica cella globale. Una costante non identifica una singola allocazione condivisa; un lazy costante puo quindi essere ricreato nei punti d'uso. [Constant items](https://doc.rust-lang.org/reference/items/constant-items.html).
- Non basare la configurazione sul thread che arriva per primo con un default: scegli input e precedenze prima dell'accesso concorrente.
- `LazyLock::new` non esegue subito la closure: un costo o errore puo emergere nel primo punto di utilizzo. `force` all'avvio rende esplicito quel momento.
- Le primitive standard attendono bloccando il thread e gli inizializzatori sono sincroni. Una closure async produrrebbe un Future memorizzato, non un'inizializzazione attesa automaticamente. Per quel caso serve un protocollo async appropriato.

## Checklist

- Il valore deve essere globale oppure appartiene a una struct?
- Voglio installare input espliciti o conservare una closure gia nota?
- Devo osservare senza attendere, attendere o inizializzare?
- Gestisco il valore rifiutato da set?
- Un Err deve restare memorizzato o consentire un nuovo tentativo?
- Gli effetti di un inizializzatore fallito possono essere ripetuti?
- Esistono dipendenze circolari o attese sullo stesso thread?
- Il tipo contenuto e le catture soddisfano i bound necessari?
- I test hanno celle indipendenti?
- Le API sono disponibili nella versione minima del progetto?

## Collegamenti

- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex<T> e RwLock<T>]]
- [[Programmazione/Rust/Pagine/Cell T|Cell<T>]]
- [[Programmazione/Rust/Pagine/const e static|const e static]]
- [[Programmazione/Rust/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Programmazione/Rust/Pagine/Shared state|Shared state]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc<T> e Arc<T>]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/panic|panic!]]
- [[Programmazione/Rust/Pagine/Async Await|Async/Await]]

## Fonti

- [Standard library: OnceLock e stabilita delle API](https://doc.rust-lang.org/std/sync/struct.OnceLock.html).
- [Standard library: LazyLock e poisoning](https://doc.rust-lang.org/std/sync/struct.LazyLock.html).
- [Implementazione ufficiale di LazyLock](https://doc.rust-lang.org/src/std/sync/lazy_lock.rs.html).
- [Standard library: OnceCell](https://doc.rust-lang.org/std/cell/struct.OnceCell.html).
- [Standard library: LazyCell](https://doc.rust-lang.org/std/cell/struct.LazyCell.html).
- [Rust Reference: static items](https://doc.rust-lang.org/reference/items/static-items.html).
- [Rust Reference: constant items](https://doc.rust-lang.org/reference/items/constant-items.html).
- [Standard library: catch_unwind](https://doc.rust-lang.org/std/panic/fn.catch_unwind.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

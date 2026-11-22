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
  - compile-time-e-type-level-programming
aliases:
  - const
  - static
  - Costanti Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Tipi di dato primitivi]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Mutabilita]]"
related:
  - "[[Programmazione/Rust/Pagine/const fn]]"
  - "[[Programmazione/Rust/Pagine/OnceLock e LazyLock]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
title: const e static
---

# const e static

## Sintesi

`const` da un nome a un **valore calcolato a compile time**; `static` dichiara una **allocazione che dura per tutto il programma**. Entrambi richiedono un tipo esplicito e un inizializzatore costante, ma solo `static` identifica una cella condivisa.

Dire che una costante viene "inlined" descrive l'uso del valore, anche se non e `Copy`: non promette istruzioni macchina, copie fisiche o un indirizzo unico. [Constant items](https://doc.rust-lang.org/reference/items/constant-items.html).

Esempi verificati con **Rust 1.99.1, edition 2024**, standard library: sette programmi validi e quattro controesempi dichiarati. Questa baseline non e una MSRV.

## Quando usarlo

| Esigenza | Scelta |
| --- | --- |
| Limite, dimensione, valore di default | `const` |
| Valore legato a un tipo | Costante associata |
| Una sola istanza condivisa | `static` |
| Costruzione al primo accesso | `static LazyLock<T>` |
| Inizializzazione con input runtime | `OnceLock<T>`, o dipendenza esplicita |
| Aggiornamenti condivisi | `static Mutex<T>` o atomico appropriato |
| Valore locale calcolato a runtime | `let` |

Una configurazione passata alle funzioni e spesso piu semplice da isolare nei test di uno stato globale. Usa uno static quando la condivisione per l'intero processo e parte del progetto.

## Come funziona

### Valore, allocazione e visibilita

Una costante puo comparire in un modulo, blocco o `impl`; non e necessariamente pubblica. Gli static possono essere dichiarati anche dentro una funzione: lo scope del nome non riduce la durata del dato.

Per `static APP_NAME: &str = "notes";`, la cella contiene un riferimento alla stringa, non i suoi caratteri. `&APP_NAME` e un riferimento alla cella; `APP_NAME` copia il valore `&str`, che e `Copy`.

Riferimenti allo stesso static individuano la stessa allocazione. Per static di dimensione non nulla, allocazioni di static distinti sono separate; non estendere questa garanzia agli zero-sized types o ai confronti con costanti e valori promossi. [Static items](https://doc.rust-lang.org/reference/items/static-items.html).

### Inizializzazione e valutazione costante

Gli inizializzatori di `const` e `static` sono contesti costanti: non possono leggere liberamente file, rete o ambiente del processo. Solo le operazioni ammesse in const evaluation sono disponibili; una normale `fn` non diventa invocabile qui solo perche restituisce un numero fisso.

Una `const fn` puo essere chiamata anche a runtime. `let x = 2 + 3;` non impone valutazione costante: il compilatore puo ottimizzarlo, ma questa e una questione distinta. [Constant evaluation](https://doc.rust-lang.org/reference/const_eval.html).

### Durata, riferimenti e distruzione

- Un riferimento contenuto nel tipo di una costante o di uno static usa normalmente `'static` quando il lifetime e omesso, come in `const NAME: &str = "notes";`.
- Prendere `&COSTANTE` non garantisce invece sempre un riferimento `'static`: puo essere un temporaneo. La promozione dipende dal valore, non soltanto dalla parola `const`.
- Un tipo con `Drop` puo essere il tipo di una costante; i valori prodotti nei punti d'uso seguono le normali regole di distruzione.
- Gli static non eseguono `Drop` alla fine del programma. Non affidare loro un flush indispensabile: prevedi una chiusura esplicita.

Fonti: [constant items](https://doc.rust-lang.org/reference/items/constant-items.html), [static e distruzione](https://doc.rust-lang.org/std/keyword.static.html), [Drop](https://doc.rust-lang.org/std/ops/trait.Drop.html).

Il bound `T: 'static` non significa "oggetto che non viene mai distrutto": un `String` posseduto puo soddisfarlo e restare locale. Vedi [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]].

## API / Sintassi

### Limiti e costanti associate

Ogni blocco valido e un programma autonomo. Le asserzioni rendono osservabile il risultato senza dipendenze esterne.

```rust
const MAX_RETRIES: u32 = 3;
const DEFAULT_PORT: u16 = 8080;

struct ServerConfig {
    port: u16,
}

impl ServerConfig {
    const MAX_USERS: usize = 1000;
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self { port: DEFAULT_PORT }
    }
}

fn main() {
    let config = ServerConfig::default();
    let slots = [false; ServerConfig::MAX_USERS];

    assert_eq!(config.port, 8080);
    assert_eq!(slots.len(), 1000);
    assert_eq!(MAX_RETRIES, 3);
}
```

`ServerConfig::MAX_USERS` appartiene al tipo, non a una singola configurazione; non serve creare un'istanza per accedervi. Anche i trait possono dichiarare costanti associate, eventualmente con un default. [Associated constants](https://doc.rust-lang.org/reference/items/associated-items.html#associated-constants).

### Riferimenti alla stessa allocazione

```rust
static APP_NAME: &str = "notes";

fn app_name_slot() -> &'static &'static str {
    &APP_NAME
}

fn main() {
    let first = app_name_slot();
    let second = app_name_slot();

    assert!(std::ptr::eq(first, second));
    assert_eq!(*first, "notes");
}
```

Il confronto riguarda la cella `APP_NAME`. Non usare due prestiti di una `const` come test di identita: gli indirizzi potrebbero coincidere oppure no.

### Costante non Copy e Drop

```rust
struct Ticket(u32);

impl Drop for Ticket {
    fn drop(&mut self) {
        println!("drop {}", self.0);
    }
}

const DEFAULT_TICKET: Ticket = Ticket(7);

fn main() {
    let first = DEFAULT_TICKET;
    let second = DEFAULT_TICKET;

    assert_eq!(first.0, second.0);
    drop(first);
    drop(second);
}
```

Stampa `drop 7` due volte. Non avviene un move da una variabile globale condivisa: ogni uso fornisce un valore. `Ticket` non e `Copy` e non implementa `Clone`; non serve chiamare un costruttore runtime per produrre questi valori.

## Esempio pratico

### Inizializzare al primo accesso

```rust
use std::sync::LazyLock;

static CONFIG_PATH: LazyLock<String> =
    LazyLock::new(|| String::from("config.toml"));

fn main() {
    let first = LazyLock::force(&CONFIG_PATH);
    let second = LazyLock::force(&CONFIG_PATH);

    assert_eq!(first, "config.toml");
    assert!(std::ptr::eq(first, second));
}
```

`LazyLock::new` prepara il contenitore a compile time; la closure costruisce la `String` a runtime al primo accesso. Gli accessi successivi usano lo stesso valore. Un accesso concorrente durante l'inizializzazione puo bloccare il thread.

L'esempio non apre un file. Se il caricamento puo fallire, considera `LazyLock<Result<Config, Error>>` oppure una fase di inizializzazione esplicita. Un panic nell'inizializzatore avvelena il lazy; non e una strategia di retry. `LazyLock` e stabile da Rust 1.80; il dettaglio delle API va controllato per la propria MSRV. [LazyLock](https://doc.rust-lang.org/std/sync/struct.LazyLock.html).

Per configurazione ricevuta in `main`, [[Programmazione/Rust/Pagine/OnceLock e LazyLock|OnceLock e LazyLock]] mostra come impostare una cella e gestire un secondo tentativo.

### Mutabilita condivisa senza static mut

```rust
use std::sync::Mutex;
use std::thread;

static COUNTER: Mutex<u64> = Mutex::new(0);

fn increment() {
    let mut count = COUNTER.lock().expect("counter poisoned");
    *count += 1;
}

fn main() {
    let workers: Vec<_> = (0..4)
        .map(|_| thread::spawn(increment))
        .collect();

    for worker in workers {
        worker.join().expect("worker panicked");
    }

    let count = *COUNTER.lock().expect("counter poisoned");
    assert_eq!(count, 4);
}
```

La dichiarazione non contiene `mut`: la modifica passa attraverso il guard del mutex, che rilascia il lock alla fine dello scope. Il tipo dello static condiviso deve essere `Sync`; `Mutex<u64>` lo e, `Cell<u64>` no.

`expect` rende esplicita la scelta del demo di terminare su poisoning; non e una politica universale di recupero. Evita di mantenere il guard durante I/O o attese inutili. [Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html).

Per un semplice contatore puo bastare un atomico: il memory ordering dipende dal protocollo, non dal fatto che sia static. Vedi [[Programmazione/Rust/Pagine/Mutex RwLock e Atomics|Mutex, RwLock e atomici]].

## Varianti

### Una const con interior mutability non e un singleton

```rust
use std::cell::Cell;

const EMPTY_COUNTER: Cell<u32> = Cell::new(0);

fn main() {
    let first = EMPTY_COUNTER;
    let second = EMPTY_COUNTER;
    first.set(10);

    assert_eq!(first.get(), 10);
    assert_eq!(second.get(), 0);
    assert_eq!(EMPTY_COUNTER.get(), 0);
}
```

Sono celle indipendenti, non aggiornamenti a una variabile globale. Lo stesso errore progettuale si presenta con un lazy o un lock dichiarato `const`: per condividere una sola istanza usa `static`. Clippy puo segnalare costanti con interior mutability: qui e un controesempio eseguibile, non uno stile consigliato.

### Uno static dentro una funzione generica resta unico

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

fn next_id<T>() -> usize {
    static NEXT: AtomicUsize = AtomicUsize::new(0);
    let _ = std::mem::size_of::<T>();
    NEXT.fetch_add(1, Ordering::Relaxed)
}

fn main() {
    assert_eq!(next_id::<u8>(), 0);
    assert_eq!(next_id::<u16>(), 1);
    assert_eq!(next_id::<u8>(), 2);
}
```

Non nasce un contatore per ogni `T`. Qui `Relaxed` basta per incrementare il singolo contatore, non pubblica altri dati; `fetch_add` puo fare wrap, quindi il demo non promette ID unici per un numero illimitato di chiamate. [Statics e generics](https://doc.rust-lang.org/reference/items/static-items.html#statics--generics).

Per stato distinto per thread esiste `thread_local!`, che e un'altra scelta rispetto a uno static condiviso. Per altri usi di `const`, prosegui con [[Programmazione/Rust/Pagine/const fn|const fn]] e [[Programmazione/Rust/Pagine/Const generics|Const generics]].

## Errori comuni

I quattro blocchi seguenti **non compilano intenzionalmente**. Sono separati dai programmi validi.

### Chiamare una normale funzione in un inizializzatore

```rust
fn default_port() -> u16 {
    8080
}

const PORT: u16 = default_port();

fn main() {
    println!("{PORT}");
}
```

Errore `E0015`: il corpo e semplice, ma la funzione non e `const fn`. Cambia il contratto della funzione se le operazioni sono ammesse, oppure usa `let` a runtime. Sostituire soltanto `const PORT` con `static PORT` non risolve il problema.

### Usare un tipo non Sync come static condiviso

```rust
use std::cell::Cell;

static COUNTER: Cell<u32> = Cell::new(0);

fn main() {}
```

Errore `E0277`: `Cell` non offre sincronizzazione fra thread. Scegli un mutex, un atomico o dati locali. Non aggiungere `unsafe impl Sync` per aggirare il controllo.

### Spostare un valore non Copy fuori da uno static

```rust
static NAME: String = String::new();

fn main() {
    let owned = NAME;
    drop(owned);
}
```

Errore `E0507`: lo static non puo essere svuotato con un move. Usa un prestito oppure, quando serve un valore posseduto distinto, una clonazione esplicita. `String::new()` e ammessa qui: "String sempre vietata a compile time" sarebbe una generalizzazione sbagliata.

### Supporre che ogni prestito di const sia statico

```rust
use std::cell::Cell;

const EMPTY_COUNTER: Cell<u32> = Cell::new(0);

fn counter() -> &'static Cell<u32> {
    &EMPTY_COUNTER
}

fn main() {}
```

Errore `E0515`: restituisce un riferimento a un temporaneo non promuovibile. Restituisci `Cell<u32>` per valore, oppure usa un contenitore condiviso appropriato con un proprietario di durata sufficiente.

### Usare static mut come scorciatoia

Lettura e scrittura di `static mut` richiedono `unsafe`; cio non introduce un lock e non prova assenza di alias incompatibili o data race. In edition 2024 il lint `static_mut_refs` e `deny` per default: creare riferimenti condivisi o mutabili viene rifiutato anche dentro `unsafe`. Non significa che l'intera sintassi `static mut` sia stata rimossa.

Raw pointer e abbassamento del lint non rendono corretto un protocollo: i casi FFI o embedded richiedono invarianti esplicite. Preferisci le astrazioni sicure mostrate sopra. [Edition Guide: static mut references](https://doc.rust-lang.org/edition-guide/rust-2024/static-mut-references.html).

## Checklist

- Mi serve un valore o un'istanza condivisa?
- Ho distinto lo scope del nome dalla durata del dato?
- L'inizializzatore e valido nel compilatore minimo supportato?
- La costruzione runtime e esplicita o lazy?
- Il dato condiviso e `Sync` e gli aggiornamenti sono sincronizzati?
- Sto facendo assunzioni non garantite sull'indirizzo di una costante?
- Ho previsto cleanup esplicito e isolamento dei test per lo stato globale?

## Collegamenti

- [[Programmazione/Rust/Pagine/const fn|const fn]]
- [[Programmazione/Rust/Pagine/Const generics|Const generics]]
- [[Programmazione/Rust/Pagine/OnceLock e LazyLock|OnceLock e LazyLock]]
- [[Programmazione/Rust/Pagine/Default|Default]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync]]
- [[Programmazione/Rust/Pagine/Mutex T e RwLock T|Mutex e RwLock]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]
- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]

## Fonti

- [Rust Reference: constant items](https://doc.rust-lang.org/reference/items/constant-items.html).
- [Rust Reference: static items](https://doc.rust-lang.org/reference/items/static-items.html).
- [Rust Reference: constant evaluation](https://doc.rust-lang.org/reference/const_eval.html).
- [Standard library: const](https://doc.rust-lang.org/std/keyword.const.html) e [static](https://doc.rust-lang.org/std/keyword.static.html).
- [Rust Reference: associated constants](https://doc.rust-lang.org/reference/items/associated-items.html#associated-constants).
- [Standard library: LazyLock](https://doc.rust-lang.org/std/sync/struct.LazyLock.html), [Mutex](https://doc.rust-lang.org/std/sync/struct.Mutex.html) e [Drop](https://doc.rust-lang.org/std/ops/trait.Drop.html).
- [Edition Guide: riferimenti a static mut](https://doc.rust-lang.org/edition-guide/rust-2024/static-mut-references.html).

Consultate il 2026-11-17. Le pagine online possono avanzare rispetto alla toolchain del laboratorio; i risultati degli esempi si riferiscono a Rust 1.99.1, non a ogni versione o piattaforma.

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

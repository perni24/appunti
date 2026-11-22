---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - standard-library
aliases:
  - Default trait
  - Default Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
  - "[[Programmazione/Rust/Pagine/Structs]]"
related:
  - "[[Programmazione/Rust/Pagine/Builder pattern]]"
  - "[[Programmazione/Rust/Pagine/Configurazione applicativa]]"
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
title: Default
---

# Default

## Sintesi

`Default` descrive come costruire un valore iniziale scelto dal tipo. Non inizializza automaticamente le variabili, non chiama necessariamente `new()` e non equivale ad azzerare la memoria.

Il default deve avere un significato utile nel dominio. Se mancano credenziali, percorsi obbligatori o altri dati indispensabili, e preferibile un costruttore con parametri o un builder fallibile.

## Quando usarlo

- Un tipo possiede uno stato iniziale naturale, per esempio una collezione vuota.
- Una configurazione ha opzioni realmente facoltative e valori iniziali documentati.
- Un algoritmo generico deve costruire un valore con `T: Default`.
- Vuoi usare API come `unwrap_or_default()`, `entry().or_default()` o `mem::take()`.

Per una configurazione finale che richiede dati obbligatori, puo essere sensato implementare `Default` sul **builder incompleto**, non sul tipo finale: `build()` deve comunque verificare cio che manca.

## Come funziona

### Derive e costruzione esplicita

I blocchi Rust sono programmi autonomi. I due controesempi nella sezione Errori comuni sono intenzionalmente non compilabili.

```rust
#[derive(Debug, Default, PartialEq)]
struct Config {
    debug: bool,
    retries: u32,
}

fn make<T: Default>() -> T {
    T::default()
}

fn main() {
    let config = Config::default();
    assert_eq!(config, Config { debug: false, retries: 0 });

    let inferred: Config = Default::default();
    let generic = make::<Config>();
    assert_eq!(inferred, generic);

    let customized = Config {
        debug: true,
        ..Default::default()
    };
    assert!(customized.debug);
    assert_eq!(customized.retries, 0);
}
```

Il derive della struct usa il default di ogni campo: qui `false` e `0`. Non sa se zero tentativi sia la scelta corretta per l'applicazione.

`Default::default()` richiede un tipo deducibile dal contesto. `Config::default()` lo rende esplicito; `make::<Config>()` passa il tipo al generico.

Il literal con `..` costruisce comunque una **struct completa**. Senza una base, omettere un campo resta un errore: il derive non abilita l'inizializzazione implicita dei campi mancanti.

### Enum con una variante iniziale dichiarata

```rust
struct Payload(String);

#[derive(Default)]
enum Mode {
    #[default]
    Normal,
    Debug,
    Custom(Payload),
}

fn main() {
    assert!(matches!(Mode::default(), Mode::Normal));
    assert!(matches!(Mode::Debug, Mode::Debug));

    let mode = Mode::Custom(Payload(String::from("preview")));
    match mode {
        Mode::Custom(payload) => assert_eq!(payload.0, "preview"),
        _ => unreachable!(),
    }
}
```

Il derive richiede **una sola variante unitaria** marcata `#[default]`: non sceglie automaticamente la prima. Nella baseline non puo essere una variante con campi o una variante `#[non_exhaustive]`.

Le altre varianti possono contenere tipi senza `Default`, come `Payload`. Se il default deve contenere dati, implementa il trait manualmente. L'attributo per gli enum e stabile da Rust 1.62.

## API / Sintassi

Il trait ha la firma `pub trait Default: Sized` con il metodo associato `fn default() -> Self`. E nel prelude: normalmente non serve importarlo. Non e utilizzabile come `dyn Default`.

| Forma | Risultato | Cosa ricordare |
| --- | --- | --- |
| `T::default()` | `T` | Tipo esplicito, nessun parametro. |
| `Default::default()` | Tipo inferito | Serve un contesto che determini il tipo. |
| `T: Default` | Bound generico | Non implica `Clone`, `Copy` o costo costante. |
| `Config { debug: true, ..base }` | Nuova struct | I campi restanti sono copiati o spostati dalla base. |
| `mem::take(&mut value)` | Vecchio valore | Nella destinazione lascia `T::default()`. |

`default()` restituisce `Self`, non `Result<Self, E>`: non ha un canale per segnalare un errore di costruzione. Questo non impedisce tecnicamente a un'implementazione di allocare, fare I/O o andare in panic. Evita effetti nascosti e costosi; una lettura di configurazione fallibile merita un'API esplicita.

La firma non promette un singleton, una copia di un'istanza esistente o byte tutti a zero. Ogni chiamata esegue l'implementazione scelta. Anche l'uso in un contesto `const` va verificato per l'API e la versione specifica, non dedotto dal nome.

### Generici senza bound superflui

```rust
struct Queue<T> {
    items: Vec<T>,
    selected: Option<T>,
}

impl<T> Default for Queue<T> {
    fn default() -> Self {
        Self {
            items: Vec::new(),
            selected: None,
        }
    }
}

struct Job {
    id: u32,
}

fn main() {
    let mut queue = Queue::<Job>::default();
    assert!(queue.items.is_empty());
    assert!(queue.selected.is_none());

    queue.items.push(Job { id: 7 });
    queue.selected = queue.items.pop();
    assert_eq!(queue.selected.as_ref().map(|job| job.id), Some(7));
}
```

`Vec<T>::default()` produce un vettore vuoto e `Option<T>::default()` produce `None`: nessuno dei due richiede `T: Default`. Un valore assente non richiede di costruire un elemento.

Il derive standard applicato a questa `Queue<T>` aggiunge invece il bound `T: Default`. L'implementazione manuale evita tale restrizione: `Job` non ha un default, ma la coda vuota si puo costruire. Il controesempio finale rende osservabile la differenza.

## Esempio pratico

### Valori di dominio e opzioni personalizzate

```rust
#[derive(Debug, PartialEq)]
struct ServerConfig {
    host: String,
    port: u16,
    workers: usize,
    retries: u32,
    debug: bool,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            host: String::from("127.0.0.1"),
            port: 8080,
            workers: 4,
            retries: 3,
            debug: false,
        }
    }
}

fn main() {
    let local = ServerConfig::default();
    assert_eq!(local.host, "127.0.0.1");
    assert_eq!(local.port, 8080);
    assert_eq!(local.workers, 4);
    assert_eq!(local.retries, 3);
    assert!(!local.debug);

    let debug_config = ServerConfig {
        debug: true,
        ..Default::default()
    };
    assert!(debug_config.debug);
    assert_eq!(debug_config.retries, 3);

    let base = ServerConfig::default();
    let changed = ServerConfig { port: 9090, ..base };
    assert_eq!(changed.host, "127.0.0.1");
    assert_eq!(base.port, 8080);
}
```

Questi sono **valori dimostrativi per sviluppo locale**, non una configurazione universale di produzione. Il programma costruisce dati: non apre socket, non avvia worker e non dimostra che la porta sia disponibile. Risorse, binding effettivo e policy applicativa vanno verificati quando la configurazione viene usata.

L'implementazione manuale sostituisce il derive di `Default`: non aggiungere anche `#[derive(Default)]` allo stesso tipo. Altri derive, come `Debug`, restano indipendenti.

La struct update usa una base dello stesso tipo e richiede accesso a **tutti** i campi, anche quelli non scritti. Non aggira la privacy e non chiama `clone()`. Nell'ultima costruzione `host: String` viene spostato da `base`: `base.port` e ancora leggibile, ma `base` non e piu utilizzabile interamente.

`..Default::default()` valuta una chiamata reale a `default()`, non una lista di valori sostitutivi generata soltanto per i campi omessi. In presenza di allocazioni o altri effetti, anche i valori poi sostituiti possono avere un costo.

I campi sono accessibili al codice dello stesso modulo: il trait non impedisce di creare `workers: 0`. Se questa e un'invariante del tipo, servono campi privati rispetto ai chiamanti e costruzione/modifica controllate.

### Valori mancanti e inserimento nelle mappe

```rust
use std::collections::HashMap;

fn label_or_empty(label: Option<String>) -> String {
    label.unwrap_or_default()
}

fn main() {
    assert_eq!(label_or_empty(None), "");
    assert_eq!(label_or_empty(Some(String::from("draft"))), "draft");

    let mut groups: HashMap<&str, Vec<u32>> = HashMap::new();
    groups.entry("pending").or_default().push(7);
    groups.entry("pending").or_default().push(9);
    assert_eq!(groups.get("pending").unwrap(), &[7, 9]);
}
```

`Option<T>::unwrap_or_default()` restituisce il contenuto di `Some` oppure costruisce `T::default()` per `None`. Diversamente, `Option<T>::default()` costruisce sempre l'**Option vuota**, non `Some(T::default())`.

`entry(key).or_default()` inserisce il default del **valore** solo quando la chiave manca, poi restituisce `&mut V`; non sostituisce un valore gia presente.

La scelta del fallback deve essere intenzionale. Per esempio, `Result<T, E>::unwrap_or_default()` scarta l'errore e restituisce il default di `T`: non usarlo per nascondere errori di parsing, permessi o configurazione. Il metodo non implica che `Result<T, E>` implementi `Default`.

Se un fallback e costoso, distingui `unwrap_or(T::default())`, che lo valuta prima della chiamata, da `unwrap_or_default()` o `unwrap_or_else(T::default)`, che lo costruiscono soltanto quando serve.

### Estrarre un campo lasciando un valore valido

```rust
#[derive(Default)]
struct Batch {
    pending: Vec<String>,
}

impl Batch {
    fn take_pending(&mut self) -> Vec<String> {
        std::mem::take(&mut self.pending)
    }
}

fn main() {
    let mut batch = Batch::default();
    batch.pending.push(String::from("compile"));

    let jobs = batch.take_pending();
    assert_eq!(jobs, ["compile"]);
    assert!(batch.pending.is_empty());

    batch.pending.push(String::from("test"));
    assert_eq!(batch.pending, ["test"]);
    assert_eq!(jobs, ["compile"]);
}
```

`mem::take` sostituisce il campo con il suo default e restituisce il vecchio valore **per ownership**, senza richiedere `Clone`. Qui il vecchio vettore e la sua allocazione passano a `jobs`; il campo riceve un nuovo `Vec` vuoto. Non e un `clear()` che conserva l'allocazione nella destinazione.

La sostituzione deve rispettare gli invarianti dell'oggetto che contiene il campo. Se non esiste un default adeguato, usa `mem::replace(&mut field, replacement)` con un sostituto esplicito; per un `Option<T>`, `take()` lascia `None` senza richiedere `T: Default`.

## Varianti

- **Derive**: quando la combinazione dei default dei campi e il valore desiderato.
- **Implementazione manuale**: valori di dominio o bound generici piu precisi.
- **`new()`**: convenzione, non requisito del trait. Se le due API hanno lo stesso significato puoi farne delegare una all'altra, mai entrambe in un ciclo.
- **Costruttore con parametri o fallibile**: preferibile quando mancano dati necessari o la costruzione puo fallire.
- **Builder con Default**: configura uno stato intermedio; non certifica che la configurazione finale sia gia completa.
- **Default di una dipendenza**: non assumere che un valore applicativo resti identico per sempre; documenta le opzioni su cui il comportamento dipende.

## Errori comuni

### Derive troppo restrittivo sul parametro generico

Controesempio, **non compila** (`E0277` nella baseline).

```rust
#[derive(Default)]
struct Queue<T> {
    items: Vec<T>,
    selected: Option<T>,
}

struct Job {
    id: u32,
}

fn main() {
    let _: Queue<Job> = Default::default();
}
```

I campi potrebbero essere inizializzati senza creare un `Job`, ma il derive richiede `Job: Default`. Usa l'implementazione manuale mostrata sopra, invece di inventare un identificativo di default solo per soddisfare questo bound.

### Una variante con dati non puo usare questo derive

Controesempio, **non compila** nella baseline.

```rust
#[derive(Default)]
enum Mode {
    #[default]
    Custom(u32),
}

fn main() {}
```

Se `Custom(3)` e davvero uno stato iniziale significativo, togli il derive e l'attributo sulla variante, poi implementa `fn default() -> Self { Self::Custom(3) }`.

Altri errori frequenti:

- Derivare e implementare manualmente lo stesso trait sullo stesso tipo: implementazioni in conflitto.
- Trattare `Default` come un controllo di validita o una sostituzione dei dati obbligatori.
- Credere che i default di due campi rispettino automaticamente vincoli fra quei campi.
- Confondere `Option<T>::default()`, `T::default()` e `unwrap_or_default()`.
- Usare un fallback che elimina informazioni necessarie a diagnosticare un errore.
- Supporre che `..base` lasci sempre la base intatta.
- Chiamare `Self::default()` dall'implementazione di `default()`, causando ricorsione invece di costruzione.

## Checklist

- Esiste un valore iniziale sensato per il tipo completo?
- Sono davvero facoltativi i dati che sto sostituendo?
- Il derive genera il comportamento e i bound desiderati?
- Il default e valido anche rispetto ai vincoli fra campi?
- Ownership, privacy ed effetti della struct update sono chiari?
- Il fallback distingue assenza ed errore quando necessario?
- Le allocazioni e gli eventuali effetti di `default()` sono accettabili?
- Test, sviluppo e produzione usano policy esplicite?

## Collegamenti

- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Builder pattern|Builder pattern]]
- [[Programmazione/Rust/Pagine/Configurazione applicativa|Configurazione applicativa]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]
- [[Programmazione/Rust/Pagine/Generics|Generics]]
- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/HashMap e HashSet|HashMap e HashSet]]

## Fonti

Baseline degli esempi: Rust **1.99.1**, edition **2024**; documentazione consultata il **2026-11-05**. I link standard seguono la versione corrente, non definiscono una MSRV.

- [Default: firma, derive ed enum](https://doc.rust-lang.org/std/default/trait.Default.html).
- [RFC 3107: scelta della variante e regole degli enum](https://rust-lang.github.io/rfcs/3107-derive-default-enum.html).
- [Rust Reference: struct update, move e privacy](https://doc.rust-lang.org/reference/expressions/struct-expr.html#functional-update-syntax).
- [Option: fallback e implementazione di Default](https://doc.rust-lang.org/std/option/enum.Option.html).
- [Entry::or_default: inserimento condizionale](https://doc.rust-lang.org/std/collections/hash_map/enum.Entry.html#method.or_default).
- [Result::unwrap_or_default: errore scartato](https://doc.rust-lang.org/std/result/enum.Result.html#method.unwrap_or_default).
- [mem::take: estrazione con default](https://doc.rust-lang.org/std/mem/fn.take.html).
- [mem::replace: sostituzione esplicita](https://doc.rust-lang.org/std/mem/fn.replace.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

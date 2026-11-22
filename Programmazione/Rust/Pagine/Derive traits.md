---
date: 2026-05-21
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - astrazione-e-generici
aliases:
  - Derive Rust
  - Trait derivati
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Enums]]"
related:
  - "[[Programmazione/Rust/Pagine/Derive macros]]"
  - "[[Programmazione/Rust/Pagine/Copy e Clone]]"
  - "[[Programmazione/Rust/Pagine/Display e Debug]]"
title: Derive traits
---

# Derive traits

## Sintesi

`#[derive(...)]` invoca macro che generano implementazioni a partire dalla struttura del tipo. Per i derive standard il comportamento dipende dai campi e dalle varianti, non dal significato che vuoi attribuire loro.

Non e un controllo di correttezza del dominio: derivare `Default` non valida una configurazione, `Debug` non nasconde dati sensibili e `Clone` non garantisce copie indipendenti.

## Quando usarlo

- Ottenere confronti, copie o diagnostica coerenti con i campi.
- Usare un nuovo tipo come chiave di una collezione.
- Ridurre implementazioni ripetitive quando la semantica standard e adatta.
- Rendere esplicite le capacita pubbliche di un tipo.

Non derivare tutti i trait per abitudine: rimuovere un'implementazione pubblica in seguito puo rompere i chiamanti.

## Come funziona

### Il derive genera un contratto concreto

I blocchi Rust sono programmi autonomi, salvo i controesempi dichiarati. Baseline di verifica: **Rust 1.99.1, edition 2024**, libreria standard.

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
struct UserId(u64);

fn main() {
    let original = UserId(7);
    let duplicate = original.clone();

    assert_eq!(original, duplicate);
    assert_ne!(original, UserId(8));
    assert!(format!("{original:?}").contains("UserId"));
}
```

`PartialEq` confronta qui il campo numerico. `Eq` richiede anche `PartialEq` e dichiara una relazione di equivalenza, inclusa la riflessivita. `assert_eq!` usa anche `Debug` per la diagnostica in caso di fallimento.

Questa struct non e `Copy`: un normale passaggio per valore la sposterebbe anche se `u64` e copiabile. Il derive non attiva automaticamente tutti i trait dei campi.

### Implementazione condizionale sui generici

```rust
#[derive(Clone)]
struct Wrapper<T> {
    value: T,
}

struct NotClone;

fn main() {
    let text = Wrapper { value: String::from("api") };
    let mut duplicate = text.clone();
    duplicate.value.push('!');
    assert_eq!(text.value, "api");
    assert_eq!(duplicate.value, "api!");

    let allowed = Wrapper { value: NotClone };
    let _value = allowed.value;
}
```

Il derive produce un'implementazione condizionata a `T: Clone`: `Wrapper<NotClone>` puo esistere, ma non soddisfa `Clone`. Un campo concreto non compatibile, invece, puo far fallire il derive alla definizione del tipo.

La frase "tutti i campi devono supportare il trait" e una prima approssimazione, non una regola completa per ogni derive. Contano anche i bound generati sui parametri e le regole specifiche, come `Default` sugli enum.

## API / Sintassi

### I nove derive standard

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Default)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let origin = Point::default();
    assert_eq!(origin, Point { x: 0, y: 0 });

    let first = Point { x: 1, y: 900 };
    let second = Point { x: 2, y: -900 };
    let copied = first;
    assert_eq!(first, copied);
    assert!(first < second);

    let mut points = [second, first, origin];
    points.sort();
    assert_eq!(points, [origin, first, second]);
}
```

- `Debug`: diagnostica con `{:?}` o `{:#?}`. Include i campi secondo il loro `Debug`; non e un formato stabile di serializzazione o una policy di riservatezza.
- `Clone`: chiama il clone dei campi. Un campo `Rc` o `Arc` continua a condividere il dato.
- `Copy`: permette la duplicazione implicita; richiede `Clone`, campi `Copy` e incompatibilita con `Drop`. Non certifica costo trascurabile.
- `PartialEq` e `Eq`: uguaglianza strutturale, rispettando i contratti dei campi.
- `PartialOrd` e `Ord`: confronto lessicografico dei campi nell'ordine di dichiarazione. Qui conta prima `x`, poi `y`: non la distanza dall'origine.
- `Hash`: combina l'hashing dei campi. Non e un hash crittografico o persistente.
- `Default`: per una struct usa i default dei campi. Non richiede o chiama un metodo `new` e non significa azzerare i byte.

`Ord` richiede `Eq + PartialOrd`, a loro volta legati a `PartialEq`. Scrivere solo `#[derive(Ord)]` non genera automaticamente i prerequisiti. `Display` non ha un derive standard: scegli una rappresentazione o una macro esterna appropriata.

### Ordinamento degli enum

```rust
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
enum Phase {
    Queued(u8),
    Done,
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
enum Priority {
    High = 10,
    Low = 1,
}

fn main() {
    assert!(Phase::Queued(1) < Phase::Queued(2));
    assert!(Phase::Queued(255) < Phase::Done);
    assert!(Priority::Low < Priority::High);
}
```

L'ordine considera prima i discriminanti, poi i campi della variante. Senza discriminanti espliciti l'ordine delle varianti segue quello dichiarato; assegnarli puo cambiarlo. Spostare campi o varianti puo quindi cambiare un ordinamento pubblico, anche se i dati sembrano gli stessi.

### Default di un enum

```rust
struct Payload(String);

#[derive(Default)]
enum State {
    #[default]
    Open,
    Closed,
    WithData(Payload),
}

fn main() {
    assert!(matches!(State::default(), State::Open));
    assert!(matches!(State::Closed, State::Closed));

    let state = State::WithData(Payload(String::from("api")));
    match state {
        State::WithData(payload) => assert_eq!(payload.0, "api"),
        _ => panic!("payload atteso"),
    }
}
```

Il derive richiede una variante unitaria marcata `#[default]`. Nella baseline non puo essere una variante con campi o `#[non_exhaustive]`. Le altre varianti possono contenere tipi senza `Default`, come `Payload`.

Se serve un default con dati, implementa `Default` manualmente. Il default non deve inventare una configurazione valida se non ne esiste una naturale.

## Esempio pratico

### Deduplicare identificativi con HashSet

```rust
use std::collections::HashSet;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct UserId(u64);

fn main() {
    let mut seen = HashSet::new();

    assert!(seen.insert(UserId(1)));
    assert!(!seen.insert(UserId(1)));
    assert!(seen.insert(UserId(2)));
    assert_eq!(seen.len(), 2);
    assert!(seen.contains(&UserId(1)));
    assert!(!seen.contains(&UserId(3)));
}
```

La deduplicazione usa `Eq` e `Hash`; `Copy` non e necessario per usare il set. Non fare affidamento sull'ordine di iterazione o su un valore numerico fisso dell'hash.

Il contratto richiede che chiavi uguali abbiano lo stesso hash; il contrario non e garantito perche possono esistere collisioni. Derivare i trait in modo coerente aiuta, ma non corregge implementazioni errate dei campi. Se personalizzi l'uguaglianza per considerare solo l'ID, anche `Hash` deve rispettare quella scelta.

Questo `UserId` ammette qualunque `u64`, incluso zero: il derive non valida identificativi, autorizzazioni o presenza di utenti reali.

## Varianti

### Implementazione manuale per bound meno restrittivi

```rust
use std::rc::Rc;

struct Shared<T>(Rc<T>);

impl<T> Clone for Shared<T> {
    fn clone(&self) -> Self {
        Self(Rc::clone(&self.0))
    }
}

struct NotClone(String);

fn main() {
    let original = Shared(Rc::new(NotClone(String::from("api"))));
    let duplicate = original.clone();

    assert!(Rc::ptr_eq(&original.0, &duplicate.0));
    assert_eq!(original.0.0, "api");
    assert_eq!(Rc::strong_count(&original.0), 2);
}
```

Clonare `Rc<T>` non richiede `T: Clone`. L'impl manuale conserva questa proprieta; un `derive(Clone)` sul wrapper generico puo invece aggiungere quel bound. Il nuovo handle condivide il dato: non e una copia profonda.

Questa non e una ragione per implementare tutto a mano: usa la variante manuale quando il bound o la semantica del derive limitano davvero l'API.

Le macro esterne, come `serde::Serialize` o `thiserror::Error`, richiedono le rispettive dipendenze e opzioni. Non sono derive incorporati e non vengono installate dagli esempi di questa nota. Vedi [[Programmazione/Rust/Pagine/Derive macros|Derive macros]].

## Errori comuni

### Un campo f64 non soddisfa Eq

Questo programma **non compila**: `f64` implementa `PartialEq`, ma non `Eq`, anche per il comportamento di `NaN`.

```rust
#[derive(PartialEq, Eq)]
struct Measurement(f64);

fn main() {}
```

Non basta rimuovere `NaN` dai dati di un singolo test per ottenere il trait. Se serve un ordine totale o una policy sui non finiti, progettala esplicitamente.

### Il campo e clonabile ma il derive impone un bound in piu

Questo programma **non compila** nella baseline indicata: il derive richiede `NotClone: Clone`, mentre l'impl manuale precedente non lo richiede.

```rust
use std::rc::Rc;

#[derive(Clone)]
struct Shared<T>(Rc<T>);

struct NotClone;

fn require_clone<T: Clone>(_: &T) {}

fn main() {
    let value = Shared(Rc::new(NotClone));
    require_clone(&value);
}
```

- Derivare e implementare manualmente lo stesso trait sullo stesso tipo crea impl in conflitto.
- Campi privati non sono automaticamente esclusi da `Debug`: usa un'implementazione esplicita se occorre oscurarli.
- Aggiungere un campo a un tipo puo cambiare uguaglianza, ordine, hash o bound generati.
- Non mischiare `Eq`, `Ord` e `Hash` manuali/derivati senza verificarne i contratti comuni.

## Checklist

- Ogni trait derivato ha un'utilita e una semantica corretta?
- I bound generati sono adeguati ai tipi generici?
- L'ordine dei campi e dei discriminanti corrisponde all'ordine desiderato?
- Clone deve condividere o duplicare i dati?
- Debug puo esporre informazioni che non devono finire nei log?
- Default e davvero sensato per il dominio?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Derive macros|Derive macros]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/Default|Default]]
- [[Programmazione/Rust/Pagine/Display e Debug|Display e Debug]]
- [[Programmazione/Rust/Pagine/HashMap e HashSet|HashMap e HashSet]]
- [[Programmazione/Rust/Pagine/VecDeque BTreeMap e BTreeSet|Collezioni ordinate]]

## Fonti

- [Rust Reference: attributo derive e macro standard](https://doc.rust-lang.org/reference/attributes/derive.html).
- [Clone: derive, bound e condivisione](https://doc.rust-lang.org/std/clone/trait.Clone.html).
- [Default: struct e variante di default degli enum](https://doc.rust-lang.org/std/default/trait.Default.html).
- [Ord: ordinamento derivato e discriminanti](https://doc.rust-lang.org/std/cmp/trait.Ord.html).
- [Hash: coerenza con Eq e portabilita](https://doc.rust-lang.org/std/hash/trait.Hash.html).
- [Debug: formato e stabilita](https://doc.rust-lang.org/std/fmt/trait.Debug.html).
- [Copy: requisiti e tipi generici](https://doc.rust-lang.org/std/marker/trait.Copy.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

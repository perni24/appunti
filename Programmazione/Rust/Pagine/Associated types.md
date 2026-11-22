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
  - Tipi associati
  - Associated type Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Generics]]"
related:
  - "[[Programmazione/Rust/Pagine/Generic Associated Types (GAT)]]"
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
title: Associated types
---

# Associated types

## Sintesi

Un associated type dichiara nel trait il ruolo di un tipo che verra definito dall'implementazione. `Self::Item` significa "il tipo Item di questa implementazione", non un valore scelto a ogni chiamata.

Per un trait senza parametri, come `Iterator`, un tipo implementatore ha un solo `Item`. Se il trait ha parametri generici, la scelta dipende dall'implementazione completa, inclusi quei parametri: non necessariamente dal solo `Self`.

## Quando usarlo

- Dare un nome al tipo di elemento, risultato o errore di un'implementazione.
- Collegare le firme di piu metodi senza ripetere parametri indipendenti.
- Vincolare il risultato di un algoritmo generico.
- Nascondere dettagli di implementazione mantenendo un contratto statico leggibile.

Se lo stesso implementatore deve supportare input differenti, valuta un parametro generico del trait. Generics e associated types possono convivere.

## Come funziona

### Un producer finito, anche al limite numerico

I blocchi sono programmi autonomi, salvo i controesempi dichiarati. Verificati con **Rust 1.99.1, edition 2024**, senza crate esterne.

```rust
trait Producer {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}

struct Counter {
    next_value: Option<u32>,
    end: u32,
}

impl Counter {
    fn new(start: u32, end: u32) -> Self {
        Self {
            next_value: (start <= end).then_some(start),
            end,
        }
    }
}

impl Producer for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        let current = self.next_value?;
        self.next_value = if current < self.end {
            Some(current + 1)
        } else {
            None
        };
        Some(current)
    }
}

fn first<P: Producer>(producer: &mut P) -> Option<P::Item> {
    producer.next()
}

fn main() {
    let mut counter = Counter::new(3, 4);
    let first_value: Option<<Counter as Producer>::Item> = first(&mut counter);
    assert_eq!(first_value, Some(3));
    assert_eq!(counter.next(), Some(4));
    assert_eq!(counter.next(), None);
    assert_eq!(counter.next(), None);

    let mut edge = Counter::new(u32::MAX, u32::MAX);
    assert_eq!(edge.next(), Some(u32::MAX));
    assert_eq!(edge.next(), None);
}
```

`type Item;` dichiara il ruolo; `type Item = u32;` lo definisce. `P::Item` e una proiezione dal parametro generico; `<Counter as Producer>::Item` identifica esplicitamente il trait, utile anche per nomi ambigui.

La sequenza include entrambi gli estremi; `start > end` produce subito `None`. L'incremento avviene solo sotto il limite: non supera `u32::MAX`. Il comportamento "dopo None resta None" e una scelta di questa implementazione, non una conseguenza automatica del tipo associato.

`Producer` e un trait didattico locale, **non Iterator**: non riceve automaticamente `map`, `collect` o l'uso in un ciclo `for`. Per una vera API di iterazione considera il trait standard.

## API / Sintassi

### Richiedere una capacita del tipo associato

```rust
use std::fmt::Debug;

fn debug_items<I>(iter: I) -> Vec<String>
where
    I: Iterator,
    I::Item: Debug,
{
    iter.map(|item| format!("{item:?}")).collect()
}

fn main() {
    assert_eq!(debug_items([1_u8, 2].into_iter()), ["1", "2"]);
    assert!(debug_items(std::iter::empty::<u8>()).is_empty());
}
```

Il requisito riguarda gli elementi, non l'iteratore. `I: Debug` non sostituirebbe `I::Item: Debug`. Il tipo associato e parte del contratto: il corpo generico puo usare solo le capacita dichiarate.

Una dichiarazione come `type Item: Debug;` nel trait impone invece quel requisito a tutte le implementazioni. Fallo solo se serve all'intera API.

### Imporre un tipo esatto

```rust
fn collect_strings<I>(iter: I) -> Vec<String>
where
    I: Iterator<Item = String>,
{
    iter.collect()
}

fn main() {
    let owned = vec![String::from("api"), String::from("web")];
    assert_eq!(collect_strings(owned.into_iter()), ["api", "web"]);

    let borrowed = vec![String::from("db")];
    assert_eq!(collect_strings(borrowed.iter().cloned()), ["db"]);
    assert_eq!(borrowed[0], "db");
}
```

`Item = String` richiede uguaglianza del tipo, non una conversione implicita. `iter()` su un vettore di stringhe produce `&String`; qui `cloned()` e una scelta esplicita che duplica i dati. `into_iter()` sul vettore owned li trasferisce.

La raccolta alloca e consuma l'iteratore fino alla fine: non usarla su sorgenti illimitate senza una policy. Una relazione fra due iteratori si puo esprimere con `J: Iterator<Item = I::Item>`.

### Un trait generico puo avere un output diverso per ogni input

```rust
trait Convert<Input> {
    type Output;

    fn convert(&self, input: Input) -> Self::Output;
}

struct Formatter;

impl Convert<u32> for Formatter {
    type Output = String;

    fn convert(&self, input: u32) -> Self::Output {
        format!("id={input}")
    }
}

impl Convert<bool> for Formatter {
    type Output = &'static str;

    fn convert(&self, input: bool) -> Self::Output {
        if input { "enabled" } else { "disabled" }
    }
}

fn main() {
    let formatter = Formatter;
    let text: <Formatter as Convert<u32>>::Output = formatter.convert(7_u32);
    let state: <Formatter as Convert<bool>>::Output = formatter.convert(true);

    assert_eq!(text, "id=7");
    assert_eq!(state, "enabled");
    assert_eq!(formatter.convert(false), "disabled");
}
```

L'input seleziona due implementazioni distinte; ciascuna fissa il proprio `Output`. Non puoi aggiungere una seconda `impl Convert<u32> for Formatter` soltanto per cambiare output: sarebbe un conflitto.

Come modello mentale, i parametri del trait aiutano a selezionare l'implementazione, mentre gli associated types ne descrivono i tipi collegati. Non sono assegnazioni o scelte dinamiche.

## Esempio pratico

### Repository in memoria con risultato reale

```rust
use std::collections::BTreeMap;

trait Repository {
    type Entity;
    type Error;

    fn find(&self, id: u64) -> Result<Option<Self::Entity>, Self::Error>;
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct User {
    name: String,
}

#[derive(Debug, PartialEq, Eq)]
enum FindError {
    InvalidId,
}

struct MemoryUsers {
    users: BTreeMap<u64, User>,
}

impl Repository for MemoryUsers {
    type Entity = User;
    type Error = FindError;

    fn find(&self, id: u64) -> Result<Option<Self::Entity>, Self::Error> {
        if id == 0 {
            return Err(FindError::InvalidId);
        }
        Ok(self.users.get(&id).cloned())
    }
}

fn find_name<R>(repository: &R, id: u64) -> Result<Option<String>, R::Error>
where
    R: Repository<Entity = User>,
{
    repository.find(id).map(|user| user.map(|user| user.name))
}

fn main() {
    let repository = MemoryUsers {
        users: BTreeMap::from([
            (1, User { name: String::from("Luca") }),
            (2, User { name: String::from("Ada") }),
        ]),
    };

    assert_eq!(find_name(&repository, 1), Ok(Some(String::from("Luca"))));
    assert_eq!(find_name(&repository, 2), Ok(Some(String::from("Ada"))));
    assert_eq!(find_name(&repository, 3), Ok(None));
    assert_eq!(find_name(&repository, 0), Err(FindError::InvalidId));
}
```

- `Ok(Some(user))`: trovato.
- `Ok(None)`: ID ammesso ma non presente.
- `Err(InvalidId)`: zero e riservato dalla policy di questa demo.

La lookup usa realmente l'ID. Il risultato possiede una copia dell'utente: `cloned()` clona anche la `String`, con relativo costo. `find_name` mantiene il tipo di errore dell'implementatore, senza imporre che tutte le implementazioni usino `FindError`.

E una sorgente in memoria in sola lettura, senza database, salvataggio, autorizzazione o validazione del nome. La policy riguarda la ricerca; il literal della mappa non impedisce di inserire manualmente la chiave zero. Per garantire invarianti in ingresso servirebbero costruttori o metodi di inserimento controllati.

Il nome `Error` non implica `std::error::Error`: qui non c'e quel bound e `FindError` non implementa tale trait. Aggiungilo esplicitamente quando il contratto deve richiederlo.

## Varianti

### Tipo associato unsized restituito per riferimento

```rust
trait View {
    type Target: ?Sized;

    fn view(&self) -> &Self::Target;
}

struct Text(String);

impl View for Text {
    type Target = str;

    fn view(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let text = Text(String::from("api"));
    assert_eq!(text.view(), "api");
    assert_eq!(text.0, "api");
}
```

Gli associated types hanno un bound `Sized` implicito: `?Sized` lo rilassa. Il risultato e un riferimento il cui lifetime e legato al prestito di `self`; non si restituisce `str` per valore.

Non serve un GAT per ogni metodo che restituisce riferimenti. Serve quando **il tipo associato stesso** deve essere parametrizzato, per esempio `Item<'a>`, non solo quando un riferimento a un tipo fisso ha un lifetime.

Altre distinzioni:

- `dyn Iterator<Item = u8>` fissa il tipo associato necessario al trait object. Non e un generico che puo cambiare `Item` a ogni chiamata; vedi [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]].
- `const LIMIT: usize;` dichiara una costante associata, non un tipo.
- Un alias fuori dal trait non e un nuovo tipo nominale. Gli associated types sono anch'essi alias, non wrapper.
- Gli alias in impl inerenti e i default di associated type non sono stabili nella baseline di questa nota.

## Errori comuni

### Omettere il tipo richiesto nell'impl

Questo programma **non compila**: l'implementazione deve definire `Item` anche se il trait non ha metodi che lo usano.

```rust
trait Producer {
    type Item;
}

struct Missing;

impl Producer for Missing {}

fn main() {}
```

### Dare un default al tipo associato su stable

Questo programma **non compila su Rust stable 1.99.1**: i default dei tipi associati richiedono la feature instabile `associated_type_defaults`. Non confonderli con parametri generici dotati di default o metodi con corpo predefinito.

```rust
trait Producer {
    type Item = u32;
}

fn main() {}
```

Su stable dichiara `type Item;` nel trait e scegli `type Item = u32;` nell'impl.

- Confondere `I: Debug` con `I::Item: Debug`.
- Trattare `Item = String` come una conversione da `&str` o `&String`.
- Assumere un tipo associato unico per il solo Self anche nei trait generici.
- Dare nomi generici come `Type` quando `Entity`, `Error` o `Target` comunicano il ruolo.
- Promettere output borrowed da dati interni con un lifetime non espresso nel contratto.

## Checklist

- Il tipo e scelto dall'implementazione completa o deve essere un parametro indipendente?
- I bound necessari sono sul tipo giusto?
- Servono un requisito comportamentale o l'uguaglianza a un tipo preciso?
- Ownership, assenza ed errore sono espliciti?
- Basta un riferimento a un tipo fisso oppure serve davvero un GAT?
- La sintassi usata e disponibile nella versione Rust del progetto?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Generic Associated Types (GAT)|Generic Associated Types (GAT)]]
- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Lifetime elision|Lifetime elision]]

## Fonti

- [Rust Reference: associated types, bound e proiezioni](https://doc.rust-lang.org/reference/items/associated-items.html#associated-types).
- [Rust Book: advanced traits e differenza dai parametri generici](https://doc.rust-lang.org/book/ch20-02-advanced-traits.html).
- [Rust Unstable Book: associated_type_defaults](https://doc.rust-lang.org/unstable-book/language-features/associated-type-defaults.html).
- [Iterator: Item e next](https://doc.rust-lang.org/std/iter/trait.Iterator.html).
- [BTreeMap::get](https://doc.rust-lang.org/std/collections/struct.BTreeMap.html#method.get).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

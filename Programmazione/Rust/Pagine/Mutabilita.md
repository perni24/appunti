---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - mutabilita
  - borrowing
aliases:
  - Mutability Rust
  - mut
prerequisites:
  - "[[Programmazione/Rust/Pagine/Variabili mutabilita e shadowing]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
related:
  - "[[Programmazione/Rust/Pagine/Interior mutability]]"
  - "[[Programmazione/Rust/Pagine/Cell T]]"
  - "[[Programmazione/Rust/Pagine/RefCell T]]"
title: Mutabilita
---

# Mutabilita

## Sintesi

La mutabilita del binding e il permesso di accesso al dato sono distinti. `let mut value` permette di riassegnare il binding; `&mut T` permette accesso esclusivo al valore referenziato. Il binding che contiene quel riferimento non deve essere mut per modificarne il destinatario.

Un binding immutabile non implica immutabilita profonda: alcuni tipi espongono interior mutability. Gli esempi autonomi sono verificati con Rust **1.99.1**, edition **2024**.

## Quando usarlo

- Usa mut quando lo stesso stato deve evolvere o un contenitore deve essere modificato.
- Usa un parametro &mut T per operare sul dato del chiamante senza prenderne ownership.
- Usa un parametro posseduto mut T per trasformare il valore ricevuto.
- Mantieni immutabile cio che non cambia; non aggiungere mut per tentativi quando l'errore riguarda i prestiti.

## Come funziona

Per prendere un prestito mutabile da una normale variabile locale posseduta serve un binding mutabile. Non e pero una regola universale su ogni nome incontrato: si puo modificare o riprendere in prestito il dato attraverso un &mut T contenuto in un binding immutabile.

mut non e una proprieta permanente del valore. Un nuovo proprietario puo ricevere una String da un binding immutabile e legarla a un binding mutabile. Anche gli accessi restano vincolati dai prestiti gia attivi: mut non autorizza riferimenti incompatibili.

Nelle struct non si scrive mut sui singoli campi. Contano il percorso di accesso e il tipo del campo, compresa l'eventuale interior mutability.

## API / Sintassi

### Parametro posseduto e parametro in prestito

```rust
fn increment_owned(mut number: i32) -> i32 {
    number += 1;
    number
}

fn increment_borrowed(number: &mut i32) {
    *number += 1;
}

fn main() {
    let original = 10;
    let changed = increment_owned(original);
    assert_eq!(original, 10);
    assert_eq!(changed, 11);

    let mut value = 10;
    increment_borrowed(&mut value);
    assert_eq!(value, 11);
}
```

i32 e Copy: il primo parametro e una copia locale. Con una String posseduta avverrebbe invece un move, non una copia implicita. Il secondo parametro modifica il dato del chiamante. Il demo usa valori piccoli: += non e una strategia generale per gestire overflow.

### Cambiare riferimento o modificare il destinatario

```rust
fn main() {
    let first = 1;
    let second = 2;
    let mut selected = &first;
    assert_eq!(*selected, 1);
    selected = &second;
    assert_eq!(*selected, 2);

    let mut total = 10;
    let reference = &mut total;
    *reference += 2;
    assert_eq!(total, 12);
}
```

selected puo essere riassegnato, ma resta &i32 e non permette scritture attraverso di esso. reference non viene riassegnato: modifica total. La lettura finale di total avviene quando reference non serve piu.

### Campi e metodi mutabili

```rust
struct Config {
    debug: bool,
}

impl Config {
    fn enable_debug(&mut self) {
        self.debug = true;
    }
}

fn main() {
    let mut config = Config { debug: false };
    config.enable_debug();
    assert!(config.debug);

    let reference = &mut config;
    reference.debug = false;
    assert!(!config.debug);
}
```

La chiamata al metodo prende implicitamente un prestito mutabile. Il campo bool non ha un modificatore mut autonomo: viene raggiunto con accesso esclusivo.

## Esempio pratico

### Sostituire il testo del chiamante

```rust
fn normalize_tag(tag: &mut String) {
    *tag = tag.trim().to_lowercase();
}

fn main() {
    let mut tag = String::from("  RUST  ");
    normalize_tag(&mut tag);
    assert_eq!(tag, "rust");
}
```

La parte destra viene calcolata prima della sostituzione: trim prende una vista e to_lowercase produce testo posseduto. L'assegnamento sostituisce la String e distrugge il vecchio valore. "Modifica il chiamante" non significa "non alloca" o "mantiene lo stesso buffer".

La funzione elimina spazi iniziali/finali secondo trim e applica lowercase Unicode. Non comprime spazi interni, non applica normalizzazione NFC e non valida un identificativo. Il tipo &mut String da solo non descrive queste regole applicative.

## Varianti

### Nuovo proprietario, nuova mutabilita

```rust
fn append_marker(mut text: String) -> String {
    text.push('!');
    text
}

fn main() {
    let original = String::from("rust");
    let updated = append_marker(original);
    assert_eq!(updated, "rust!");
}
```

original non era mutabile, ma il suo valore puo essere spostato nel parametro mutabile. Dopo il move original non e piu utilizzabile. Attenzione alla generalizzazione "il parametro posseduto modifica solo dati locali": un valore puo contenere riferimenti o ownership condivisa e quindi rendere modifiche osservabili altrove.

### Interior mutability controllata

```rust
use std::cell::Cell;

fn main() {
    let enabled = Cell::new(false);
    let first = &enabled;
    let second = &enabled;
    first.set(true);
    assert!(second.get());
}
```

Cell offre questa possibilita tramite la propria API, non rende scrivibile qualunque &T. Get qui copia un bool. RefCell gestisce prestiti dinamici e puo fallire o generare panic; Cell e RefCell non sono Sync e non sono la soluzione per condividere mutazioni tra thread. Mutex e tipi atomici hanno contratti diversi: scegliere interior mutability richiede capire il modello di accesso.

## Errori comuni

- Aggiungere mut a un &T e aspettarsi di modificare T.
- Confondere mut parametro: T con parametro: &mut T.
- Pensare che un binding mutabile permetta di cambiare tipo: per quello serve un nuovo binding, per esempio con shadowing.
- Usare la parola immutabile come garanzia che nessuno possa osservare cambiamenti interni.
- Scegliere RefCell o Mutex soltanto per nascondere un errore di progettazione.
- Mantenere un prestito oltre gli usi necessari, rendendo impossibili operazioni successive.

## Checklist

- Sto cambiando il binding, il destinatario di un riferimento o uno stato interno?
- Il chiamante conserva ownership oppure la trasferisce?
- Esistono prestiti incompatibili ancora utilizzati?
- Il metodo puo allocare o sostituire il contenuto?
- L'interior mutability e necessaria? Quali errori runtime o requisiti di thread introduce?
- La funzione documenta i propri effetti, oltre alla presenza di mut?

## Collegamenti

- [[Programmazione/Rust/Pagine/Variabili mutabilita e shadowing|Variabili, mutabilita e shadowing]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Cell T|Cell<T>]]
- [[Programmazione/Rust/Pagine/RefCell T|RefCell<T>]]

## Fonti

- [Rust Book: Variables and Mutability](https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html).
- [Rust Reference: Mutable place expressions](https://doc.rust-lang.org/reference/expressions.html#mutability).
- [Standard library: Cell e interior mutability](https://doc.rust-lang.org/std/cell/index.html).
- [Standard library: str e trasformazioni del testo](https://doc.rust-lang.org/std/primitive.str.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

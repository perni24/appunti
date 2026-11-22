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
  - borrow-checker
  - memory-safety
aliases:
  - Controllore dei prestiti
  - Borrow checking
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
related:
  - "[[Programmazione/Rust/Pagine/Lifetime impliciti]]"
  - "[[Programmazione/Rust/Pagine/Aliasing rules]]"
  - "[[Programmazione/Rust/Pagine/Mutabilita]]"
title: Borrow checker
---

# Borrow checker

## Sintesi

Il borrow checker verifica staticamente che usi dei valori e prestiti rispettino le regole di ownership e lifetime: per esempio impedisce di usare un valore mosso o di modificare dati ancora letti da un prestito condiviso.

Non e un contatore a runtime e non prova la correttezza completa del programma. Gli esempi sono programmi indipendenti per `src/main.rs`, baseline **Rust 1.99.1, edition 2024**; i due controesempi sono dichiarati non compilabili.

## Quando usarlo

Il borrow checker e sempre attivo. Diventa particolarmente importante quando:

- si lavora con riferimenti multipli allo stesso valore;
- si alternano letture e modifiche;
- si restituiscono riferimenti da funzioni;
- si manipolano collection mentre si itera;
- si struttura codice con closure, struct e metodi.

## Come funziona

Il compilatore controlla:

- se un valore e ancora valido dopo un move;
- se i riferimenti non vivono piu del valore referenziato;
- se un `&mut T` e esclusivo;
- se un valore non viene modificato mentre esistono riferimenti immutabili attivi;
- se le relazioni fra lifetime sono rispettate. Le annotazioni descrivono il contratto, non estendono la vita dei valori.

Il controllo e conservativo: un algoritmo puo essere sicuro per una proprieta che il compilatore non riesce a dedurre. In quel caso spesso serve esprimere meglio la separazione dei dati, non aggiungere `clone` o `unsafe` automaticamente. Un errore di annotazione o di tipo non e necessariamente un conflitto di prestiti.

### Prestito condiviso ancora usato

Questo programma **non compila** con E0502:

```rust
fn main() {
    let mut text = String::from("rust");
    let borrowed = &text;
    text.push('!');
    println!("{borrowed}");
}
```

`push` richiede un prestito mutabile, ma `borrowed` verra letto dopo. Il conflitto esiste anche senza piu thread. Per leggere il testo originale puoi usarlo prima della modifica; se vuoi conservarne una copia indipendente, il clone e una scelta semantica esplicita.

## API / Sintassi

Non esiste una API del borrow checker. Si controlla indirettamente tramite le firme:

### Tre contratti diversi

```rust
fn read_len(values: &[i32]) -> usize {
    values.len()
}

fn append(values: &mut Vec<i32>) {
    values.push(10);
}

fn consume_len(values: Vec<i32>) -> usize {
    values.len()
}

fn main() {
    let mut values = vec![1, 2];
    assert_eq!(read_len(&values), 2);
    append(&mut values);
    assert_eq!(values, [1, 2, 10]);
    assert_eq!(consume_len(values), 3);
}
```

Le firme permettono rispettivamente lettura, modifica del contenitore e consumo. `&mut Vec<i32>` e appropriato per `push`; per modificare soltanto elementi, senza cambiare lunghezza, preferisci spesso `&mut [i32]`.

## Esempio pratico

### Separare ricerca e inserimento

```rust
fn add_if_missing(names: &mut Vec<String>, name: &str) {
    let present = names.iter().any(|existing| existing == name);
    if !present {
        names.push(name.to_owned());
    }
}

fn main() {
    let mut names = vec![String::from("Ada")];
    add_if_missing(&mut names, "Ada");
    add_if_missing(&mut names, "Luca");
    assert_eq!(names, ["Ada", "Luca"]);
}
```

`present` e un `bool`, non conserva un riferimento agli elementi. Terminata la ricerca, `push` puo prendere in prestito mutabile il vettore. Il confronto e esatto e case-sensitive; la funzione non rimuove duplicati preesistenti e la ricerca e lineare. Non e una struttura per accessi concorrenti.

### Riferimento a elemento e push

Questo secondo programma **non compila** con E0502:

```rust
fn main() {
    let mut names = vec![String::from("Ada")];
    let first = names.first();
    names.push(String::from("nuovo"));
    println!("{first:?}");
}
```

`first` puo contenere un riferimento interno; `push` richiede `&mut Vec` e puo riallocare. Riservare capacita non rende valido il programma: la firma continua a richiedere un prestito incompatibile con quello ancora usato.

### Usare il riferimento prima di modificare

```rust
fn main() {
    let mut names = vec![String::from("Ada")];
    let first = names.first();
    assert_eq!(first.map(String::as_str), Some("Ada"));
    names.push(String::from("nuovo"));
    assert_eq!(names.len(), 2);
}
```

I non-lexical lifetimes rendono sufficiente l'ultimo uso mostrato: non occorre un blocco artificiale. Se il risultato deve sopravvivere alla modifica, puoi copiare un dato `Copy`, clonare intenzionalmente il contenuto o conservare un indice e ricontrollarlo dopo; l'indice non e una garanzia di identita se la collezione cambia ordine.

## Varianti

- Borrow checking statico: controllo di ownership, prestiti e lifetime.
- Non-lexical lifetimes: la durata inferita segue gli usi e il flusso di controllo, non necessariamente tutte le parentesi del blocco.
- Interior mutability: sposta alcuni controlli da compile time a runtime, per esempio con `RefCell<T>`.
- Smart pointer condivisi: `Rc<T>` e `Arc<T>` gestiscono ownership condivisa con reference counting.

### Campi disgiunti

```rust
struct Counters {
    accepted: u32,
    rejected: u32,
}

fn main() {
    let mut counters = Counters { accepted: 0, rejected: 0 };
    let accepted = &mut counters.accepted;
    let rejected = &mut counters.rejected;
    *accepted += 1;
    *rejected += 2;
    assert_eq!((counters.accepted, counters.rejected), (1, 2));
}
```

Il compilatore distingue questi campi. Non deduce invece in generale che due accessi tramite indici producano elementi disgiunti; per dividere una slice usa `split_at_mut`, mostrato in [[Programmazione/Rust/Pagine/Slices|Slices]].

### Prestiti runtime di RefCell

```rust
use std::cell::RefCell;

fn main() {
    let values = RefCell::new(vec![1]);
    let read = values.borrow();
    assert_eq!(read.len(), 1);
    assert!(values.try_borrow_mut().is_err());
    drop(read);
    values.borrow_mut().push(2);
    assert_eq!(&*values.borrow(), &[1, 2]);
}
```

L'ultimo uso di `read` non distrugge automaticamente questa guardia: il prestito runtime dura fino al suo rilascio. `drop(read)` lo termina, mentre `try_borrow_mut` segnala il conflitto senza panic. `borrow_mut` nello stesso punto genererebbe invece panic. Non e una disattivazione del borrow checker; `Rc`/`Arc` da soli non aggiungono questo meccanismo o permessi di modifica.

## Errori comuni

- Iterare su una collection e modificarla nello stesso ciclo senza separare le fasi.
- Tenere riferimenti a elementi di un `Vec` e poi fare operazioni che possono riallocare.
- Ignorare dove la diagnostica indica nascita e uso successivo del prestito; non ogni rifiuto implica che il compilatore sappia provare tutte le alternative sicure.
- Usare `RefCell<T>` per evitare di modellare correttamente ownership e borrowing.

Per orientarsi: E0502 segnala prestiti di mutabilita incompatibile, E0499 piu prestiti mutabili in conflitto, E0597 un valore che non vive abbastanza. Leggi anche le righe evidenziate: il solo codice non descrive il contratto da correggere. Il superamento del controllo non garantisce assenza di panic, deadlock, errori logici o problemi in implementazioni unsafe non corrette.

## Checklist

- Puoi ridurre lo scope del riferimento?
- Puoi separare fase di lettura e fase di modifica?
- Puoi estrarre il valore invece di conservarne un riferimento?
- La funzione dovrebbe prendere ownership invece di un riferimento?
- La collection puo riallocare mentre esistono riferimenti ai suoi elementi?
- Stai ragionando su un riferimento staticamente controllato oppure sulla durata di una guardia runtime?

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Lifetime impliciti|Lifetime impliciti]]
- [[Programmazione/Rust/Pagine/Aliasing rules|Aliasing rules]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]
- [[Programmazione/Rust/Pagine/Slices|Slice e prestiti disgiunti]]
- [[Programmazione/Rust/Pagine/RefCell T|RefCell<T>]]

## Fonti

- [Rust Book: References and Borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html).
- [Rust Blog: NLL fully stable](https://blog.rust-lang.org/2022/08/05/nll-by-default/).
- [Diagnostica E0502](https://doc.rust-lang.org/error_codes/E0502.html), [E0499](https://doc.rust-lang.org/error_codes/E0499.html) ed [E0597](https://doc.rust-lang.org/error_codes/E0597.html).
- [Standard library: Cell e RefCell](https://doc.rust-lang.org/std/cell/index.html).
- [Standard library: split_at_mut](https://doc.rust-lang.org/std/primitive.slice.html#method.split_at_mut).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

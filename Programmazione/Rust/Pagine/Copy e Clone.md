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
  - ownership
  - copy
  - clone
aliases:
  - Trait Copy
  - Trait Clone
  - Copy vs Clone
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Move semantics]]"
related:
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
title: Copy e Clone
---

# Copy e Clone

## Sintesi

`Copy` permette la duplicazione implicita di un valore tramite copia dei bit; `Clone` definisce la duplicazione esplicita con `clone()`. Il costo e il grado di indipendenza del risultato dipendono dal tipo: un clone puo duplicare dati oppure creare un altro handle agli stessi dati.

`Copy` non e una promessa di costo trascurabile: anche array grandi possono implementarlo. `Clone` non e necessariamente costoso o una copia profonda. Esempi indipendenti per `src/main.rs`, baseline **Rust 1.99.1, edition 2024**.

## Quando usarlo

- Usa `Copy` per tipi piccoli, semplici e senza ownership di risorse esterne.
- Usa `Clone` quando serve duplicare esplicitamente un valore posseduto.
- Usa `#[derive(Clone)]` o `#[derive(Copy, Clone)]` su struct quando i campi lo permettono e la semantica e appropriata.
- Evita `clone` come soluzione automatica agli errori del borrow checker.

## Come funziona

### Valori Copy

Negli usi per valore che altrimenti sposterebbero un valore, `Copy` permette una copia implicita. Non viene chiamato un metodo `copy()` o `clone()` personalizzato.

```rust
fn main() {
    let first = 10_i32;
    let mut second = first;
    second += 1;
    assert_eq!(first, 10);
    assert_eq!(second, 11);
}
```

`i32` implementa `Copy`, quindi `first` resta valido. Una struct non diventa automaticamente `Copy` solo perche tutti i suoi campi sono interi: occorre implementare o derivare il trait.

### Clonare una String

```rust
fn main() {
    let original = String::from("rust");
    let mut duplicate = original.clone();
    duplicate.push('!');
    assert_eq!(original, "rust");
    assert_eq!(duplicate, "rust!");
}
```

Una normale assegnazione di `String` sarebbe un move; `clone()` duplica il contenuto in una stringa indipendente. Modificare `duplicate` non cambia `original`. Non estendere questa conclusione a tutti i tipi `Clone`.

## API / Sintassi

### Derivare Copy e Clone

```rust
#[derive(Debug, Copy, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let first = Point { x: 1, y: 2 };
    let second = first;
    assert_eq!(first, second);
}
```

Per questa struct servono campi `Copy`; il tipo non deve implementare `Drop`. `Copy` richiede anche `Clone`, mentre `Clone` da solo non implica `Copy`. Il comportamento della copia implicita non e sovrascrivibile.

### Derivare solo Clone

```rust
#[derive(Clone)]
struct Document {
    title: String,
}

fn main() {
    let original = Document { title: String::from("Bozza") };
    let mut duplicate = original.clone();
    duplicate.title.push_str(" rivista");
    assert_eq!(original.title, "Bozza");
    assert_eq!(duplicate.title, "Bozza rivista");
}
```

`derive(Clone)` clona i campi secondo la loro implementazione: qui il campo `String` viene duplicato. Un campo smart pointer potrebbe invece continuare a condividere il contenuto. Sui tipi generici il derive puo introdurre bound sui parametri; non trattarlo come un'implementazione automaticamente adatta a ogni wrapper.

## Esempio pratico

### Coordinate passate per valore

```rust
#[derive(Debug, Copy, Clone)]
struct Coordinate {
    row: usize,
    column: usize,
}

fn highlight(position: Coordinate) {
    println!("{}:{}", position.row, position.column);
}

fn main() {
    let position = Coordinate { row: 3, column: 12 };
    highlight(position);
    highlight(position);
}
```

`Coordinate` e piccolo e non possiede risorse: `Copy` rende naturale passarlo per valore.

Entrambe le chiamate stampano `3:12`. `Copy` fa parte del contratto pubblico: rimuoverlo in futuro puo rompere codice che riutilizza il valore dopo il passaggio per valore.

## Varianti

- `Copy`: duplicazione implicita, nessun metodo chiamato.
- `Clone`: duplicazione esplicita tramite `.clone()`.
- `clone_from`: puo riutilizzare allocazioni esistenti quando implementato.
- `to_owned`: spesso usato per ottenere un valore posseduto da un riferimento, per esempio da `&str` a `String`.

### Copiare un riferimento condiviso

```rust
fn main() {
    let text = String::from("rust");
    let first: &String = &text;
    let second = first;
    assert!(std::ptr::eq(first, second));
    assert_eq!(text, "rust");
}
```

`&T` e `Copy` anche se `T` non lo e: viene copiato il riferimento, non il dato. `&mut T` non e `Copy` o `Clone`; passarlo a una funzione puo comunque creare un nuovo prestito temporaneo, senza duplicare due accessi mutabili simultanei.

### Clone di ownership condivisa

```rust
use std::rc::Rc;

fn main() {
    let original = Rc::new(String::from("config"));
    let duplicate = Rc::clone(&original);
    assert!(Rc::ptr_eq(&original, &duplicate));
    assert_eq!(Rc::strong_count(&original), 2);
    drop(duplicate);
    assert_eq!(Rc::strong_count(&original), 1);
}
```

Viene duplicato l'handle e incrementato il contatore: non la `String`. `Rc::ptr_eq` rende esplicita la condivisione. Anche `Arc::clone` condivide il contenuto, usando un contatore atomico; questo non rende automaticamente thread-safe il tipo contenuto. Per mutazione condivisa e sincronizzazione vedi [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc<T> e Arc<T>]].

### clone_from e conversione a posseduto

```rust
fn main() {
    let source = String::from("config");
    let mut destination = String::with_capacity(32);
    destination.push_str("vecchio");
    destination.clone_from(&source);
    assert_eq!(destination, source);

    let borrowed: &str = "note";
    let owned: String = borrowed.to_owned();
    assert_eq!(owned, "note");
}
```

`clone_from` sostituisce il contenuto della destinazione e puo riutilizzare risorse: il trait non garantisce in generale zero allocazioni. `to_owned` su `&str` produce una `String`; clonare il riferimento `&str` continuerebbe invece a riferirsi agli stessi byte.

## Errori comuni

- Implementare `Copy` su tipi che concettualmente possiedono una risorsa unica.
- Chiamare `.clone()` su valori grandi dentro loop caldi senza misurare.
- Pensare che `Clone` sia sempre una copia superficiale o sempre profonda: dipende dal tipo e dai suoi campi.
- Dimenticare che `Copy` richiede anche `Clone`.
- Scambiare l'assenza di un metodo chiamato per assenza di costo: misura le copie grandi nei percorsi critici.

### Copy su un campo String

Questo programma **non compila**: il campo `String` non implementa `Copy`.

```rust
#[derive(Copy, Clone)]
struct Document {
    title: String,
}

fn main() {}
```

Non forzare il problema con copie raw o codice unsafe. Scegli `Clone` se serve una duplicazione intenzionale, oppure passa un riferimento.

## Checklist

- Il tipo possiede memoria, file descriptor, lock o altre risorse? Non dovrebbe essere `Copy`.
- La duplicazione e economica e ovvia? `Copy` puo andare bene.
- La duplicazione puo allocare o avere costo visibile? Usa `Clone`.
- Il clone e davvero necessario o puoi prendere in prestito con `&T`?
- Tutti i campi della struct supportano il trait che vuoi derivare?
- Il duplicato deve essere indipendente o condividere intenzionalmente i dati?

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Clone degli smart pointer]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop e incompatibilita con Copy]]

## Fonti

- [Standard library: Copy](https://doc.rust-lang.org/std/marker/trait.Copy.html).
- [Standard library: Clone e clone_from](https://doc.rust-lang.org/std/clone/trait.Clone.html).
- [Standard library: String](https://doc.rust-lang.org/std/string/struct.String.html).
- [Standard library: Rc::clone](https://doc.rust-lang.org/std/rc/struct.Rc.html#method.clone).
- [Standard library: ToOwned](https://doc.rust-lang.org/std/borrow/trait.ToOwned.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

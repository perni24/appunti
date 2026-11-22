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
  - variabili
aliases:
  - Variabili, mutabilita e shadowing
prerequisites: []
related: []
title: Variabili, mutabilita e shadowing
---

# Variabili, mutabilita e shadowing

## Sintesi

In Rust i binding creati con `let` sono immutabili di default. La mutabilita va dichiarata esplicitamente con `mut`. Lo shadowing permette di dichiarare un nuovo binding con lo stesso nome, anche cambiando tipo.

Queste sono tre scelte diverse: inizializzare un binding, modificare il valore esistente e introdurre un altro binding. Gli esempi validi sono programmi indipendenti, verificati con Rust **1.99.1**, edition **2024**; i controesempi non compilabili sono indicati.

## Quando usarlo

- Quando devi modellare dati modificabili o immutabili.
- Quando vuoi trasformare un valore senza mantenere variabili temporanee con nomi diversi.
- Quando il compilatore segnala che stai provando a modificare un binding immutabile.

## Come funziona

`let` lega un nome a un valore. Senza `mut`, quel binding non puo essere riassegnato. Con `mut`, puoi cambiare il valore mantenendo lo stesso tipo. Con shadowing, invece, crei un nuovo binding che nasconde il precedente nello stesso scope o in uno scope interno.

La mutabilita del binding non e una promessa di immutabilita profonda: un `&mut T` permette di modificare il valore puntato anche quando il binding del riferimento non e `mut`. Tipi come `Cell<T>` e `RefCell<T>` offrono inoltre interior mutability tramite API specifiche; non si applica a ogni valore indistintamente.

## API / Sintassi

### Mutazione dello stesso binding

```rust
fn main() {
    let x = 5;
    let mut count: u32 = 0;
    count += 1;
    count = count + x;
    assert_eq!(count, 6);
    println!("Conteggio: {count}");
}
```

Il tipo resta `u32`. Nell'esempio l'uso di `x` contribuisce a inferire anche per esso `u32`; l'assenza di annotazione non significa tipo dinamico.

### Shadowing con cambio di tipo

```rust
fn main() -> Result<(), std::num::ParseIntError> {
    let value = "42";
    let value: i32 = value.parse()?;
    assert_eq!(value, 42);
    println!("Valore: {value}");
    Ok(())
}
```

Il secondo `let` crea un nuovo binding `i32`. Il lato destro usa ancora il precedente `&str`. `?` propaga un eventuale errore di parsing: con testo esterno non bisogna trasformare ogni errore in panic tramite `unwrap`. La semantica di `Result` e approfondita nella nota collegata.

## Esempio pratico

### Trasformazioni progressive

```rust
fn main() {
    let input = "  rust  ";
    let input = input.trim();
    let input = input.to_uppercase();

    assert_eq!(input, "RUST");
    println!("{input}");
}
```

Qui ogni `let input` crea un nuovo binding. `trim()` restituisce una vista `&str`; `to_uppercase()` produce una `String`. Lo shadowing non fa sparire i costi delle operazioni, come l'allocazione della nuova stringa, e non equivale a mutazione in-place.

## Varianti

- `let x = ...`: binding immutabile.
- `let mut x = ...`: binding mutabile.
- `let x = x + 1`: shadowing.
- Scope interno: uno shadowing puo valere solo dentro un blocco.

### Scope interno e binding esterno

```rust
fn main() {
    let count = 4;
    {
        let count = count * 3;
        assert_eq!(count, 12);
    }
    assert_eq!(count, 4);
}
```

Fuori dal blocco torna visibile il binding esterno: non e un rollback di una mutazione. Se il blocco avesse modificato un valore esterno accessibile con `mut`, quella modifica resterebbe.

### Inizializzazione differita

```rust
fn main() {
    let enabled = false;
    let limit: u32;
    if enabled {
        limit = 10;
    } else {
        limit = 0;
    }
    assert_eq!(limit, 0);
}
```

Un binding immutabile puo essere dichiarato prima dell'inizializzazione. Il compilatore deve poter verificare che sia inizializzato prima di leggerlo e non inizializzato due volte sullo stesso percorso. Non esiste un valore zero assegnato automaticamente a ogni locale; per questo caso semplice e piu conciso `let limit = if enabled { 10 } else { 0 };`.

### Mutabilita del riferimento e del valore

```rust
fn main() {
    let mut total = 10;
    let reference = &mut total;
    *reference += 2;
    assert_eq!(*reference, 12);
    assert_eq!(total, 12);
}
```

`reference` non viene riassegnato: cambia il valore raggiunto tramite `*reference`. Scrivere invece `let mut reference = &total` permetterebbe di cambiare quale riferimento condiviso e contenuto nel binding, **non** di scrivere attraverso `&total`. Il tipo del riferimento conta. L'ultima lettura di `total` avviene quando il prestito mutabile non viene piu usato.

### Costanti e binding locali

```rust
const MAX_RETRIES: u32 = 3;

fn main() {
    let attempts = MAX_RETRIES;
    assert_eq!(attempts, 3);
}
```

`const` richiede un tipo esplicito e un inizializzatore ammesso in valutazione costante. Non e semplicemente un `let` immutabile: un normale `let` puo contenere un valore calcolato a runtime. Per indirizzo stabile e differenze con `static`, vedi la nota dedicata.

## Errori comuni

- Usare `mut` quando basta shadowing.
- Pensare che shadowing e mutabilita siano equivalenti.
- Provare a cambiare tipo a una variabile `mut`: la mutabilita non permette cambio di tipo.
- Rendere mutabile un dato condiviso senza pensare a ownership e borrowing.

### Riassegnazione senza mut

Questo programma **non compila**: `count` e gia inizializzato e non e mutabile.

```rust
fn main() {
    let count = 0;
    count = 1;
    println!("{count}");
}
```

Usa `mut` se e lo stesso stato a evolvere; usa un nuovo `let` se vuoi una nuova fase della trasformazione.

### Mut non cambia il tipo

Anche questo **non compila**: la riassegnazione cerca di sostituire `&str` con `usize`.

```rust
fn main() {
    let mut input = "rust";
    input = input.len();
    println!("{input}");
}
```

La forma corretta per cambiare binding e `let input = input.len();`. Un nuovo `let` senza `mut` torna immutabile anche se il binding precedente era mutabile.

### Shadowing non significa distruzione immediata

Nascondere un nome non chiama automaticamente `drop` sul vecchio valore. Una risorsa puo restare viva fino alla fine del proprio scope, oppure essere stata spostata altrove. Non usare lo shadowing come meccanismo per rilasciare anticipatamente un lock o un file: scegli uno scope piu piccolo o `drop(value)` quando sei ancora proprietario del valore accessibile. Questo aspetto segue le regole di ownership, non soltanto la visibilita del nome.

## Checklist

- Preferisci immutabilita come default.
- Usa `mut` solo quando il valore evolve realmente nel tempo.
- Usa shadowing per trasformazioni progressive o cambio di tipo.
- Controlla lo scope in cui il binding e valido.
- Non confondere `let mut reference` con un riferimento di tipo `&mut T`.
- Gestisci gli errori delle trasformazioni e rendi esplicita la durata delle risorse.

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Mutabilita|Mutabilita]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/const e static|const e static]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]
- [[Programmazione/Rust/Pagine/Interior mutability|Interior mutability]]

## Fonti

- [Rust Book: Variables and Mutability](https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html).
- [Rust Reference: Statements](https://doc.rust-lang.org/reference/statements.html).
- [Rust Reference: Borrow operators](https://doc.rust-lang.org/reference/expressions/operator-expr.html#borrow-operators).
- [Rust Reference: Destructors](https://doc.rust-lang.org/reference/destructors.html).
- [Standard library: interior mutability](https://doc.rust-lang.org/std/cell/index.html).
- [Rust Reference: Constant items](https://doc.rust-lang.org/reference/items/constant-items.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

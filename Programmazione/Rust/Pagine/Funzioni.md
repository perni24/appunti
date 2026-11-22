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
  - funzioni
aliases: []
prerequisites: []
related: []
title: Funzioni
---

# Funzioni

## Sintesi

Le funzioni in Rust sono definite con `fn`, hanno parametri tipizzati e possono restituire un valore. Il tipo di ritorno e dichiarato dopo `->`, tranne quando la funzione restituisce unit `()`.

La firma descrive anche come passano i dati: un valore posseduto, un riferimento condiviso o un riferimento mutabile non sono intercambiabili. Esempi indipendenti per `src/main.rs`, verificati con **Rust 1.99.1, edition 2024**, senza crate esterne; il controesempio non compilabile e indicato.

## Quando usarlo

- Quando vuoi isolare logica riutilizzabile.
- Quando devi esprimere chiaramente input e output.
- Quando vuoi controllare ownership, borrowing e mutabilita nei parametri.

## Come funziona

Rust richiede il tipo dei parametri. Il valore di ritorno puo essere prodotto con l'ultima espressione della funzione o con `return`. Lo stile idiomatico usa spesso l'ultima espressione senza `;`.

### Firma e chiamata

In `fn add(a: i32, b: i32) -> i32`, `a` e `b` sono parametri; in `add(2, 3)`, `2` e `3` sono argomenti. Le funzioni ordinarie usano argomenti posizionali: non hanno parametri opzionali con default o overload per numero/tipo degli argomenti. Quando serve, usa nomi distinti, tipi dedicati, generici o un builder.

Una funzione nello stesso modulo puo essere dichiarata dopo il suo chiamante. Il risultato non dipende dall'ordine testuale delle definizioni; la visibilita e i percorsi dei moduli restano da rispettare.

### Passaggio dei dati

Gli argomenti passano per valore. Per tipi `Copy`, come `i32`, questo lascia utilizzabile il valore originale; per una `String` passata come `String`, normalmente trasferisce ownership. Non viene chiamato `clone()` automaticamente.

Anche un riferimento e un valore: `&str` permette di leggere testo senza prenderne ownership; `&mut String` permette di modificarlo durante il prestito. Un parametro `mut value: T` rende mutabile il binding locale, non il binding del chiamante. Un parametro `value: &mut T` concede invece accesso mutabile al dato preso in prestito, anche senza `mut` davanti a `value`.

## API / Sintassi

### Parametri e risultato unit

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn print_value(value: i32) {
    println!("{value}");
}

fn main() {
    let result = add(2, 3);
    assert_eq!(result, 5);
    let printed: () = print_value(result);
    assert_eq!(printed, ());
}
```

`print_value` ha un effetto su stdout ma restituisce `()`. `add` usa normale aritmetica `i32`: per input arbitrari fuori range bisogna scegliere una politica di overflow, come spiegato nella nota sui tipi primitivi.

### Mutazione locale e modifica tramite riferimento

```rust
fn next(mut value: u32) -> u32 {
    value += 1;
    value
}

fn append_marker(text: &mut String) {
    text.push('!');
}

fn byte_len(text: &str) -> usize {
    text.len()
}

fn main() {
    let count = 4;
    assert_eq!(next(count), 5);
    assert_eq!(count, 4);

    let mut label = String::from("Rust");
    append_marker(&mut label);
    assert_eq!(label, "Rust!");
    assert_eq!(byte_len(&label), 5);
    assert_eq!(byte_len("ok"), 2);
}
```

`next` non modifica `count`; `append_marker` modifica la stessa stringa del chiamante. `byte_len` accetta sia un letterale sia una vista della `String`; misura byte UTF-8, non caratteri visibili. La conversione da `&String` a `&str` non copia il contenuto.

## Esempio pratico

### Predicato riutilizzabile

```rust
fn is_even(value: i32) -> bool {
    value % 2 == 0
}

fn main() {
    let result = is_even(10);
    assert!(result);
    assert!(is_even(0));
    assert!(is_even(-4));
    assert!(!is_even(3));
    println!("{result}");
}
```

Una funzione che risponde a una domanda puo restituire `bool`. Il chiamante decide poi cosa fare: non e necessario incorporare stampa o input nella logica di calcolo.

### Uscita anticipata e valore assente

```rust
fn first_positive(values: &[i32]) -> Option<i32> {
    for &value in values {
        if value > 0 {
            return Some(value);
        }
    }
    None
}

fn main() {
    assert_eq!(first_positive(&[-2, 0, 7, 9]), Some(7));
    assert_eq!(first_positive(&[-2, 0]), None);
    assert_eq!(first_positive(&[]), None);
}
```

`return` termina la funzione, non soltanto il ciclo. `Some(value)` e `None` sono due casi dello stesso tipo `Option<i32>`. Il pattern `&value` legge e copia il numero dalla slice; la funzione non prende ownership della collezione. Qui il ritorno anticipato rende chiara la scelta del **primo** elemento valido.

## Varianti

- Funzione senza ritorno esplicito: restituisce `()`.
- Funzione associata: definita dentro `impl`.
- Metodo: funzione associata con parametro `self`, `&self` o `&mut self`.
- Closure: funzione anonima con cattura dell'ambiente.

### Passare una funzione come argomento

```rust
fn is_even(value: i32) -> bool {
    value % 2 == 0
}

fn accepts(value: i32, predicate: fn(i32) -> bool) -> bool {
    predicate(value)
}

fn main() {
    assert!(accepts(8, is_even));
    assert!(!accepts(7, is_even));
}
```

`is_even` senza parentesi passa la funzione; `is_even(8)` la esegue e produce un `bool`. `fn(i32) -> bool` e un puntatore a funzione. Le closure che catturano variabili richiedono altre firme, per esempio basate sui trait `Fn`, `FnMut` o `FnOnce`: vedi la nota dedicata. Una funzione `fn` annidata non cattura automaticamente le variabili locali esterne.

Funzioni generiche, `const fn`, `async fn` e API `unsafe` hanno vincoli aggiuntivi: questa nota non le tratta come varianti intercambiabili di una normale chiamata sincrona.

## Errori comuni

- Mettere `;` sull'espressione finale e trasformare il ritorno in `()`.
- Dimenticare il tipo dei parametri.
- Trattare `return` come vietato: e utile per uscite anticipate; per il risultato finale spesso basta l'espressione conclusiva.
- Passare ownership quando basterebbe un riferimento.

### Valore usato dopo il trasferimento

Questo esempio **non compila**: la stringa e stata trasferita a `consume`.

```rust
fn consume(text: String) -> usize {
    text.len()
}

fn main() {
    let label = String::from("Rust");
    assert_eq!(consume(label), 4);
    println!("{label}");
}
```

Se serve solo leggere, usa `&str` e chiama `consume(&label)`; se serve davvero un proprietario indipendente, valuta esplicitamente `clone()` e il suo costo. Non aggiungere clone a ogni errore di ownership senza scegliere il contratto dell'API.

## Checklist

- I parametri hanno tipo esplicito.
- Il tipo di ritorno e coerente con l'ultima espressione.
- Usi riferimenti quando la funzione non deve possedere il dato.
- La firma chiarisce lettura, modifica o trasferimento del dato.
- Usi `mut` solo per accessi mutabili necessari nella funzione.
- Input vuoti, errori, range numerici ed effetti esterni hanno un comportamento definito.

## Collegamenti

- [[Programmazione/Rust/Pagine/Closure|Closure]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Structs|Structs]]
- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Tipi di dato primitivi|Tipi di dato primitivi]]
- [[Programmazione/Rust/Pagine/Ownership|Ownership]]

## Fonti

- [Rust Book: Functions](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html).
- [Rust Reference: Functions](https://doc.rust-lang.org/reference/items/functions.html).
- [Rust Book: Ownership and Functions](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html#ownership-and-functions).
- [Rust Reference: Function pointer types](https://doc.rust-lang.org/reference/types/function-pointer.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

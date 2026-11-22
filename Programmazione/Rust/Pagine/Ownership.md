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
  - memory-safety
aliases:
  - Ownership in Rust
  - Sistema di ownership
prerequisites:
  - "[[Programmazione/Rust/Pagine/Sintassi di base]]"
  - "[[Programmazione/Rust/Pagine/Variabili mutabilita e shadowing]]"
  - "[[Programmazione/Rust/Pagine/Stack e Heap]]"
related:
  - "[[Programmazione/Rust/Pagine/Move semantics]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
title: Ownership
---

# Ownership

## Sintesi

L'ownership descrive chi possiede un valore e chi e responsabile della sua distruzione. Insieme al borrowing permette a Rust di gestire memoria e altre risorse senza richiedere un garbage collector: nel codice safe, con astrazioni corrette, impedisce usi come use-after-free e double free.

I controlli sono in gran parte statici, ma allocazioni, distruttori e reference counting, quando usati, svolgono lavoro a runtime. Non significa quindi "nessun costo di gestione della memoria". Gli esempi sono programmi indipendenti per `src/main.rs`, baseline **Rust 1.99.1, edition 2024**.

## Quando usarlo

- Quando si lavora con valori come `String`, `Vec<T>`, file o guardie di lock. L'ownership non e limitata allo heap.
- Quando si passa un valore a una funzione e bisogna decidere se trasferirlo, copiarlo o prestarlo.
- Quando si progetta una API e si vuole rendere chiaro chi possiede i dati.
- Quando si deve evitare memoria condivisa non controllata.

## Come funziona

Per un valore posseduto ordinario, ragiona cosi:

- Esiste un proprietario responsabile del valore; puo essere un binding, un campo, una collezione o un temporaneo, non necessariamente una variabile con nome.
- Un trasferimento sposta quella responsabilita: non crea due proprietari indipendenti della stessa risorsa.
- Alla normale uscita dallo scope viene distrutto cio che e ancora inizializzato e posseduto in quello scope. Un valore restituito o spostato altrove non viene distrutto dal vecchio proprietario.

Con `let other = name`, una `String` viene spostata: `name` non puo piu leggerla. Un `i32`, invece, e `Copy` e viene copiato. Decide il tipo, non una regola "stack = copia, heap = move".

L'ownership condivisa si esprime tramite tipi come `Rc<T>` e `Arc<T>`: ogni handle e a sua volta un valore posseduto, mentre il contenuto e gestito dal contatore. Non si ottiene assegnando liberamente una `String` a piu nomi. Vedi [[Programmazione/Rust/Pagine/Rc T e Arc T|Rc<T> e Arc<T>]].

## API / Sintassi

### Consumare un valore

```rust
fn consume(text: String) -> usize {
    text.len()
}

fn main() {
    let name = String::from("Luca");
    let bytes = consume(name);
    assert_eq!(bytes, 4);
}
```

`consume` riceve la `String` per valore e la distrugge al termine della chiamata: il chiamante ottiene solo il numero di byte, non la stringa. E una dimostrazione del contratto, non la firma consigliata per calcolare una lunghezza.

### Leggere senza consumare

```rust
fn byte_len(text: &str) -> usize {
    text.len()
}

fn main() {
    let name = String::from("Luca");
    assert_eq!(byte_len(&name), 4);
    assert_eq!(byte_len("Rust"), 4);
    assert_eq!(name, "Luca");
}
```

`&str` permette di leggere sia una `String` presa in prestito sia un letterale, senza richiedere `&String`. La funzione conta byte UTF-8, non caratteri visibili. Il prestito non rende il destinatario proprietario del testo.

### Modificare senza trasferire

```rust
fn append_marker(text: &mut String) {
    text.push('!');
}

fn main() {
    let mut name = String::from("Luca");
    append_marker(&mut name);
    assert_eq!(name, "Luca!");
}
```

Il chiamante conserva ownership. Il riferimento mutabile concede accesso esclusivo per la durata del prestito; non e una copia del valore. La mutabilita del binding e la proprieta della risorsa sono concetti diversi.

## Esempio pratico

### Trasformare e restituire ownership

```rust
fn add_prefix(mut text: String) -> String {
    text.insert_str(0, "id-");
    text
}

fn main() {
    let name = String::from("ordine");
    assert_eq!(name.len(), 6);
    let name = add_prefix(name);
    assert_eq!(name, "id-ordine");
    println!("{name}");
}
```

Il primo binding non e `mut`, ma puo trasferire il valore a un parametro locale mutabile. Il risultato diventa il nuovo `name` tramite shadowing: non e un clone. `insert_str` puo riallocare se la capacita non basta; questo costo deriva dalla modifica, non dal semplice trasferimento di ownership.

## Varianti

- Trasferire ownership: utile quando la funzione deve diventare responsabile del valore.
- Prendere un riferimento immutabile `&T`: utile per leggere senza consumare.
- Prendere un riferimento mutabile `&mut T`: utile per modificare senza trasferire.
- Restituire ownership: utile quando una funzione costruisce o trasforma un valore posseduto.

### Distruzione a fine scope e drop anticipato

```rust
struct Resource(&'static str);

impl Drop for Resource {
    fn drop(&mut self) {
        println!("rilascio {}", self.0);
    }
}

fn main() {
    let first = Resource("prima");
    {
        let _second = Resource("seconda");
    }
    drop(first);
    println!("fine");
}
```

Output: `rilascio seconda`, `rilascio prima`, `fine`, su tre righe. `Resource` osserva la distruzione tramite stampa: non apre un file o un lock. `drop(first)` consuma il valore e ne anticipa la distruzione; `drop(&first)` eliminerebbe solo una copia del riferimento, non la risorsa.

Non serve implementare `Drop` per ogni struct: i campi posseduti vengono distrutti automaticamente. Un riassegnamento puo distruggere il vecchio valore prima della fine dello scope; la fine di un prestito non coincide necessariamente con la distruzione del proprietario. Vedi [[Programmazione/Rust/Pagine/Drop Trait|Drop e RAII]].

### Limiti della garanzia

Ownership non significa assenza di memory leak o cleanup garantito in ogni situazione: `mem::forget`, cicli di riferimenti forti e terminazione senza unwinding possono impedire l'esecuzione dei distruttori. Non risolve errori logici, deadlock o implementazioni `unsafe` non corrette. La memoria restituita all'allocatore non deve necessariamente tornare subito al sistema operativo.

## Errori comuni

- Usare una variabile dopo un move.
- Passare `String` quando sarebbe bastato `&str`.
- Clonare valori grandi per evitare il borrow checker invece di modellare meglio l'ownership.
- Restituire riferimenti a valori locali che vengono distrutti alla fine della funzione.
- Confondere immutabilita della variabile e ownership del valore.

### Riferimento a un valore locale

Questo programma **non compila**: `name` viene distrutta al ritorno. Scrivere `'static` nel tipo non ne prolunga la vita.

```rust
fn invalid_name() -> &'static str {
    let name = String::from("Luca");
    &name
}

fn main() {
    println!("{}", invalid_name());
}
```

In questo caso restituisci una `String` posseduta; se vuoi restituire una vista su dati del chiamante, il prestito deve provenire da dati che vivono abbastanza a lungo, non da questa variabile locale.

## Checklist

- Il chiamante deve continuare a usare il valore dopo la chiamata? Usa un riferimento.
- La funzione deve conservare il dato senza dipendere dalla durata del chiamante? Valuta un valore posseduto. Conservare un riferimento e possibile solo rispettandone il lifetime.
- Il valore e piccolo e `Copy`? La copia e spesso accettabile.
- Il valore e grande o possiede risorse? Evita `clone` non necessari.
- Il design della API comunica chiaramente chi possiede cosa?

## Collegamenti

- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/Stack e Heap|Stack e Heap]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop e RAII]]
- [[Programmazione/Rust/Pagine/Rc T e Arc T|Ownership condivisa con Rc e Arc]]

## Fonti

- [Rust Book: What Is Ownership?](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html).
- [Rust Book: References and Borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html).
- [Rust Reference: Destructors](https://doc.rust-lang.org/reference/destructors.html).
- [Standard library: drop](https://doc.rust-lang.org/std/mem/fn.drop.html).
- [Standard library: forget e limiti delle garanzie](https://doc.rust-lang.org/std/mem/fn.forget.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

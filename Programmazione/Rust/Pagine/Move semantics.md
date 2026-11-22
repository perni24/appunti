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
  - move-semantics
aliases:
  - Move in Rust
  - Semantica di move
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Stack e Heap]]"
related:
  - "[[Programmazione/Rust/Pagine/Copy e Clone]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
title: Move semantics
---

# Move semantics

## Sintesi

La move semantics trasferisce un valore non `Copy` a una nuova posizione, per esempio un binding, un parametro o un campo. La sorgente non puo piu essere letta finche non viene reinizializzata; un move parziale riguarda invece solo alcune parti.

Il trasferimento non chiama automaticamente `clone()` o un costruttore di move personalizzato. Evita di duplicare implicitamente risorse possedute, ma non garantisce che il codice macchina non copi alcun byte. Esempi indipendenti per `src/main.rs`, baseline **Rust 1.99.1, edition 2024**.

## Quando usarlo

- Quando si passa a una funzione un valore che la funzione deve consumare.
- Quando si sposta un valore dentro una struttura, una collection o una closure.
- Quando si restituisce un valore costruito localmente.
- Quando si vuole evitare una copia profonda di dati allocati sullo heap.

## Come funziona

Per i tipi non `Copy`, assegnazione, passaggio a funzione e ritorno possono trasferire ownership.

### Trasferimento senza clone

```rust
fn main() {
    let first = String::from("ciao");
    let second = first;
    assert_eq!(second, "ciao");
}
```

Una `String` contiene puntatore, lunghezza e capacita riferiti a un buffer sullo heap. Il move non duplica quel buffer: cambia chi lo possiede. Non dedurre pero che i metadati debbano sempre risiedere sullo stack o essere materialmente copiati: il valore puo essere un campo e il compilatore puo ottimizzare gli spostamenti.

Il criterio e `Copy`, non la presenza di allocazioni. Anche una struct contenente soltanto un `u32` viene mossa se non implementa `Copy`. La regola riguarda l'uso per valore: chiamate a metodi come `len()` possono invece prendere in prestito il receiver.

## API / Sintassi

### Parametri e ritorno

```rust
fn make_values() -> Vec<i32> {
    vec![1, 2, 3]
}

fn count_owned(values: Vec<i32>) -> usize {
    values.len()
}

fn main() {
    let values = make_values();
    assert_eq!(count_owned(values), 3);
}
```

Il vettore creato da `make_values` passa al chiamante; `count_owned` lo consuma e lo distrugge. Per una funzione che deve soltanto contare elementi sarebbe piu adatto un parametro `&[i32]`.

### Campo posseduto

```rust
struct User {
    name: String,
}

fn main() {
    let name = String::from("Luca");
    let user = User { name };
    assert_eq!(user.name, "Luca");
}
```

Il campo `user.name` possiede ora la stringa; il precedente binding `name` non la possiede piu. L'asserzione legge il campo tramite prestito, non lo sposta fuori dalla struct.

## Esempio pratico

### Passare un job alla coda

```rust
struct Job {
    id: u64,
    payload: String,
}

fn enqueue(queue: &mut Vec<Job>, job: Job) {
    queue.push(job);
}

fn main() {
    let mut queue = Vec::new();
    let job = Job {
        id: 1,
        payload: String::from("sync"),
    };

    enqueue(&mut queue, job);
    assert_eq!(queue.len(), 1);
    let job = queue.pop().expect("job appena inserito");
    assert_eq!(job.id, 1);
    assert_eq!(job.payload, "sync");
    assert!(queue.is_empty());
}
```

`enqueue` sposta il `Job` nella coda senza clonarne il payload; `pop()` trasferisce il valore estratto al chiamante. E una collezione locale, non una coda concorrente o un sistema persistente. Il `Vec` puo allocare o riallocare spazio quando cresce: move non significa che l'intera operazione sia priva di allocazioni.

Con `push` e `pop` l'ordine e **LIFO**, come una pila. Se il requisito e una coda FIFO, usa per esempio `VecDeque` con `push_back` e `pop_front`; il nome `queue` da solo non cambia l'ordine di estrazione.

## Varianti

- Move per assegnazione: `let b = a;`.
- Move per passaggio a funzione: `funzione(a);`.
- Move per ritorno: una funzione restituisce un valore e trasferisce ownership al chiamante.
- Move parziale: un campo non `Copy` puo essere spostato da un valore posseduto che lo consente; gli altri campi restano utilizzabili.

### Move parziale e reinizializzazione

```rust
struct User {
    name: String,
    visits: u32,
}

fn main() {
    let mut user = User {
        name: String::from("Luca"),
        visits: 3,
    };
    let old_name = user.name;
    assert_eq!(user.visits, 3);
    user.name = String::from("Ada");
    let complete_user = user;
    assert_eq!(old_name, "Luca");
    assert_eq!(complete_user.name, "Ada");
}
```

Fra lo spostamento di `user.name` e la sua reinizializzazione non puoi prendere in prestito o muovere `user` come valore intero. Puoi ancora usare `visits`. Non serve ricostruire tutti i campi: assegnare quello mancante ripristina il valore completo. La mutabilita e necessaria per riassegnare il campo, non per il move iniziale.

Un campo non `Copy` non puo essere estratto in questo modo da un tipo che implementa `Drop`: il distruttore deve poter vedere il valore completo. Non puoi nemmeno spostare liberamente un campo dietro `&T` o `&mut T`. Le API come `Option::take` e `mem::replace` consentono estrazioni lasciando un sostituto valido; non aggirano il controllo di ownership.

### Cattura move di una closure

```rust
fn main() {
    let label = String::from("worker");
    let byte_len = move || label.len();
    assert_eq!(byte_len(), 6);
    assert_eq!(byte_len(), 6);
}
```

La closure cattura la `String` per valore, ma ogni chiamata si limita a leggerla: puo essere invocata piu volte. Una closure `move` non e automaticamente solo `FnOnce`; conta cosa fa il corpo. Se cattura un `&T`, cattura il riferimento, non diventa proprietaria di `T` e non lo rende `'static`.

## Errori comuni

- Provare a usare un valore dopo averlo passato a una funzione che prende ownership.
- Risolvere ogni errore di move con `.clone()` senza valutare il costo.
- Confondere cattura per valore di una closure con consumo del contenuto a ogni chiamata.
- Muovere un campo da una struct e poi provare a usare l'intera struct.

### Uso dopo il trasferimento

Questo programma **non compila**: `first` e stato spostato. Non e una stringa vuota o un valore nullo da controllare a runtime.

```rust
fn main() {
    let first = String::from("ciao");
    let second = first;
    println!("{first} {second}");
}
```

Leggi tramite un prestito se il trasferimento non serve, oppure usa un clone intenzionale se servono due stringhe indipendenti. Un binding mutabile puo anche ricevere un nuovo valore dopo il move: questo non recupera il contenuto precedente.

## Checklist

- La funzione deve solo leggere? Usa `&T`.
- La funzione deve modificare senza conservare? Usa `&mut T`.
- La funzione deve consumare il valore o conservarlo senza dipendere dal chiamante? Prendi `T`; un eventuale riferimento conservato richiede invece lifetime adeguati.
- Il clone e necessario o basta cambiare firma?
- Il valore mosso viene ancora usato dopo? Riorganizza lo scope o usa un riferimento.

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Closure|Closure]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop e limiti del move parziale]]
- [[Programmazione/Rust/Pagine/Destructuring|Destructuring]]
- [[Programmazione/Rust/Pagine/VecDeque BTreeMap e BTreeSet|VecDeque e coda FIFO]]

## Fonti

- [Rust Reference: moved and copied types](https://doc.rust-lang.org/reference/expressions.html#moved-and-copied-types).
- [Standard library: rappresentazione di String](https://doc.rust-lang.org/std/string/struct.String.html#representation).
- [Rust By Example: partial moves](https://doc.rust-lang.org/rust-by-example/scope/move/partial_move.html).
- [Rust Reference: catture e trait delle closure](https://doc.rust-lang.org/reference/types/closure.html).
- [Standard library: VecDeque](https://doc.rust-lang.org/std/collections/struct.VecDeque.html).
- [Standard library: mem::replace](https://doc.rust-lang.org/std/mem/fn.replace.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

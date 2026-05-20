---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, ownership, move-semantics]
aliases:
  - "Move in Rust"
  - "Semantica di move"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Stack e Heap]]"
related:
  - "[[Programmazione/Rust/Pagine/Copy e Clone]]"
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
---

# Move semantics

## Sintesi

La move semantics e il comportamento per cui l'ownership di un valore viene trasferita da una variabile a un'altra. Dopo un move, la variabile originale non puo piu essere usata, perche non e piu proprietaria del valore.

Questo meccanismo permette a Rust di evitare copie implicite costose e di garantire che ogni risorsa venga liberata una sola volta.

## Quando usarlo

- Quando si passa a una funzione un valore che la funzione deve consumare.
- Quando si sposta un valore dentro una struttura, una collection o una closure.
- Quando si restituisce un valore costruito localmente.
- Quando si vuole evitare una copia profonda di dati allocati sullo heap.

## Come funziona

Per i tipi non `Copy`, assegnazione, passaggio a funzione e ritorno possono trasferire ownership.

```rust
let a = String::from("ciao");
let b = a;

// a non e piu valido
println!("{b}");
```

Nel caso di `String`, Rust copia sullo stack i metadati della stringa, cioe puntatore, lunghezza e capacita. Non copia il buffer sullo heap. Per evitare che due proprietari puntino alla stessa allocazione, il vecchio binding viene invalidato.

## API / Sintassi

```rust
fn consuma(v: Vec<i32>) {
    println!("{}", v.len());
}

let numeri = vec![1, 2, 3];
consuma(numeri);
// numeri non e piu utilizzabile
```

Move dentro una struct:

```rust
struct Utente {
    nome: String,
}

let nome = String::from("Luca");
let utente = Utente { nome };
// nome e stato mosso dentro utente
```

## Esempio pratico

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
    // job non serve piu: ora appartiene alla queue
}
```

La funzione `enqueue` prende ownership del `Job` per inserirlo nella coda. Questo evita copie inutili del `payload`.

## Varianti

- Move per assegnazione: `let b = a;`.
- Move per passaggio a funzione: `funzione(a);`.
- Move per ritorno: una funzione restituisce un valore e trasferisce ownership al chiamante.
- Move parziale: si puo muovere un campo da una struct, ma poi la struct non puo essere usata come valore intero se non viene ricostruita.

## Errori comuni

- Provare a usare un valore dopo averlo passato a una funzione che prende ownership.
- Risolvere ogni errore di move con `.clone()` senza valutare il costo.
- Dimenticare che una closure con `move` cattura ownership dei valori usati.
- Muovere un campo da una struct e poi provare a usare l'intera struct.

## Checklist

- La funzione deve solo leggere? Usa `&T`.
- La funzione deve modificare senza conservare? Usa `&mut T`.
- La funzione deve conservare o consumare il valore? Prendi `T`.
- Il clone e necessario o basta cambiare firma?
- Il valore mosso viene ancora usato dopo? Riorganizza lo scope o usa un riferimento.

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Copy e Clone|Copy e Clone]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]
- [[Programmazione/Rust/Pagine/Closure|Closure]]


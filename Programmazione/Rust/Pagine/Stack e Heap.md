---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, stack, heap, memory]
aliases:
  - "Stack vs Heap in Rust"
  - "Memoria stack e heap"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Tipi di dato primitivi]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
related:
  - "[[Programmazione/Rust/Pagine/Move semantics]]"
  - "[[Programmazione/Rust/Pagine/Stringhe String e &str]]"
  - "[[Programmazione/Rust/Pagine/Vec]]"
---

# Stack e Heap

## Sintesi

Stack e heap sono due aree di memoria con caratteristiche diverse. Lo stack e veloce, ordinato e usato per valori di dimensione nota. Lo heap e piu flessibile, permette dati di dimensione dinamica, ma richiede allocazione e deallocazione.

Rust usa ownership e `drop` per gestire automaticamente le risorse sullo heap senza garbage collector.

## Quando usarlo

- I tipi primitivi, tuple piccole e struct di dimensione nota stanno direttamente sullo stack.
- Tipi come `String`, `Vec<T>` e `Box<T>` usano lo heap per i dati dinamici.
- Usa lo heap quando la dimensione non e nota a compile time o quando serve ownership indiretta.
- Evita allocazioni heap inutili in codice sensibile alla performance.

## Come funziona

Una `String` e composta da metadati sullo stack e buffer sullo heap:

- puntatore al buffer;
- lunghezza;
- capacita.

```rust
let s = String::from("rust");
```

Il binding `s` contiene i metadati. I byte `r`, `u`, `s`, `t` sono nello heap.

Quando `s` esce dallo scope, Rust chiama `drop` e libera il buffer.

```rust
{
    let s = String::from("temp");
} // qui il buffer viene liberato
```

## API / Sintassi

Allocazioni comuni:

```rust
let testo = String::from("ciao");
let numeri = vec![1, 2, 3];
let valore = Box::new(42);
```

Valori stack-only:

```rust
let n: i32 = 10;
let punto = (3, 4);
let flag = true;
```

Capacita e riallocazione:

```rust
let mut v = Vec::with_capacity(100);
v.push(1);
```

## Esempio pratico

```rust
fn crea_messaggi(n: usize) -> Vec<String> {
    let mut messaggi = Vec::with_capacity(n);

    for i in 0..n {
        messaggi.push(format!("messaggio-{i}"));
    }

    messaggi
}

fn main() {
    let messaggi = crea_messaggi(3);
    println!("{messaggi:?}");
}
```

Il `Vec` possiede un buffer heap. Ogni `String` possiede a sua volta un buffer heap per il testo.

## Varianti

- Stack: valori locali, dimensione nota, deallocazione automatica con uscita dallo scope.
- Heap: dati dinamici, accesso tramite puntatori o smart pointer.
- `Box<T>`: mette un singolo valore sullo heap.
- `Vec<T>`: buffer dinamico contiguo sullo heap.
- `String`: buffer UTF-8 dinamico sullo heap.

## Errori comuni

- Pensare che una variabile `String` sia interamente sullo stack.
- Ignorare il costo di allocazioni ripetute in loop.
- Conservare riferimenti a elementi di un `Vec` e poi causare riallocazioni.
- Usare `Box<T>` senza una ragione concreta.
- Confondere move dei metadati con copia dei dati heap.

## Checklist

- La dimensione del valore e nota e piccola? Lo stack e naturale.
- Serve dimensione dinamica? Probabilmente serve heap.
- Stai riallocando spesso? Usa `with_capacity`.
- Stai passando una `String` per valore? Stai muovendo i metadati, non copiando il buffer.
- I riferimenti restano validi se una collection rialloca?

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]
- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/Box T|Box T]]


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
  - stack
  - heap
  - memory
aliases:
  - Stack vs Heap in Rust
  - Memoria stack e heap
prerequisites:
  - "[[Programmazione/Rust/Pagine/Tipi di dato primitivi]]"
  - "[[Programmazione/Rust/Pagine/Ownership]]"
related:
  - "[[Programmazione/Rust/Pagine/Move semantics]]"
  - "[[Programmazione/Rust/Pagine/Stringhe String e &str]]"
  - "[[Programmazione/Rust/Pagine/Vec]]"
title: Stack e Heap
---

# Stack e Heap

## Sintesi

Stack e heap descrivono forme diverse di gestione della memoria, non due categorie rigide di tipi Rust. Un i32 puo essere un locale, un campo in un Box o un elemento di un Vec. Un valore di dimensione nota puo quindi essere contenuto anche nello heap.

Il modello stack/frame e utile per ragionare sulle chiamate; le allocazioni possedute da Box, Vec e String possono sopravvivere alla funzione che le ha create se la proprieta viene trasferita. Gli esempi autonomi sono verificati con Rust **1.99.1**, edition **2024**.

## Quando usarlo

- Per distinguere un valore dai dati che possiede indirettamente.
- Per capire crescita dei contenitori, capacita e costo delle copie.
- Per scegliere un array a lunghezza fissa, un Vec dinamico o un Box.
- Per analizzare consumo di memoria e ricorsione, senza dedurre prestazioni assolute dal solo tipo.

Non usare la regola "primitivo uguale stack, dimensione dinamica uguale heap" come garanzia. Una slice puo riferirsi a un array gia esistente senza allocare.

## Come funziona

Nel modello usuale, ogni chiamata ha un frame con locali e informazioni di controllo. I frame seguono l'ordine delle chiamate e dei ritorni. Il compilatore puo mantenere valori in registri o eliminarli: il sorgente non promette che ogni let occupi uno slot fisico sullo stack.

Lo heap e gestito dall'allocatore. Un contenitore posseduto gestisce l'accesso e il rilascio della sua allocazione. Ownership e borrowing sono regole semantiche; non obbligano tutti i valori a una posizione fisica specifica. Anche allocazioni non osservabili possono essere ottimizzate via.

### Metadati e dati posseduti

Una String distingue puntatore, lunghezza e capacita dai byte del testo. Un Vec distingue i propri metadati dal buffer contiguo di elementi. Se una String e un elemento di Vec<String>, i suoi metadati stanno nel buffer del Vec, mentre il testo e posseduto separatamente.

Un array contiene gli elementi direttamente; non riserva da solo un secondo buffer. Un array di String puo comunque possedere allocazioni tramite ciascun elemento.

Il rilascio ordinario segue la distruzione del proprietario, non necessariamente il ritorno della funzione che ha allocato. Leak intenzionali, cicli di ownership condivisa o terminazione senza unwinding richiedono considerazioni ulteriori: non promettere che ogni allocazione venga sempre liberata.

## API / Sintassi

### Valori contenuti direttamente

```rust
use std::mem::size_of_val;

fn main() {
    let number: i32 = 10;
    let point = (3_i32, 4_i32);
    let flag = true;
    let values = [1_u32, 2, 3];

    assert_eq!(size_of_val(&number), 4);
    assert_eq!(point.0, 3);
    assert!(flag);
    assert_eq!(size_of_val(&values), 3 * size_of_val(&values[0]));

    let boxed = Box::new(values);
    assert_eq!(boxed[2], 3);
}
```

Questi assert verificano valori e dimensioni, non indirizzi stack/heap. Box fornisce ownership indiretta anche per un array di dimensione nota. Il compilatore puo ottimizzare il demo; non e una misura delle allocazioni effettive.

### String, Vec e Box

```rust
fn main() {
    let text = String::from("ciao");
    let numbers = vec![1, 2, 3];
    let value = Box::new(42);

    assert_eq!(text.len(), 4);
    assert!(text.capacity() >= text.len());
    assert_eq!(numbers.as_slice(), &[1, 2, 3]);
    assert_eq!(*value, 42);

    let boxed_text = Box::new(text);
    assert_eq!(boxed_text.as_str(), "ciao");
}
```

Box<String> aggiunge un livello di indirezione per la String; non fonde automaticamente il suo buffer con il contenitore. Per possedere testo senza capacita di crescita valuta Box<str>, non un Box aggiunto per abitudine.

### Capacita e lunghezza

```rust
fn main() {
    let mut values: Vec<i32> = Vec::with_capacity(3);
    assert_eq!(values.len(), 0);
    assert!(values.capacity() >= 3);

    let capacity = values.capacity();
    for value in [10, 20, 30] {
        values.push(value);
    }
    assert_eq!(values, [10, 20, 30]);
    assert_eq!(values.capacity(), capacity);

    values.clear();
    assert!(values.is_empty());
    assert_eq!(values.capacity(), capacity);
}
```

with_capacity riserva spazio, non crea elementi. Push non rialloca se la capacita basta; una crescita ulteriore puo richiedere un nuovo buffer. Non assumere un fattore di crescita fisso o capacita esattamente uguale alla richiesta. Clear distrugge gli elementi ma conserva la capacita del Vec.

## Esempio pratico

### Creare messaggi e trasferirli al chiamante

```rust
fn create_messages(count: usize) -> Vec<String> {
    let mut messages = Vec::with_capacity(count);

    for index in 0..count {
        messages.push(format!("messaggio-{index}"));
    }

    messages
}

fn main() {
    let messages = create_messages(3);
    assert_eq!(messages, ["messaggio-0", "messaggio-1", "messaggio-2"]);
    assert!(create_messages(0).is_empty());
}
```

La prenotazione riguarda gli elementi del Vec, non tutti i byte delle String future. Ogni format produce testo posseduto. Il ritorno trasferisce il Vec, non clona ricorsivamente i messaggi: il chiamante diventa responsabile dei dati.

count e fidato nel demo. Per dimensioni provenienti dall'esterno servono limiti applicativi; una richiesta enorme puo fallire. try_reserve permette di gestire errori di prenotazione del contenitore, ma non rende automaticamente fallibili le altre allocazioni del programma.

## Varianti

### Distruzione osservabile del contenuto

```rust
struct Resource;

impl Drop for Resource {
    fn drop(&mut self) {
        println!("rilasciata");
    }
}

fn main() {
    let resource = Box::new(Resource);
    println!("prima");
    drop(resource);
    println!("dopo");
}
```

L'output e prima, rilasciata, dopo, su tre righe. Resource ha dimensione zero: questo esempio osserva il distruttore, **non dimostra una chiamata all'allocatore**. Box di tipi zero-sized e Vec di elementi zero-sized non richiedono spazio per il contenuto; anche Vec::new e String::new partono senza buffer allocato.

Per grandi sequenze, Vec o una slice posseduta possono evitare un grande array locale. Tuttavia scrivere Box::new con un enorme array non garantisce l'assenza di temporanei sullo stack su ogni build. Il dimensionamento dello stack dipende dalla piattaforma e dai thread; ricorsione e array grandi vanno misurati nel contesto reale.

## Errori comuni

- Presentare il layout didattico come ABI o ordine garantito dei campi.
- Chiamare size_of su String e interpretarlo come totale dei byte posseduti.
- Confondere move con clone o con assenza garantita di copie macchina.
- Pensare che clear restituisca sempre memoria all'allocatore o che liberarla riduca subito la memoria del processo vista dal sistema operativo.
- Credere che reserve consenta push mentre un riferimento a un elemento deve ancora essere usato: il contratto dei prestiti resta valido.
- Dire che lo heap e sempre lento e lo stack sempre veloce, senza considerare allocazioni, localita e accessi.

## Checklist

- Il dato e contenuto direttamente oppure attraverso un proprietario indiretto?
- Sto misurando metadati, elementi o allocazioni annidate?
- La capacita riguarda quanti elementi, non quante String complete?
- La dimensione richiesta e limitata e attendibile?
- Il costo viene da allocazione, clone, riallocazione o lavoro sugli elementi?
- Ho distinto comportamento osservabile, ottimizzazione e garanzie dell'API?

## Collegamenti

- [[Programmazione/Rust/Pagine/Ownership|Ownership]]
- [[Programmazione/Rust/Pagine/Move semantics|Move semantics]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe String e &str]]
- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/Box T|Box<T>]]
- [[Programmazione/Rust/Pagine/Drop Trait|Drop Trait]]

## Fonti

- [Rust Book: Ownership, stack e heap](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html).
- [Rust Reference: Memory allocation and lifetime](https://doc.rust-lang.org/reference/memory-allocation-and-lifetime.html).
- [Rust Reference: Destructors](https://doc.rust-lang.org/reference/destructors.html).
- [Standard library: size_of_val](https://doc.rust-lang.org/std/mem/fn.size_of_val.html).
- [Standard library: Vec e garanzie](https://doc.rust-lang.org/std/vec/struct.Vec.html#guarantees).
- [Standard library: Box e tipi zero-sized](https://doc.rust-lang.org/std/boxed/index.html).
- [Standard library: GlobalAlloc, limiti delle osservazioni sulle allocazioni](https://doc.rust-lang.org/std/alloc/trait.GlobalAlloc.html#safety).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

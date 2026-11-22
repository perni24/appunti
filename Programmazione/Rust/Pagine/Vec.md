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
  - vec
  - collezioni
aliases:
  - Vec Rust
  - Vector Rust
  - Vec<T>
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Slices]]"
  - "[[Programmazione/Rust/Pagine/Stack e Heap]]"
related:
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
  - "[[Programmazione/Rust/Pagine/VecDeque BTreeMap e BTreeSet]]"
  - "[[Programmazione/Rust/Pagine/HashMap e HashSet]]"
title: Vec
---

# Vec

## Sintesi

`Vec<T>` possiede una sequenza di elementi dello stesso tipo, con lunghezza modificabile. Gli elementi inizializzati sono contigui; eventuali buffer posseduti da ciascun elemento, come il testo di una `String`, possono trovarsi altrove.

Esempi autonomi per Rust stable, edition 2024. Il blocco indicato come controesempio deve fallire in compilazione.

## Quando usarlo

- Accumulare risultati o mantenere una sequenza in un ordine scelto.
- Accedere per indice, scorrere dati o implementare uno stack con `push` e `pop`.
- Passare dati a funzioni che accettano slice, senza imporre il contenitore al chiamante.
- Per una coda con rimozioni frequenti in testa, valutare invece `VecDeque`.

## Come funziona

### Lunghezza, capacita e memoria

`len()` conta gli elementi presenti; `capacity()` indica quanti il buffer puo ospitarne senza crescere. La capacita inutilizzata **non contiene elementi accessibili**.

Il valore `Vec` contiene puntatore, lunghezza e capacita: non e necessariamente sullo stack, puo essere un campo di un oggetto allocato sullo heap. L'ordine interno dei campi non e un contratto ABI.

`Vec::new()` non alloca; anche i tipi di dimensione zero, come `()`, non richiedono spazio per gli elementi. Se esiste, il buffer e allocato sullo heap. Distruggere il vettore distrugge gli elementi ancora posseduti, ma non garantisce cancellazione sicura dei dati.

### Costo e prestiti

L'accesso per indice costa O(1); `push` ha costo O(1) **ammortizzato**, non una latenza costante per ogni chiamata. La crescita puo spostare il buffer, senza un fattore di crescita garantito. Inserire o rimuovere nel mezzo richiede spostamenti; `swap_remove` li evita sacrificando l'ordine.

I riferimenti sicuri non diventano silenziosamente invalidi: il borrow checker rifiuta un uso incompatibile con una modifica. Questo vale anche se hai gia riservato capacita sufficiente.

## API / Sintassi

### Creazione, accesso e modifica

```rust
fn main() {
    let empty: Vec<i32> = Vec::new();
    assert!(empty.is_empty());

    let mut values: Vec<i32> = Vec::with_capacity(4);
    assert_eq!(values.len(), 0);
    assert!(values.capacity() >= 4);
    assert_eq!(values.get(0), None);

    values.push(10);
    values.push(20);
    if let Some(first) = values.get_mut(0) {
        *first += 1;
    }
    assert_eq!(values.first(), Some(&11));
    assert_eq!(values.pop(), Some(20));

    values.resize(3, 0);
    assert_eq!(values, [11, 0, 0]);
    assert_eq!(vec![7; 3], [7, 7, 7]);
}
```

`with_capacity` lascia la lunghezza a zero, mentre `resize` aggiunge valori o tronca. `vec![value; n]` ripete tramite `Clone`: con puntatori condivisi come `Rc` non crea oggetti indipendenti. Per un vettore vuoto il tipo deve essere deducibile dall'uso o annotato.

`get(i)` restituisce `Option<&T>`; `get_mut(i)` restituisce `Option<&mut T>`. `values[i]` provoca panic fuori intervallo. Con elementi non `Copy` non puoi estrarli per valore semplicemente indicizzando: usa un prestito oppure un'operazione che rimuove e restituisce l'elemento.

### Leggere, modificare o consumare

```rust
fn main() {
    let mut names = vec![String::from("api"), String::from("web")];

    for name in &names {
        assert!(!name.is_empty());
    }
    for name in &mut names {
        name.push('!');
    }

    let mut lengths = Vec::new();
    for name in names {
        lengths.push(name.len());
    }
    assert_eq!(lengths, [4, 4]);
}
```

`&names` produce `&String`, `&mut names` produce `&mut String`, mentre `names` trasferisce gli elementi come `String` e consuma il vettore. Non occorre clonare per leggere. La lunghezza non si modifica attraverso una slice o durante il ciclo che ne mantiene un prestito.

### Rimuovere, filtrare e deduplicare

```rust
fn main() {
    let mut ordered = vec![10, 20, 30, 40];
    assert_eq!(ordered.remove(1), 20);
    assert_eq!(ordered, [10, 30, 40]);

    let mut unordered = vec![10, 20, 30, 40];
    assert_eq!(unordered.swap_remove(1), 20);
    assert_eq!(unordered, [10, 40, 30]);

    let mut values = vec![2, 2, 1, 2, 3];
    values.dedup();
    assert_eq!(values, [2, 1, 2, 3]);
    values.sort_unstable();
    values.dedup();
    assert_eq!(values, [1, 2, 3]);

    values.retain(|n| n % 2 == 0);
    assert_eq!(values, [2]);
    let capacity = values.capacity();
    values.clear();
    assert!(values.is_empty());
    assert_eq!(values.capacity(), capacity);
}
```

`dedup` elimina solo duplicati **consecutivi**; ordinare prima cambia la sequenza originale. `sort_unstable` non preserva l'ordine relativo degli elementi che il confronto considera uguali. `retain` conserva l'ordine dei superstiti; `remove` e `swap_remove` richiedono un indice valido.

`truncate(n)` riduce la lunghezza, non la espande. `clear` elimina gli elementi senza liberare la capacita; `shrink_to_fit` richiede una riduzione, senza imporre capacita esattamente uguale alla lunghezza.

## Esempio pratico

### Filtrare senza consumare l'input

```rust
fn filter_even(numbers: &[i32]) -> Vec<i32> {
    let mut result = Vec::new();
    for &number in numbers {
        if number % 2 == 0 {
            result.push(number);
        }
    }
    result
}

fn main() {
    let numbers = vec![-3, -2, 0, 4, 5];
    assert_eq!(filter_even(&numbers), [-2, 0, 4]);
    assert_eq!(filter_even(&[7, 8]), [8]);
    assert!(filter_even(&[]).is_empty());
    assert_eq!(numbers, [-3, -2, 0, 4, 5]);
}
```

La funzione accetta vettori e array tramite slice. Copia gli interi selezionati in un nuovo contenitore e mantiene ordine e duplicati. Non modifica l'input. Preallocare l'intera lunghezza potrebbe evitare crescite ma sprecare memoria quando pochi elementi passano il filtro: e una scelta da misurare, non un requisito di correttezza.

### Riservare memoria in modo fallibile

```rust
use std::collections::TryReserveError;

fn repeated(value: u8, count: usize) -> Result<Vec<u8>, TryReserveError> {
    let mut bytes = Vec::new();
    bytes.try_reserve(count)?;
    bytes.resize(count, value);
    Ok(bytes)
}

fn main() -> Result<(), TryReserveError> {
    assert_eq!(repeated(9, 3)?, [9, 9, 9]);
    assert!(repeated(9, 0)?.is_empty());
    Ok(())
}
```

`reserve(additional)` e `try_reserve(additional)` ragionano rispetto alla **lunghezza corrente**, non alla capacita. Qui `try_reserve` permette di propagare overflow di capacita o fallimenti riportati dall'allocatore; non rende fallibili tutte le allocazioni del programma. Se `count` arriva dall'esterno, imponi anche un limite applicativo prima di riservare: non usare l'esaurimento della memoria come validazione.

## Varianti

| Esigenza                                         | Tipo o firma  |
| ------------------------------------------------ | ------------- |
| Possedere una sequenza ridimensionabile          | `Vec<T>`      |
| Leggere dati senza imporre il contenitore        | `&[T]`        |
| Modificare elementi, ma non la lunghezza         | `&mut [T]`    |
| Aggiungere o rimuovere dal vettore del chiamante | `&mut Vec<T>` |
| Numero di elementi nel tipo                      | `[T; N]`      |
| Inserire/rimuovere ai due estremi                | `VecDeque<T>` |

`&Vec<T>` puo avere senso quando servono proprieta specifiche del vettore, come la capacita; per la sola lettura degli elementi preferisci una slice.

## Errori comuni

### Prestito ancora usato dopo push

Controesempio intenzionale: non compila, anche se la capacita e sufficiente.

```rust
fn main() {
    let mut values = Vec::with_capacity(8);
    values.push(String::from("first"));
    let first = &values[0];
    values.push(String::from("second"));
    println!("{first}");
}
```

Usa il riferimento prima di `push`, acquisiscilo dopo la modifica oppure copia/clona esplicitamente solo cio che deve sopravvivere. Non aggirare il controllo con puntatori raw.

- Confondere capacita disponibile con elementi inizializzati.
- Assumere che `dedup` rimuova ogni duplicato senza ordinare.
- Dipendere da indici stabili dopo inserimenti, rimozioni o ordinamenti.
- Usare `remove(0)` ripetutamente per svuotare una coda: puo portare a costo quadratico.
- Preallocare quantitativi enormi senza limiti o trattare `clear` come cancellazione sicura.

## Checklist

- Accesso potenzialmente assente gestito con `get`?
- Ordine richiesto preservato dalle operazioni scelte?
- La funzione deve prendere possesso, leggere o modificare la lunghezza?
- I prestiti terminano prima delle modifiche incompatibili?
- Preallocazione proporzionata ai dati e verificata con misure?
- Duplicati e input vuoto coperti dagli esempi o dai test?

## Collegamenti

- [[Programmazione/Rust/Pagine/Slices|Slices]]
- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/VecDeque BTreeMap e BTreeSet|VecDeque, BTreeMap e BTreeSet]]
- [[Programmazione/Rust/Pagine/HashMap e HashSet|HashMap e HashSet]]
- [[Programmazione/Rust/Pagine/Stack e Heap|Stack e Heap]]

## Fonti

Baseline consultata: documentazione stable **Rust 1.99.1**. Gli esempi non richiedono crate esterne; non e una dichiarazione di MSRV.

- [Vec: garanzie, capacita e metodi](https://doc.rust-lang.org/std/vec/struct.Vec.html)
- [Rust Book: vettori e borrowing](https://doc.rust-lang.org/book/ch08-01-vectors.html)
- [Slice: accesso, ordinamento e iterazione](https://doc.rust-lang.org/std/primitive.slice.html)
- [Collezioni: costi attesi e ammortizzati](https://doc.rust-lang.org/std/collections/index.html#performance)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

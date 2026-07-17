---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [programmazione, rust, vecdeque, btreemap, btreeset, collezioni]
aliases:
  - "VecDeque Rust"
  - "BTreeMap Rust"
  - "BTreeSet Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Vec]]"
  - "[[Programmazione/Rust/Pagine/HashMap e HashSet]]"
related:
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
  - "[[Programmazione/Rust/Pagine/Default]]"
---

# VecDeque BTreeMap e BTreeSet

## Sintesi

`VecDeque`, `BTreeMap` e `BTreeSet` sono collezioni standard alternative a `Vec`, `HashMap` e `HashSet`. Servono quando la struttura dei dati richiede operazioni diverse: coda a doppia estremita o ordine stabile per chiave.

## Quando usarlo

- Usa `VecDeque<T>` per code FIFO o inserimenti/rimozioni frequenti in testa e coda.
- Usa `BTreeMap<K, V>` quando serve una mappa ordinata per chiave.
- Usa `BTreeSet<T>` quando serve un insieme ordinato.
- Preferisci `HashMap`/`HashSet` quando l'ordine non serve e vuoi lookup medio veloce.

## Come funziona

Import:

```rust
use std::collections::{BTreeMap, BTreeSet, VecDeque};
```

`VecDeque`:

```rust
let mut queue = VecDeque::new();
queue.push_back("job-1");
queue.push_back("job-2");
let next = queue.pop_front();
```

`BTreeMap` mantiene le chiavi ordinate:

```rust
let mut map = BTreeMap::new();
map.insert(2, "b");
map.insert(1, "a");
```

Iterando, le chiavi escono in ordine.

## API / Sintassi

```rust
let mut deque = VecDeque::new();
deque.push_front(1);
deque.push_back(2);
deque.pop_front();
deque.pop_back();
```

```rust
let mut map = BTreeMap::new();
map.insert("a", 1);
map.range("a".."z");
```

```rust
let mut set = BTreeSet::new();
set.insert(10);
set.contains(&10);
```

## Esempio pratico

```rust
use std::collections::{BTreeMap, VecDeque};

fn scheduler() {
    let mut queue = VecDeque::new();
    queue.push_back("download");
    queue.push_back("parse");

    while let Some(job) = queue.pop_front() {
        println!("eseguo {job}");
    }
}

fn report_ordinato(conteggi: BTreeMap<String, usize>) {
    for (chiave, valore) in conteggi {
        println!("{chiave}: {valore}");
    }
}
```

`VecDeque` modella bene una coda. `BTreeMap` rende stabile l'ordine del report.

## Varianti

- `VecDeque<T>`: coda a doppia estremita.
- `BTreeMap<K, V>`: mappa ordinata.
- `BTreeSet<T>`: insieme ordinato.
- `HashMap<K, V>`: mappa hash non ordinata.
- `Vec<T>`: sequenza contigua ottimale per accesso per indice.

## Errori comuni

- Usare `Vec` come coda con rimozioni frequenti in testa.
- Usare `BTreeMap` solo per abitudine quando l'ordine non serve.
- Aspettarsi complessita identica tra strutture hash e B-tree.
- Dimenticare che `BTreeMap` richiede ordinamento delle chiavi.
- Usare collection ordinate in percorsi critici senza misurare.

## Checklist

- Hai bisogno di ordine stabile?
- Hai bisogno di range query su chiavi ordinate?
- Inserisci o rimuovi spesso dalla testa?
- Il costo di hashing o confronto e rilevante?
- La struttura scelta rende chiaro l'uso previsto?

## Collegamenti

- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/HashMap e HashSet|HashMap e HashSet]]
- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]
- [[Programmazione/Rust/Pagine/Default|Default]]


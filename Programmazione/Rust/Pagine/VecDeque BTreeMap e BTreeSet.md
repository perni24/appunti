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
  - vecdeque
  - btreemap
  - btreeset
  - collezioni
aliases:
  - VecDeque Rust
  - BTreeMap Rust
  - BTreeSet Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Vec]]"
  - "[[Programmazione/Rust/Pagine/HashMap e HashSet]]"
related:
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
  - "[[Programmazione/Rust/Pagine/Default]]"
title: VecDeque BTreeMap e BTreeSet
---

# VecDeque BTreeMap e BTreeSet

## Sintesi

`VecDeque<T>` e una sequenza con accesso efficiente ai due estremi. `BTreeMap<K, V>` e `BTreeSet<T>` mantengono invece chiavi ordinate: risolvono problemi diversi, non sono sostituti intercambiabili.

Esempi autonomi per Rust stable, edition 2024. L'ordine dei B-tree e quello definito da `Ord`, **non quello di inserimento**.

## Quando usarlo

- `VecDeque`: coda FIFO, buffer di lavoro, inserimenti/rimozioni in testa e coda.
- `BTreeMap`: valori associati a chiavi ordinate, ricerca per intervalli, minimo e massimo.
- `BTreeSet`: appartenenza senza duplicati e scansione ordinata.
- `Vec`: sequenze contigue; `HashMap`/`HashSet`: lookup senza bisogno di ordine.

## Come funziona

### Ordine logico e disposizione fisica

`VecDeque` usa un buffer circolare: la sequenza puo essere spezzata in due slice. Il primo elemento logico resta quello in testa, non necessariamente quello all'inizio dell'allocazione.

`as_slices` espone le due parti nel giusto ordine, con punto di separazione non garantito. `make_contiguous` le riunisce senza allocare e senza cambiare ordine logico; un successivo `sort` sulla slice, invece, cambia quell'ordine.

### Contratto delle chiavi

I B-tree richiedono `Ord` coerente con uguaglianza e confronti parziali. Non modificare l'ordinamento relativo di una chiave mentre e nella struttura. I valori della mappa possono invece essere aggiornati tramite prestiti mutabili.

Le stringhe usano un ordine lessicografico, non una collazione italiana o un ordinamento numerico dei suffissi. `f32` e `f64` non implementano `Ord`: per usarli come chiavi occorre definire consapevolmente una rappresentazione e un ordine totale, compreso il comportamento dei NaN.

### Costi da confrontare

| Operazione                               | Costo di riferimento                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| `VecDeque::get(i)`                       | O(1)                                                                       |
| Push ai due estremi                      | O(1) ammortizzato                                                          |
| Pop ai due estremi                       | O(1)                                                                       |
| Inserimento/rimozione interni a VecDeque | Spostamenti verso l'estremo piu vicino; possibile crescita all'inserimento |
| Ricerca/inserimento/rimozione B-tree     | O(log n)                                                                   |
| Lookup hash                              | O(1) atteso, con costo di hashing e collisioni                             |

I costi astratti non includono un costo arbitrario dei confronti o della distruzione dei valori. Ammortizzato non significa latenza massima costante. La struttura va scelta per le operazioni necessarie e misurata sui dati reali.

## API / Sintassi

### Coda FIFO e accesso agli estremi

```rust
use std::collections::VecDeque;

fn main() {
    let mut queue = VecDeque::new();
    queue.push_back(String::from("download"));
    queue.push_back(String::from("parse"));
    queue.push_front(String::from("check"));

    assert_eq!(queue.front().map(String::as_str), Some("check"));
    assert_eq!(queue.back().map(String::as_str), Some("parse"));
    assert_eq!(queue.get(1).map(String::as_str), Some("download"));
    assert_eq!(queue.pop_back().as_deref(), Some("parse"));

    let mut completed = Vec::new();
    while let Some(job) = queue.pop_front() {
        completed.push(job);
    }
    assert_eq!(completed, ["check", "download"]);
    assert_eq!(queue.pop_front(), None);
}
```

FIFO usa `push_back` e `pop_front`. `push_front` inserisce prima dei lavori in attesa, modificando quella politica. `front`/`back` prestano, i pop rimuovono e trasferiscono l'elemento; sulla coda vuota restituiscono `None`.

La capacita riservata non e un limite: `with_capacity(n)` non crea una coda bounded. Non offre inoltre sincronizzazione o attesa fra thread.

### Ottenere una slice contigua

```rust
use std::collections::VecDeque;

fn main() {
    let mut queue = VecDeque::from([4, 1, 3, 2]);
    queue.pop_front();
    queue.push_back(5);

    let (first, second) = queue.as_slices();
    let logical: Vec<_> = first.iter().chain(second).copied().collect();
    assert_eq!(logical, [1, 3, 2, 5]);

    assert_eq!(queue.make_contiguous(), &[1, 3, 2, 5]);
    assert!(queue.as_slices().1.is_empty());

    queue.make_contiguous().sort_unstable();
    assert_eq!(queue.iter().copied().collect::<Vec<_>>(), [1, 2, 3, 5]);
}
```

Non assumere che in questo esempio entrambe le slice siano non vuote: il test riguarda l'ordine logico, non la disposizione interna. Per la sola lettura spesso basta `iter()`; non serve riordinare fisicamente il buffer.

### Mappa ordinata, intervalli ed estremi

```rust
use std::collections::BTreeMap;

fn main() {
    let mut map = BTreeMap::from([(30, "c"), (10, "a"), (20, "b")]);
    assert_eq!(map.insert(20, "updated"), Some("b"));
    assert_eq!(map.get(&20), Some(&"updated"));
    assert_eq!(map.keys().copied().collect::<Vec<_>>(), [10, 20, 30]);

    let half_open: Vec<_> = map.range(10..30).map(|(&k, _)| k).collect();
    let inclusive: Vec<_> = map.range(10..=30).map(|(&k, _)| k).collect();
    assert_eq!(half_open, [10, 20]);
    assert_eq!(inclusive, [10, 20, 30]);

    for (_, value) in map.range_mut(10..20) {
        *value = "changed";
    }
    assert_eq!(map.first_key_value(), Some((&10, &"changed")));
    assert_eq!(map.last_key_value(), Some((&30, &"c")));
    assert_eq!(map.pop_first(), Some((10, "changed")));
    assert_eq!(map.pop_last(), Some((30, "c")));
    assert_eq!(map.remove(&20), Some("updated"));
    assert!(map.is_empty());
}
```

Gli intervalli riguardano **chiavi**, non posizioni. `a..b` esclude `b`, `a..=b` lo include; un limite non deve essere presente nella mappa. `range` restituisce un iteratore: crearlo e scartarlo non stampa ne modifica dati.

`range` e `range_mut` possono provocare panic se inizio > fine, o se i limiti sono uguali ed entrambi `Excluded`. Valida intervalli provenienti dall'esterno. `get` gestisce l'assenza con `Option`, l'indicizzazione no. `entry` offre aggiornamenti analoghi a quelli di `HashMap`.

### Insieme ordinato e operazioni fra insiemi

```rust
use std::collections::BTreeSet;

fn main() {
    let mut ids = BTreeSet::from([30, 10, 20, 10]);
    assert_eq!(ids.iter().copied().collect::<Vec<_>>(), [10, 20, 30]);
    assert!(!ids.insert(20));
    assert!(ids.contains(&10));
    assert_eq!(ids.range(15..=30).copied().collect::<Vec<_>>(), [20, 30]);

    let other = BTreeSet::from([20, 40]);
    assert_eq!(ids.intersection(&other).copied().collect::<Vec<_>>(), [20]);
    assert_eq!(ids.difference(&other).copied().collect::<Vec<_>>(), [10, 30]);
    assert_eq!(ids.union(&other).copied().collect::<Vec<_>>(), [10, 20, 30, 40]);

    assert_eq!(ids.first(), Some(&10));
    assert_eq!(ids.take(&20), Some(20));
    assert_eq!(ids.pop_last(), Some(30));
    assert!(ids.remove(&10));
    assert!(ids.is_empty());
}
```

L'insieme conserva un rappresentante per ciascuna equivalenza definita dall'ordine. Anche le operazioni fra questi insiemi producono risultati ordinati. `insert` non sostituisce il rappresentante gia presente; `replace` permette di farlo. Un set non e un contatore: le ripetizioni vengono perse.

## Esempio pratico

### Elaborazione sequenziale con riepilogo ordinato

```rust
use std::collections::{BTreeMap, VecDeque};

fn summarize(mut queue: VecDeque<String>) -> BTreeMap<String, usize> {
    let mut counts = BTreeMap::new();
    while let Some(job) = queue.pop_front() {
        *counts.entry(job).or_insert(0) += 1;
    }
    counts
}

fn print_report(counts: &BTreeMap<String, usize>) {
    for (job, count) in counts {
        println!("{job}: {count}");
    }
}

fn main() {
    let queue = VecDeque::from([
        String::from("parse"),
        String::from("download"),
        String::from("parse"),
    ]);
    let counts = summarize(queue);
    print_report(&counts);
    assert_eq!(counts.get("parse"), Some(&2));
    assert_eq!(counts.len(), 2);
}
```

`summarize` prende possesso della coda e trasferisce le stringhe nella mappa; `print_report` prende un prestito e non consuma il riepilogo. Il report mostra `download` prima di `parse`, anche se il primo lavoro in coda era `parse`.

E un modello didattico in memoria: conta etichette, non esegue download o parsing. Non e uno scheduler concorrente, non persiste lavori e non implementa retry, cancellazione, limiti di coda o garanzie di consegna.

## Varianti

- Per uno stack LIFO basta spesso `Vec` con `push`/`pop`.
- Per stampare in ordine una sola volta puoi ordinare una vista di una mappa hash; il B-tree mantiene l'ordine anche durante gli aggiornamenti.
- `BTreeMap::split_off(&key)` separa le chiavi maggiori o uguali al limite in una nuova mappa.
- Per una priorita basata sul valore del lavoro, non sulla posizione o sulla chiave, valuta una struttura dedicata come `BinaryHeap`; una FIFO non e una coda di priorita.

## Errori comuni

- Confondere ordine per chiave, ordine di inserimento e disposizione in memoria.
- Ordinare la deque e poi aspettarsi ancora la politica FIFO originale.
- Usare la capacita come limite automatico del numero di lavori.
- Scambiare `range(10..20)` per gli elementi in posizione 10-19.
- Mutare l'ordinamento della chiave attraverso stato condiviso.
- Scegliere hash o B-tree solo dalla complessita asintotica, ignorando dati e operazioni effettive.

## Checklist

- Ordine richiesto definito: inserimento, posizione, chiave o priorita?
- Pop e lookup su collezioni vuote gestiti?
- Intervalli inclusivi/esclusivi e validazione dei limiti chiari?
- Slice contigua davvero necessaria?
- La funzione deve consumare la collezione oppure prenderla in prestito?
- Limiti di memoria e concorrenza gestiti fuori dalla struttura quando servono?

## Collegamenti

- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/HashMap e HashSet|HashMap e HashSet]]
- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]
- [[Programmazione/Rust/Pagine/Default|Default]]
- [[Programmazione/Rust/Pagine/Channel async|Channel async]]

## Fonti

Baseline consultata: **Rust 1.99.1**; esempi solo stable. Non e una verifica della versione minima supportata.

- [VecDeque: buffer circolare e make_contiguous](https://doc.rust-lang.org/std/collections/struct.VecDeque.html)
- [BTreeMap: ordine, range e accessi](https://doc.rust-lang.org/std/collections/struct.BTreeMap.html)
- [BTreeSet: insiemi ordinati](https://doc.rust-lang.org/std/collections/struct.BTreeSet.html)
- [Collezioni: scelta e costi](https://doc.rust-lang.org/std/collections/index.html)
- [Ord: contratto e derivazione](https://doc.rust-lang.org/std/cmp/trait.Ord.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

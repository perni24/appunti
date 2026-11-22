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
  - hashmap
  - hashset
  - collezioni
aliases:
  - HashMap Rust
  - HashSet Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
related:
  - "[[Programmazione/Rust/Pagine/Vec]]"
  - "[[Programmazione/Rust/Pagine/VecDeque BTreeMap e BTreeSet]]"
  - "[[Programmazione/Rust/Pagine/AsRef AsMut e Borrow]]"
title: HashMap e HashSet
---

# HashMap e HashSet

## Sintesi

`HashMap<K, V>` associa ogni chiave a un valore; `HashSet<T>` rappresenta un insieme senza duplicati. L'identita delle chiavi dipende da `Eq` e `Hash`, non dalla posizione o dall'ordine di inserimento.

Esempi autonomi per Rust stable, edition 2024, senza crate esterne.

## Quando usarlo

- `HashMap` per conteggi, cache e indici per identificativo.
- `HashSet` per appartenenza, deduplicazione e confronti fra insiemi.
- `BTreeMap` e `BTreeSet` se servono chiavi ordinate o intervalli.
- Per piccole sequenze, un `Vec` puo essere piu semplice: misura se la velocita e rilevante.

## Come funziona

### Identita e costo

Chiavi uguali devono avere lo stesso hash; hash uguali **non implicano** chiavi uguali. Le collisioni vengono gestite dalla collezione. Non modificare uguaglianza o hash di una chiave mentre e inserita, nemmeno tramite interior mutability: viola il contratto logico della struttura.

Il lookup ha costo O(1) **atteso**, non garantito per ogni caso; l'inserimento include anche crescite ammortizzate. Hashing e confronti di chiavi lunghe hanno un costo proprio. L'hasher predefinito usa un seed casuale e mira a resistere a HashDoS; sostituirlo cambia queste proprieta.

L'iterazione non garantisce ordine. Nella baseline consultata `HashMap::iter` visita anche bucket vuoti, con costo O(capacity): riservare moltissimo spazio non e sempre vantaggioso.

### Ownership e chiavi prese in prestito

Inserire `String` trasferisce la stringa alla collezione; inserire `&str` conserva solo un riferimento e non prolunga la vita del testo originale.

Una mappa con chiavi `String` puo usare `get("api")` senza creare una nuova stringa: il lookup sfrutta `Borrow<str>`. La forma presa in prestito deve avere semantica di uguaglianza e hash coerente con la chiave; `AsRef` da solo non basta.

## API / Sintassi

### Inserire, cercare, aggiornare e rimuovere

```rust
use std::collections::HashMap;

fn main() {
    let mut scores: HashMap<String, u32> = HashMap::new();
    let key = String::from("api");
    assert_eq!(scores.insert(key, 10), None);
    assert_eq!(scores.insert(String::from("api"), 20), Some(10));
    assert_eq!(scores.len(), 1);

    assert_eq!(scores.get("api"), Some(&20));
    assert_eq!(scores.get("missing"), None);
    if let Some(score) = scores.get_mut("api") {
        *score += 1;
    }

    assert_eq!(scores.remove("api"), Some(21));
    assert_eq!(scores.remove("api"), None);
}
```

`insert` restituisce il valore precedente e sostituisce il valore, non l'oggetto chiave gia presente se uguale. `get` presta il valore; `remove` lo trasferisce fuori dalla mappa. `scores["missing"]` provocherebbe panic.

Con `&map` ottieni `(&K, &V)`; con `&mut map` ottieni `(&K, &mut V)`, senza poter modificare le chiavi. `for (key, value) in map` consuma invece il contenitore. Un riferimento ancora utilizzato impedisce modifiche incompatibili alla mappa.

### Entry e inizializzazione differita

```rust
use std::collections::HashMap;

fn main() {
    let mut counts: HashMap<&str, usize> = HashMap::new();
    for name in ["api", "web", "api"] {
        *counts.entry(name).or_insert(0) += 1;
    }
    counts.entry("api").and_modify(|n| *n += 1).or_insert(1);
    assert_eq!(counts.get("api"), Some(&3));

    let mut labels = HashMap::new();
    labels.insert("api", String::from("ready"));
    let mut created = 0;
    labels.entry("api").or_insert_with(|| {
        created += 1;
        String::from("pending")
    });
    labels.entry("web").or_insert_with(|| {
        created += 1;
        String::from("pending")
    });
    assert_eq!(created, 1);

    let mut groups: HashMap<&str, Vec<u32>> = HashMap::new();
    groups.entry("api").or_default().push(42);
    assert_eq!(groups.get("api"), Some(&vec![42]));
}
```

`entry` distingue una posizione occupata da una libera, evitando la ricerca manuale `contains_key` seguita dall'aggiornamento. Non e un'operazione atomica fra thread.

`or_insert(value)` valuta `value` subito; `or_insert_with(|| ... )` esegue la closure solo se manca la chiave. `and_modify` opera solo sul valore presente, `or_default` inserisce `Default::default()` se assente. Il risultato e un prestito mutabile al valore.

`entry` riceve una chiave posseduta `K`: con `HashMap<String, _>`, una `to_owned()` nel suo argomento avviene anche quando la chiave esiste. Per aggiornare solo una chiave gia presente, `get_mut` puo evitare quella costruzione.

### Appartenenza e algebra degli insiemi

```rust
use std::collections::HashSet;

fn main() {
    let mut visited: HashSet<String> = HashSet::new();
    assert!(visited.insert(String::from("home")));
    assert!(!visited.insert(String::from("home")));
    assert!(visited.contains("home"));
    assert!(visited.remove("home"));
    assert!(!visited.remove("home"));

    let local = HashSet::from([1, 2, 3]);
    let remote = HashSet::from([3, 4]);
    let common: HashSet<_> = local.intersection(&remote).copied().collect();
    let missing: HashSet<_> = remote.difference(&local).copied().collect();
    let all: HashSet<_> = local.union(&remote).copied().collect();
    let changed: HashSet<_> =
        local.symmetric_difference(&remote).copied().collect();

    assert_eq!(common, HashSet::from([3]));
    assert_eq!(missing, HashSet::from([4]));
    assert_eq!(all, HashSet::from([1, 2, 3, 4]));
    assert_eq!(changed, HashSet::from([1, 2, 4]));
    assert!(common.is_subset(&all));
}
```

`insert` restituisce `false` se l'elemento equivalente esiste gia e non lo sostituisce; `replace` serve a sostituirlo, `take` a rimuoverlo ottenendone la proprieta. Le operazioni fra insiemi mostrate producono iteratori di riferimenti; `copied` copia qui gli interi, `collect` costruisce un nuovo insieme.

Deduplicare tramite un set perde sia la molteplicita sia l'ordine della sequenza. Il confronto dei set nei test non dipende dal loro ordine di iterazione.

### Chiavi personalizzate

```rust
use std::collections::HashSet;

#[derive(Debug, PartialEq, Eq, Hash)]
struct ResourceKey {
    project: u32,
    path: String,
}

fn main() {
    let mut keys = HashSet::new();
    keys.insert(ResourceKey { project: 1, path: String::from("config") });
    keys.insert(ResourceKey { project: 2, path: String::from("config") });
    assert_eq!(keys.len(), 2);
    assert!(keys.contains(&ResourceKey {
        project: 1,
        path: String::from("config"),
    }));
}
```

Qui tutti i campi partecipano all'identita. Non aggiungere dati accessori alla chiave senza decidere se debbano influire sull'uguaglianza: spesso e meglio usare un identificativo come chiave e un record come valore.

## Esempio pratico

### Conteggio di token con report riproducibile

```rust
use std::collections::HashMap;

fn count_words(text: &str) -> HashMap<String, usize> {
    let mut counts = HashMap::new();
    for token in text.split_whitespace() {
        *counts.entry(token.to_lowercase()).or_insert(0) += 1;
    }
    counts
}

fn main() {
    let counts = count_words("Rust rust RUST, go");
    assert_eq!(counts.get("rust"), Some(&2));
    assert_eq!(counts.get("rust,"), Some(&1));

    let mut rows: Vec<_> = counts.iter().collect();
    rows.sort_unstable_by(|(left, _), (right, _)| left.cmp(right));
    for (word, count) in rows {
        println!("{word}: {count}");
    }
    assert_eq!(counts.len(), 3);
}
```

La funzione possiede le chiavi risultanti, quindi la mappa puo sopravvivere all'input. Il report ordina una vista di riferimenti, senza consumare o clonare tutta la mappa.

Il nome `count_words` e didattico: il criterio e **token separati da whitespace e convertiti in minuscolo**. Non elimina punteggiatura, non applica regole linguistiche locali, normalizzazione Unicode o case folding completo; `rust` e `rust,` rimangono distinti. L'ordinamento delle stringhe non e una collazione linguistica. Per input non fidato limita dimensione totale e numero di chiavi; questo esempio non implementa tali limiti.

## Varianti

- Chiavi possedute: comode per dati che devono sopravvivere alla sorgente.
- Chiavi prese in prestito: evitano copie ma vincolano il contenitore alla sorgente.
- `with_capacity` e `reserve`: preparano spazio, non aggiungono voci; `clear` mantiene l'allocazione riutilizzabile.
- `BTreeMap`/`BTreeSet`: ordine per chiave, non di inserimento. Per stampare una sola volta basta anche ordinare una vista come sopra.

## Errori comuni

- Basare test o output sul debug non ordinato di una mappa hash.
- Cercare un `&str` convertendolo inutilmente in `String`.
- Ignorare il valore precedente restituito da `insert` quando un duplicato deve essere un errore.
- Usare `or_insert` per una costruzione costosa che deve essere differita.
- Mutare indirettamente l'identita della chiave; per cambiarla, rimuovere e reinserire.
- Considerare `to_lowercase` una normalizzazione universale.

## Checklist

- Definizione di chiave duplicata esplicita?
- Ordine non richiesto oppure costruito separatamente?
- Proprietari e lifetime del testo chiari?
- Accesso assente gestito senza panic involontari?
- Entry utile, oppure basta `get_mut`?
- Costi di allocazione, hashing e input esterno considerati?

## Collegamenti

- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/VecDeque BTreeMap e BTreeSet|VecDeque, BTreeMap e BTreeSet]]
- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/AsRef AsMut e Borrow|AsRef, AsMut e Borrow]]
- [[Programmazione/Rust/Pagine/Stringhe String e &str|Stringhe: String e &str]]

## Fonti

Baseline consultata: **Rust 1.99.1**. Solo API stable negli esempi, senza dichiarare una MSRV.

- [HashMap: contratti, ownership e complessita](https://doc.rust-lang.org/std/collections/struct.HashMap.html)
- [Entry: aggiornamento e default](https://doc.rust-lang.org/std/collections/hash_map/enum.Entry.html)
- [HashSet: inserimento e operazioni fra insiemi](https://doc.rust-lang.org/std/collections/struct.HashSet.html)
- [Borrow: equivalenza della forma presa in prestito](https://doc.rust-lang.org/std/borrow/trait.Borrow.html)
- [str: split_whitespace e to_lowercase](https://doc.rust-lang.org/std/primitive.str.html)
- [Collezioni: costi attesi e ammortizzati](https://doc.rust-lang.org/std/collections/index.html#performance)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [programmazione, rust, hashmap, hashset, collezioni]
aliases:
  - "HashMap Rust"
  - "HashSet Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Ownership]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
related:
  - "[[Programmazione/Rust/Pagine/Vec]]"
  - "[[Programmazione/Rust/Pagine/VecDeque BTreeMap e BTreeSet]]"
  - "[[Programmazione/Rust/Pagine/AsRef AsMut e Borrow]]"
---

# HashMap e HashSet

## Sintesi

`HashMap<K, V>` associa chiavi a valori usando hashing. `HashSet<T>` conserva elementi unici ed e concettualmente una mappa con sole chiavi. Sono utili quando serve ricerca media veloce per chiave o deduplicazione.

Le chiavi devono implementare `Eq` e `Hash`.

## Quando usarlo

- Usa `HashMap` per lookup per chiave, cache, conteggi e indici.
- Usa `HashSet` per deduplicare elementi o testare appartenenza.
- Preferisci `BTreeMap` o `BTreeSet` se serve ordine stabile.
- Evita `HashMap` se devi mantenere ordine di inserimento.

## Come funziona

Import:

```rust
use std::collections::{HashMap, HashSet};
```

Creazione e inserimento:

```rust
let mut conteggi = HashMap::new();
conteggi.insert("rust", 1);
```

Lookup:

```rust
if let Some(n) = conteggi.get("rust") {
    println!("{n}");
}
```

Con ownership: inserire una `String` muove la chiave dentro la mappa.

## API / Sintassi

`entry` e il modo idiomatico per aggiornare valori:

```rust
let mut conteggi = HashMap::new();

for parola in ["rust", "rust", "go"] {
    *conteggi.entry(parola).or_insert(0) += 1;
}
```

`HashSet`:

```rust
let mut visitati = HashSet::new();
visitati.insert("home");

if visitati.contains("home") {
    println!("gia visitato");
}
```

## Esempio pratico

```rust
use std::collections::HashMap;

fn conta_parole(testo: &str) -> HashMap<String, usize> {
    let mut conteggi = HashMap::new();

    for parola in testo.split_whitespace() {
        let parola = parola.to_lowercase();
        *conteggi.entry(parola).or_insert(0) += 1;
    }

    conteggi
}
```

Ogni parola normalizzata diventa una chiave posseduta dalla mappa.

## Varianti

- `HashMap<K, V>`: lookup medio veloce, ordine non garantito.
- `HashSet<T>`: insieme non ordinato.
- `BTreeMap<K, V>`: mappa ordinata per chiave.
- `BTreeSet<T>`: insieme ordinato.
- `Entry API`: aggiornamento efficiente senza doppio lookup.

## Errori comuni

- Fare `contains_key` seguito da `insert` invece di usare `entry`.
- Aspettarsi ordine stabile in iterazione.
- Usare chiavi mutate in modo che cambino hash o uguaglianza logica.
- Clonare chiavi e valori senza necessita.
- Usare `HashMap` per piccole liste dove un `Vec` sarebbe piu semplice.

## Checklist

- Serve lookup per chiave?
- L'ordine conta? Se si, valuta `BTreeMap`.
- La chiave implementa correttamente `Eq` e `Hash`?
- Devi aggiornare valori esistenti? Usa `entry`.
- La mappa possiede chiavi e valori o bastano riferimenti con lifetime chiari?

## Collegamenti

- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/VecDeque BTreeMap e BTreeSet|VecDeque BTreeMap e BTreeSet]]
- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/AsRef AsMut e Borrow|AsRef AsMut e Borrow]]


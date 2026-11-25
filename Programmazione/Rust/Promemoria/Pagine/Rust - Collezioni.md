---
date: 2026-07-30
area: Programmazione
topic: Promemoria Rust
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - rust
  - promemoria
  - vec
  - hashmap
  - hashset
aliases:
  - Cheatsheet collezioni Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Vec|Vec]]"
  - "[[Programmazione/Rust/Pagine/HashMap e HashSet|HashMap e HashSet]]"
title: Rust - Collezioni
---

# Rust - Collezioni

Blocchi indipendenti da incollare in `fn main()`. Usa `Vec` per la posizione, `HashMap` per chiave, `HashSet` per appartenenza e `VecDeque` per una coda.

## Vec: leggere e modificare

```rust
let mut values = vec![10, 20, 30];
values.push(40);
assert_eq!(values.pop(), Some(40));
assert_eq!(values.first(), Some(&10));
assert_eq!(values.get(3), None);
values.insert(1, 15);
assert_eq!(values.remove(1), 15);
values.retain(|&n| n >= 20);
assert_eq!(values.len(), 2);
values.clear();
assert!(values.is_empty());
```

`get(i)` restituisce `None` fuori intervallo; `remove(i)` richiede `i < len()`, `insert(i, x)` ammette anche `i == len()`.

## Ordinare

```rust
let mut values = vec![3, 1, 2];
values.sort();
values.sort_by(|a, b| b.cmp(a));
assert_eq!(values, [3, 2, 1]);
let mut users = [(2, "Lia"), (1, "Ada")];
users.sort_by_key(|user| user.0);
assert_eq!(users[0].1, "Ada");
let mut floats = [1.5_f64, -2.0];
floats.sort_by(f64::total_cmp); // definito anche per NaN
assert_eq!(floats, [-2.0, 1.5]);
```

## HashMap ed entry

```rust
use std::collections::HashMap;
let mut users = HashMap::from([(1, "Ada")]);
users.insert(2, "Lia");
assert_eq!(users.get(&1), Some(&"Ada"));
assert!(users.contains_key(&2));
assert_eq!(users.remove(&2), Some("Lia"));
for (id, name) in &users { println!("{id}: {name}"); }

let mut counts = HashMap::new();
for word in ["ok", "ok", "no"] { *counts.entry(word).or_insert(0) += 1; }
assert_eq!(counts["ok"], 2);
let mut labels = HashMap::new();
let id = 7;
let label = labels.entry(id).or_insert_with(|| format!("user-{id}"));
assert_eq!(label.as_str(), "user-7");
```

`or_insert_with` calcola il valore solo se la chiave manca. Non fare affidamento sull'ordine di iterazione di `HashMap` o `HashSet`.

## HashSet: appartenenza e confronti

```rust
use std::collections::HashSet;
let mut left = HashSet::from([1, 2]);
let right = HashSet::from([2, 3]);
assert!(!left.insert(2)); // era già presente
assert!(left.contains(&1));
assert_eq!(left.union(&right).count(), 3);
assert_eq!(left.intersection(&right).copied().collect::<Vec<_>>(), [2]);
assert_eq!(left.difference(&right).copied().collect::<Vec<_>>(), [1]);
assert!(left.remove(&1));
```

## VecDeque: FIFO

```rust
use std::collections::VecDeque;
let mut queue = VecDeque::new();
queue.push_back("first");
assert_eq!(queue.pop_front(), Some("first"));
assert_eq!(queue.pop_front(), None);
```

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/HashMap e HashSet|HashMap e HashSet]]
- [[Programmazione/Rust/Pagine/VecDeque BTreeMap e BTreeSet|VecDeque BTreeMap e BTreeSet]]
- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]

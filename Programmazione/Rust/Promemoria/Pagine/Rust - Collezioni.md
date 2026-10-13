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
  - "[[Programmazione/Rust/Pagine/Vec]]"
  - "[[Programmazione/Rust/Pagine/HashMap e HashSet]]"
title: Rust - Collezioni
---

# Rust - Collezioni

## Vec

```rust
let mut values = vec![10, 20, 30];

values.push(40);
let last = values.pop();
let first = values.first();
let second = values.get(1);
values.len();
values.is_empty();
```

## Modificare e rimuovere

```rust
values.insert(1, 15);
let removed = values.remove(1);
values.retain(|value| *value >= 20);
values.clear();
```

## Ordinare

```rust
values.sort();
values.sort_by(|left, right| right.cmp(left));
users.sort_by_key(|user| user.id);
```

Per `f32` e `f64`:

```rust
values.sort_by(|left, right| left.total_cmp(right));
```

## HashMap

```rust
use std::collections::HashMap;

let mut users = HashMap::new();

users.insert(1, "Ada");
users.get(&1);
users.contains_key(&1);
users.remove(&1);
```

## Entry API

```rust
let count = counts.entry(word).or_insert(0);
*count += 1;
```

```rust
users.entry(id).or_insert_with(|| create_user(id));
```

## Iterare una mappa

```rust
for (id, user) in &users {
    println!("{id}: {user}");
}
```

## HashSet

```rust
use std::collections::HashSet;

let mut ids = HashSet::from([1, 2, 3]);

ids.insert(4);
ids.contains(&2);
ids.remove(&1);
```

## Operazioni tra set

```rust
let union = left.union(&right);
let intersection = left.intersection(&right);
let difference = left.difference(&right);
```

## VecDeque

```rust
use std::collections::VecDeque;

let mut queue = VecDeque::new();
queue.push_back(item);
let item = queue.pop_front();
```

## Approfondimento

- [[Programmazione/Rust/Pagine/Vec|Vec]]
- [[Programmazione/Rust/Pagine/HashMap e HashSet|HashMap e HashSet]]
- [[Programmazione/Rust/Pagine/VecDeque BTreeMap e BTreeSet|VecDeque BTreeMap e BTreeSet]]
- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]


## Navigazione

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]

---
date: 2026-07-30
area: Programmazione
topic: Promemoria Rust
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - rust
  - promemoria
  - iteratori
aliases:
  - Cheatsheet iteratori Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Iteratori|Iteratori]]"
  - "[[Programmazione/Rust/Pagine/Iterator API|Iterator API]]"
title: Rust - Iteratori
---

# Rust - Iteratori

Per scegliere una pipeline chiediti chi possiede gli elementi e come vuoi trattare gli errori. Ogni blocco è indipendente e va nel corpo di `fn main()`.

## Leggere, modificare o prendere possesso

```rust
let mut names = vec![String::from("Ada"), String::from("Teo")];
assert_eq!(names.iter().next().map(String::as_str), Some("Ada")); // &String
for name in names.iter_mut() { name.push('!'); }                 // &mut String
let owned: Vec<String> = names.into_iter().collect();            // String
assert_eq!(owned, ["Ada!", "Teo!"]);
```

Su un `Vec<T>` posseduto, `into_iter()` sposta il vettore. Su `&vec` produce invece riferimenti: conta il tipo del ricevitore, non solo il nome del metodo.

## Trasformare e cercare

```rust
let values = [-2, 3, 8];
let mut doubled = values.iter().copied().filter(|&n| n > 0).map(|n| n * 2);
assert_eq!(doubled.next(), Some(6));
assert_eq!(doubled.collect::<Vec<_>>(), [16]); // solo ciò che resta
```

`filter` e `map` sono pigri: costruiscono un iteratore; sono `next`, `collect` o un ciclo a chiedere i valori.

```rust
let values = [4, 12, 20];
assert_eq!(values.iter().copied().find(|&n| n > 10), Some(12)); // valore
assert_eq!(values.iter().position(|&n| n > 10), Some(1));       // posizione
assert!(values.iter().any(|&n| n == 20));
assert!(values.iter().all(|&n| n > 0));
```

## Ridurre, enumerare e combinare

```rust
let values = [2, 3, 4];
assert_eq!(values.iter().sum::<i32>(), 9);
assert_eq!(values.iter().product::<i32>(), 24);
assert_eq!(values.iter().fold(10, |acc, &n| acc + n), 19); // base esplicita
```

```rust
let names = ["Ada", "Teo", "Lia"];
let scores = [9, 7];
let rows: Vec<_> = names.into_iter().zip(scores).enumerate().collect();
assert_eq!(rows, [(0, ("Ada", 9)), (1, ("Teo", 7))]);
```

`zip` termina con l'iteratore più corto: non segnala una differenza di lunghezza.

## Saltare elementi o lavorare su una slice

```rust
let values = [0, 1, 2, 3, 4, 5];
let selected: Vec<_> = values.iter().copied().skip(1).step_by(2).take(2).collect();
assert_eq!(selected, [1, 3]);
let s = &[1, 2, 3][..];
assert_eq!(s.windows(2).collect::<Vec<_>>(), [&s[0..2], &s[1..3]]);
assert_eq!(s.chunks(2).collect::<Vec<_>>(), [&s[0..2], &s[2..3]]);
```

`windows` sovrappone le finestre; `chunks` no e può lasciare un ultimo blocco corto. La dimensione deve essere positiva.

## Scartare valori mancanti o conservare l'errore

```rust
let present: Vec<_> = [Some(1), None, Some(3)].into_iter().flatten().collect();
assert_eq!(present, [1, 3]);
let texts = ["2", "x", "4"];
let valid: Vec<_> = texts.iter().filter_map(|s| s.parse::<i32>().ok()).collect();
assert_eq!(valid, [2, 4]); // scarta gli errori
let all: Result<Vec<_>, _> = texts.iter().map(|s| s.parse::<i32>()).collect();
assert!(all.is_err()); // primo errore, non un Vec parziale
```

Riferimento: [metodi di Iterator](https://doc.rust-lang.org/std/iter/trait.Iterator.html).

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]
- [[Programmazione/Rust/Pagine/Closure|Closure]]
- [[Programmazione/Rust/Pagine/Rayon e parallel iterators|Rayon e parallel iterators]]

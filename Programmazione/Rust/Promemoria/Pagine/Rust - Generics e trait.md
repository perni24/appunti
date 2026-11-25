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
  - generics
  - trait
aliases:
  - Cheatsheet trait Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Generics|Generics]]"
  - "[[Programmazione/Rust/Pagine/Traits|Traits]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]"
title: Rust - Generics e trait
---

# Rust - Generics e trait

Usa un parametro generico quando vuoi riutilizzare una funzione o collegare più tipi nella firma. Ogni blocco è indipendente e va nel corpo di `fn main()`.

## Parametri generici e bound

```rust
fn first<T>(values: &[T]) -> Option<&T> { values.first() }
struct Pair<T> { left: T, right: T }
fn equal<T>(pair: &Pair<T>) -> bool
where
    T: PartialEq,
{
    pair.left == pair.right
}
assert_eq!(first(&["Ada", "Teo"]), Some(&"Ada"));
assert!(first::<String>(&[]).is_none());
assert!(equal(&Pair { left: 7, right: 7 }));
```

`first` restituisce un prestito: non richiede `Clone`. Per il confronto basta `PartialEq`; aggiungi `Debug` solo se devi anche formattare il valore con `{:?}`.

## Trait, metodo predefinito e dispatch

```rust
trait Summary {
    fn title(&self) -> &str;
    fn summary(&self) -> String { self.title().to_owned() }
}
struct User { id: u64, name: String }
impl Summary for User {
    fn title(&self) -> &str { &self.name }
    fn summary(&self) -> String { format!("{}: {}", self.id, self.title()) }
}
struct Note(String);
impl Summary for Note {
    fn title(&self) -> &str { &self.0 }
}
fn label(value: &impl Summary) -> String { value.summary() }
let note = Note("Bozza".into());
assert_eq!(label(&note), "Bozza"); // usa l'implementazione predefinita
let items: Vec<Box<dyn Summary>> = vec![
    Box::new(note), Box::new(User { id: 7, name: "Ada".into() }),
];
let labels: Vec<_> = items.iter().map(|item| item.summary()).collect();
assert_eq!(labels, ["Bozza", "7: Ada"]);
```

| Forma | Quando sceglierla |
|---|---|
| `fn f<T: Trait>(a: T, b: T)` | I due argomenti devono avere lo stesso tipo concreto. |
| `fn f(a: impl Trait, b: impl Trait)` | Ogni argomento ha il proprio parametro generico; i tipi possono differire. |
| `&dyn Trait` / `Box<dyn Trait>` | Dispatch dinamico tramite un trait compatibile con `dyn`; il primo prende in prestito, il secondo possiede. |

## Restituire `impl Trait`

```rust
fn positive(values: &[i32]) -> impl Iterator<Item = &i32> {
    values.iter().filter(|&&n| n > 0)
}
assert_eq!(positive(&[-1, 0, 4]).copied().collect::<Vec<_>>(), [4]);
```

Nel ritorno è la funzione a scegliere il tipo concreto nascosto: tutti i rami devono produrre lo stesso tipo, non basta che implementino lo stesso trait. [Riferimento su impl Trait](https://doc.rust-lang.org/reference/types/impl-trait.html).

## Tipo associato e conversione

```rust
trait Repository {
    type Item;
    fn find(&self, id: usize) -> Option<Self::Item>;
}
struct Scores(Vec<u8>);
impl Repository for Scores {
    type Item = u8;
    fn find(&self, id: usize) -> Option<u8> { self.0.get(id).copied() }
}
let scores = Scores(vec![90]);
assert_eq!(scores.find(0), Some(90));
assert_eq!(scores.find(1), None);
```

```rust
struct UserId(u64);
impl From<UserId> for u64 {
    fn from(id: UserId) -> Self { id.0 }
}
let raw: u64 = UserId(7).into();
assert_eq!(raw, 7);
```

`From` fornisce anche `Into` nella stessa direzione. Per una conversione che può fallire usa `TryFrom`.

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/Generics|Generics]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch|Static dispatch vs dynamic dispatch]]
- [[Programmazione/Rust/Pagine/From Into TryFrom e TryInto|From Into TryFrom e TryInto]]

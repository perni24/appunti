---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - lifetimes
aliases:
  - "Trait con lifetime"
  - "Lifetimes nei trait Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
  - "[[Programmazione/Rust/Pagine/Associated types]]"
related:
  - "[[Programmazione/Rust/Pagine/Generic Associated Types (GAT)]]"
  - "[[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes nelle struct]]"
---

# Lifetimes nei trait

## Sintesi

I lifetime nei trait servono a descrivere relazioni tra riferimenti nei metodi, negli implementatori e nei tipi associati. Possono comparire come parametri del trait, dei metodi, degli associated types o dei trait bounds.

La scelta principale e tra lifetime sul trait intero e lifetime sui singoli metodi.

## Quando usarlo

- Quando un metodo di trait restituisce un riferimento legato a un input.
- Quando un implementatore contiene riferimenti.
- Quando un associated type dipende da un lifetime.
- Quando una API generica deve accettare funzioni o closure valide per qualsiasi lifetime.

## Come funziona

Lifetime sul metodo:

```rust
trait View {
    fn view<'a>(&'a self) -> &'a str;
}
```

Qui ogni chiamata sceglie il lifetime del borrow di `self`.

Lifetime sul trait:

```rust
trait Parser<'a> {
    type Output;

    fn parse(&self, input: &'a str) -> Self::Output;
}
```

Qui il lifetime e parte del trait implementato. Questo puo essere corretto, ma rende il trait piu vincolato.

## API / Sintassi

Metodo con elision:

```rust
trait Named {
    fn name(&self) -> &str;
}
```

Equivale a una relazione con il lifetime di `self`.

Associated type con lifetime tramite GAT:

```rust
trait Source {
    type Item<'a>
    where
        Self: 'a;

    fn next<'a>(&'a mut self) -> Option<Self::Item<'a>>;
}
```

## Esempio pratico

```rust
trait FieldReader {
    fn field<'a>(&self, row: &'a str) -> Option<&'a str>;
}

struct FirstField;

impl FieldReader for FirstField {
    fn field<'a>(&self, row: &'a str) -> Option<&'a str> {
        row.split(',').next()
    }
}
```

Il riferimento restituito deriva da `row`, non da `self`. Il lifetime esplicito comunica questa relazione.

## Varianti

- Lifetime sul metodo: piu flessibile per relazioni locali alla chiamata.
- Lifetime sul trait: utile quando l'intero trait e parametrizzato su dati borrowed.
- Lifetime su associated type: spesso con GAT.
- HRTB: `for<'a>` quando un bound deve valere per ogni lifetime.
- Trait object con lifetime: `Box<dyn Trait + 'a>`.

## Errori comuni

- Mettere il lifetime sul trait quando basta metterlo sul metodo.
- Restituire un riferimento legato a `self` quando in realta deriva da un parametro.
- Rendere un trait difficile da usare con lifetime troppo lunghi.
- Confondere `dyn Trait + 'a` con il lifetime dei dati interni del tipo concreto.
- Usare GAT prima di avere bisogno di un output legato al borrow.

## Checklist

- Il lifetime riguarda tutto il trait o solo un metodo?
- Il riferimento restituito deriva da `self` o da un parametro?
- L'elision rende gia chiara la relazione?
- Serve un associated type con lifetime?
- Il trait deve essere usabile come trait object?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Generic Associated Types (GAT)|Generic Associated Types (GAT)]]
- [[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)|Higher-Ranked Trait Bounds (HRTB)]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]

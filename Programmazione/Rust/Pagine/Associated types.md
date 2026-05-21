---
date: 2026-05-21
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - astrazione-e-generici
aliases:
  - "Tipi associati"
  - "Associated type Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Generics]]"
related:
  - "[[Programmazione/Rust/Pagine/Generic Associated Types (GAT)]]"
  - "[[Programmazione/Rust/Pagine/Iteratori]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
---

# Associated types

## Sintesi

Gli associated types sono tipi dichiarati dentro un trait e scelti dall'implementazione. Permettono di dire: "chi implementa questo trait deve specificare anche questo tipo collegato".

Sono utili quando per ogni implementazione esiste un tipo naturale e unico, come `Iterator::Item`.

## Quando usarlo

- Quando un trait ha un tipo di output o elemento collegato all'implementatore.
- Quando vuoi evitare parametri generici ripetuti in ogni uso del trait.
- Quando ogni tipo dovrebbe avere una sola implementazione logica per quel tipo associato.
- Quando vuoi rendere le firme piu leggibili.

## Come funziona

```rust
trait Producer {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}
```

Implementazione:

```rust
struct Counter {
    current: u32,
}

impl Producer for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        self.current += 1;
        Some(self.current)
    }
}
```

`Self::Item` indica il tipo associato scelto dall'implementazione.

## API / Sintassi

Bound su associated type:

```rust
fn stampa_tutti<I>(iter: I)
where
    I: Iterator,
    I::Item: std::fmt::Debug,
{
    for item in iter {
        println!("{item:?}");
    }
}
```

Forma compatta:

```rust
fn solo_stringhe<I>(iter: I)
where
    I: Iterator<Item = String>,
{
    for item in iter {
        println!("{item}");
    }
}
```

## Esempio pratico

```rust
trait Repository {
    type Entity;
    type Error;

    fn find(&self, id: u64) -> Result<Option<Self::Entity>, Self::Error>;
}

struct UserRepo;

impl Repository for UserRepo {
    type Entity = String;
    type Error = std::io::Error;

    fn find(&self, _id: u64) -> Result<Option<Self::Entity>, Self::Error> {
        Ok(Some(String::from("Luca")))
    }
}
```

Il repository dichiara quali entita ed errori produce senza ripetere parametri generici in ogni metodo.

## Varianti

- Associated type semplice: `type Item;`.
- Associated type con bound: `type Item: Debug;`.
- Associated type con default, disponibile in alcuni contesti con feature/stabilita specifiche.
- Generic Associated Types: associated type parametrizzati.
- Associated constants: costanti associate, non tipi.

## Errori comuni

- Usare associated types quando servono piu implementazioni dello stesso trait per lo stesso tipo con parametri diversi.
- Dimenticare di vincolare `I::Item` quando serve un comportamento.
- Confondere `Self::Item` con un tipo globale.
- Rendere il trait troppo rigido scegliendo associated types dove un generic sarebbe piu flessibile.
- Usare nomi poco chiari per tipi associati pubblici.

## Checklist

- Il tipo associato e unico per ogni implementatore?
- Un parametro generico sarebbe piu flessibile?
- I bound sul tipo associato sono espliciti?
- Il nome del tipo associato comunica il ruolo?
- Il trait resta comprensibile per chi lo implementa?

## Collegamenti

- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Generic Associated Types (GAT)|Generic Associated Types (GAT)]]
- [[Programmazione/Rust/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Rust/Pagine/Iterator API|Iterator API]]

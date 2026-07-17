---
date: 2026-05-21
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - astrazione-e-generici
aliases:
  - "Trait Rust"
  - "Interfacce Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/Structs]]"
  - "[[Programmazione/Rust/Pagine/Enums]]"
related:
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
  - "[[Programmazione/Rust/Pagine/Trait objects e dyn Trait]]"
---

# Traits

## Sintesi

Un trait definisce comportamento condiviso. E simile a una interfaccia, ma in Rust puo includere metodi richiesti, metodi con implementazione di default, associated types e vincoli.

I trait sono il meccanismo principale per astrazione, polimorfismo statico, estensione di tipi e progettazione di API generiche.

## Quando usarlo

- Quando piu tipi devono esporre lo stesso comportamento.
- Quando vuoi scrivere funzioni generiche vincolate da capacita specifiche.
- Quando vuoi separare contratto e implementazione.
- Quando vuoi permettere estensibilita senza ereditarieta.

## Come funziona

Definizione:

```rust
trait Summary {
    fn summarize(&self) -> String;
}
```

Implementazione:

```rust
struct Articolo {
    titolo: String,
}

impl Summary for Articolo {
    fn summarize(&self) -> String {
        self.titolo.clone()
    }
}
```

Uso:

```rust
fn stampa(item: &impl Summary) {
    println!("{}", item.summarize());
}
```

## API / Sintassi

Metodo con default:

```rust
trait Named {
    fn name(&self) -> &str;

    fn label(&self) -> String {
        format!("name={}", self.name())
    }
}
```

Bound generico:

```rust
fn log<T: Named>(item: &T) {
    println!("{}", item.label());
}
```

Implementazione per tipo generico:

```rust
impl<T: Named> Named for Box<T> {
    fn name(&self) -> &str {
        (**self).name()
    }
}
```

## Esempio pratico

```rust
trait Validator {
    fn validate(&self) -> Result<(), String>;
}

struct User {
    email: String,
}

impl Validator for User {
    fn validate(&self) -> Result<(), String> {
        if self.email.contains('@') {
            Ok(())
        } else {
            Err(String::from("email non valida"))
        }
    }
}

fn salva<T: Validator>(value: &T) -> Result<(), String> {
    value.validate()?;
    Ok(())
}
```

La funzione `salva` non conosce il tipo concreto, ma richiede il comportamento `Validator`.

## Varianti

- Trait marker: non definisce metodi, comunica una proprieta.
- Trait con metodi default.
- Trait con associated types.
- Trait generici.
- Trait object: `dyn Trait` per dispatch dinamico.
- Extension trait: aggiunge metodi a tipi esistenti.

## Errori comuni

- Creare trait con un solo implementatore senza bisogno reale.
- Mettere troppi metodi non correlati nello stesso trait.
- Confondere trait bounds statici con trait object dinamici.
- Dimenticare la orphan rule: puoi implementare un trait per un tipo solo se almeno uno dei due e locale al crate.
- Usare trait quando un semplice enum sarebbe piu chiaro.

## Checklist

- Il comportamento e condiviso da piu tipi?
- Il trait e abbastanza piccolo e coeso?
- Serve dispatch statico o dinamico?
- Il trait fa parte della API pubblica?
- Le implementazioni esterne devono essere possibili e stabili?

## Collegamenti

- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Associated types|Associated types]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Extension traits|Extension traits]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]

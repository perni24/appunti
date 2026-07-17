---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - lifetimes
aliases:
  - "Elision dei lifetime"
  - "Lifetime elision rules"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Lifetime impliciti]]"
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
related:
  - "[[Programmazione/Rust/Pagine/Lifetimes nelle struct]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes nei trait]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
---

# Lifetime elision

## Sintesi

La lifetime elision e l'insieme di regole con cui Rust deduce lifetime senza scriverli nella firma. Esiste per rendere leggibili le funzioni comuni, soprattutto quelle che prendono un riferimento e restituiscono un riferimento collegato.

L'elision non cambia le regole del borrow checker: rimuove solo annotazioni ripetitive.

## Quando usarlo

- Quando una funzione ha un solo input reference e restituisce un riferimento derivato da esso.
- Quando un metodo restituisce un riferimento legato a `self`.
- Quando il compilatore riesce a dedurre le relazioni senza ambiguita.
- Quando scrivere lifetime espliciti peggiora la leggibilita.

## Come funziona

Regole principali:

- Ogni parametro reference riceve un lifetime distinto.
- Se c'e un solo lifetime di input, viene assegnato a tutti i lifetime di output elisi.
- Nei metodi, se c'e `&self` o `&mut self`, il lifetime di `self` viene assegnato agli output elisi.

Questa firma:

```rust
fn first_word(s: &str) -> &str {
    s.split_whitespace().next().unwrap_or("")
}
```

equivale concettualmente a:

```rust
fn first_word<'a>(s: &'a str) -> &'a str {
    s.split_whitespace().next().unwrap_or("")
}
```

## API / Sintassi

Metodo:

```rust
struct Buffer {
    text: String,
}

impl Buffer {
    fn as_str(&self) -> &str {
        &self.text
    }
}
```

Il riferimento restituito e legato a `&self`.

Caso ambiguo:

```rust
// fn choose(a: &str, b: &str) -> &str {
//     if a.len() > b.len() { a } else { b }
// }
```

Qui servono annotazioni esplicite, perche ci sono due input possibili.

## Esempio pratico

```rust
fn extension(path: &str) -> Option<&str> {
    path.rsplit_once('.').map(|(_, ext)| ext)
}

struct User {
    email: String,
}

impl User {
    fn domain(&self) -> Option<&str> {
        self.email.split_once('@').map(|(_, domain)| domain)
    }
}
```

In entrambi i casi Rust deduce che l'output preso in prestito vive quanto l'input corrispondente.

## Varianti

- Elision in funzioni libere con un solo input reference.
- Elision nei metodi con `&self`.
- Lifetime espliciti quando ci sono piu input.
- Placeholder lifetime `'_` in alcune posizioni dove vuoi lasciare inferenza esplicita.
- Elision nei trait object con default object lifetime bounds.

## Errori comuni

- Pensare che l'elision sia un meccanismo diverso dai lifetime.
- Aspettarsi che Rust indovini quale input restituire quando ci sono piu riferimenti.
- Scrivere lifetime espliciti identici in funzioni dove l'elision basta.
- Confondere output posseduto (`String`) con output borrowed (`&str`).
- Dimenticare che un metodo puo restituire un riferimento legato a `self`.

## Checklist

- C'e un solo riferimento in input?
- Il metodo ha `&self` o `&mut self`?
- L'output e chiaramente derivato da un input?
- Una firma esplicita chiarirebbe o appesantirebbe?
- Il compilatore segnala ambiguita? Allora annota i lifetime.

## Collegamenti

- [[Programmazione/Rust/Pagine/Lifetime impliciti|Lifetime impliciti]]
- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetimes nelle struct|Lifetimes nelle struct]]
- [[Programmazione/Rust/Pagine/Lifetimes nei trait|Lifetimes nei trait]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]

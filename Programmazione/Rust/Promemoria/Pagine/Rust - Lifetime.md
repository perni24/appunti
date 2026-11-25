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
  - lifetime
aliases:
  - Cheatsheet lifetime Rust
prerequisites: []
related:
  - "[[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]"
  - "[[Programmazione/Rust/Pagine/Lifetime elision|Lifetime elision]]"
title: Rust - Lifetime
---

# Rust - Lifetime

Annota la relazione fra i prestiti quando la firma non la rende univoca. Un lifetime non prolunga la vita di un valore. Ogni blocco è indipendente e va nel corpo di `fn main()`.

## Uno o due possibili input

```rust
fn first_word(text: &str) -> &str {
    text.split_whitespace().next().unwrap_or("")
}
let title = String::from("Guida Rust");
assert_eq!(first_word(&title), "Guida");
assert_eq!(first_word("  "), "");
```

Con un solo lifetime in ingresso, quello di uscita si può omettere. Se il risultato può provenire da due input, rendi esplicito il legame:

```rust
fn longest<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.len() >= right.len() { left } else { right }
}
let left = String::from("prima");
{
    let right = String::from("dopo");
    let selected = longest(&left, &right);
    assert_eq!(selected, "prima");
}
```

Il confronto qui conta i byte. I proprietari non devono vivere altrettanto a lungo: il risultato è utilizzabile solo dove entrambi i prestiti sono validi, anche quando viene scelto `left`.

## Una struct che prende in prestito

```rust
struct View<'a> { title: &'a str }
impl<'a> View<'a> {
    fn title(&self) -> &str { self.title }
    fn source(&self) -> &'a str { self.title }
}
let text = String::from("Guida");
let saved = {
    let view = View { title: &text };
    assert_eq!(view.title(), "Guida");
    view.source()
};
assert_eq!(saved, "Guida"); // view è uscita di scope, text no
```

Con `&self`, l'uscita di `title` è legata al prestito di `self`. L'uscita esplicita `&'a str` di `source` è invece legata ai dati originali. [Regole di lifetime elision](https://doc.rust-lang.org/reference/lifetime-elision.html).

## Un bound sul tipo non è un riferimento statico

```rust
fn log_and_return<T: std::fmt::Debug>(value: &T) -> &T {
    println!("{value:?}");
    value
}
fn accepts_static<T: 'static>(_: T) {}
let name = String::from("Ada");
assert_eq!(log_and_return(&name), "Ada");
let label: &'static str = "app";
accepts_static(label);
accepts_static(name); // prende ownership; la String viene rilasciata al ritorno
```

`T: 'a` richiede che i prestiti contenuti in `T` siano validi per `'a`. Nel parametro `&'a T` il bound `T: 'a` è già implicito. `&'static str` può essere usato per tutta l'esecuzione; `T: 'static` non impone di conservare il **valore** per sempre.

## Restituire dati creati nella funzione

```rust
fn make_title() -> String { String::from("Guida") }
let title = make_title();
assert_eq!(title, "Guida");
```

Non restituire `&title` se `title` è una `String` locale: al ritorno il proprietario viene rilasciato. Nemmeno annotare il risultato come `&'static str` risolve il problema; restituisci la `String` oppure prendi in prestito dall'input.

## Collegamenti

- [[Programmazione/Rust/Promemoria/Indice Promemoria Rust|Indice Promemoria Rust]]
- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetime elision|Lifetime elision]]
- [[Programmazione/Rust/Pagine/Lifetime impliciti|Lifetime impliciti]]
- [[Programmazione/Rust/Pagine/Lifetimes nelle struct|Lifetimes nelle struct]]
- [[Programmazione/Rust/Pagine/Lifetimes nei trait|Lifetimes nei trait]]
- [[Programmazione/Rust/Pagine/Lifetimes avanzati|Lifetimes avanzati]]

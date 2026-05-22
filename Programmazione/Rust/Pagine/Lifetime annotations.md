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
  - "Annotazioni lifetime"
  - "Lifetime espliciti"
prerequisites:
  - "[[Programmazione/Rust/Pagine/References e Borrowing]]"
  - "[[Programmazione/Rust/Pagine/Borrow checker]]"
  - "[[Programmazione/Rust/Pagine/Lifetime impliciti]]"
related:
  - "[[Programmazione/Rust/Pagine/Lifetime elision]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes nelle struct]]"
  - "[[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)]]"
---

# Lifetime annotations

## Sintesi

Le lifetime annotations descrivono la relazione tra la durata di riferimenti diversi. Non estendono la vita dei valori: dicono al compilatore quali riferimenti devono essere validi almeno quanto altri riferimenti.

Servono quando il borrow checker non puo dedurre in modo univoco da quale input deriva un riferimento restituito o quando una struct/trait conserva riferimenti.

## Quando usarlo

- Quando una funzione prende piu riferimenti e restituisce un riferimento.
- Quando una struct contiene riferimenti.
- Quando un trait o una implementazione deve esprimere relazioni tra borrow.
- Quando l'elision non basta e il compilatore chiede un lifetime esplicito.

## Come funziona

Un lifetime si scrive con un apostrofo seguito da un nome, spesso `'a`:

```rust
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() > b.len() {
        a
    } else {
        b
    }
}
```

La firma dice: il riferimento restituito vive al massimo quanto il piu corto tra `a` e `b`. Non dice che `a` e `b` vivono per sempre.

Il lifetime e una relazione, non una durata assoluta.

## API / Sintassi

Funzione:

```rust
fn f<'a>(input: &'a str) -> &'a str {
    input
}
```

Struct:

```rust
struct View<'a> {
    text: &'a str,
}
```

Impl:

```rust
impl<'a> View<'a> {
    fn text(&self) -> &'a str {
        self.text
    }
}
```

Bound:

```rust
fn debug_ref<'a, T>(value: &'a T)
where
    T: std::fmt::Debug + 'a,
{
    println!("{value:?}");
}
```

## Esempio pratico

```rust
fn scegli_non_vuota<'a>(prima: &'a str, seconda: &'a str) -> &'a str {
    if !prima.is_empty() {
        prima
    } else {
        seconda
    }
}

fn main() {
    let a = String::from("rust");
    let b = String::from("borrow");

    let scelta = scegli_non_vuota(&a, &b);
    println!("{scelta}");
}
```

La funzione restituisce una slice che punta a una delle due stringhe ricevute. Il chiamante deve garantire che entrambe restino vive abbastanza.

## Varianti

- Lifetime impliciti: dedotti dal compilatore.
- Lifetime espliciti: scritti nella firma.
- Lifetime in struct: collegano la struct ai dati presi in prestito.
- Bound di outlives: `'a: 'b` significa che `'a` vive almeno quanto `'b`.
- `'static`: lifetime valido per tutta la durata del programma.

## Errori comuni

- Pensare che aggiungere `'a` faccia vivere piu a lungo un valore.
- Usare lo stesso lifetime per riferimenti che non devono avere la stessa durata.
- Restituire riferimenti a variabili locali.
- Aggiungere annotazioni lifetime dove l'elision basta.
- Confondere lifetime del riferimento e ownership del valore.

## Checklist

- Il riferimento restituito deriva da quale input?
- I lifetime esprimono una relazione reale o sono stati aggiunti a caso?
- Un valore posseduto (`String`, `Vec<T>`) sarebbe piu semplice?
- L'elision puo gia gestire la firma?
- La funzione espone riferimenti solo finche i dati sorgente restano validi?

## Collegamenti

- [[Programmazione/Rust/Pagine/Lifetime impliciti|Lifetime impliciti]]
- [[Programmazione/Rust/Pagine/Lifetime elision|Lifetime elision]]
- [[Programmazione/Rust/Pagine/Lifetimes nelle struct|Lifetimes nelle struct]]
- [[Programmazione/Rust/Pagine/Borrow checker|Borrow checker]]
- [[Programmazione/Rust/Pagine/References e Borrowing|References e Borrowing]]

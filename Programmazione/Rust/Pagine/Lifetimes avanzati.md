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
  - "Lifetimes avanzati Rust"
  - "Outlives e variance"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes nelle struct]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
related:
  - "[[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)]]"
  - "[[Programmazione/Rust/Pagine/PhantomData]]"
  - "[[Programmazione/Rust/Pagine/Unsafe Rust]]"
---

# Lifetimes avanzati

## Sintesi

I lifetime avanzati riguardano casi in cui le relazioni tra riferimenti non sono solo input-output semplici: outlives bounds, `'static`, variance, reborrowing, trait object lifetime e interazioni con tipi generici.

In molti progetti quotidiani basta capire lifetime annotations ed elision. Questi concetti diventano importanti quando si progettano librerie, astrazioni generiche o codice vicino a unsafe.

## Quando usarlo

- Quando scrivi API generiche con riferimenti e trait bounds.
- Quando usi struct generiche che rappresentano viste o wrapper.
- Quando ricevi errori complessi su outlives o variance.
- Quando devi capire `T: 'a`, `&'a T`, `dyn Trait + 'a` o `'static`.
- Quando lavori con `PhantomData`, iteratori lending o unsafe abstractions.

## Come funziona

Outlives:

```rust
fn require_outlives<'a, T>(value: &'a T)
where
    T: 'a,
{
    let _ = value;
}
```

`T: 'a` significa che eventuali riferimenti contenuti in `T` devono essere validi almeno per `'a`.

`'static`:

```rust
let s: &'static str = "testo nel binario";
```

`&'static str` e un riferimento valido per tutta la durata del programma. Un bound `T: 'static`, invece, significa che `T` non contiene riferimenti non-static, non che il valore vive per sempre.

## API / Sintassi

Trait object lifetime:

```rust
fn boxed<'a>(value: &'a str) -> Box<dyn std::fmt::Display + 'a> {
    Box::new(value)
}
```

Reborrow:

```rust
fn push_one(v: &mut Vec<i32>) {
    let r: &mut Vec<i32> = v;
    r.push(1);
}
```

Placeholder lifetime:

```rust
let view: std::str::Split<'_, char> = "a,b".split(',');
```

## Esempio pratico

```rust
struct BorrowedDisplay<'a, T>
where
    T: std::fmt::Display + ?Sized,
{
    value: &'a T,
}

impl<'a, T> BorrowedDisplay<'a, T>
where
    T: std::fmt::Display + ?Sized,
{
    fn render(&self) -> String {
        format!("{}", self.value)
    }
}
```

La struct accetta anche tipi non `Sized`, come `str`, e conserva un riferimento valido per `'a`.

## Varianti

- Outlives bound: `'a: 'b`, `T: 'a`.
- `'static` su riferimenti e su tipi.
- Reborrowing: prestiti temporanei derivati da altri prestiti.
- Variance: relazione tra lifetime piu lunghi e piu corti nei tipi generici.
- `PhantomData`: comunica ownership o lifetime al compilatore senza campo reale.
- Default object lifetime bounds nei trait object.

## Errori comuni

- Interpretare `T: 'static` come "questo valore vive per sempre".
- Aggiungere `'static` per zittire il compilatore invece di correggere ownership.
- Confondere il lifetime del trait object con quello del puntatore che lo contiene.
- Usare lifetime troppo ampi e rendere l'API inutilizzabile.
- Entrare in `PhantomData` o variance senza una necessita concreta.

## Checklist

- Il problema richiede davvero lifetime avanzati?
- `T: 'a` rappresenta dati contenuti o solo il riferimento esterno?
- Il bound `'static` e necessario o e una scorciatoia sbagliata?
- Il trait object deve poter contenere riferimenti non-static?
- Un tipo owned semplificherebbe il modello?

## Collegamenti

- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetimes nelle struct|Lifetimes nelle struct]]
- [[Programmazione/Rust/Pagine/Higher-Ranked Trait Bounds (HRTB)|Higher-Ranked Trait Bounds (HRTB)]]
- [[Programmazione/Rust/Pagine/PhantomData|PhantomData]]
- [[Programmazione/Rust/Pagine/Unsafe Rust|Unsafe Rust]]

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
  - "HRTB"
  - "Higher-Ranked Trait Bounds"
  - "for<'a>"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Lifetime annotations]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes nei trait]]"
related:
  - "[[Programmazione/Rust/Pagine/Generic Associated Types (GAT)]]"
  - "[[Programmazione/Rust/Pagine/Lifetimes avanzati]]"
  - "[[Programmazione/Rust/Pagine/Closure]]"
---

# Higher-Ranked Trait Bounds (HRTB)

## Sintesi

Gli Higher-Ranked Trait Bounds permettono di esprimere un vincolo che deve valere per qualsiasi lifetime. La sintassi tipica e `for<'a>`.

Sono utili quando una funzione, closure o trait implementation deve accettare riferimenti con qualunque durata scelta dal chiamante, invece di un solo lifetime specifico.

## Quando usarlo

- Quando un bound deve essere valido per ogni lifetime possibile.
- Quando passi closure o funzioni che ricevono riferimenti temporanei.
- Quando progetti trait con metodi che devono lavorare su borrow molto locali.
- Quando incontri firme con `for<'a> Fn(&'a T)`.
- Quando lavori con GAT, parser, visitor o API altamente generiche.

## Come funziona

Senza HRTB, un lifetime puo essere scelto da chi chiama o dalla firma esterna. Con `for<'a>`, il bound dice: questa implementazione deve funzionare per tutti i lifetime `'a`.

```rust
fn apply<F>(f: F)
where
    F: for<'a> Fn(&'a str),
{
    let local = String::from("rust");
    f(&local);
}
```

La closure deve poter accettare un `&str` con un lifetime qualsiasi, incluso quello locale creato dentro `apply`.

## API / Sintassi

Forma esplicita:

```rust
where
    F: for<'a> Fn(&'a str)
```

Forma spesso equivalente per closure semplici:

```rust
fn visit<F>(items: &[String], f: F)
where
    F: for<'a> Fn(&'a str),
{
    for item in items {
        f(item.as_str());
    }
}
```

Con trait personalizzato:

```rust
trait Visit<'a> {
    fn visit(&self, input: &'a str);
}

fn run<V>(visitor: V)
where
    V: for<'a> Visit<'a>,
{
    visitor.visit("test");
}
```

## Esempio pratico

```rust
fn with_temp<F, R>(f: F) -> R
where
    F: for<'a> FnOnce(&'a str) -> R,
{
    let temp = String::from("temporaneo");
    f(temp.as_str())
}

fn main() {
    let len = with_temp(|s| s.len());
    println!("{len}");
}
```

`with_temp` crea la stringa internamente e passa un riferimento alla closure. Il bound dice che la closure deve funzionare con il lifetime locale scelto dalla funzione.

## Varianti

- `for<'a> Fn(&'a T)`: closure valida per ogni borrow.
- `for<'a> Trait<'a>`: implementazione valida per ogni lifetime.
- HRTB con piu lifetime: `for<'a, 'b>`.
- HRTB nei trait bounds di funzioni generiche.
- Alternative: lifetime espliciti normali quando il lifetime e scelto dal chiamante.

## Errori comuni

- Usare HRTB quando un lifetime esplicito normale basta.
- Pensare che `for<'a>` crei un lifetime lungo: in realta quantifica su tutti i lifetime.
- Scrivere closure che catturano riferimenti troppo specifici e non soddisfano il bound.
- Confondere `for<'a>` con `T: 'a`.
- Rendere una API pubblica difficile da leggere senza documentare il motivo del bound.

## Checklist

- Il codice deve funzionare per qualunque lifetime scelto internamente?
- Il lifetime viene scelto dal chiamante o dalla funzione chiamata?
- Una closure deve accettare riferimenti temporanei locali?
- Un bound normale sarebbe sufficiente?
- Il motivo del `for<'a>` e documentato?

## Collegamenti

- [[Programmazione/Rust/Pagine/Lifetime annotations|Lifetime annotations]]
- [[Programmazione/Rust/Pagine/Lifetimes nei trait|Lifetimes nei trait]]
- [[Programmazione/Rust/Pagine/Lifetimes avanzati|Lifetimes avanzati]]
- [[Programmazione/Rust/Pagine/Generic Associated Types (GAT)|Generic Associated Types (GAT)]]
- [[Programmazione/Rust/Pagine/Closure|Closure]]

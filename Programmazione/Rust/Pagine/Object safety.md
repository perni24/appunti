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
  - "Object safety Rust"
  - "dyn compatibility"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Trait objects e dyn Trait]]"
related:
  - "[[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch]]"
  - "[[Programmazione/Rust/Pagine/Associated types]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
---

# Object safety

## Sintesi

Object safety indica se un trait puo essere usato come trait object, cioe come `dyn Trait`. Un trait non object safe puo comunque essere usato con generics e static dispatch, ma non come `&dyn Trait` o `Box<dyn Trait>`.

Il tema nasce perche un trait object deve poter chiamare metodi tramite vtable senza conoscere il tipo concreto.

## Quando usarlo

- Quando vuoi usare `dyn Trait`.
- Quando progetti trait pubblici che potrebbero essere usati come plugin o handler.
- Quando ricevi errori del compilatore su trait non dyn-compatible.
- Quando devi separare metodi statici/generici da metodi chiamabili via trait object.

## Come funziona

Un trait object safe deve rispettare regole che rendono possibile costruire una vtable. In pratica, sono problematici:

- metodi che restituiscono `Self` senza vincolo `Self: Sized`;
- metodi generici;
- metodi statici senza receiver;
- uso di `Self` in posizioni non compatibili con dynamic dispatch.

Esempio non object safe:

```rust
trait CloneLike {
    fn clone_like(&self) -> Self;
}
```

`Self` nel ritorno richiede conoscere il tipo concreto.

## API / Sintassi

Soluzione comune con `Self: Sized`:

```rust
trait Parser {
    fn parse(&self, input: &str) -> bool;

    fn new() -> Self
    where
        Self: Sized;
}
```

`parse` resta chiamabile su `dyn Parser`. `new` no, perche richiede il tipo concreto.

Trait object:

```rust
fn run(parser: &dyn Parser, input: &str) -> bool {
    parser.parse(input)
}
```

## Esempio pratico

```rust
trait Command {
    fn name(&self) -> &str;
    fn execute(&self);

    fn boxed(self) -> Box<dyn Command>
    where
        Self: Sized + 'static,
    {
        Box::new(self)
    }
}
```

`name` ed `execute` sono object safe. `boxed` richiede `Self: Sized`, quindi non entra nella vtable del trait object.

## Varianti

- Trait object safe: usabile come `dyn Trait`.
- Trait non object safe: usabile solo con generics/static dispatch.
- Metodo escluso dal trait object con `where Self: Sized`.
- Trait separati: uno object safe per runtime, uno esteso per funzioni generiche.
- `dyn Trait + Send + Sync`: trait object con marker aggiuntivi.

## Errori comuni

- Progettare un trait pensando ai generics e poi volerlo usare come `dyn Trait`.
- Mettere costruttori `fn new() -> Self` nello stesso trait object safe senza `Self: Sized`.
- Aggiungere metodi generici a un trait destinato a trait object.
- Confondere object safety con thread safety.
- Rendere object safe un trait che in realta dovrebbe restare statico.

## Checklist

- Il trait deve essere usato come `dyn Trait`?
- I metodi restituiscono `Self`?
- Ci sono metodi generici?
- I metodi non object safe possono avere `where Self: Sized`?
- Conviene separare il trait in due livelli?

## Collegamenti

- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Static dispatch vs dynamic dispatch|Static dispatch vs dynamic dispatch]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Send e Sync Traits|Send e Sync Traits]]

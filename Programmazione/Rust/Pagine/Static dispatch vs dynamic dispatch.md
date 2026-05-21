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
  - "Static dispatch"
  - "Dynamic dispatch"
  - "Dispatch Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Generics]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Trait objects e dyn Trait]]"
related:
  - "[[Programmazione/Rust/Pagine/Zero-cost abstractions]]"
  - "[[Programmazione/Rust/Pagine/Object safety]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
---

# Static dispatch vs dynamic dispatch

## Sintesi

Static dispatch significa che il compilatore conosce il tipo concreto e risolve la chiamata a compile time. Dynamic dispatch significa che la chiamata viene risolta a runtime tramite una vtable, di solito con `dyn Trait`.

Rust usa static dispatch per generics e `impl Trait`; usa dynamic dispatch per trait objects.

## Quando usarlo

- Usa static dispatch quando il tipo concreto puo restare noto a compile time.
- Usa dynamic dispatch quando devi gestire tipi diversi in modo uniforme a runtime.
- Usa static dispatch per performance e ottimizzazioni aggressive.
- Usa dynamic dispatch per plugin, handler eterogenei, dependency injection semplice o collection di trait object.

## Come funziona

Static dispatch:

```rust
fn stampa<T: std::fmt::Display>(value: T) {
    println!("{value}");
}
```

Il compilatore genera codice specializzato per ogni `T` usato.

Dynamic dispatch:

```rust
fn stampa_dyn(value: &dyn std::fmt::Display) {
    println!("{value}");
}
```

Il metodo viene scelto a runtime tramite vtable.

## API / Sintassi

Statico con generics:

```rust
fn run<T: Task>(task: T) {
    task.execute();
}
```

Statico con `impl Trait`:

```rust
fn run(task: impl Task) {
    task.execute();
}
```

Dinamico:

```rust
fn run(task: &dyn Task) {
    task.execute();
}
```

## Esempio pratico

```rust
trait Handler {
    fn handle(&self, input: &str);
}

fn static_run<H: Handler>(handler: H, input: &str) {
    handler.handle(input);
}

fn dynamic_run(handler: &dyn Handler, input: &str) {
    handler.handle(input);
}
```

`static_run` viene specializzata per ogni handler. `dynamic_run` usa una singola firma che accetta qualsiasi trait object compatibile.

## Varianti

- Generics: static dispatch.
- `impl Trait` in parametro: static dispatch.
- `impl Trait` in ritorno: tipo concreto nascosto ma unico.
- `dyn Trait`: dynamic dispatch.
- Enum dispatch manuale: enum con varianti concrete e `match`.

## Errori comuni

- Pensare che `impl Trait` in ritorno possa restituire tipi diversi nei vari branch.
- Usare `Box<dyn Trait>` per evitare di capire un errore di tipo.
- Ignorare la crescita del codice causata dalla monomorfizzazione in casi estremi.
- Ottimizzare contro dynamic dispatch senza misurare.
- Dimenticare che `dyn Trait` richiede object safety.

## Checklist

- Il tipo concreto e unico e noto a compile time?
- Serve una collection eterogenea?
- La API deve nascondere il tipo o accettare tipi diversi?
- Il costo di dispatch o monomorfizzazione conta davvero?
- Un enum sarebbe piu chiaro di `dyn Trait`?

## Collegamenti

- [[Programmazione/Rust/Pagine/Generics|Generics]]
- [[Programmazione/Rust/Pagine/Trait objects e dyn Trait|Trait objects e dyn Trait]]
- [[Programmazione/Rust/Pagine/Object safety|Object safety]]
- [[Programmazione/Rust/Pagine/Zero-cost abstractions|Zero-cost abstractions]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]

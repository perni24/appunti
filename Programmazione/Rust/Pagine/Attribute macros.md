---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - macros
aliases:
  - "attribute macro"
  - "proc_macro_attribute"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Procedural macros]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Derive macros]]"
  - "[[Programmazione/Rust/Pagine/Function-like macros]]"
  - "[[Programmazione/Rust/Pagine/Hygiene]]"
---

# Attribute macros

## Sintesi

Le attribute macros sono procedural macros applicate come attributi a item Rust: funzioni, moduli, struct, enum, impl e altri costrutti. Ricevono gli argomenti dell'attributo e l'item annotato, poi restituiscono codice trasformato o aumentato.

Sono usate da framework web, tracing, test custom, dependency injection e tooling compile-time.

## Quando usarlo

- Quando vuoi trasformare una funzione o un item annotato.
- Quando vuoi aggiungere boilerplate intorno a un handler.
- Quando vuoi leggere parametri da attributi, per esempio route o configurazione.
- Quando una derive macro non basta perche devi modificare item interi.

## Come funziona

Dichiarazione:

```rust
#[proc_macro_attribute]
pub fn my_attr(args: TokenStream, item: TokenStream) -> TokenStream {
    item
}
```

Uso:

```rust
#[my_attr]
fn handler() {}
```

La macro riceve:

- `args`: token dentro l'attributo;
- `item`: item annotato.

## API / Sintassi

Attributo con argomenti:

```rust
#[route(GET, "/users")]
async fn users() {}
```

Macro:

```rust
#[proc_macro_attribute]
pub fn route(args: TokenStream, item: TokenStream) -> TokenStream {
    // parse args and item
    item
}
```

Con `syn`, si parse-a spesso l'item come `ItemFn`, `ItemStruct` o simili.

## Esempio pratico

```rust
#[instrument]
fn process(id: u64) {
    println!("process {id}");
}
```

Un attributo come `instrument` puo generare codice di tracing attorno alla funzione, senza cambiare la firma visibile.

## Varianti

- Attribute macro su funzioni.
- Attribute macro su moduli o impl.
- Attributi helper usati da derive.
- Attributi di framework, per esempio route HTTP.
- Attributi per test e tracing.

## Errori comuni

- Modificare troppo l'item e rendere il codice generato imprevedibile.
- Nascondere controllo di flusso importante dietro un attributo.
- Generare errori con span poco utili.
- Creare attributi con sintassi non documentata.
- Accoppiare macro e runtime crate in modo fragile.

## Checklist

- L'attributo modifica item in modo comprensibile?
- Gli argomenti dell'attributo sono ben definiti?
- Gli errori puntano alla parte sbagliata o corretta del codice?
- La macro preserva visibilita, generics e attributi esistenti?
- Una funzione wrapper sarebbe piu chiara?

## Collegamenti

- [[Programmazione/Rust/Pagine/Procedural macros|Procedural macros]]
- [[Programmazione/Rust/Pagine/Derive macros|Derive macros]]
- [[Programmazione/Rust/Pagine/Function-like macros|Function-like macros]]
- [[Programmazione/Rust/Pagine/Hygiene|Hygiene]]
- [[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]

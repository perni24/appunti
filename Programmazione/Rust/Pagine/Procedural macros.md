---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - macros
aliases:
  - "Proc macros"
  - "Macro procedurali"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Macro dichiarative]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
  - "[[Programmazione/Rust/Pagine/Crates.io]]"
related:
  - "[[Programmazione/Rust/Pagine/Derive macros]]"
  - "[[Programmazione/Rust/Pagine/Attribute macros]]"
  - "[[Programmazione/Rust/Pagine/Function-like macros]]"
---

# Procedural macros

## Sintesi

Le procedural macros sono macro Rust che ricevono un `TokenStream` e producono un nuovo `TokenStream`. A differenza di `macro_rules!`, possono analizzare e generare codice con logica Rust arbitraria durante la compilazione.

Sono potenti, ma aumentano complessita, tempi di compilazione e superficie di errore.

## Quando usarlo

- Quando devi generare codice da struct, enum o attributi.
- Quando una macro dichiarativa non riesce a esprimere il parsing necessario.
- Quando vuoi implementare derive custom.
- Quando vuoi creare attributi come `#[route(...)]` o `#[instrument]`.
- Quando costruisci DSL compile-time robuste.

## Come funziona

Una proc macro vive in un crate speciale:

```toml
[lib]
proc-macro = true
```

La funzione macro riceve token:

```rust
use proc_macro::TokenStream;

#[proc_macro]
pub fn my_macro(input: TokenStream) -> TokenStream {
    input
}
```

Nella pratica si usano spesso crate come `syn`, `quote` e `proc-macro2`.

## API / Sintassi

Tipi di procedural macro:

```rust
#[proc_macro]
pub fn function_like(input: TokenStream) -> TokenStream;

#[proc_macro_derive(MyDerive)]
pub fn derive(input: TokenStream) -> TokenStream;

#[proc_macro_attribute]
pub fn attr(args: TokenStream, item: TokenStream) -> TokenStream;
```

Dipendenze tipiche:

```toml
[dependencies]
syn = "2"
quote = "1"
proc-macro2 = "1"
```

## Esempio pratico

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(TypeName)]
pub fn type_name(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let ident = input.ident;

    quote! {
        impl #ident {
            pub fn type_name() -> &'static str {
                stringify!(#ident)
            }
        }
    }
    .into()
}
```

La macro legge il nome del tipo e genera un metodo associato.

## Varianti

- Function-like procedural macros: `my_macro!(...)`.
- Derive macros: `#[derive(MyTrait)]`.
- Attribute macros: `#[my_attribute]`.
- Macro helper attributes: attributi letti da derive.
- Proc macro crate separato dal crate runtime.

## Errori comuni

- Usare proc macro per logica che una funzione o derive standard risolverebbero.
- Generare errori poco leggibili.
- Non preservare span utili per diagnostica.
- Accoppiare troppo la macro alla struttura interna del crate.
- Dimenticare che le proc macro vengono eseguite durante compilazione.

## Checklist

- Una macro dichiarativa e insufficiente?
- La macro produce diagnostica chiara?
- Hai test compile-fail o esempi?
- Il crate proc-macro e separato correttamente?
- La macro mantiene compatibilita con modifiche future della API?

## Collegamenti

- [[Programmazione/Rust/Pagine/Derive macros|Derive macros]]
- [[Programmazione/Rust/Pagine/Attribute macros|Attribute macros]]
- [[Programmazione/Rust/Pagine/Function-like macros|Function-like macros]]
- [[Programmazione/Rust/Pagine/Hygiene|Hygiene]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]

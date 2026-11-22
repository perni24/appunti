---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - macros
aliases:
  - Proc macros
  - Macro procedurali
prerequisites:
  - "[[Programmazione/Rust/Pagine/Macro dichiarative]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
  - "[[Programmazione/Rust/Pagine/Crates.io]]"
related:
  - "[[Programmazione/Rust/Pagine/Derive macros]]"
  - "[[Programmazione/Rust/Pagine/Attribute macros]]"
  - "[[Programmazione/Rust/Pagine/Function-like macros]]"
title: Procedural macros
---

# Procedural macros

## Sintesi

Le procedural macros sono funzioni eseguite durante la compilazione: ricevono token Rust e restituiscono token che il compilatore integra nel programma. Non ricevono valori runtime, ne un AST con tutti i tipi gia risolti.

Questa nota introduce il modello comune e un progetto completo con tre entry point. Il derive **TypeName** conserva generics e clausole where; identity e keep_item sono intenzionalmente pass-through, non funzionalita di validazione o logging.

Baseline verificata: **Rust 1.99.1, edition 2024**, **syn 3.0.10**, **quote 1.0.47**, **proc-macro2 1.0.107**. Le versioni sono esplicite per il demo, non una MSRV o un invito ad aggiornare automaticamente altri progetti.

## Quando usarlo

- Generare codice da struct, enum o attributi quando macro_rules non basta.
- Analizzare sintassi strutturata, produrre diagnostiche mirate o implementare derive personalizzati.
- Trasformare item con attributi, per esempio nelle API di framework.

Preferisci funzioni, generics, derive standard o macro dichiarative se sufficienti. Una proc macro aggiunge dipendenze e lavoro alla build: non rende automaticamente piu veloce il programma generato.

## Come funziona

### Confine tra macro e programma

L'entry point e una funzione pubblica alla radice di una crate con `[lib] proc-macro = true`. La macro si usa da **un'altra crate**, anche nello stesso workspace; gli helper possono essere moduli privati. Per esportare normali trait o tipi runtime usa una libreria ordinaria separata. [Cargo: target proc-macro](https://doc.rust-lang.org/cargo/reference/cargo-targets.html#the-proc-macro-field).

`proc_macro::TokenStream` e l'interfaccia del compilatore; non e una String da analizzare con split o regex. `syn` effettua il parsing, `quote!` costruisce token, `proc_macro2` permette di usare l'elaborazione anche in normali test. La conversione fra i due TokenStream non esegue il codice prodotto. [syn](https://docs.rs/syn/latest/syn/), [quote](https://docs.rs/quote/latest/quote/), [proc-macro2](https://docs.rs/proc-macro2/latest/proc_macro2/).

### Input e output

| Forma | Contratto |
| --- | --- |
| Function-like | Un TokenStream in ingresso; sostituisce l'invocazione `name!(...)`. |
| Derive | Riceve struct, enum o union; aggiunge item, non riscrive l'originale. |
| Attribute | Riceve argomenti e item; l'output sostituisce l'item annotato. |
| Helper attributes | Metadati dichiarati dal derive; non trasformano da soli il programma. |

Gli entry point delle prime due forme hanno firma `fn(TokenStream) -> TokenStream`; l'attributo usa `fn(TokenStream, TokenStream) -> TokenStream`. Sono definizioni con un corpo, non prototipi terminati da punto e virgola. [Rust Reference](https://doc.rust-lang.org/reference/procedural-macros.html).

Il derive lascia l'item originale al compilatore: restituirlo nuovamente duplicherebbe la definizione. Un attributo che restituisce uno stream vuoto, invece, rimuove l'item; per conservarlo deve includerlo nell'output.

## API / Sintassi

### Parsing, generics e diagnostiche

- `parse_macro_input!(input as DeriveInput)` converte gli errori di parsing in diagnostiche di compilazione.
- `Generics::split_for_impl()` separa parametri dell'impl, argomenti del tipo e clausola where.
- `quote! { ... #name ... }` interpola token; non concatena testo arbitrario.
- `syn::Error::new_spanned(...)` associa l'errore a token utili; `into_compile_error()` genera il relativo codice.

Un input non supportato e un errore previsto: preferisci una diagnostica esplicita al panic. Il fatto che il parsing riesca non prova che i nomi, i trait o i bound del codice generato siano validi. [parse_macro_input](https://docs.rs/syn/latest/syn/macro.parse_macro_input.html), [Generics](https://docs.rs/syn/latest/syn/struct.Generics.html#method.split_for_impl), [Error](https://docs.rs/syn/latest/syn/struct.Error.html).

## Esempio pratico

### Struttura del progetto

Progetto autonomo, non file da aggiungere al vault o al sito Quartz:

```text
proc-guide/
|-- Cargo.toml
|-- macros/
|   |-- Cargo.toml
|   `-- src/
|       |-- lib.rs
|       `-- expand.rs
`-- demo/
    |-- Cargo.toml
    `-- src/
        `-- main.rs
```

### Cargo.toml

```toml
[workspace]
members = ["macros", "demo"]
resolver = "3"
```

### macros/Cargo.toml

```toml
[package]
name = "note-macros"
version = "0.1.0"
edition = "2024"

[lib]
proc-macro = true

[dependencies]
proc-macro2 = "=1.0.107"
quote = "=1.0.47"
syn = { version = "=3.0.10", features = ["full"] }
```

`full` serve qui anche per verificare l'output come ItemImpl nei test. Non abilitarlo automaticamente in ogni macro. Le versioni dirette sono fissate; il Cargo.lock del workspace registra anche le dipendenze transitive. Il demo usa syn 3, non il manifest syn 2 della precedente versione di questa nota.

### macros/src/lib.rs

```rust
use proc_macro::TokenStream;
use syn::{parse_macro_input, DeriveInput};

mod expand;

#[proc_macro]
pub fn identity(input: TokenStream) -> TokenStream {
    input
}

#[proc_macro_attribute]
pub fn keep_item(args: TokenStream, item: TokenStream) -> TokenStream {
    if !args.is_empty() {
        return syn::Error::new_spanned(
            proc_macro2::TokenStream::from(args),
            "keep_item takes no arguments",
        )
        .into_compile_error()
        .into();
    }
    item
}

#[proc_macro_derive(TypeName)]
pub fn type_name(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    expand::type_name(&input)
        .unwrap_or_else(syn::Error::into_compile_error)
        .into()
}
```

`identity!` conserva i token, quindi anche gli effetti runtime dell'espressione risultante. `keep_item` non modifica l'item quando gli argomenti sono vuoti; gli argomenti non vuoti sono rifiutati. Nessuna delle due risolve o valida i tipi al posto del compilatore.

### macros/src/expand.rs

```rust
use proc_macro2::TokenStream;
use quote::quote;
use syn::{Data, DeriveInput};

pub(super) fn type_name(input: &DeriveInput) -> syn::Result<TokenStream> {
    if matches!(&input.data, Data::Union(_)) {
        return Err(syn::Error::new_spanned(
            &input.ident,
            "TypeName supports only structs and enums",
        ));
    }

    let ident = &input.ident;
    let (impl_generics, ty_generics, where_clause) =
        input.generics.split_for_impl();

    Ok(quote! {
        impl #impl_generics #ident #ty_generics #where_clause {
            pub fn type_name() -> &'static str {
                ::core::stringify!(#ident)
            }
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn preserves_generics() {
        let input: DeriveInput = syn::parse_quote! {
            struct Packet<'a, T: ?Sized, const N: usize>
            where T: 'a
            { value: &'a T, bytes: [u8; N] }
        };
        let generated: syn::ItemImpl =
            syn::parse2(type_name(&input).unwrap()).unwrap();
        assert_eq!(generated.generics.params.len(), 3);
        assert!(generated.generics.where_clause.is_some());
    }

    #[test]
    fn rejects_unions() {
        let input: DeriveInput = syn::parse_quote! {
            union Bits { word: u32 }
        };
        let error = type_name(&input).unwrap_err();
        assert_eq!(
            error.to_string(),
            "TypeName supports only structs and enums",
        );
    }
}
```

L'impl conserva lifetime, parametri di tipo, const generics e where. Non aggiunge bound Debug/Clone: il metodo non legge i campi. I parametri con default vanno nelle dichiarazioni appropriate, non copiati alla cieca nella firma dell'impl; split_for_impl gestisce questa distinzione.

**TypeName e il nome del derive, non un trait definito dal demo.** L'output e un impl inerente che aggiunge il metodo associato type_name. Ritorna il nome sintattico del tipo, non il percorso completo o gli argomenti generici: non usarlo come identificatore globale, formato di serializzazione o API di reflection.

I test dell'helper verificano token e AST senza invocare proc_macro fuori dal compilatore. Il progetto demo verifica poi che l'espansione venga davvero compilata e usata.

### demo/Cargo.toml

```toml
[package]
name = "proc-demo"
version = "0.1.0"
edition = "2024"

[dependencies]
note-macros = { path = "../macros" }
```

### demo/src/main.rs

```rust
use note_macros::{identity, keep_item, TypeName};

#[derive(TypeName)]
struct Packet<'a, T: ?Sized, const N: usize>
where
    T: 'a,
{
    value: &'a T,
    bytes: [u8; N],
}

#[derive(TypeName)]
enum State { Ready }

#[keep_item]
fn add_one(value: u8) -> u16 {
    u16::from(value) + 1
}

fn main() {
    let packet = Packet { value: "hello", bytes: [1, 2] };
    assert_eq!(packet.value, "hello");
    assert_eq!(packet.bytes, [1, 2]);
    assert_eq!(Packet::<str, 2>::type_name(), "Packet");
    assert_eq!(State::type_name(), "State");
    let _ = State::Ready;

    let mut calls = 0;
    let result = identity!({ calls += 1; 42 });
    assert_eq!((result, calls), (42, 1));
    assert_eq!(add_one(255), 256);
}
```

### Eseguire il progetto

Dalla radice proc-guide, con Cargo e il linker della propria piattaforma disponibili. Il primo comando puo scaricare e compilare dipendenze: usa soltanto codice e registry affidabili.

```sh
cargo run -p proc-demo
```

Il programma termina senza output se gli assert passano. Dopo la prima risoluzione viene generato Cargo.lock. Per i due test dell'helper:

```sh
cargo test -p note-macros --lib --locked
```

Con cache gia popolata e lockfile presente puoi verificare la build senza rete:

```sh
cargo check --workspace --locked --offline
```

`cargo check` non esegue gli assert del programma. Un successo dei test sull'AST non sostituisce la compilazione del chiamante; gli errori intenzionali seguenti vanno provati separatamente, sostituendo solo demo/src/main.rs.

## Varianti

### Crate runtime e hygiene

Se generi implementazioni di un trait pubblico, quel trait vive normalmente in una libreria ordinaria, mentre il derive vive nella crate proc-macro. Una libreria puo riesportare il derive per offrire un unico punto d'ingresso; evita cicli nelle dipendenze.

Il codice generato interagisce con lo scope del chiamante: usa percorsi qualificati e nomi deliberati. Qui `::core::stringify!` evita di dipendere da un import locale. Una dipendenza runtime rinominata richiede una strategia esplicita; `$crate` di macro_rules non e una soluzione automatica per quote. Vedi [[Programmazione/Rust/Pagine/Hygiene|Hygiene]].

### Sicurezza e riproducibilita

Le proc macro sono codice eseguito durante la build, con accesso alle risorse consentite al processo del compilatore: non considerarle una sandbox. Anche una verifica del codice puo eseguirle. Evita I/O, rete, orologio o ambiente non documentati come input nascosti; valuta dipendenze e lockfile. [Rust Reference: esecuzione e sicurezza](https://doc.rust-lang.org/reference/procedural-macros.html).

Nella cross-compilazione la macro viene eseguita sull'host; il codice prodotto viene compilato per il target dell'applicazione. Non dedurre le proprieta del target dal sistema su cui gira la macro. [Cargo: build cache e host](https://doc.rust-lang.org/cargo/reference/build-cache.html).

## Errori comuni

### Union non supportata dal demo

Compile-fail intenzionale, con diagnostica TypeName supports only structs and enums:

```rust
use note_macros::TypeName;

#[derive(TypeName)]
union Bits { word: u32 }

fn main() {}
```

Il linguaggio ammette derive su union, ma questa macro le rifiuta per scelta. Usa un tipo supportato o progetta e testa un supporto esplicito alle union.

### Collisione con un metodo esistente

Compile-fail intenzionale, con duplicazione di type_name (E0592):

```rust
use note_macros::TypeName;

#[derive(TypeName)]
struct Item;

impl Item {
    fn type_name() -> &'static str { "custom" }
}

fn main() {}
```

Il derive non vede tutti gli impl separati del tipo. Non generare lo stesso metodo due volte; per una libreria considera un trait o una configurazione esplicita, senza promettere assenza universale di collisioni.

### Argomenti ignorati silenziosamente

Compile-fail intenzionale, con diagnostica keep_item takes no arguments:

```rust
use note_macros::keep_item;

#[keep_item(unexpected)]
fn work() {}

fn main() {}
```

La macro dichiara un contratto ristretto e rifiuta l'input non previsto: usa `#[keep_item]`, oppure implementa davvero il parsing degli argomenti.

Altri errori:

- Omettere generics/where nel codice generato: l'esempio precedente con `impl #ident` falliva su tipi generici.
- Esportare normali funzioni pubbliche dalla crate proc-macro anziche spostarle in una libreria ordinaria.
- Invocare il derive nella stessa crate che lo definisce.
- Usare to_string e regex come parser di Rust, perdendo struttura e span.
- Trattare panic, compilazione riuscita o un espansore di macro come una verifica completa di correttezza.

## Checklist

- Il tipo di macro corrisponde alla trasformazione necessaria?
- Il progetto separa entry point, logica testabile e chiamante?
- Generics, lifetime, default e where sono conservati senza bound superflui?
- Gli input non supportati producono errori con span utili?
- Ho verificato tipi supportati, nomi in conflitto e dipendenza rinominata?
- Ho eseguito il chiamante oltre a controllare l'AST dell'espansione?
- Dipendenze, accessi alle risorse e comportamento host/target sono espliciti?

## Collegamenti

- [[Programmazione/Rust/Pagine/Derive macros|Derive macros]]
- [[Programmazione/Rust/Pagine/Attribute macros|Attribute macros]]
- [[Programmazione/Rust/Pagine/Function-like macros|Function-like macros]]
- [[Programmazione/Rust/Pagine/Hygiene|Hygiene]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Generics|Generics]]
- [[Programmazione/Rust/Pagine/Build scripts|Build scripts]]

## Fonti

- [Rust Reference: procedural macros](https://doc.rust-lang.org/reference/procedural-macros.html).
- [Cargo: proc-macro](https://doc.rust-lang.org/cargo/reference/cargo-targets.html#the-proc-macro-field), [host e target](https://doc.rust-lang.org/cargo/reference/build-cache.html).
- [syn](https://docs.rs/syn/latest/syn/), [DeriveInput](https://docs.rs/syn/latest/syn/struct.DeriveInput.html), [split_for_impl](https://docs.rs/syn/latest/syn/struct.Generics.html#method.split_for_impl).
- [syn: diagnostiche](https://docs.rs/syn/latest/syn/struct.Error.html), [parse_macro_input](https://docs.rs/syn/latest/syn/macro.parse_macro_input.html).
- [quote](https://docs.rs/quote/latest/quote/), [proc-macro2](https://docs.rs/proc-macro2/latest/proc_macro2/).

I link latest possono avanzare; le versioni del demo sono quelle dichiarate nel manifest. Nessuna verifica locale certifica tutte le piattaforme, la MSRV o la sicurezza di ogni dipendenza.

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

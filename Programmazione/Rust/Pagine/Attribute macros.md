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
  - attribute macro
  - proc_macro_attribute
prerequisites:
  - "[[Programmazione/Rust/Pagine/Procedural macros]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Derive macros]]"
  - "[[Programmazione/Rust/Pagine/Function-like macros]]"
  - "[[Programmazione/Rust/Pagine/Hygiene]]"
title: Attribute macros
---

# Attribute macros

## Sintesi

Con `#[on_entry(crate::record)]` chiediamo al compilatore di inserire una chiamata a `record()` all'inizio di una funzione. **La macro trasforma la definizione durante la build; il codice inserito gira quando il corpo viene eseguito.** Leggere un attributo non registra da solo una rotta, non avvia un server e non produce log.

## Quando usarlo

Un attributo procedurale serve quando molti item devono essere trasformati nello stesso modo: strumentare handler, generare test, integrare funzioni con un framework. Se il comportamento riguarda una sola funzione, una chiamata esplicita all'inizio del corpo e spesso piu leggibile. Se devi soltanto aggiungere un'implementazione a un tipo senza riscriverlo, valuta un [[Programmazione/Rust/Pagine/Derive macros|derive]].

## Come funziona

La funzione marcata `#[proc_macro_attribute]` vive alla radice di una crate `proc-macro`. Riceve due `proc_macro::TokenStream` e ne restituisce uno:

| Stream | Nel caso di `on_entry` |
| --- | --- |
| Argomenti | I token `crate::record`, senza le parentesi esterne. Senza argomenti lo stream e vuoto. |
| Item | La definizione della funzione, inclusi gli altri attributi ancora presenti. L'attributo in esecuzione non fa parte di questo stream. |
| Risultato | Sostituisce l'item annotato. Restituire l'item invariato non aggiunge comportamento; restituire uno stream vuoto lo elimina. |

Il linguaggio consente attributi procedurali anche su moduli, blocchi `impl` e altri item. **La grammatica accettata da una particolare macro dipende dal suo parser.** Gli helper di un derive, invece, sono configurazione letta dal derive, non trasformazioni autonome. Vedi la [Rust Reference](https://doc.rust-lang.org/reference/procedural-macros.html#attribute-macros) e [[Programmazione/Rust/Pagine/Procedural macros|Procedural macros]].

## API / Sintassi

`#[on_entry(percorso)]` accetta un solo percorso Rust, come `crate::audit::record`, senza parentesi di chiamata, liste o argomenti generici espliciti. Il percorso deve risolversi, nel codice della funzione annotata, a qualcosa di chiamabile senza argomenti e con risultato `()`. Queste ultime condizioni sono controllate da `rustc`, non dal parser di `syn`.

Il demo tratta funzioni con corpo, sincrone o `async`, e rifiuta le `const fn` per scelta: l'hook e pensato per effetti runtime. Non promette di supportare ogni item, ABI o attributo speciale. La macro viene eseguita durante la compilazione anche se la funzione non sara mai chiamata: usa solo dipendenze di build affidabili.

## Esempio pratico

Il progetto ha tre file. `examples/counter.rs` e un target Cargo separato dalla libreria: puo usare la macro pur appartenendo allo stesso package. Baseline del demo: Rust 1.99.1, edition 2024; nessuna dipendenza applicativa per l'hook.

### Cargo.toml

```toml
[package]
name = "entry-hook"
version = "0.1.0"
edition = "2024"

[lib]
proc-macro = true

[dependencies]
syn = { version = "=3.0.10", features = ["full"] }
quote = "=1.0.47"
```

### src/lib.rs

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, parse_quote, Error, ItemFn, Path};

#[proc_macro_attribute]
pub fn on_entry(args: TokenStream, item: TokenStream) -> TokenStream {
    let hook = parse_macro_input!(args with Path::parse_mod_style);
    let mut function = parse_macro_input!(item as ItemFn);
    if let Some(token) = function.sig.constness {
        return Error::new_spanned(token, "on_entry does not support const fn")
            .into_compile_error()
            .into();
    }

    function.block.stmts.insert(0, parse_quote! {
        let _: () = #hook();
    });
    quote!(#function).into()
}
```

`Path::parse_mod_style` legge il percorso; `ItemFn` separa firma, visibilita, attributi e blocco. La macro modifica **solo la lista delle istruzioni**, senza ricostruire la firma o avvolgere il corpo in una closure. Questo conserva generics, clausole `where`, `return`, `?` e l'espressione finale. `let _: ()` controlla che il risultato sia unit senza introdurre un nome locale.

### examples/counter.rs

```rust
use entry_hook::on_entry;
use std::sync::atomic::{AtomicUsize, Ordering};

static CALLS: AtomicUsize = AtomicUsize::new(0);

fn record() {
    CALLS.fetch_add(1, Ordering::Relaxed);
}

#[on_entry(crate::record)]
pub fn first<T>(values: &[T]) -> Result<&T, &'static str>
where
    T: PartialEq,
{
    let value = values.first().ok_or("empty")?;
    if values.last() != Some(value) {
        return Err("different ends");
    }
    Ok(value)
}

fn main() {
    assert_eq!(CALLS.load(Ordering::Relaxed), 0);
    assert_eq!(first(&[4, 2, 4]), Ok(&4));
    assert_eq!(first::<u8>(&[]), Err("empty"));
    assert_eq!(first(&[1, 2]), Err("different ends"));
    assert_eq!(CALLS.load(Ordering::Relaxed), 3);
}
```

Nel corpo di `first` la prima istruzione dopo l'espansione equivale a `let _: () = crate::record();`. Anche i due percorsi di errore incrementano il contatore: l'hook precede sia `?` sia il `return` esplicito. Conta gli ingressi, non i successi, e non registra l'uscita. Se l'hook va in panic, il corpo originale non prosegue.

### Esecuzione

Dalla radice del package, con Cargo e un linker disponibili:

```sh
cargo run --example counter
```

Il primo comando puo scaricare dipendenze e genera `Cargo.lock`; termina senza output se passano gli assert. Con lockfile presente e cache popolata, puoi controllare l'espansione e i tipi senza scaricare o eseguire il programma:

```sh
cargo check --locked --offline --example counter
```

## Varianti

- **Funzione asincrona.** L'inserimento avviene nel corpo di `async fn`. Creare il future non chiama l'hook: viene eseguito al primo poll che entra nel corpo. Dopo una sospensione il corpo riprende dal punto raggiunto, non dall'inizio. Scartare un future mai avviato non incrementa il contatore.
- **Tracing.** `#[tracing::instrument]` crea uno span e puo registrarvi gli argomenti. Non equivale a `println!` o a un semplice hook: la raccolta degli eventi dipende dal subscriber. Valuta quali campi escludere, soprattutto per dati riservati. [Documentazione di instrument](https://docs.rs/tracing/latest/tracing/attr.instrument.html).
- **Routing HTTP.** In Actix Web la forma documentata e `#[route("/users", method = "GET")]`. Il servizio generato deve essere collegato all'applicazione. Un attributo che restituisce semplicemente `item` non genera quel servizio, anche se il codice compila. [Documentazione di route](https://docs.rs/actix-web/latest/actix_web/attr.route.html).

## Errori comuni

- **Chiamata anziche percorso:** in `on_entry(record())` le parentesi appartengono a una chiamata. Scrivi `on_entry(crate::record)`.
- **Firma dell'hook incompatibile:** il parsing puo riuscire, ma la chiamata inserita non compila. Usa un adattatore senza argomenti che restituisca `()`.
- **Nome nascosto da un parametro:** i nomi generati si risolvono nel chiamante. Per un hook alla radice usa `crate::record`, senza dipendere da un import locale.
- **Item non supportato:** una struct non e un `ItemFn`; una `const fn` e rifiutata esplicitamente. Cambia attributo o implementa un diverso contratto.
- **Attributi spariti o effetti in ordine inatteso:** riemetti gli attributi ancora presenti. Se impili due macro che inseriscono in testa al corpo, la seconda inserzione precede la prima a runtime.

## Checklist

- Quale codice sostituisce effettivamente l'item? Quali effetti avvengono solo a runtime?
- Gli argomenti non previsti vengono rifiutati, con una diagnostica comprensibile?
- Rimangono firma, visibilita, documentazione, altri attributi e flusso di ritorno?
- Il chiamante e stato **eseguito**, oltre che compilato? Per `async`, e stato anche fatto il poll del future?

## Collegamenti

- [[Programmazione/Rust/Pagine/Procedural macros|Procedural macros]]
- [[Programmazione/Rust/Pagine/Derive macros|Derive macros]]
- [[Programmazione/Rust/Pagine/Function-like macros|Function-like macros]]
- [[Programmazione/Rust/Pagine/Hygiene|Hygiene]]
- [[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]

## Fonti

- [Rust Reference: attributi procedurali](https://doc.rust-lang.org/reference/procedural-macros.html#attribute-macros).
- [syn: struttura di ItemFn](https://docs.rs/syn/latest/syn/struct.ItemFn.html), [parsing dei percorsi](https://docs.rs/syn/latest/syn/struct.Path.html#method.parse_mod_style).
- [Rust Reference: funzioni asincrone](https://doc.rust-lang.org/reference/items/functions.html#async-functions).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

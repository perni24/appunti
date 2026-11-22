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
  - derive macro
  - proc_macro_derive
prerequisites:
  - "[[Programmazione/Rust/Pagine/Derive traits]]"
  - "[[Programmazione/Rust/Pagine/Procedural macros]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
related:
  - "[[Programmazione/Rust/Pagine/Attribute macros]]"
  - "[[Programmazione/Rust/Pagine/Display e Debug]]"
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow]]"
title: Derive macros
---

# Derive macros

## Sintesi

Un derive, invocato con `#[derive(...)]`, legge la definizione di un tipo e aggiunge item, spesso un'implementazione di trait. Non modifica i campi originali e non riceve valori runtime o informazioni complete sui tipi risolti.

Questa nota distingue l'uso di un derive dalla sua implementazione. Il progetto completo genera metadati con **Describe**: nome del tipo e nomi dei campi, con configurazione realmente analizzata. Non e un serializer, un validatore o un sistema di reflection.

Baseline del progetto custom: **Rust 1.99.1, edition 2024**, **syn 3.0.10**, **quote 1.0.47**, **proc-macro2 1.0.107**. Versioni del demo, non MSRV. L'esempio thiserror usa separatamente **2.0.21**.

## Quando usarlo

- Generare implementazioni ripetitive derivabili dalla sintassi del tipo.
- Esporre una configurazione dichiarativa per campi e varianti supportati.
- Ridurre codice manuale mantenendo un contratto prevedibile e verificabile.

Usa un'implementazione manuale quando la semantica dipende dal dominio, non dalla forma dei campi. Per i derive standard e i loro bound vedi [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]; per il modello generale delle proc macro vedi [[Programmazione/Rust/Pagine/Procedural macros|Procedural macros]].

## Come funziona

### Usare un derive esistente

Programma autonomo con la sola standard library:

```rust
#[derive(Debug, Clone)]
struct User {
    id: u64,
    name: String,
}

fn main() {
    let original = User { id: 7, name: "Ada".into() };
    let mut copy = original.clone();
    copy.name.push('!');
    assert_eq!(original.name, "Ada");
    assert_eq!(copy.name, "Ada!");
    assert_eq!(copy.id, 7);
    assert!(format!("{original:?}").contains("Ada"));
}
```

Clone e Debug sono capacita distinte; Debug non oscura dati sensibili. Per questo User la String clonata e indipendente, ma Clone non promette una copia profonda di ogni struttura, per esempio con Arc.

### Derive, trait e attributi helper

| Elemento | Ruolo |
| --- | --- |
| Derive | Macro eseguita durante la compilazione. |
| Trait | Contratto implementato dal codice generato. |
| Helper | Configurazione interpretata dalla macro. |

La stessa parola puo identificare sia un trait sia un derive, in namespace diversi. Importare un trait non crea magicamente una macro: una libreria puo esportare entrambi, come nel progetto seguente.

Il linguaggio ammette derive su struct, enum e union; ogni macro decide quali forme supportare. L'output si aggiunge all'item: restituire anche l'originale ne duplica la definizione. [Rust Reference: derive](https://doc.rust-lang.org/reference/attributes/derive.html), [procedural derive](https://doc.rust-lang.org/reference/procedural-macros.html#derive-macros).

Gli helper dichiarati con `attributes` sono attributi inerti, non attribute macros autonome. Dichiarare il nome `describe` non implementa `rename` o `skip`: serve un parser. Nel codice scrivi l'helper dopo il derive che lo introduce.

## API / Sintassi

### Contratto del demo Describe

- Supporta **solo struct con campi nominati**, anche vuote. Tuple struct, unit struct, enum e union sono rifiutati esplicitamente.
- Sul tipo: `rename` cambia `NAME`; `crate_path` indica il percorso della libreria runtime se rinominata.
- Sul campo: `rename` cambia la voce in `FIELDS`; `skip` esclude soltanto quella voce.
- `rename` richiede una stringa letterale non vuota; non e un identificatore Rust e puo contenere spazi.
- Opzioni sconosciute, duplicate, collocate nel posto sbagliato o `skip` insieme a `rename` sono errori.
- Nomi finali duplicati tra i campi inclusi sono errori; l'ordine segue la dichiarazione.
- Senza `rename` usa l'identificatore senza il prefisso raw `r#`. Nessuna unicita globale tra tipi.

Gli helper non fanno sparire i campi. Un campo escluso da FIELDS resta nella struct e puo ancora essere letto o mostrato da altri derive.

## Esempio pratico

### Struttura del progetto

Workspace autonomo; i percorsi seguenti non sono file da aggiungere al vault.

```text
derive-guide/
|-- Cargo.toml
|-- schema/
|   |-- Cargo.toml
|   +-- src/lib.rs
|-- macros/
|   |-- Cargo.toml
|   +-- src/
|       |-- lib.rs
|       |-- config.rs
|       +-- expand.rs
+-- demo/
    |-- Cargo.toml
    +-- src/main.rs
```

### Cargo.toml

```toml
[workspace]
members = ["schema", "macros", "demo"]
resolver = "3"
```

### schema/Cargo.toml

```toml
[package]
name = "note-schema"
version = "0.1.0"
edition = "2024"

[dependencies]
note-schema-derive = { path = "../macros" }
```

### schema/src/lib.rs

```rust
pub use note_schema_derive::Describe;

pub trait Describe {
    const NAME: &'static str;
    const FIELDS: &'static [&'static str];
}
```

Il trait vive nella libreria ordinaria. La crate macro non dipende da schema: produce token che il compilatore risolvera nel chiamante. Il re-export del derive non crea quindi un ciclo.

### macros/Cargo.toml

```toml
[package]
name = "note-schema-derive"
version = "0.1.0"
edition = "2024"

[lib]
proc-macro = true

[dependencies]
proc-macro2 = "=1.0.107"
quote = "=1.0.47"
syn = { version = "=3.0.10", features = ["full"] }
```

full e usato anche per analizzare ItemImpl nei test. I pin fissano le dipendenze dirette; Cargo.lock registra la risoluzione completa.

### macros/src/lib.rs

```rust
use proc_macro::TokenStream;
use syn::{parse_macro_input, DeriveInput};

mod config;
mod expand;

#[proc_macro_derive(Describe, attributes(describe))]
pub fn describe(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    expand::describe(&input)
        .unwrap_or_else(syn::Error::into_compile_error)
        .into()
}
```

### macros/src/config.rs

Il parser accumula le opzioni anche tra piu attributi describe, cosi i duplicati non vengono sovrascritti silenziosamente.

```rust
use syn::{Attribute, Error, LitStr, Path};

#[derive(Default)]
pub(super) struct Options {
    pub rename: Option<LitStr>,
    pub skip: bool,
    pub crate_path: Option<Path>,
}

pub(super) fn options(
    attrs: &[Attribute],
    on_field: bool,
) -> syn::Result<Options> {
    let mut out = Options::default();
    for attr in attrs.iter().filter(|a| a.path().is_ident("describe")) {
        attr.parse_nested_meta(|meta| {
            if meta.path.is_ident("rename") {
                if out.rename.is_some() {
                    return Err(meta.error("duplicate rename"));
                }
                let name: LitStr = meta.value()?.parse()?;
                if name.value().is_empty() {
                    return Err(Error::new_spanned(name, "rename cannot be empty"));
                }
                out.rename = Some(name);
            } else if on_field && meta.path.is_ident("skip") {
                if out.skip {
                    return Err(meta.error("duplicate skip"));
                }
                out.skip = true;
            } else if !on_field && meta.path.is_ident("crate_path") {
                if out.crate_path.is_some() {
                    return Err(meta.error("duplicate crate_path"));
                }
                out.crate_path = Some(meta.value()?.parse()?);
            } else {
                return Err(meta.error("unsupported describe option here"));
            }
            Ok(())
        })?;
    }
    if out.skip {
        if let Some(name) = &out.rename {
            return Err(Error::new_spanned(name, "skip conflicts with rename"));
        }
    }
    Ok(out)
}
```

parse_nested_meta analizza la struttura dell'attributo; LitStr e Path richiedono i rispettivi tipi sintattici. Non sono sostituzioni di testo. Gli errori conservano span utili invece di usare panic per input previsto come non valido. [syn: Attribute](https://docs.rs/syn/latest/syn/struct.Attribute.html#method.parse_nested_meta).

### macros/src/expand.rs

```rust
use std::collections::HashSet;
use proc_macro2::TokenStream;
use quote::quote;
use syn::ext::IdentExt;
use syn::{Data, DeriveInput, Error, Fields, LitStr};

use crate::config::options;

pub(super) fn describe(input: &DeriveInput) -> syn::Result<TokenStream> {
    let fields = match &input.data {
        Data::Struct(data) => match &data.fields {
            Fields::Named(fields) => &fields.named,
            _ => return Err(Error::new_spanned(
                &input.ident, "Describe requires named fields",
            )),
        },
        _ => return Err(Error::new_spanned(
            &input.ident, "Describe requires a struct",
        )),
    };

    let opts = options(&input.attrs, false)?;
    let ident = &input.ident;
    let name = opts.rename.unwrap_or_else(|| {
        LitStr::new(&ident.unraw().to_string(), ident.span())
    });
    let runtime = opts.crate_path
        .unwrap_or_else(|| syn::parse_quote!(::note_schema));
    let mut names = Vec::new();
    let mut seen = HashSet::new();

    for field in fields {
        let opts = options(&field.attrs, true)?;
        if opts.skip {
            continue;
        }
        let ident = field.ident.as_ref().ok_or_else(|| {
            Error::new_spanned(field, "expected named field")
        })?;
        let name = opts.rename.unwrap_or_else(|| {
            LitStr::new(&ident.unraw().to_string(), ident.span())
        });
        if !seen.insert(name.value()) {
            return Err(Error::new_spanned(name, "duplicate field name"));
        }
        names.push(name);
    }

    let (impl_generics, ty_generics, where_clause) =
        input.generics.split_for_impl();
    Ok(quote! {
        impl #impl_generics #runtime::Describe for #ident #ty_generics
        #where_clause {
            const NAME: &'static str = #name;
            const FIELDS: &'static [&'static str] = &[#(#names),*];
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn preserves_generics() {
        let input: DeriveInput = syn::parse_quote! {
            struct View<'a, T: ?Sized, const N: usize>
            where T: 'a
            { value: &'a T, bytes: [u8; N] }
        };
        let output: syn::ItemImpl =
            syn::parse2(describe(&input).unwrap()).unwrap();
        assert_eq!(output.generics.params.len(), 3);
        assert!(output.generics.where_clause.is_some());
        assert!(output.trait_.is_some());
        assert_eq!(output.items.len(), 2);
    }

    #[test]
    fn rejects_unknown_option() {
        let input: DeriveInput = syn::parse_quote! {
            #[describe(unknown)]
            struct Item { value: u8 }
        };
        assert_eq!(
            describe(&input).unwrap_err().to_string(),
            "unsupported describe option here",
        );
    }
}
```

split_for_impl conserva lifetime, parametri, default nelle posizioni corrette e where. Non aggiungiamo bound ai tipi dei campi: generiamo stringhe, senza clonare, formattare o leggere i valori. Un derive che chiama davvero un trait sui campi deve invece costruire i bound necessari. [syn: Generics](https://docs.rs/syn/latest/syn/struct.Generics.html#method.split_for_impl), [IdentExt](https://docs.rs/syn/latest/syn/ext/trait.IdentExt.html).

### demo/Cargo.toml

La dipendenza runtime viene deliberatamente rinominata schema:

```toml
[package]
name = "derive-demo"
version = "0.1.0"
edition = "2024"

[dependencies]
schema = { package = "note-schema", path = "../schema" }
```

### demo/src/main.rs

```rust
use schema::Describe;

#[derive(Debug, Describe)]
#[describe(rename = "account", crate_path = ::schema)]
struct Account<'a, T: ?Sized, const N: usize>
where
    T: 'a,
{
    #[describe(rename = "display_name")]
    name: &'a T,
    #[describe(skip)]
    password: &'a str,
    flags: [u8; N],
}

fn main() {
    type Example = Account<'static, str, 2>;
    assert_eq!(Example::NAME, "account");
    assert_eq!(Example::FIELDS, &["display_name", "flags"]);

    let account = Account {
        name: "Ada",
        password: "demo-only",
        flags: [1, 2],
    };
    assert_eq!(account.name, "Ada");
    assert_eq!(account.flags, [1, 2]);
    assert_eq!(account.password, "demo-only");
    assert!(format!("{account:?}").contains("demo-only"));
}
```

L'ultimo assert dimostra un limite, non una pratica per loggare credenziali: skip non influenza Debug. Il demo genera metadati, non serializza valori ne protegge segreti. I nomi pubblicati possono rivelare dettagli di campi privati.

crate_path e una scelta esplicita del demo per supportare dipendenze rinominate. Senza l'override cerca ::note_schema; non rileva automaticamente gli alias Cargo. Il percorso deve essere risolvibile nel punto dell'espansione.

### Eseguire e verificare

Dalla radice derive-guide, con Cargo e linker disponibili. Il primo comando puo scaricare e compilare dipendenze; usa sorgenti e registry affidabili.

```sh
cargo run -p derive-demo
```

Il programma termina senza output se gli assert passano. Dopo la prima risoluzione Cargo.lock fissa anche le dipendenze transitive.

```sh
cargo test -p note-schema-derive --lib --locked
```

I due test dell'helper verificano parsing/AST; il chiamante prova la compilazione e l'uso reale dell'impl. Con cache gia popolata:

```sh
cargo check --workspace --locked --offline
```

cargo check non esegue gli assert. Per una macro riutilizzabile aggiungi chiamanti validi e compile-fail, inclusi generics, attributi invalidi e dipendenza rinominata.

## Varianti

### thiserror: implementazioni pronte

Programma separato dal workspace precedente: usa il manifest error-guide documentato in [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]] e questo src/main.rs. Baseline thiserror 2.0.21, nessun file o I/O reale necessario.

```rust
use std::error::Error;

#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error("config mancante")]
    MissingConfig,
    #[error("errore io")]
    Io(#[from] std::io::Error),
}

fn main() {
    let missing = AppError::MissingConfig;
    assert_eq!(missing.to_string(), "config mancante");
    assert!(missing.source().is_none());

    let error: AppError = std::io::Error::other("demo cause").into();
    assert_eq!(error.to_string(), "errore io");
    assert_eq!(error.source().unwrap().to_string(), "demo cause");
    assert!(matches!(error, AppError::Io(_)));
}
```

error configura Display; from genera From e identifica anche la causa. Qui il messaggio esterno non include automaticamente il testo della causa. La variante from non puo avere altri dati arbitrari da inventare. Debug viene derivato separatamente. [thiserror](https://docs.rs/thiserror/latest/thiserror/).

Altri casi: `serde::Serialize` genera l'implementazione del trait di serializzazione, mentre i derive standard coprono Debug, Clone, Copy, Default, confronti e Hash. I rispettivi helper e bound appartengono alla macro specifica: il nostro `describe(skip)` non e `serde(skip)`. [Serde: derive](https://serde.rs/derive.html).

## Errori comuni

I seguenti programmi sono compile-fail intenzionali: sostituiscono soltanto demo/src/main.rs nel workspace custom.

### Opzione scritta male

```rust
#[derive(schema::Describe)]
#[describe(crate_path = ::schema, renmae = "item")]
struct Item { id: u8 }

fn main() {}
```

Diagnostica unsupported describe option here sul nome errato. Correzione: rename, non renmae. Accettare silenziosamente l'errore produrrebbe metadati diversi dall'intenzione.

### Configurazione contraddittoria

```rust
#[derive(schema::Describe)]
#[describe(crate_path = ::schema)]
struct Item {
    #[describe(skip, rename = "public_id")]
    id: u8,
}

fn main() {}
```

Diagnostica skip conflicts with rename. Scegli se includere il campo con un nome diverso oppure escluderlo.

### Implementazione duplicata

```rust
#[derive(schema::Describe)]
#[describe(crate_path = ::schema)]
struct Item { id: u8 }

impl schema::Describe for Item {
    const NAME: &'static str = "manual";
    const FIELDS: &'static [&'static str] = &[];
}

fn main() {}
```

Errore E0119: l'impl manuale confligge con quello generato. Mantieni una sola implementazione; il derive non rileva e non sostituisce automaticamente gli impl presenti altrove.

Altri errori da evitare:

- Presentare un corpo vuoto o todo! come implementazione funzionante del derive.
- Ricopiare l'item originale nell'output, duplicandolo.
- Perdere generics/where o aggiungere bound indiscriminati a tutti i parametri.
- Ignorare le forme non supportate o fingere supporto per enum senza gestirne le varianti.
- Considerare il parser sintattico una verifica dei tipi o delle regole del dominio.
- Usare un campo escluso dai metadati come se fosse stato rimosso, cifrato o redatto.
- Trattare nuovi bound, nuovi nomi di campo o cambiamenti del codice generato come modifiche interne necessariamente compatibili.

## Checklist

- Il derive ha un contratto esplicito per forme e helper supportati?
- Opzioni errate, duplicate e incompatibili producono diagnostiche utili?
- Il codice generato implementa il trait corretto senza duplicazioni?
- Generics, lifetime, default e where sono conservati con i soli bound necessari?
- Il chiamante funziona anche con la dipendenza rinominata?
- Esistono test del parser e chiamanti realmente compilati?
- Ho distinto metadati, serializzazione e riservatezza?

## Collegamenti

- [[Programmazione/Rust/Pagine/Derive traits|Derive traits]]
- [[Programmazione/Rust/Pagine/Procedural macros|Procedural macros]]
- [[Programmazione/Rust/Pagine/Attribute macros|Attribute macros]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/Display e Debug|Display e Debug]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]

## Fonti

- [Rust Reference: derive](https://doc.rust-lang.org/reference/attributes/derive.html).
- [Procedural derive e helper attributes](https://doc.rust-lang.org/reference/procedural-macros.html#derive-macros).
- [syn: parsing degli attributi](https://docs.rs/syn/latest/syn/struct.Attribute.html#method.parse_nested_meta).
- [syn: generics](https://docs.rs/syn/latest/syn/struct.Generics.html#method.split_for_impl), [identificatori raw](https://docs.rs/syn/latest/syn/ext/trait.IdentExt.html).
- [thiserror](https://docs.rs/thiserror/latest/thiserror/).
- [Serde: derive](https://serde.rs/derive.html).

I link latest possono avanzare rispetto alla baseline. Questi esempi non certificano ogni piattaforma, una MSRV o la sicurezza delle dipendenze eseguite in compilazione.

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

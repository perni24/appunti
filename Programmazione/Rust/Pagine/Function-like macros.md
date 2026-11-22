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
  - Function-like macro
  - proc_macro
prerequisites:
  - "[[Programmazione/Rust/Pagine/Procedural macros]]"
  - "[[Programmazione/Rust/Pagine/Macro dichiarative]]"
related:
  - "[[Programmazione/Rust/Pagine/Attribute macros]]"
  - "[[Programmazione/Rust/Pagine/Derive macros]]"
  - "[[Programmazione/Rust/Pagine/Hygiene]]"
title: Function-like macros
---

# Function-like macros

## Sintesi

Una chiamata come `add!(2, 3)` si riconosce dal `!`, non da come e implementata: dietro puo esserci un matcher `macro_rules!` oppure una funzione `#[proc_macro]`. In entrambi i casi il compilatore sostituisce l'invocazione con codice Rust. Non chiama la macro con i valori `2` e `3` a runtime.

In questa nota `hashmap!` ripete un'operazione per ogni coppia, mentre `sql!` legge una piccola grammatica e produce una stringa letterale. La prima costruisce un valore quando il programma gira; la seconda non si collega mai a un database.

## Quando usarlo

- **Funzione o builder:** preferibili se gli argomenti sono valori ordinari e il lavoro non dipende dalla loro sintassi. Per sommare due numeri non serve una macro.
- **Macro dichiarativa:** adatta a poche forme riconoscibili, frammenti Rust e ripetizioni. Per una lista di coppie `chiave => valore` basta un matcher.
- **Macro procedurale:** utile quando servono un parser, controlli tra parti distanti dell'input o errori che indichino il token preciso. Il costo e una crate di build da mantenere.

## Come funziona

La proc macro riceve i token *interni* ai delimitatori. Per `sql!(SELECT * FROM users)` non riceve il nome `sql`, il `!` o le parentesi esterne. Puo interpretare una sintassi diversa da un'espressione Rust, ma l'input deve comunque poter essere tokenizzato, con delimitatori bilanciati.

L'output **sostituisce** l'invocazione: se la chiamata e a destra di `let query =`, il risultato deve essere un'espressione valida. Le macro possono anche generare item, tipi o pattern quando la posizione lo consente. Restituire direttamente `input` va bene per una macro identita, ma non trasforma `SELECT * FROM users` in una stringa: quei token non sono un'espressione Rust. [Rust Reference: invocazione](https://doc.rust-lang.org/reference/macros.html#macro-invocation).

## API / Sintassi

`sql!` accetta soltanto le due forme seguenti. `SELECT` e `FROM` sono sensibili alle maiuscole.

```text
SELECT * FROM tabella
SELECT colonna [, altra_colonna ...] FROM tabella
```

Ogni nome deve essere un identificatore Rust non riservato, iniziare con una lettera ASCII minuscola e contenere soltanto `a-z`, `0-9` o `_`. Non sono ammessi nomi raw come `r#type`, colonne ripetute, virgola finale, clausole aggiuntive o punto e virgola *dentro* la macro. Sono regole **del demo**, non di SQL. Una tabella inesistente passa il controllo se il nome rispetta queste regole.

## Esempio pratico

Il package ha una libreria proc-macro e due programmi nella cartella `examples/`. Ogni esempio e una crate chiamante distinta anche se condivide lo stesso manifest. Baseline: Rust 1.99.1, edition 2024, syn 3.0.10 e quote 1.0.47.

### Cargo.toml

```toml
[package]
name = "query-note"
version = "0.1.0"
edition = "2024"

[lib]
proc-macro = true

[dependencies]
syn = "=3.0.10"
quote = "=1.0.47"
```

### src/lib.rs

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::parse::{Parse, ParseStream};
use syn::{parse_macro_input, Error, Ident, LitStr, Token};

mod kw {
    syn::custom_keyword!(SELECT);
    syn::custom_keyword!(FROM);
}

fn name(input: ParseStream) -> syn::Result<Ident> {
    let ident: Ident = input.parse()?;
    let text = ident.to_string();
    let bytes = text.as_bytes();
    if !bytes[0].is_ascii_lowercase()
        || !bytes.iter().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || *b == b'_')
    {
        return Err(Error::new(ident.span(), "expected a lowercase ASCII name"));
    }
    Ok(ident)
}

struct Query(LitStr);

impl Parse for Query {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        input.parse::<kw::SELECT>()?;
        let projection = if input.peek(Token![*]) {
            input.parse::<Token![*]>()?;
            String::from("*")
        } else {
            let mut columns = Vec::new();
            loop {
                let ident = name(input)?;
                let column = ident.to_string();
                if columns.contains(&column) {
                    return Err(Error::new(ident.span(), "duplicate column"));
                }
                columns.push(column);
                if !input.peek(Token![,]) { break; }
                input.parse::<Token![,]>()?;
            }
            columns.join(", ")
        };

        input.parse::<kw::FROM>()?;
        let table = name(input)?;
        if !input.is_empty() {
            return Err(input.error("unexpected tokens after table name"));
        }
        let text = format!("SELECT {projection} FROM {table}");
        Ok(Query(LitStr::new(&text, table.span())))
    }
}

#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
    let Query(literal) = parse_macro_input!(input as Query);
    quote!(#literal).into()
}
```

`syn` legge i token in ordine; convertiamo in testo solo i singoli identificatori gia riconosciuti. L'errore `duplicate column` punta alla seconda occorrenza. `format!` gira durante la compilazione; `LitStr` e `quote!` emettono un **letterale Rust**, non un'espressione che ricostruisce la query a ogni chiamata.

### examples/query.rs

```rust
use query_note::sql;

const LIST: &str = sql!(SELECT id, name FROM users);

fn main() {
    assert_eq!(LIST, "SELECT id, name FROM users");
    assert_eq!(sql![SELECT * FROM logs], "SELECT * FROM logs");
    assert_eq!(sql! { SELECT id FROM not_in_schema }, "SELECT id FROM not_in_schema");
}
```

L'uso in `const` rende controllabile il tipo di risultato. Cambiare i delimitatori esterni non cambia i token ricevuti. Non sono verificati schema, permessi o dialetto del database: per eseguire query reali serve un client; per i valori dinamici usa i parametri del driver.

### examples/maps.rs

```rust
use std::collections::HashMap;

macro_rules! add {
    ($a:expr, $b:expr) => { $a + $b };
}

macro_rules! hashmap {
    () => { ::std::collections::HashMap::new() };
    ($($key:expr => $value:expr),+ $(,)?) => {{
        let mut map = ::std::collections::HashMap::new();
        $(let _ = map.insert($key, $value);)+
        map
    }};
}

fn main() {
    let empty: HashMap<&str, i32> = hashmap!();
    assert!(empty.is_empty());

    let mut calls = 0;
    let scores = hashmap! {
        "Ada" => { calls += 1; add!(2, 3) },
        "Ada" => { calls += 1; 8 },
    };
    assert_eq!(calls, 2);
    assert_eq!(scores.len(), 1);
    assert_eq!(scores["Ada"], 8);
}
```

Qui il compilatore genera le chiamate a `insert`, ma le espressioni per chiave e valore sono valutate **una volta per coppia**, in ordine, durante l'esecuzione del demo. Se una chiave e gia presente, il nuovo valore sostituisce il precedente; cio non annulla gli effetti della prima espressione. L'ordine di inserimento non garantisce l'ordine di iterazione della mappa. [HashMap::insert](https://doc.rust-lang.org/std/collections/struct.HashMap.html#method.insert).

Il braccio `()` accetta zero coppie; il secondo richiede almeno una coppia e solo allora consente la virgola finale. Con `*` al posto di `+` il matcher potrebbe accettare anche `hashmap!(,)`. Il percorso `::std` non dipende dagli import del chiamante; questa variante richiede la standard library.

### Esecuzione

Dalla radice del package, con Cargo e un linker disponibili. La prima build puo scaricare e compilare dipendenze: usa sorgenti affidabili.

```sh
cargo run --example query
```

```sh
cargo run --example maps
```

Entrambi i programmi terminano senza output se gli assert passano. Con cache popolata e `Cargo.lock` presente puoi controllare i tipi senza eseguirli:

```sh
cargo check --locked --offline --examples
```

## Varianti

Per generare un item, una DSL potrebbe emettere una definizione `const` anziche un letterale: il chiamante la metterebbe a livello di modulo, non a destra di un'assegnazione. Per capire perche una macro identita non valuta le espressioni e come separare macro e chiamante, vedi [[Programmazione/Rust/Pagine/Procedural macros|Procedural macros]].

## Errori comuni

- **`sql!(SELECT id, id FROM users)`:** errore di parsing sulla seconda `id`. Elimina il duplicato.
- **`sql!(SELECT * FROM users WHERE active)`:** i token dopo la tabella non appartengono alla grammatica. Non ignorarli silenziosamente.
- **`sql!("SELECT * FROM users")`:** una stringa e un solo token letterale, non una sequenza che inizia con il token `SELECT`. Il demo non contiene un parser di testo SQL.
- **`let n: u32 = sql!(SELECT * FROM users);`:** la macro ha accettato l'input; e il controllo dei tipi Rust a rifiutare `&str` come `u32`.
- **`let m = hashmap!();` senza altri usi:** mancano i tipi di chiave e valore. Annotali oppure fornisci un uso dal quale il compilatore possa inferirli.

## Checklist

- Posso ottenere lo stesso risultato con una funzione o con poche regole dichiarative?
- La grammatica specifica input vuoto, delimitatori, separatori e token finali?
- L'espansione e valida nella posizione di chiamata e con il tipo atteso?
- Ho provato sia input sintatticamente errati sia input validi con un uso di tipo sbagliato?
- Quali espressioni del chiamante vengono eseguite, quante volte e in quale fase?

## Collegamenti

- [[Programmazione/Rust/Pagine/Macro dichiarative|Macro dichiarative]]
- [[Programmazione/Rust/Pagine/Procedural macros|Procedural macros]]
- [[Programmazione/Rust/Pagine/Attribute macros|Attribute macros]]
- [[Programmazione/Rust/Pagine/Derive macros|Derive macros]]
- [[Programmazione/Rust/Pagine/Hygiene|Hygiene]]

## Fonti

- [Rust Reference: macro procedurali function-like](https://doc.rust-lang.org/reference/procedural-macros.html#function-like-procedural-macros).
- [Rust Reference: macro dichiarative e ripetizioni](https://doc.rust-lang.org/reference/macros-by-example.html#repetitions).
- [syn: parsing di una grammatica](https://docs.rs/syn/latest/syn/parse/index.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

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
  - Macro hygiene
  - Igiene macro
prerequisites:
  - "[[Programmazione/Rust/Pagine/Macro dichiarative]]"
  - "[[Programmazione/Rust/Pagine/Procedural macros]]"
related:
  - "[[Programmazione/Rust/Pagine/Function-like macros]]"
  - "[[Programmazione/Rust/Pagine/Attribute macros]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
title: Hygiene
---

# Hygiene

## Sintesi

Se il chiamante e la macro scrivono entrambi `temp`, stanno parlando della stessa variabile? **Non basta confrontare i nomi:** conta anche il contesto nel quale il compilatore risolve ciascun identificatore. Queste regole prendono il nome di *macro hygiene*.

Per capire un'espansione, distingui tre casi: un nome scritto dall'autore della macro, un nome ricevuto dal chiamante e il percorso di un item della libreria. Ciascuno richiede una scelta diversa.

## Quando usarlo

- Una macro introduce temporanee ma deve poter ricevere espressioni con variabili omonime.
- Una macro deve **creare intenzionalmente** un binding utilizzabile nelle istruzioni successive.
- Una macro esportata funziona nella libreria ma da un'altra crate non trova un tipo o usa l'helper sbagliato.
- Una proc macro compila, ma il valore ottenuto cambia quando il chiamante rinomina una variabile.

## Come funziona

### Una prova con tre nomi

Questo file si puo eseguire anche da solo. Nel progetto piu sotto corrisponde a `examples/locals.rs`.

```rust
fn main() {
    let temp = 10;
    macro_rules! inspect {
        ($arg:expr) => {{
            let before = temp;
            let temp = 1;
            (before, $arg, temp, tag())
        }};
    }
    {
        let temp = 40;
        fn tag() -> &'static str { "caller" }
        assert_eq!(inspect!(temp), (10, 40, 1, "caller"));
        assert_eq!(temp, 40);
    }

    macro_rules! bind {
        ($name:ident, $value:expr) => { let $name = $value; };
    }
    bind!(answer, 42);
    assert_eq!(answer, 42);
}
```

Leggi la tupla da sinistra a destra:

1. `before` vale **10**: il primo `temp` scritto nel template cerca una variabile locale visibile **alla definizione** di `inspect!`.
2. `$arg` vale **40**: e il `temp` passato dal chiamante. La nuova temporanea della macro, pur avendo lo stesso nome, non lo cattura.
3. L'ultimo `temp` vale **1**: dichiarazione e uso appartengono alla stessa espansione.
4. `tag()` restituisce **"caller"**: non e una variabile locale, ma un item senza percorso esplicito, risolto **all'invocazione**.

Per questo `macro_rules!` ha igiene *mixed-site*: variabili locali ed etichette di loop o blocco scritte nel template seguono il contesto di definizione; gli altri simboli seguono quello di invocazione. I token catturati conservano il proprio contesto. Due invocazioni distinte non condividono automaticamente una temporanea introdotta dalla prima. [Rust Reference: hygiene](https://doc.rust-lang.org/reference/macros-by-example.html#hygiene).

In `bind!`, invece, **il nome da dichiarare viene dal chiamante**. `answer` non deve esistere prima: appare in posizione di binding dopo `let`. Le graffe esterne del transcriber delimitano il template, non generano un blocco. Con `=> {{ let $name = $value; }}` ci sarebbe un blocco aggiuntivo: il binding terminerebbe prima dell'assert. Questo sarebbe un problema di **scope**, non di hygiene.

## API / Sintassi

- **`$crate::Value`** in una macro dichiarativa: usa `Value` della crate che definisce la macro, anche se il chiamante ha rinominato la dipendenza. Scrivere `crate::Value` nell'espansione cercherebbe invece nel chiamante. `$crate` non aggira la privacy: anche il percorso fino all'item deve essere accessibile.
- **`::core::result::Result::Err`**: usa la variante standard anche se il chiamante ha un simbolo `Err`. Analogamente `::std::vec::Vec` evita di dipendere da un import locale, ma richiede `std`.
- **`Span::call_site()` e `Span::mixed_site()`**: nella proc macro uno *span* porta informazioni sulla posizione e sulla risoluzione dei nomi. Cambiare lo span di un identificatore puo cambiare il binding scelto anche se il testo prodotto sembra identico.

## Esempio pratico

Il progetto ha un'applicazione e due dipendenze locali: `rules/` esporta macro dichiarative e `spans/` una coppia di proc macro. L'applicazione rinomina davvero la prima dipendenza nel manifest. Oltre ai file sotto, usa l'esempio `examples/locals.rs` riportato sopra. Baseline: **Rust 1.99.1, edition 2024**.

### Cargo.toml

```toml
[package]
name = "hygiene-demo"
version = "0.1.0"
edition = "2024"

[dependencies]
kit = { package = "hygiene-rules", path = "rules" }
hygiene-spans = { path = "spans" }
```

### rules/Cargo.toml

```toml
[package]
name = "hygiene-rules"
version = "0.1.0"
edition = "2024"
```

### rules/src/lib.rs

```rust
pub struct Value(pub u8);

#[macro_export]
macro_rules! make_value {
    ($n:expr) => { $crate::Value($n) };
}

#[macro_export]
macro_rules! bail_if {
    ($condition:expr, $message:expr) => {
        if $condition {
            return ::core::result::Result::Err(
                ::core::convert::Into::into($message)
            );
        }
    };
}
```

La qualificazione protegge i **nomi**, non il flusso di controllo: il `return` di `bail_if!` esce dalla funzione o closure in cui la macro e invocata. La condizione viene valutata una volta; il messaggio solo se serve. Il tipo di ritorno deve comunque accettare l'errore convertito.

### spans/Cargo.toml

```toml
[package]
name = "hygiene-spans"
version = "0.1.0"
edition = "2024"

[lib]
proc-macro = true

[dependencies]
proc-macro2 = "=1.0.107"
quote = "=1.0.47"
syn = "=3.0.10"
```

### spans/src/lib.rs

```rust
use proc_macro::TokenStream;
use proc_macro2::{Ident, Span};
use quote::quote;
use syn::parse_macro_input;

fn expand(input: TokenStream, span: Span) -> TokenStream {
    let caller = parse_macro_input!(input as Ident);
    let local = Ident::new("temp", span);
    quote!({
        let #local = 1_u8;
        (#caller, #local)
    }).into()
}

#[proc_macro]
pub fn pair_call(input: TokenStream) -> TokenStream {
    expand(input, Span::call_site())
}

#[proc_macro]
pub fn pair_mixed(input: TokenStream) -> TokenStream {
    expand(input, Span::mixed_site())
}
```

Entrambe le macro accettano un solo identificatore. `#caller` reimpiega il token dell'utente con il suo span; `#local` introduce un identificatore nuovo, riusato sia nel `let` sia nella tupla. Il codice scritto direttamente dentro `quote!` usa normalmente lo span del sito di chiamata; interpolare un identificatore non equivale a ricrearlo dal suo nome. [quote: hygiene](https://docs.rs/quote/latest/quote/macro.quote.html#hygiene).

### src/main.rs

```rust
use hygiene_spans::{pair_call, pair_mixed};

struct Value; // Omonimo nel chiamante, diverso da kit::Value.

fn check(port: u16) -> Result<u16, String> {
    #[allow(non_snake_case)]
    fn Err(_: String) -> Result<u16, String> { Ok(99) }
    kit::bail_if!(port == 0, "zero");
    Err(String::new())
}

fn main() {
    let _local_type = Value;
    let value: kit::Value = kit::make_value!(7);
    assert_eq!(value.0, 7);
    assert_eq!(check(0), Err(String::from("zero")));
    assert_eq!(check(1), Ok(99));

    let temp = 40_u8;
    assert_eq!(pair_call!(temp), (1, 1));
    assert_eq!(pair_mixed!(temp), (40, 1));
    assert_eq!(temp, 40);
}
```

**Perche la prima tupla e `(1, 1)`?** Il binding generato con `call_site` puo catturare il nome `temp` passato dall'utente: la prima componente finisce per leggere la temporanea. Con `mixed_site` la temporanea resta utilizzabile dalla macro, ma il `temp` interpolato continua a leggere **40**. Nessuna delle due cambia il valore esterno: il blocco dell'espansione limita la durata della temporanea. `pair_call!` e il controesempio intenzionale, non la soluzione consigliata.

### Esecuzione

Dalla radice del progetto con Cargo e linker disponibili. La prima build puo scaricare dipendenze ed esegue codice proc-macro durante la compilazione: usa sorgenti affidabili.

```sh
cargo run --example locals
```

```sh
cargo run
```

Entrambi i programmi terminano senza output se gli assert passano. Con cache popolata e lockfile gia creato:

```sh
cargo check --locked --offline --all-targets
```

## Varianti

Uno span mixed-site **non** rende ogni item generato privato o univoco: due definizioni di una funzione con lo stesso nome nello stesso modulo possono ancora confliggere. Un prefisso insolito riduce la probabilita di collisione, non la elimina.

Per un derive o un attributo che emette `impl` di un trait esterno, una temporanea isolata non risolve il nome della crate runtime. Decidi come il chiamante puo indicare il percorso quando rinomina la dipendenza, come in [[Programmazione/Rust/Pagine/Derive macros|Derive macros]]. `$crate` di `macro_rules!` non e una scorciatoia da scrivere dentro `quote!`.

## Errori comuni

- **Nome locale non trovato:** controlla chi ha fornito il token del binding e chi ha fornito il token che lo legge. Aggiungere un import non collega due locali di espansioni diverse.
- **Compila ma legge il valore sbagliato:** testa un chiamante che usa lo stesso nome della temporanea; stampare solo il testo dell'espansione non mostra il contesto igienico degli identificatori.
- **Funziona solo nella crate della macro:** prova una crate consumatrice, rinomina la dipendenza e verifica la visibilita dell'helper. `#[doc(hidden)]` non cambia la privacy.
- **Percorso giusto, API sbagliata:** qualificare `Err` e `Into` non fa diventare una funzione arbitraria compatibile con `Result`, ne rende innocuo un ritorno anticipato.

## Checklist

- Il nome deve restare interno oppure dev'essere scelto e riusato dal chiamante?
- Ho distinto il contesto del token dallo scope lessicale introdotto dalle graffe?
- Il test copre nomi omonimi e una dipendenza realmente rinominata?
- Gli helper raggiunti dall'espansione sono accessibili senza dipendere dagli import del chiamante?

## Collegamenti

- [[Programmazione/Rust/Pagine/Macro dichiarative|Macro dichiarative]]
- [[Programmazione/Rust/Pagine/Procedural macros|Procedural macros]]
- [[Programmazione/Rust/Pagine/Function-like macros|Function-like macros]]
- [[Programmazione/Rust/Pagine/Attribute macros|Attribute macros]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]

## Fonti

- [Rust Reference: risoluzione dei nomi e $crate](https://doc.rust-lang.org/reference/macros-by-example.html#hygiene).
- [Rust Reference: hygiene nelle proc macro](https://doc.rust-lang.org/reference/procedural-macros.html#procedural-macro-hygiene).
- [proc-macro2: Span](https://docs.rs/proc-macro2/latest/proc_macro2/struct.Span.html), [quote: interpolazione e span](https://docs.rs/quote/latest/quote/macro.quote.html#hygiene).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

---
date: 2026-05-26
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - macros
aliases:
  - macro_rules!
  - Declarative macros
prerequisites:
  - "[[Programmazione/Rust/Pagine/Sintassi di base]]"
  - "[[Programmazione/Rust/Pagine/Pattern Matching]]"
related:
  - "[[Programmazione/Rust/Pagine/Hygiene]]"
  - "[[Programmazione/Rust/Pagine/Procedural macros]]"
  - "[[Programmazione/Rust/Pagine/Function-like macros]]"
  - "[[Programmazione/Rust/Pagine/rustfmt]]"
title: Macro dichiarative
---

# Macro dichiarative

## Sintesi

Le macro dichiarative (`macro_rules!`) trasformano token in codice durante la compilazione. Un **matcher** descrive la sintassi accettata, un **transcriber** produce l'espansione. Non sono funzioni variadiche e non scelgono il comportamento in base ai tipi inferiti degli argomenti.

Espansione a compile time non significa esecuzione a compile time: una chiamata di funzione inserita dalla macro normalmente viene eseguita quando si esegue il codice generato. [Rust Book: macro e funzioni](https://doc.rust-lang.org/book/ch20-05-macros.html).

Esempi verificati con **Rust 1.99.1, edition 2024**, salvo confronti espliciti: cinque programmi validi e tre controesempi intenzionali. Sola standard library; la baseline non e una MSRV.

## Quando usarlo

- Sintassi con numero variabile di argomenti o piccole DSL.
- Generazione ripetitiva di item, come funzioni o implementazioni di trait.
- Un costrutto sintattico che deve espandersi nel contesto del chiamante.

Per normali calcoli o validazione, preferisci funzioni, trait e generics. Una funzione che restituisce Result, usata con `?`, e spesso piu chiara di una macro con un return nascosto. Le procedural macros hanno invece un modello diverso, trattato nella nota dedicata.

## Come funziona

### Token, non valori runtime

I bracci vengono provati in ordine; vince il primo matcher compatibile, senza riprovare i successivi se il codice prodotto e errato. Una macro puo produrre espressioni, istruzioni, item, tipi o pattern, secondo il punto di invocazione. [Rust Reference](https://doc.rust-lang.org/reference/macros-by-example.html#transcribing).

Il pattern `$value:expr` cattura un'espressione sintattica; non dice se il risultato sara un numero o una String. L'espansione resta soggetta a risoluzione dei nomi, type checking e borrow checking.

### Prima macro e valutazione singola

```rust
macro_rules! say_hello {
    () => { println!("hello"); };
}

macro_rules! log_value {
    ($value:expr) => {{
        let value = $value;
        println!("{value:?}");
        value
    }};
}

fn main() {
    say_hello!();

    let mut calls = 0;
    let result = log_value!({ calls += 1; 7 });
    assert_eq!(result, 7);
    assert_eq!(calls, 1);
}
```

Stampa hello e poi 7. Le parentesi esterne del transcriber delimitano il template; quelle interne in `{{ ... }}` generano un blocco-espressione. L'ultimo `value`, senza punto e virgola, e il risultato.

Questo log valuta l'argomento una volta, lo sposta nella variabile locale, richiede Debug per stamparlo e restituisce il valore. Non promette che tutti i log funzionino cosi: conta il codice generato. Ripetere `$value` in due posizioni eseguite puo ripetere effetti o tentare due move; catturarlo non lo valuta automaticamente. [Designators](https://doc.rust-lang.org/rust-by-example/macros/designators.html).

## API / Sintassi

### Fragment specifier

| Frammento | Uso |
| --- | --- |
| `expr`, `expr_2021` | Espressioni; differenze di edition sotto. |
| `ident`, `lifetime` | Identificatori o lifetime. |
| `ty`, `path` | Tipo o percorso di tipo. |
| `pat`, `pat_param` | Pattern, con regole diverse sugli or-pattern. |
| `item`, `stmt`, `block` | Item, istruzione o blocco. |
| `literal`, `meta`, `vis` | Letterale, contenuto di attributo, visibilita. |
| `tt` | Un token tree: token singolo o gruppo delimitato. |

`$name:ident` compare nel matcher, `$name` nel transcriber. `vis` puo essere vuoto; `tt` non indica una sequenza arbitraria: per una sequenza serve una ripetizione. Non usare tt come scorciatoia se conosci la sintassi richiesta. [Designators](https://doc.rust-lang.org/rust-by-example/macros/designators.html).

### Ripetizioni e separatori

- `$(...),*`: zero o piu occorrenze, separate da virgole.
- `$(...),+`: una o piu occorrenze.
- `$(...)?`: zero o una occorrenza, senza separatore associato.
- `$(,)?`: una virgola finale facoltativa, non una ripetizione di argomenti.

Le ripetizioni nell'output devono rispettare struttura e cardinalita delle catture; due liste espanse insieme devono avere la stessa lunghezza. Una ripetizione nell'output necessita di una metavariabile che ne determini il numero di espansioni. [Repeat](https://doc.rust-lang.org/rust-by-example/macros/repeat.html), [regole delle ripetizioni](https://doc.rust-lang.org/reference/macros-by-example.html#repetitions).

## Esempio pratico

Ogni blocco e autonomo. I tre blocchi sotto Errori comuni sono intenzionalmente invalidi.

### Una lista con zero, uno o piu elementi

```rust
macro_rules! vec_like {
    () => { ::std::vec::Vec::new() };
    ($($item:expr),+ $(,)?) => {{
        let mut values = ::std::vec::Vec::new();
        $(values.push($item);)+
        values
    }};
}

fn main() {
    let empty: Vec<u8> = vec_like![];
    assert!(empty.is_empty());
    assert_eq!(vec_like![4], [4]);
    assert_eq!(vec_like![4, 5,], [4, 5]);

    let mut calls = 0;
    let values = vec_like![
        { calls += 1; calls },
        { calls += 1; calls },
    ];
    assert_eq!(values, [1, 2]);
    assert_eq!(calls, 2);

    let values = String::from("caller");
    let owned = vec_like![values];
    assert_eq!(owned[0], "caller");
}
```

I due bracci separano la lista vuota da quella non vuota: `vec_like![,]` e rifiutato. Il comune matcher unico `($($item:expr),* $(,)?)` accetterebbe anche quella virgola isolata.

Ogni elemento viene valutato una volta, in ordine, dai push generati. Non viene clonato automaticamente e tutti gli elementi devono essere compatibili con lo stesso tipo T. La variabile interna values non cattura quella fornita dal chiamante.

E un esempio didattico, non un sostituto di `vec!`: manca la forma `[value; count]` e non prealloca in base al numero di elementi. Usa la macro standard nel codice applicativo. [Rust Book: esempio semplificato di vec](https://doc.rust-lang.org/book/ch20-05-macros.html#declarative-macros-for-general-metaprogramming).

### Una guardia con uscita anticipata

```rust
macro_rules! ensure {
    ($condition:expr, $message:expr $(,)?) => {{
        if !($condition) {
            return ::core::result::Result::Err(
                ::core::convert::Into::into($message),
            );
        }
    }};
}

fn validate_port(port: u16) -> Result<u16, String> {
    ensure!(port != 0, "port must be nonzero");
    Ok(port)
}

fn main() {
    assert_eq!(validate_port(8080), Ok(8080));
    assert_eq!(validate_port(65535), Ok(65535));
    assert_eq!(
        validate_port(0),
        Err(String::from("port must be nonzero")),
    );
}
```

`validate_port` non fa parsing: riceve gia un u16 e applica soltanto la policy locale "diverso da zero". Non verifica disponibilita della porta o permessi; la porta 0 puo essere utile in altre API per chiedere una porta effimera.

La condizione viene valutata una volta; il messaggio e la conversione Into soltanto nel ramo falso. Il chiamante deve restituire un Result con errore compatibile. Un return generato esce dalla funzione, closure o blocco async che lo contiene: un normale blocco `{{ ... }}` non crea una funzione.

Una macro non offre rollback: gli effetti gia avvenuti prima dell'errore restano. Questa proprieta discende dall'espansione, non da una gestione speciale degli errori.

## Varianti

### Edition del punto di definizione

```rust
macro_rules! classify {
    ($value:expr) => { "expr" };
    (const $value:expr) => { "const arm" };
}

macro_rules! classify_legacy {
    ($value:expr_2021) => { "expr_2021" };
    (const $value:expr) => { "const arm" };
    (_) => { "underscore" };
}

fn main() {
    assert_eq!(classify!(const { 2 + 3 }), "expr");
    assert_eq!(classify!(_), "expr");
    assert_eq!(classify_legacy!(const { 2 + 3 }), "const arm");
    assert_eq!(classify_legacy!(_), "underscore");
}
```

Programma edition 2024. Qui `expr` accetta anche const block e `_` al livello esterno; `expr_2021` conserva il comportamento precedente. In edition 2021 la prima invocazione seleziona il braccio const e `classify!(_)` e rifiutata. Conta l'edition della **definizione** della macro, non quella della crate che la invoca. Il demo scarta i frammenti: riconoscere `_` non significa che lo si possa usare come valore in ogni contesto. [Edition Guide 2024](https://doc.rust-lang.org/edition-guide/rust-2024/macro-fragment-specifiers.html).

Da edition 2021, `pat` include gli or-pattern al livello esterno; `pat_param` li esclude a quel livello. Per un matcher con alternative separate esplicitamente, usa per esempio `$($pattern:pat_param)|+`. Un `pat` non puo essere seguito direttamente da `|` nelle edition 2021/2024. [Edition Guide 2021](https://doc.rust-lang.org/edition-guide/rust-2021/or-patterns-macro-rules.html).

### Scope ed esportazione

```rust
pub mod support {
    #[doc(hidden)]
    pub fn label(port: u16) -> String {
        format!("port:{port}")
    }

    #[macro_export]
    macro_rules! port_label {
        ($port:expr) => { $crate::support::label($port) };
    }
}

fn main() {
    assert_eq!(crate::port_label!(8080), "port:8080");
}
```

`macro_export` esporta la macro alla radice della crate, non sotto support. `$crate` identifica la crate di definizione anche se importata con un altro nome. Non aggira la privacy: gli helper richiamati dall'espansione devono essere accessibili al chiamante esterno. `doc(hidden)` nasconde dalla documentazione, non dall'API pubblica.

Le macro locali usate senza percorso hanno scope testuale: la definizione deve precedere l'uso. Le macro hanno hygiene mixed-site, non isolamento universale dei nomi: qualifica i percorsi degli item e passa esplicitamente gli identificatori che vuoi introdurre nel chiamante. [Scope e hygiene](https://doc.rust-lang.org/reference/macros-by-example.html#scoping-exporting-and-importing).

Ricorsione e helper sono possibili, ma aumentano complessita e tempi di espansione. Preferisci una ripetizione semplice quando basta; non alzare il recursion_limit per nascondere una macro ricorsiva senza caso base.

## Errori comuni

### Ambiguita locale del matcher

Controesempio intenzionale: diagnostica local ambiguity.

```rust
macro_rules! last_name {
    ($($head:ident)* $tail:ident) => { stringify!($tail) };
}

fn main() {
    let _ = last_name!(entry);
}
```

Il token entry potrebbe appartenere alla ripetizione o alla cattura finale. Introduci un delimitatore: per esempio `($($head:ident),* ; $tail:ident)` e invocazione `last_name!(; entry)`.

### Separatore non ammesso dopo expr

Controesempio intenzionale: definizione rifiutata per il follow-set.

```rust
macro_rules! indexed {
    ($value:expr [$index:expr]) => { ($value)[$index] };
}

fn main() {}
```

Usa `($value:expr, $index:expr)`: la virgola elimina il seguito non ammesso dopo expr.

### Frammento inoltrato come se fosse testo

Controesempio intenzionale: il matcher interno non accetta il frammento.

```rust
macro_rules! only_seven {
    (7) => { "seven" };
}

macro_rules! forward {
    ($value:expr) => { only_seven!($value) };
}

fn main() {
    let _ = forward!(7);
}
```

Un expr inoltrato e opaco. Se serve riconoscere proprio il token 7, cattura `tt`; se serve valutare un'espressione, fai accettare expr alla macro interna e gestisci il valore nel codice generato. [Forwarding e restrizioni](https://doc.rust-lang.org/reference/macros-by-example.html#forwarding-a-matched-fragment).

Altri errori da evitare:

- Mettere un braccio generico prima di uno specifico e aspettarsi un overload sui tipi.
- Duplicare espressioni con effetti, move, return o `?` senza un contratto esplicito.
- Confondere i token accettati con codice semanticamente valido dopo l'espansione.
- Usare nomi non qualificati in macro esportate e provarle solo nella crate di origine.
- Inserire un fallback troppo ampio prima dei bracci validi.

Un ultimo braccio con `compile_error!` puo descrivere un input non supportato; non risolve un'ambiguita interna al matcher precedente. [compile_error](https://doc.rust-lang.org/std/macro.compile_error.html).

## Checklist

- Una funzione, un trait o Result con `?` sarebbero sufficienti?
- Sono chiari input, tipo prodotto, move/borrow ed eventuali uscite anticipate?
- Ho contato quante volte vengono valutate le espressioni?
- Ho testato zero, uno, molti argomenti, virgola finale e input invalidi?
- Ho verificato ordine dei bracci, ripetizioni e delimitatori?
- Ho verificato l'edition della definizione e gli eventuali cambiamenti dei matcher?
- Ho testato la macro esportata da una crate separata, anche con nome rinominato?

## Collegamenti

- [[Programmazione/Rust/Pagine/Hygiene|Hygiene]]
- [[Programmazione/Rust/Pagine/Procedural macros|Procedural macros]]
- [[Programmazione/Rust/Pagine/Function-like macros|Function-like macros]]
- [[Programmazione/Rust/Pagine/rustfmt|rustfmt]]
- [[Programmazione/Rust/Pagine/Zero-cost abstractions|Zero-cost abstractions]]
- [[Programmazione/Rust/Pagine/Edition migration|Edition migration]]
- [[Programmazione/Rust/Pagine/Result|Result]]

## Fonti

- [Rust Reference: macros by example](https://doc.rust-lang.org/reference/macros-by-example.html).
- [Rust Book: Macros](https://doc.rust-lang.org/book/ch20-05-macros.html).
- [Rust By Example: designators](https://doc.rust-lang.org/rust-by-example/macros/designators.html), [overload](https://doc.rust-lang.org/rust-by-example/macros/overload.html), [repeat](https://doc.rust-lang.org/rust-by-example/macros/repeat.html).
- [Edition Guide: fragment specifiers 2024](https://doc.rust-lang.org/edition-guide/rust-2024/macro-fragment-specifiers.html), [or-patterns 2021](https://doc.rust-lang.org/edition-guide/rust-2021/or-patterns-macro-rules.html).
- [compile_error](https://doc.rust-lang.org/std/macro.compile_error.html).

La documentazione online puo avanzare; gli esempi sono verificati sulla baseline dichiarata, non su ogni versione o target.

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

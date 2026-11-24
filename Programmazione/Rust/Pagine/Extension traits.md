---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - api-design-idiomatico
aliases:
  - Extension traits
  - Trait di estensione
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits|Traits]]"
  - "[[Programmazione/Rust/Pagine/Blanket implementations|Blanket implementations]]"
  - "[[Programmazione/Rust/Pagine/Public API design|Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/Object safety|Object safety]]"
  - "[[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]"
  - "[[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]"
title: Extension traits
---

# Extension traits

## Sintesi

Un **extension trait** è un trait della tua crate che permette di scrivere, per esempio, `text.is_blank()` senza modificare `str`. Il tipo rimane quello originale; è il trait a fornire il metodo. In un modulo client che lavora con un tipo concreto, di norma devi portare il trait in scope con `use`. Importarlo non cambia i dati e non installa il metodo globalmente.

Usalo quando l'operazione si legge bene sul valore o conclude una catena di chiamate. Se compare una sola volta, `iter.filter(predicate).count()` è già chiaro. Se vuoi invece un tipo con identità o vincoli propri, valuta un [[Programmazione/Rust/Pagine/Newtype pattern|newtype]]: aggiungere un metodo a tutte le stringhe non le rende nomi utente validati.

## Tre decisioni prima di scrivere il trait

| Domanda | Scelta nell'esempio | Effetto sul chiamante |
| --- | --- | --- |
| A quali tipi serve il metodo? | `StringExt` per `T: AsRef<str> + ?Sized` | Funziona anche direttamente su `str`, non solo su `String`; non occorre allocare una nuova stringa |
| Chi possiede il valore dopo la chiamata? | `is_blank(&self)` prende in prestito; `count_where(self, ...)` prende per valore | Il testo resta disponibile. Il conteggio consuma l'iteratore ricevuto, non necessariamente la collezione |
| Che cosa riceve il predicato? | `FnMut(&Self::Item) -> bool`, come in `filter` | Con `Item = i32` osserva un `&i32`; con `Item = &i32` osserva un `&&i32` |

## Esempio: testo e iteratori

Crea una libreria in una directory libera. I tre trait della nota usano soltanto la libreria standard.

```sh
cargo new --lib --edition 2024 note_ext
```

Entra in `note_ext`. Sostituisci `src/lib.rs` con questo codice; il modulo `report` è definito nel blocco successivo.

```rust
mod report;
pub use report::{AppError, ResultExt};

pub trait StringExt {
    fn is_blank(&self) -> bool;
}

impl<T: AsRef<str> + ?Sized> StringExt for T {
    fn is_blank(&self) -> bool {
        self.as_ref().trim().is_empty()
    }
}

pub trait IteratorExt: Iterator {
    fn count_where<P>(self, predicate: P) -> usize
    where
        Self: Sized,
        P: FnMut(&Self::Item) -> bool,
    {
        self.filter(predicate).count()
    }
}

impl<I: Iterator> IteratorExt for I {}
```

`filter` deve poter restituire l'elemento originale se supera il controllo: per questo presta l'elemento al predicato. `count()` percorre poi l'iteratore filtrato; non costruisce un vettore intermedio. Non usare questo conteggio su una sequenza infinita senza limitarla. Se vuoi davvero un predicato che *riceve la proprietà* dell'elemento, è un'altra API: per esempio, puoi contare con `fold` e passare ogni elemento per valore, invece di inoltrare quel predicato a `filter`.

`Self: Sized` si applica al solo metodo che riceve `self` per valore. Non va confuso con `?Sized` sull'implementazione di `StringExt`: lì si rimuove il vincolo implicito di dimensione nota perché si lavora tramite un riferimento. La nota sulle [[Programmazione/Rust/Pagine/Blanket implementations|blanket implementation]] approfondisce questo secondo caso.

### Aggiungere contesto a un Result

Crea `src/report.rs`. A differenza dei due metodi precedenti, qui cambia il **tipo restituito**: un successo conserva il valore `T`; un fallimento diventa `AppError`, che dà un nome all'operazione e conserva la causa originale.

```rust
use std::{error::Error, fmt};

#[derive(Debug)]
pub struct AppError {
    message: &'static str,
    cause: Box<dyn Error + Send + Sync>,
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.message)
    }
}

impl Error for AppError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        Some(self.cause.as_ref())
    }
}

pub trait ResultExt<T> {
    fn map_message(self, message: &'static str) -> Result<T, AppError>;
}

impl<T, E: Error + Send + Sync + 'static> ResultExt<T> for Result<T, E> {
    fn map_message(self, message: &'static str) -> Result<T, AppError> {
        self.map_err(|cause| AppError { message, cause: Box::new(cause) })
    }
}
```

`E` serve nell'implementazione, non nella firma del trait esposta al chiamante. I vincoli su `E` corrispondono al tipo di causa che si vuole conservare; un `Result<T, String>` non riceve questa estensione perché `String` non implementa `Error`. Il contesto è una stringa statica per scelta di questa API. Per errori sui quali il programma deve prendere decisioni, vedi [[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]].

### Provare i metodi da una crate client

Crea la cartella `tests` e il file `tests/extensions.rs`. Gli import indicano da dove provengono i metodi; il client non usa moduli privati.

```rust
use note_ext::{IteratorExt, ResultExt, StringExt};
use std::{error::Error, num::ParseIntError};

#[test]
fn text_is_borrowed() {
    let name = String::from(" Ada ");
    assert!(!name.is_blank());
    assert_eq!(name, " Ada ");
    assert!(<str as StringExt>::is_blank(" \t\n"));
}

#[test]
fn count_owned_and_borrowed_items() {
    let values = [1, 2, 3, 4];
    let mut visits = 0;
    let even = values.iter().count_where(|n: &&i32| {
        visits += 1;
        **n % 2 == 0
    });
    assert_eq!((even, visits), (2, 4));

    let mut iter = values.into_iter();
    let first_two = iter.by_ref().take(2).count_where(|n: &i32| *n % 2 == 0);
    assert_eq!(first_two, 1);
    assert_eq!(iter.next(), Some(3));
}

#[test]
fn context_preserves_the_value_or_cause() {
    assert_eq!("42".parse::<u32>().map_message("reading limit").unwrap(), 42);
    let err = "many".parse::<u32>().map_message("reading limit").unwrap_err();
    assert_eq!(err.to_string(), "reading limit");
    assert!(err.source().unwrap().is::<ParseIntError>());
}
```

Esegui dalla cartella con `Cargo.toml`:

```sh
cargo test --test extensions
```

I tre test devono passare. `FnMut` consente di aggiornare `visits`. Nel secondo conteggio `by_ref()` presta l'iteratore a `take(2)`: viene consumato l'adattatore e l'originale riparte dal terzo elemento. Chiamare direttamente `iter.count_where(...)` su un iteratore non `Copy` lo sposterebbe; non potresti poi chiamare `iter.next()`.

## Import, collisioni e compatibilità

- **Metodo non trovato.** Se un modulo vede un `String` ma non `StringExt`, importa `use note_ext::StringExt;` nello stesso modulo che effettua la chiamata. In alternativa, `<str as note_ext::StringExt>::is_blank(" ")` indica esplicitamente il trait senza alcun `use`. Un `prelude` può re-esportare i trait, ma deve comunque essere importato dal client.
- **Due trait offrono lo stesso metodo.** Se entrambi sono candidati per lo stesso ricevitore, la sintassi con il punto può diventare ambigua. Scegli il trait desiderato esplicitamente: `StringExt::is_blank(&name)`. Rinominare l'import con `as` non rinomina il metodo. Preferisci nomi specifici, soprattutto in un prelude pubblico.
- **Perché un trait locale?** Non puoi aggiungere un metodo intrinseco a `String` con `impl String` nella tua crate. Definire un trait locale ti permette invece di implementarlo per tipi esterni. Non rende legali implementazioni sovrapposte: dopo l'implementazione generale per `AsRef<str>` non puoi aggiungerne una diversa di `StringExt` per `String`.
- **Quanto estendere?** Una blanket implementation copre già tutti i tipi che soddisfano il bound. Se vuoi vietare esplicitamente altre implementazioni esterne, considera un trait sigillato; se serve solo nella tua crate, basta tenerlo privato. Aggiungere un metodo obbligatorio rompe le implementazioni esterne che non lo forniscono; anche un nuovo metodo con implementazione predefinita può creare collisioni nei client.

## Fonti

- [Libreria standard: Iterator::filter e tipo del predicato](https://doc.rust-lang.org/std/iter/trait.Iterator.html#method.filter)
- [Libreria standard: Iterator::by_ref](https://doc.rust-lang.org/std/iter/trait.Iterator.html#method.by_ref)
- [Rust Reference: risoluzione delle chiamate ai metodi](https://doc.rust-lang.org/reference/expressions/method-call-expr.html)
- [Rust Reference: coerenza e orphan rules](https://doc.rust-lang.org/reference/items/implementations.html#trait-implementation-coherence)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Blanket implementations|Blanket implementations]]
- [[Programmazione/Rust/Pagine/Trait bounds|Trait bounds]]
- [[Programmazione/Rust/Pagine/Object safety|Object safety]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]

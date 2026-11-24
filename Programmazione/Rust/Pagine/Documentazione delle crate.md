---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - api-design-idiomatico
aliases:
  - Documentazione delle crate
  - Crate documentation
prerequisites:
  - "[[Programmazione/Rust/Pagine/rustdoc|rustdoc]]"
  - "[[Programmazione/Rust/Pagine/Doc test|Doc test]]"
  - "[[Programmazione/Rust/Pagine/Public API design|Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]"
  - "[[Programmazione/Rust/Pagine/Feature flags ben progettate|Feature flags ben progettate]]"
  - "[[Programmazione/Rust/Pagine/Packaging e release|Packaging e release]]"
title: Documentazione delle crate
---

# Documentazione delle crate

## Sintesi

La documentazione di una crate dovrebbe permettere a chi non ha letto il sorgente di compiere tre passi: **capire se la libreria serve al suo caso, ottenere un primo risultato e sapere cosa fare quando l'input non è valido**. Il README aiuta a scegliere; la pagina iniziale di rustdoc orienta tra le API; la pagina di una funzione ne definisce il contratto.

Un buon test editoriale è chiedersi: dopo aver letto «normalizza il testo», saprei dire cosa succede agli spazi *interni*, alle lettere accentate o a una stringa vuota? Se non saprei prevedere il risultato, l'esempio felice da solo non basta.

## Dove mettere ogni informazione

| Domanda del lettore | Dove rispondere | Che cosa evitare |
| --- | --- | --- |
| «Mi serve? Come inizio?» | README: scopo, installazione, esempio minimo e limiti | Presentare una crate dimostrativa come se fosse pubblicata |
| «Da dove parto nell'API?» | Documentazione alla radice di `lib.rs`: percorso di lettura, link agli elementi, feature | Copiare un secondo quick start che può diventare obsoleto |
| «Che cosa mi promette questa funzione?» | Commenti `///` sull'elemento: input, risultato, casi limite ed errori | Descrivere soltanto i passaggi interni dell'algoritmo |
| «Come integro o aggiorno la libreria?» | `examples/` per un flusso completo; changelog per versioni, migrazioni e cambiamenti incompatibili | Nascondere un nuovo requisito soltanto nel changelog o in un test |

## Esempio: una guida che viene anche eseguita

In una directory libera crea il package di esempio. Non richiede dipendenze esterne.

```sh
cargo new --lib --edition 2024 text-labels
```

Entra in `text-labels`. Il nome del package contiene un trattino, ma nel codice Rust il nome della libreria è `text_labels`.

### 1. README e manifest: il primo utilizzo

Crea `README.md` nella radice del package con questo contenuto:

~~~markdown
# text-labels

Prepara etichette per la visualizzazione: elimina gli spazi bianchi ai bordi
e converte il testo in minuscolo. Non unisce gli spazi interni e non esegue
la normalizzazione Unicode NFC. Non usarlo per decidere se due identità coincidono.

Per provarlo da un package nella directory accanto, aggiungi
`text-labels = { path = "../text-labels" }` nella sua sezione `[dependencies]`.

## Primo utilizzo

```rust
use text_labels::normalize;

assert_eq!(normalize("  CAFFÈ  Latte  ").as_deref(), Ok("caffè  latte"));
```

La feature facoltativa `batch` aggiunge `normalize_all` per più etichette.
Non è attiva per default.
~~~

In `Cargo.toml`, aggiungi `readme = "README.md"` alla sezione `[package]` esistente e aggiungi questa sezione a livello principale:

```toml
[features]
default = []
batch = []
```

`package.readme` indica a Cargo quale file presentare con il package; **non** fa eseguire il suo esempio. Il passo seguente include lo stesso Markdown nella documentazione di crate: da quel momento il blocco Rust partecipa anche ai doc test. Nel testo condiviso usa nomi che si capiscono anche su GitHub; riserva i link specifici di rustdoc alla parte Rust.

### 2. lib.rs: il contratto dell'API

Sostituisci `src/lib.rs` con questo file completo:

~~~rust
#![doc = include_str!("../README.md")]
//!
//! Per una singola etichetta usa [`normalize`]. Il caso vuoto restituisce [`EmptyLabel`].
#![cfg_attr(feature = "batch", doc = "Per una lista usa [`normalize_all`].")]

use std::fmt;

/// L'input non contiene testo dopo la rimozione degli spazi bianchi ai bordi.
#[derive(Debug, PartialEq, Eq)]
pub struct EmptyLabel;

impl fmt::Display for EmptyLabel {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("empty label")
    }
}

impl std::error::Error for EmptyLabel {}

/// Restituisce una nuova stringa in minuscolo, preservando gli spazi interni.
///
/// # Errors
///
/// Restituisce [`EmptyLabel`] se dopo `trim()` non rimane testo.
///
/// # Examples
///
/// ```rust
/// use text_labels::{normalize, EmptyLabel};
/// assert_eq!(normalize("  \t\n"), Err(EmptyLabel));
/// ```
pub fn normalize(input: &str) -> Result<String, EmptyLabel> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        Err(EmptyLabel)
    } else {
        Ok(trimmed.to_lowercase())
    }
}

/// Normalizza in ordine le etichette. Richiede la feature `batch`.
///
/// Una lista vuota produce un vettore vuoto.
///
/// # Errors
///
/// Al primo [`EmptyLabel`] restituisce l'errore, non un risultato parziale.
///
/// # Examples
///
/// ```rust
/// use text_labels::{normalize_all, EmptyLabel};
/// assert_eq!(normalize_all(&[" A ", "B"]).unwrap(), ["a", "b"]);
/// assert_eq!(normalize_all(&["A", " "]), Err(EmptyLabel));
/// ```
#[cfg(feature = "batch")]
pub fn normalize_all(inputs: &[&str]) -> Result<Vec<String>, EmptyLabel> {
    inputs.iter().map(|input| normalize(input)).collect()
}
~~~

`include_str!` risolve il percorso **rispetto a `src/lib.rs`**. Il testo del README descrive sempre la feature in carattere monospace; il link rustdoc alla funzione viene aggiunto solo quando esiste il suo destinatario. In questo modo la vista predefinita non promette una funzione indisponibile.

Usa le sezioni in base al contratto: **Errors** per i fallimenti restituiti, **Panics** se ci sono condizioni note che provocano un panic, **Safety** per gli obblighi del chiamante di un'API `unsafe`. Non sono intestazioni decorative. Per esempio, per un riferimento ottenuto da un puntatore non basta dire «non nullo»: bisogna descrivere validità e inizializzazione del valore, allineamento, durata e regole di accesso applicabili. Il testo non verifica tali precondizioni. Qui un'etichetta vuota è un `Err`, non un panic né un obbligo di sicurezza.

### 3. Un esempio dal punto di vista del chiamante

Crea `examples/basic.rs`. A differenza dell'asserzione nel README, questo esempio è un piccolo programma: usa l'import pubblico, propaga l'errore e stampa il risultato.

```rust
fn main() -> Result<(), text_labels::EmptyLabel> {
    let label = text_labels::normalize("  Release  Notes  ")?;
    println!("{label}");
    Ok(())
}
```

Eseguilo dalla radice del package. L'output atteso è `release  notes`, con due spazi interni.

```sh
cargo run --quiet --example basic
```

## Verifica prima del rilascio

**Prova quello che il lettore copia.** Con le feature predefinite i doc test sono due (README e `normalize`); con `batch` sono tre. Il test dell'API aggiuntiva non viene eseguito nella configurazione minima perché l'elemento stesso è escluso.

```sh
cargo test --doc
```

```sh
cargo test --doc --features batch
```

**Apri le due viste pubbliche.** Questi comandi generano HTML in directory distinte e rendono bloccanti sia i link intra-doc irrisolti sia la documentazione pubblica mancante. Non verificano gli URL esterni e non eseguono le asserzioni degli esempi.

```sh
cargo rustdoc --lib --target-dir target/docs-base -- -D rustdoc::broken_intra_doc_links -D missing_docs
```

```sh
cargo rustdoc --lib --features batch --target-dir target/docs-batch -- -D rustdoc::broken_intra_doc_links -D missing_docs
```

Apri `doc/text_labels/index.html` dentro ciascuna directory di output. In entrambe devi trovare il primo utilizzo, la pagina di `normalize` con la sezione **Errors** e quella di `EmptyLabel`. Solo nella seconda la guida deve collegare la pagina di `normalize_all`. Il testo informativo sulla feature, invece, appartiene a entrambe.

**Controlla il contenuto del pacchetto.** Verifica che nell'elenco compaiano almeno `README.md`, `src/lib.rs` ed `examples/basic.rs`. Il comando elenca i file: non pubblica nulla e non prova i doc test.

```sh
cargo package --list
```

**Controprova:** cambia soltanto il risultato atteso nel README da `"caffè  latte"` a `"caffè latte"`. L'HTML continua a generarsi e l'esempio in `examples/` continua a funzionare, ma il doc test del README fallisce. Ripristina i due spazi: hai verificato che il controllo protegge proprio la promessa letta dall'utente. Per sintassi avanzata e limiti dei test vedi [[Programmazione/Rust/Pagine/Doc test|Doc test]] e [[Programmazione/Rust/Pagine/rustdoc|rustdoc]].

## Fonti

- [Rustdoc Book: quali contenuti includere](https://doc.rust-lang.org/rustdoc/write-documentation/what-to-include.html)
- [Rustdoc Book: includere Markdown con l'attributo doc](https://doc.rust-lang.org/rustdoc/write-documentation/the-doc-attribute.html)
- [Rustdoc Book: esecuzione degli esempi](https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html)
- [Cargo Book: campo readme](https://doc.rust-lang.org/cargo/reference/manifest.html#the-readme-field) e [file inclusi nel pacchetto](https://doc.rust-lang.org/cargo/commands/cargo-package.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/rustdoc|rustdoc]]
- [[Programmazione/Rust/Pagine/Doc test|Doc test]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]
- [[Programmazione/Rust/Pagine/Feature flags ben progettate|Feature flags ben progettate]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]
- [[Programmazione/Rust/Pagine/Packaging e release|Packaging e release]]

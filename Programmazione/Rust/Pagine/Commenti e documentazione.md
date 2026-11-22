---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - documentazione
aliases: []
prerequisites: []
related: []
title: Commenti e documentazione
---

# Commenti e documentazione

## Sintesi

Rust distingue commenti normali e commenti di documentazione. I commenti normali spiegano il codice per chi lo legge. I commenti doc generano documentazione con `rustdoc` e possono includere esempi eseguibili come test.

**Generare HTML non equivale a eseguire i doctest.** La procedura qui sotto prepara una vera libreria `note-rust`, senza dipendenze, verificata con **Rust 1.99.1, edition 2024**. I comandi creano file soltanto nella nuova directory scelta per il progetto.

## Quando usarlo

- Quando devi chiarire una scelta non ovvia.
- Quando esponi API pubbliche di crate o moduli.
- Quando vuoi esempi verificabili nella documentazione.

## Come funziona

### Commento ordinario o documentazione

`//` e `/* ... */` sono trattati come spazi dal compilatore; i commenti a blocco possono essere annidati. Servono a spiegare motivazioni e vincoli non ovvi, non a ripetere ogni istruzione.

`///` documenta l'item successivo; `//!` documenta il contenitore, tipicamente crate o modulo, e va collocato nella posizione ammessa per un attributo interno, normalmente all'inizio. Non e un modo per documentare l'item precedente. I doc comment sono una forma di attributo `doc`, non semplice testo scartato.

### Il contratto prima dei dettagli interni

Una buona doc indica cosa riceve e restituisce l'API, quando fallisce e quali effetti produce. Usa sezioni come `# Examples`, `# Errors`, `# Panics` e `# Safety` **solo quando pertinenti**; `Safety` descrive gli obblighi del chiamante di un'API unsafe. Non inventare panic o errori per riempire una sezione.

I link intra-doc come ``[`is_even`]`` collegano simboli Rust risolti da rustdoc. I wikilink del vault servono invece fra queste note Markdown: non sono la sintassi dei link dentro i commenti Rust.

## API / Sintassi

### Commenti ordinari

```rust
fn main() {
    // Il margine lascia spazio per terminatori del protocollo dimostrativo.
    let payload_limit = 64 - 2;
    /* Commento esterno con /* dettaglio annidato */ ancora valido. */
    assert_eq!(payload_limit, 62);
}
```

Il limite e solo un dato dimostrativo, non una specifica di rete reale. Evita grandi blocchi di codice disattivato che possono diventare obsoleti: Git conserva la storia.

## Esempio pratico

### Preparare una libreria

Prerequisito: toolchain Rust e Cargo installati. Da una directory di lavoro in cui `note-rust` non esiste gia:

```powershell
cargo new note-rust --lib --edition 2024 --vcs none
```

Entra nel progetto:

```powershell
cd note-rust
```

### Sorgente documentato

Sostituisci il contenuto di `src/lib.rs` con questo blocco. Non va in `main.rs`: il demo e una libreria. Il package generato si chiama `note-rust`, mentre nei percorsi Rust si scrive `note_rust`.

````rust
//! Utility numeriche: somma controllata e verifica della parita.
//!
//! Usa [`add`] per una somma senza overflow e [`is_even`] per la parita.

/// Somma due interi se il risultato e rappresentabile come `i32`.
///
/// Restituisce `None` in caso di overflow, senza saturare o fare wrapping.
///
/// # Examples
///
/// ```
/// # use note_rust::add;
/// assert_eq!(add(2, 3), Some(5));
/// assert_eq!(add(i32::MAX, 1), None);
/// ```
pub fn add(left: i32, right: i32) -> Option<i32> {
    left.checked_add(right)
}

/// Restituisce `true` se il numero e pari, anche per zero e numeri negativi.
///
/// # Examples
///
/// ```
/// assert!(note_rust::is_even(-4));
/// assert!(!note_rust::is_even(3));
/// ```
///
/// Gli argomenti devono essere interi, non stringhe:
///
/// ```compile_fail
/// note_rust::is_even("2");
/// ```
pub fn is_even(value: i32) -> bool {
    value % 2 == 0
}
````

Il blocco contiene tre doctest: due devono eseguire le asserzioni, uno deve fallire la compilazione. La riga che inizia con `# ` nel primo esempio viene compilata ma nascosta nella resa rustdoc; non e un commento Rust. Qui nasconde solo l'import: non nascondere prerequisiti sostanziali, come autenticazione o risorse necessarie.

### Generare la documentazione

```powershell
cargo doc --no-deps
```

Con la configurazione predefinita, l'HTML del demo si trova in `target/doc/note_rust/index.html`. `--no-deps` evita di generare la documentazione delle dipendenze; non significa che Cargo possa ignorare le dipendenze necessarie a compilare un progetto diverso.

### Eseguire i doctest

```powershell
cargo test --doc
```

Rustdoc prepara il contesto degli esempi Rust, inclusa una funzione `main` quando necessaria. Gli esempi devono comunque usare l'API pubblica con il giusto nome della crate. Questa procedura prova i doctest del target libreria; non assumere lo stesso comportamento per esempi scritti soltanto in un target binario.

### Aprire l'HTML nel browser

```powershell
cargo doc --no-deps --open
```

Questo comando genera e apre la documentazione nel browser predefinito. Non pubblica nulla online e non sostituisce `cargo test --doc`.

## Varianti

- `//`: commento ordinario.
- `/* ... */`: commento multilinea.
- `///`: documentazione dell'item successivo.
- `//!`: documentazione del modulo o crate corrente.
- `/** ... */` e `/*! ... */`: equivalenti doc a blocco; `///` e spesso piu pratico con esempi Markdown.
- `no_run` sui blocchi doc: compila ma non esegue; adatto quando l'esecuzione richiede risorse non disponibili nel test.
- `ignore`: esclude il blocco dai normali doctest; non usarlo per mascherare errori.
- `compile_fail`: verifica che il codice non compili, non che fallisca per il motivo desiderato. Nella baseline stable non considerare un suffisso come `E0308` una garanzia sul codice diagnostico: il controllo dei codici nei doctest e una funzionalita unstable. Mantieni il controesempio minimo e verifica la causa dell'errore.
- `should_panic`: richiede un panic runtime; `text` indica un blocco non Rust.
- `cargo doc --no-deps --document-private-items`: include anche gli item privati nella documentazione della libreria. Non rende pubbliche le API Rust.

## Errori comuni

- Commentare cosa fa una riga ovvia invece di spiegare perche esiste.
- Lasciare documentazione pubblica non aggiornata.
- Inserire esempi doc che non compilano.
- Usare commenti per nascondere codice morto invece di rimuoverlo.
- Aggiungere `///` a fine file senza un item seguente, oppure mettere `//!` dopo gli item come se fosse un commento ordinario.
- Usare `my_crate` senza adattarlo al package: un esempio puo fallire per l'import errato invece che per il vincolo che intende dimostrare.
- Credere che un build HTML riuscito certifichi anche le asserzioni nei doctest.
- Confondere `////` con `///`: quattro slash sono un commento ordinario, non un doc comment.

## Checklist

- Le API pubbliche hanno documentazione chiara.
- Gli esempi doc sono minimali e compilabili.
- I commenti spiegano decisioni, invarianti o vincoli.
- La documentazione non contraddice il codice.
- Hai eseguito sia generazione HTML sia doctest, controllando anche i link intra-doc.
- Eventuali test esclusi o solo compilati hanno una motivazione esplicita.

## Collegamenti

- [[Programmazione/Rust/Pagine/rustdoc|rustdoc]]
- [[Programmazione/Rust/Pagine/Doc test|Doc test]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]

## Fonti

- [Rust Reference: Comments](https://doc.rust-lang.org/reference/comments.html).
- [Rustdoc Book: How to write documentation](https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html).
- [Rustdoc Book: Documentation tests](https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html).
- [Rustdoc Book: Intra-doc links](https://doc.rust-lang.org/rustdoc/write-documentation/linking-to-items-by-name.html).
- [Rustdoc Book: funzionalita unstable, codici di errore nei doctest](https://doc.rust-lang.org/rustdoc/unstable-features.html#error-numbers-for-compile-fail-doctests).
- [Cargo: doc](https://doc.rust-lang.org/cargo/commands/cargo-doc.html) e [Cargo: test](https://doc.rust-lang.org/cargo/commands/cargo-test.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

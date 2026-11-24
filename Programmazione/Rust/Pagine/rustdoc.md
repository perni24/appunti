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
  - testing-qualita-e-sicurezza
aliases:
  - rustdoc
  - cargo doc
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo|Cargo]]"
  - "[[Programmazione/Rust/Pagine/Public API design|Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/Doc test|Doc test]]"
  - "[[Programmazione/Rust/Pagine/Documentazione delle crate|Documentazione delle crate]]"
  - "[[Programmazione/Rust/Pagine/rustfmt|rustfmt]]"
  - "[[Programmazione/Rust/Pagine/Clippy|Clippy]]"
title: rustdoc
---

# rustdoc

## Sintesi

`rustdoc` trasforma i commenti di documentazione e le firme delle API Rust in pagine HTML navigabili. Dalla pagina della crate un lettore può seguire il nome di una funzione e trovarne parametri, risultato, casi di errore ed esempi. **Generare la pagina non significa aver eseguito l'esempio che vi compare.**

## Scegliere il controllo

| Domanda | Comando per la libreria dell'esempio | Che cosa non garantisce |
| --- | --- | --- |
| Quale documentazione vedrà chi usa la libreria? | `cargo doc --lib --no-deps` | Non esegue gli esempi; alcuni problemi di documentazione sono solo avvisi. |
| Il nome citato nella guida punta a un elemento Rust esistente? | `cargo rustdoc --lib -- -D rustdoc::broken_intra_doc_links` | Non verifica la raggiungibilità di URL esterni né la correttezza delle promesse scritte. |
| Il codice mostrato al lettore produce davvero il risultato dichiarato? | `cargo test --doc` | Esegue i doc test della libreria, non verifica la navigazione dell'HTML. |

## Esempio pratico: dalla crate alla funzione

In una directory libera, crea una libreria senza dipendenze esterne:

```sh
cargo new --lib --edition 2024 quota_notes
```

Dalla directory `quota_notes`, sostituisci **solo il file di prova** `src/lib.rs` con questo contenuto:

~~~rust
//! Percentuali intere per confrontare due quantità.
//!
//! Per calcolare la quota di una parte sul totale usa [`percentage`].

/// Calcola la percentuale intera di `part` rispetto a `total`.
///
/// Scarta la parte frazionaria. Se la parte supera il totale,
/// il risultato può superare 100: non viene limitato a 100.
///
/// # Examples
///
/// ```rust
/// use quota_notes::percentage;
///
/// assert_eq!(percentage(1, 3), Ok(33));
/// assert_eq!(percentage(2, 1), Ok(200));
/// assert_eq!(percentage(u64::MAX, u64::MAX), Ok(100));
/// ```
///
/// # Errors
///
/// Restituisce un errore se il totale è zero o se il risultato
/// intero non è rappresentabile come `u64`.
///
/// ```rust
/// use quota_notes::percentage;
///
/// assert!(percentage(1, 0).is_err());
/// assert!(percentage(u64::MAX, 1).is_err());
/// ```
pub fn percentage(part: u64, total: u64) -> Result<u64, String> {
    if total == 0 {
        return Err("total is zero".to_owned());
    }
    let quotient = scaled(part) / u128::from(total);
    u64::try_from(quotient).map_err(|_| "percentage exceeds u64".to_owned())
}

fn scaled(part: u64) -> u128 {
    u128::from(part) * 100
}
~~~

I commenti `//!` all'inizio di `lib.rs` descrivono **la crate**; in un modulo descriverebbero il modulo che li contiene. I commenti `///` descrivono **l'elemento che segue**. La prima frase riassume la funzione; `# Errors` dice al chiamante quando aspettarsi un `Err`. Usa `# Panics` o `# Safety` quando c'è davvero un panic da documentare o un obbligo a carico di chi chiama un'API unsafe.

Il caso con due `u64::MAX` non è decorativo: la risposta deve essere 100, ma moltiplicare prima in `u64` può causare overflow. Qui la moltiplicazione avviene in `u128` e la conversione finale verifica che il risultato entri in `u64`.

### 1. Leggere la vista pubblica

```sh
cargo doc --lib --no-deps
```

Con il percorso di build predefinito, apri `target/doc/quota_notes/index.html` oppure aggiungi `--open` allo stesso comando. Nel testo introduttivo, il nome `percentage` è un **link intra-doc**: rustdoc lo risolve nel contesto Rust e lo collega a `fn.percentage.html`. Seguilo e controlla le sezioni *Examples* ed *Errors*. `--no-deps` evita di generare le pagine delle dipendenze; **non** seleziona la visibilità degli elementi.

### 2. Confrontare la vista interna

Per vedere anche l'helper privato `scaled`, genera una seconda copia:

```sh
cargo doc --lib --no-deps --document-private-items --target-dir target/internal
```

Apri `target/internal/doc/quota_notes/index.html`: qui compare anche `scaled`, senza averlo reso `pub`. I due percorsi sono distinti perché Cargo può conservare HTML di generazioni precedenti. **Omettere le pagine private non rende segreto il sorgente**: la documentazione pubblica può comunque includere collegamenti al codice. I comandi mostrati scrivono file locali; non pubblicano la crate né aggiornano docs.rs.

### 3. Far fallire il controllo giusto

Per rendere bloccante un riferimento Rust irrisolto nella libreria, passa il lint a rustdoc dopo `--`:

```sh
cargo rustdoc --lib -- -D rustdoc::broken_intra_doc_links
```

**Prova sul link:** nella sola riga `//!` cambia il nome tra parentesi quadre da `percentage` a `percentage_typo`. Con le impostazioni predefinite, `cargo doc --lib --no-deps` avvisa del nome irrisolto ma può terminare con successo; il comando con `-D` fallisce. Ripristina il nome corretto. Se vuoi rilevare anche elementi pubblici senza documentazione, aggiungi `-D missing_docs`: è un controllo distinto e non misura la qualità del testo.

Ora esegui gli esempi pubblicati:

```sh
cargo test --doc
```

In questa crate i doc test sono **due**: si contano i blocchi Rust, non le singole asserzioni. **Prova sull'esempio:** cambia solo il risultato atteso da `Ok(33)` a `Ok(34)`. L'HTML si genera e il controllo del link passa, ma il primo doc test fallisce. Ripristina `33`. Per blocchi da compilare senza esecuzione o che devono fallire in compilazione, vedi [[Programmazione/Rust/Pagine/Doc test|Doc test]].

## Errori comuni

- Usare nei commenti un nome fittizio come `my_crate`: l'esempio deve importare il nome reale della libreria come farebbe un chiamante esterno.
- Collegare la guida pubblica a un helper privato: il nome esiste, ma la sua pagina non è disponibile nella vista pubblica. È un caso diverso da un nome inesistente (`rustdoc::private_intra_doc_links`).
- Scrivere percorsi HTML a mano nei commenti. Preferisci un link all'elemento Rust; se un tipo e una funzione hanno lo stesso nome, disambigua per esempio con `fn@nome`.
- Dare per aggiornata una pagina solo perché esiste su disco. Controlla l'esito dell'ultima generazione e il percorso di output prima di distribuirla.

## Checklist

- Dalla pagina iniziale si arriva al contratto dell'API senza vedere gli internals?
- I casi di errore, gli arrotondamenti e i limiti descritti hanno esempi verificabili?
- La CI controlla sia i link intra-doc sia l'esecuzione dei doc test?

## Fonti

- [Cargo Book: cargo doc, visibilità e directory di output](https://doc.rust-lang.org/cargo/commands/cargo-doc.html)
- [Cargo Book: passare opzioni a rustdoc per un target](https://doc.rust-lang.org/cargo/commands/cargo-rustdoc.html)
- [Rustdoc Book: link agli elementi Rust](https://doc.rust-lang.org/rustdoc/write-documentation/linking-to-items-by-name.html) e [lint della documentazione](https://doc.rust-lang.org/rustdoc/lints.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Doc test|Doc test]]
- [[Programmazione/Rust/Pagine/Documentazione delle crate|Documentazione delle crate]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/rustfmt|rustfmt]]
- [[Programmazione/Rust/Pagine/Clippy|Clippy]]

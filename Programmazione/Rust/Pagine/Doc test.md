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
  - Doc test
  - Documentation test
prerequisites:
  - "[[Programmazione/Rust/Pagine/rustdoc|rustdoc]]"
  - "[[Programmazione/Rust/Pagine/Public API design|Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/Unit test|Unit test]]"
  - "[[Programmazione/Rust/Pagine/Integration test|Integration test]]"
  - "[[Programmazione/Rust/Pagine/Documentazione delle crate|Documentazione delle crate]]"
title: Doc test
---

# Doc test

## Sintesi

Un **doc test** è un esempio nella documentazione Rust che `rustdoc` può verificare. Un blocco Rust ordinario passa se compila e termina senza fallire. Scrivere `parse_percentage("120")` mostra come chiamare la funzione; aggiungere un'asserzione verifica anche la promessa fatta al lettore: il risultato è `100`.

## Quando usarlo

Usalo per mostrare la prima chiamata utile a un'API pubblica, il valore restituito o un errore che il chiamante deve gestire. Se devi controllare tutti i valori limite di una funzione privata, usa un [[Programmazione/Rust/Pagine/Unit test|test unitario]]. Se devi avviare una CLI e osservarne il codice di uscita, usa un [[Programmazione/Rust/Pagine/Integration test|test di integrazione]]. Un programma dimostrativo lungo può stare in `examples/`, lasciando nella documentazione l'esempio minimo.

## Come funziona

`///` documenta l'elemento successivo; `//!` può documentare il modulo o la crate. Nei commenti, `rustdoc` interpreta come Rust un blocco delimitato da tre backtick senza linguaggio o con `rust`. Ogni esempio deve avere gli import che gli servono: usa il nome della libreria come farebbe un chiamante esterno, senza affidarti a variabili o import di un altro blocco.

| Blocco nel commento | Cosa controlla il test | Quando sceglierlo |
| --- | --- | --- |
| `rust` o senza annotazione | Compila ed esegue; un'asserzione fallita fa fallire il test. | Input e risultato riproducibili. |
| `no_run` | Compila, ma non esegue il codice. | L'esempio richiede input interattivo o un servizio esterno. |
| `ignore` | Per impostazione predefinita salta il blocco: non garantisce neppure che compili. | Un prerequisito impedisce anche la compilazione; spiegare quale. |
| `compile_fail` | Passa se il blocco non compila. | Mostrare un uso che il sistema di tipi rifiuta. |
| `should_panic` | Deve compilare e andare in panic durante l'esecuzione. | L'API documenta un panic; un semplice `Err` non è un panic. |
| `text` | Non è un esempio Rust e non viene testato. | Mostrare output, non codice da verificare. |

## Esempio pratico

Parti dalla libreria `percentage_notes` della nota [[Programmazione/Rust/Pagine/Unit test|Unit test]]. In `src/lib.rs`, incolla **solo questi commenti**, subito sopra la funzione esistente `pub fn parse_percentage`. Non serve modificare l'implementazione né rendere pubblico l'helper.

~~~rust
/// Legge un intero e ne limita il valore all'intervallo 0..=100.
///
/// # Examples
///
/// ```rust
/// use percentage_notes::parse_percentage;
///
/// assert_eq!(parse_percentage(" 120 ")?, 100);
/// # Ok::<(), std::num::ParseIntError>(())
/// ```
///
/// # Errors
///
/// Restituisce un errore se, tolti gli spazi esterni, il testo non
/// rappresenta un intero valido per `i32`. Un valore come 120 è valido.
///
/// ```rust
/// use percentage_notes::parse_percentage;
/// use std::num::IntErrorKind;
///
/// let error = parse_percentage("42%").unwrap_err();
/// assert_eq!(error.kind(), &IntErrorKind::InvalidDigit);
/// ```
~~~

Nel primo blocco, `?` propaga un eventuale errore. La riga che inizia con `# ` dà all'esempio un risultato di successo con un tipo di errore esplicito: partecipa al test ma è nascosta nella vista normale della documentazione generata da rustdoc. Nel secondo blocco, `unwrap_err()` è intenzionale: se un domani il parser accettasse `"42%"`, vogliamo che l'esempio fallisca.

### Eseguire la verifica

Dalla directory con il `Cargo.toml` di `percentage_notes`, esegui soltanto i doc test della libreria. Con i soli commenti sopra devono passarne **due**:

```sh
cargo test --doc
```

Per includere anche i test unitari e gli eventuali test di integrazione del pacchetto:

```sh
cargo test
```

Per generare l'HTML della libreria senza documentare le dipendenze:

```sh
cargo doc --no-deps
```

Apri `target/doc/percentage_notes/fn.parse_percentage.html` per leggere la pagina della funzione. **Controprova:** cambia solo il risultato atteso da `100` a `99`. L'HTML si genera ancora, ma `cargo test --doc` fallisce mostrando il risultato effettivo (`100`) e quello atteso (`99`). Ripristina l'asserzione prima di proseguire. `cargo test --lib` da solo non esegue i doc test.

## Varianti

**Verificare una chiamata senza attendere input.** Questo esempio facoltativo si può aggiungere in fondo ai commenti della stessa funzione. Il chiamante legge una riga dallo standard input: interessa verificare che il codice resti valido, non simulare una tastiera. Le varianti sono indipendenti dai due test precedenti.

~~~rust
/// ```no_run
/// use percentage_notes::parse_percentage;
///
/// let mut line = String::new();
/// std::io::stdin().read_line(&mut line)?;
/// println!("{}", parse_percentage(&line)?);
/// # Ok::<(), Box<dyn std::error::Error>>(())
/// ```
~~~

**Verificare un vincolo di tipo.** Il parser restituisce un `Result`, non un `u8` già pronto. Qui l'import e l'input sono validi: l'unica operazione che deve essere rifiutata è l'assegnazione. Se si aggiunge `.unwrap()` alla chiamata, il codice compila e il doc test negativo deve fallire.

~~~rust
/// ```compile_fail
/// use percentage_notes::parse_percentage;
///
/// let percent: u8 = parse_percentage("42");
/// ```
~~~

## Errori comuni

- Stampare un risultato e scrivere quello atteso in un commento: il test non confronta l'output. Per una funzione pura usa un'asserzione.
- Usare `ignore` per codice che richiede solo un servizio **durante l'esecuzione**: con `no_run` il compilatore può ancora segnalare una chiamata non più valida.
- Fidarsi di un `compile_fail` con un import sbagliato: il test passa anche se la compilazione fallisce per quel motivo. Prova la variante che dovrebbe compilare.
- Nascondere dietro `# ` proprio il passaggio che il lettore deve imparare, ad esempio l'import pubblico o la gestione dell'errore.

## Checklist

- L'esempio funziona dal punto di vista di chi importa la libreria?
- Un risultato sbagliato viene rilevato da un'asserzione?
- Ogni esempio non eseguito ha un motivo esplicito?
- La verifica in locale o in CI include `cargo test --doc` oppure la suite completa?

## Fonti

- [The rustdoc book: documentation tests, righe nascoste e attributi](https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html)
- [The Cargo Book: cargo test e selezione dei target](https://doc.rust-lang.org/cargo/commands/cargo-test.html)
- [The Cargo Book: cargo doc](https://doc.rust-lang.org/cargo/commands/cargo-doc.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/rustdoc|rustdoc]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]
- [[Programmazione/Rust/Pagine/Integration test|Integration test]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Documentazione delle crate|Documentazione delle crate]]

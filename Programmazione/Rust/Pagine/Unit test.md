---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - Unit test
  - Test unitari Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Funzioni|Funzioni]]"
  - "[[Programmazione/Rust/Pagine/Result|Result]]"
related:
  - "[[Programmazione/Rust/Pagine/Integration test|Integration test]]"
  - "[[Programmazione/Rust/Pagine/Doc test|Doc test]]"
  - "[[Programmazione/Rust/Pagine/cargo-nextest|cargo-nextest]]"
title: Unit test
---

# Unit test

## Sintesi

Un **test unitario** fissa una regola osservabile di un modulo. Per esempio: «una percentuale numerica sopra 100 diventa 100; un testo che non è un numero dà errore». Un buon test distingue questi due esiti, invece di limitarsi a controllare che la funzione non vada in panic.

In Rust la convenzione è mettere i test in un modulo figlio del codice da verificare, spesso in fondo a `src/lib.rs`. Questo permette di provare sia l'API pubblica sia una funzione privata, **senza renderla pubblica per i test**. Conta la gerarchia dei moduli, non la vicinanza fisica: anche `#[cfg(test)] mod tests;` con un file separato può dichiarare un modulo figlio.

## Come funziona

| Elemento | A cosa serve |
| --- | --- |
| `#[cfg(test)] mod tests` | Include l'intero modulo, compresi eventuali dati e funzioni di supporto, quando si compila **questa crate** in modalità test. Una normale build della libreria lo esclude. |
| `#[test]` | Registra una funzione senza argomenti nel programma che esegue i test. Il nome `tests` del modulo è una convenzione, non ciò che fa scoprire la funzione. |
| `use super::…` | Importa nomi dal modulo padre. È la posizione del modulo figlio a permettere l'accesso ai privati; `use` non cambia la visibilità. |
| `assert_eq!(ottenuto, atteso)` | Confronta due valori e li mostra entrambi se sono diversi. Usare `assert!` per una condizione e `assert_ne!` quando il contratto richiede soltanto disuguaglianza. |

## Esempio: una percentuale da testo

Per provare l'esempio con Cargo e senza dipendenze esterne, creare una libreria in una directory libera:

```sh
cargo new --lib percentage_notes
```

In `percentage_notes/src/lib.rs`, sostituire il contenuto generato con il blocco seguente. Il contratto ha due passi: prima si interpreta il testo come `i32`, ignorando gli spazi esterni; **solo se il parsing riesce** si limita il valore a `0..=100`. Perciò `"120"` è valido e restituisce 100, mentre `"42%"` e `"2147483648"` sono errori, per motivi diversi.

```rust
use std::num::ParseIntError;

fn clamp_percentage(value: i32) -> u8 {
    value.clamp(0, 100) as u8
}

pub fn parse_percentage(input: &str) -> Result<u8, ParseIntError> {
    let value = input.trim().parse::<i32>()?;
    Ok(clamp_percentage(value))
}

#[cfg(test)]
mod tests {
    use super::{clamp_percentage, parse_percentage};
    use std::num::{IntErrorKind, ParseIntError};

    #[test]
    fn clamps_at_both_limits() {
        for (input, expected) in [
            (i32::MIN, 0), (-1, 0), (0, 0), (1, 1), (42, 42),
            (99, 99), (100, 100), (101, 100), (i32::MAX, 100),
        ] {
            assert_eq!(clamp_percentage(input), expected, "input={input}");
        }
    }

    #[test]
    fn parses_trimmed_integer() -> Result<(), ParseIntError> {
        assert_eq!(parse_percentage(" 42 ")?, 42);
        Ok(())
    }

    #[test]
    fn clamps_after_parsing() -> Result<(), ParseIntError> {
        assert_eq!(parse_percentage("-10")?, 0);
        assert_eq!(parse_percentage("120")?, 100);
        Ok(())
    }

    #[test]
    fn rejects_percent_suffix() {
        let err = parse_percentage("42%").expect_err("il suffisso non è un intero");
        assert_eq!(err.kind(), &IntErrorKind::InvalidDigit);
    }

    #[test]
    fn rejects_integer_outside_i32() {
        let err = parse_percentage("2147483648").expect_err("valore oltre i32::MAX");
        assert_eq!(err.kind(), &IntErrorKind::PosOverflow);
    }
}
```

**Come leggere i test.** La tabella indica risultati noti senza riusare `clamp` per calcolare l'atteso. Il caso `-1` distingue l'implementazione corretta da una che converte in `u8` *prima* di limitare il valore. Il caso `100` controlla che il massimo sia incluso. Gli altri quattro test chiamano la funzione pubblica: se il parser smettesse di usare il limite, il test dell'helper passerebbe ancora ma `clamps_after_parsing` fallirebbe.

**Errore previsto o inatteso?** In `parses_trimmed_integer` un `Err` è inatteso: `?` lo restituisce al runner e il test fallisce. In `rejects_percent_suffix`, invece, l'errore è proprio il risultato atteso: `expect_err` esclude il caso `Ok` e il confronto controlla la categoria dell'errore, non il testo del messaggio. Se interessa solo il rifiuto dell'input, basta `assert!(risultato.is_err())`. Usare `#[should_panic(expected = "...")]` solo quando **il panic stesso** fa parte del contratto: cerca una sottostringa nel messaggio e non verifica un `Err`.

## Eseguire e diagnosticare

Dalla directory `percentage_notes`, eseguire i test unitari del target libreria:

```sh
cargo test --lib
```

Il riepilogo atteso è **5 passati, 0 falliti**: le nove righe della tabella appartengono a un'unica funzione di test. Per conoscere i nomi completi senza eseguire i test:

```sh
cargo test --lib -- --list
```

Per riprodurre soltanto il caso del limite numerico:

```sh
cargo test --lib tests::rejects_integer_outside_i32 -- --exact
```

Qui ci si aspetta **1 passato, 4 filtrati**. Prima di `--` si seleziona il target di Cargo; dopo `--` si passano opzioni al runner dei test. Senza `--exact` il filtro cerca una sottostringa. Con `--exact`, dimenticare il prefisso `tests::` può dare **0 test eseguiti e codice di uscita 0**: un comando verde non dimostra che quel caso sia passato.

## Quale test scegliere

- **Unitario:** se il difetto è una regola locale, usare l'input più piccolo che lo riproduce. Per un metodo che cambia stato, verificare lo stato osservabile prima e dopo. Creare dati e risorse separati per ogni test: il runner può eseguirli in parallelo, senza un ordine su cui contare.
- **Di integrazione:** se la domanda è «un'altra crate può usare correttamente questa API?», mettere il test in `tests/`. La libreria viene usata dall'esterno: il test può chiamare `parse_percentage`, non l'helper privato né una funzione esposta soltanto con `#[cfg(test)]`. Vedere [[Programmazione/Rust/Pagine/Integration test|Integration test]].
- **Di documentazione:** se deve restare valido l'esempio mostrato a chi usa la libreria, scegliere un [[Programmazione/Rust/Pagine/Doc test|doc test]]. `cargo test --lib` non sostituisce l'esecuzione dell'intera suite con `cargo test`.

La possibilità di testare un dettaglio privato non è un obbligo. Se una funzione cambia spesso ma il contratto pubblico è stabile, preferire il test del contratto. Se una prova richiede rete, orologio reale o un database condiviso, separare la regola locale dalla verifica dell'integrazione: serializzare l'intera suite non rende indipendenti i test.

## Fonti

- [Rust Book: organizzazione dei test e visibilità](https://doc.rust-lang.org/book/ch11-03-test-organization.html) e [Rust Reference: attributi di test e tipi di ritorno](https://doc.rust-lang.org/reference/attributes/testing.html).
- [Cargo Book: selezione dei target con cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html) e [rustc: filtri, elenco e opzioni del runner](https://doc.rust-lang.org/rustc/tests/index.html).

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Integration test|Integration test]]
- [[Programmazione/Rust/Pagine/Doc test|Doc test]]
- [[Programmazione/Rust/Pagine/cargo-nextest|cargo-nextest]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]

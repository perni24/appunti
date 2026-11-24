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
  - Integration test
  - Test di integrazione Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo|Cargo]]"
  - "[[Programmazione/Rust/Pagine/Public API design|Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/Unit test|Unit test]]"
  - "[[Programmazione/Rust/Pagine/Mocking|Mocking]]"
  - "[[Programmazione/Rust/Pagine/cargo-nextest|cargo-nextest]]"
title: Integration test
---

# Integration test

## Sintesi

Un test di integrazione osserva il programma **dall'esterno**. Una libreria può rifiutare correttamente un input con `Err`, ma la CLI che la usa potrebbe stampare l'errore e terminare con codice `0`. Il primo comportamento si verifica chiamando la funzione pubblica; per il secondo occorre avviare il binario e osservare il processo.

Il confine attraversato conta più della durata. Un test in `tests/` che chiama una funzione in memoria può essere rapido e non ha bisogno di rete o database.

## Come Cargo organizza i test

Con la struttura standard e la scoperta automatica attiva, **ogni file `.rs` direttamente sotto `tests/`** diventa un target di integrazione: Cargo lo compila come crate separata, con il proprio eseguibile di test. Le funzioni `#[test]` nello stesso target condividono il processo e possono girare in parallelo.

| Dove si trova il codice | Che cosa vede |
| --- | --- |
| Modulo `#[cfg(test)]` dentro `src/lib.rs` | Il modulo padre e i suoi elementi privati, secondo le regole di visibilità. |
| `tests/api.rs` | La libreria attraverso il suo nome di crate e i percorsi pubblici. Qui `crate::` indica la crate di **test**, non la libreria. |
| `tests/cli.rs` | Oltre all'API pubblica, può avviare un binario del pacchetto e controllare ciò che vede chi lo esegue. |
| `tests/common/mod.rs` | Non è un target autonomo. Ogni target che scrive `mod common;` lo include come proprio modulo; non è memoria condivisa fra eseguibili. |

Un helper della libreria dichiarato solo con `#[cfg(test)]` non è disponibile al test esterno: in questo caso la libreria viene compilata come dipendenza. Non renderlo pubblico solo per far passare il test.

## Esempio: lo stesso input, due contratti

Partire dalla libreria `percentage_notes` della nota [[Programmazione/Rust/Pagine/Unit test|Unit test]], lasciando invariato il suo `src/lib.rs`. Espone `parse_percentage(&str) -> Result<u8, ParseIntError>`: accetta spazi esterni, limita a 100 il numero 120 e rifiuta `"42%"`. Aggiungere i file seguenti; non servono dipendenze né modifiche al manifest.

```text
percentage_notes/
  Cargo.toml
  src/
    lib.rs
    bin/percent.rs
  tests/
    api.rs
    cli.rs
    common/mod.rs
```

### 1. Verificare la libreria come consumatore

In `tests/common/mod.rs` condividiamo solo gli input. I risultati attesi restano visibili in ciascun test. Un file chiamato invece `tests/common.rs` verrebbe scoperto anche come eseguibile di test, spesso con zero test.

```rust
pub const ABOVE_MAX: &str = " 120 ";
pub const INVALID: &str = "42%";
```

In `tests/api.rs` non si importa il sorgente con `#[path]` e non si chiama l'helper privato `clamp_percentage`. Si usa la libreria come farebbe un altro pacchetto:

```rust
mod common;

use percentage_notes::parse_percentage;
use std::num::IntErrorKind;

#[test]
fn clamps_numeric_input() {
    assert_eq!(parse_percentage(common::ABOVE_MAX).unwrap(), 100);
}

#[test]
fn rejects_percent_suffix() {
    let err = parse_percentage(common::INVALID).expect_err("atteso un errore di parsing");
    assert_eq!(err.kind(), &IntErrorKind::InvalidDigit);
}
```

Il primo test attraversa il parsing e la normalizzazione. Il secondo verifica la categoria dell'errore, non la frase prodotta dal suo `Display`: cambiare un messaggio interno non dovrebbe rompere un consumatore che usa il tipo.

### 2. Aggiungere la CLI

In `src/bin/percent.rs`, il binario si occupa solo degli argomenti e dell'esito del processo. La regola sulle percentuali resta nella libreria:

```rust
use percentage_notes::parse_percentage;
use std::{env, process::ExitCode};

fn main() -> ExitCode {
    let mut args = env::args_os().skip(1);
    let (Some(arg), None) = (args.next(), args.next()) else {
        eprintln!("usage: percent VALUE");
        return ExitCode::from(2);
    };

    if let Some(value) = arg.to_str().and_then(|s| parse_percentage(s).ok()) {
        println!("{value}");
        ExitCode::SUCCESS
    } else {
        eprintln!("invalid percentage");
        ExitCode::from(2)
    }
}
```

### 3. Verificare il processo, non solo la funzione

In `tests/cli.rs`, `env!("CARGO_BIN_EXE_percent")` fornisce in compilazione il percorso del binario `percent` costruito da Cargo. Non occorre indovinare `target/debug/`, aggiungere `.exe` su Windows o lanciare un altro `cargo run` dal test.

```rust
mod common;

use std::process::{Command, Output};

fn run(args: &[&str]) -> Output {
    Command::new(env!("CARGO_BIN_EXE_percent"))
        .args(args)
        .output()
        .expect("impossibile avviare percent")
}

#[test]
fn prints_value_on_stdout() {
    let out = run(&[common::ABOVE_MAX]);
    assert!(out.status.success());
    assert_eq!(String::from_utf8(out.stdout).unwrap().trim_end(), "100");
    assert!(out.stderr.is_empty());
}

#[test]
fn invalid_input_is_a_process_error() {
    let out = run(&[common::INVALID]);
    assert_eq!(out.status.code(), Some(2));
    assert!(out.stdout.is_empty());
    assert_eq!(String::from_utf8(out.stderr).unwrap().trim_end(), "invalid percentage");
}

#[test]
fn requires_one_argument() {
    for args in [&[][..], &["1", "2"][..]] {
        let out = run(args);
        assert_eq!(out.status.code(), Some(2));
        assert!(out.stdout.is_empty());
        assert_eq!(String::from_utf8(out.stderr).unwrap().trim_end(), "usage: percent VALUE");
    }
}
```

`.output().expect(...)` verifica solo che il processo sia stato avviato e che sia stato possibile raccoglierne l'output: **un processo che termina con 2 non produce un `Err` di `output()`**. Per questo il test deve leggere `out.status`. In questo esempio le due righe diagnostiche sono parte del contratto della CLI; se la loro formulazione è libera, controllare piuttosto il codice e la destinazione del messaggio.

## Eseguire i casi giusti

Dalla radice di `percentage_notes`, eseguire i due test dell'API:

```sh
cargo test --test api
```

Eseguire i tre test del processo:

```sh
cargo test --test cli
```

Per riprodurre soltanto il caso di input non valido, selezionare prima **il target** `cli`, poi **la funzione**. I nomi in questo caso sono alla radice di `tests/cli.rs`, quindi non hanno il prefisso `tests::`:

```sh
cargo test --test cli invalid_input_is_a_process_error -- --exact
```

Il riepilogo deve indicare **1 passato e 2 filtrati**. `--test` vuole il nome del target, non il nome della funzione. Per controllare anche i cinque test unitari della libreria ed eventuali doc test, eseguire la suite del pacchetto:

```sh
cargo test
```

## Quando servono risorse esterne

- **Filesystem:** dare a ciascun test una directory temporanea distinta e ripulirla anche in caso di errore. Due processi separati possono ancora usare per sbaglio lo stesso nome di file.
- **HTTP:** se il contratto riguarda solo il router, esercitarlo in memoria. Se conta la connessione reale, usare il loopback, lasciare scegliere una porta libera al sistema e attendere che il server sia pronto, senza pause arbitrarie.
- **Database:** una transazione annullata a fine test isola solo le operazioni che la usano davvero. Se l'applicazione apre altre connessioni, predisporre uno schema o un database di test isolato.
- **Pacchetto con solo `src/main.rs`:** è possibile provare l'eseguibile come sopra. Per importare e testare la logica come API, estrarla in `src/lib.rs`; non duplicare il parser dentro il test. Per mostrare l'uso dell'API nella documentazione, preferire un [[Programmazione/Rust/Pagine/Doc test|doc test]].

## Fonti

- [Rust Book: test esterni e moduli di supporto](https://doc.rust-lang.org/book/ch11-03-test-organization.html) e [Cargo Book: target di integrazione](https://doc.rust-lang.org/cargo/reference/cargo-targets.html#integration-tests).
- [Cargo Book: percorsi dei binari disponibili ai test](https://doc.rust-lang.org/cargo/reference/environment-variables.html#environment-variables-cargo-sets-for-crates) e [opzioni di cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html).

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]
- [[Programmazione/Rust/Pagine/Doc test|Doc test]]
- [[Programmazione/Rust/Pagine/Mocking|Mocking]]
- [[Programmazione/Rust/Pagine/cargo-nextest|cargo-nextest]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]

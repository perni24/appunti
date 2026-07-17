---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - "Snapshot testing"
  - "Insta"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unit test]]"
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione]]"
related:
  - "[[Programmazione/Rust/Pagine/CLI con clap]]"
  - "[[Programmazione/Rust/Pagine/Doc test]]"
  - "[[Programmazione/Rust/Pagine/Integration test]]"
---

# Snapshot testing

## Sintesi

Lo **snapshot testing** confronta l'output di un test con un file snapshot salvato. In Rust una crate molto usata per questo approccio e `insta`.

E utile quando l'output e strutturato, lungo o difficile da verificare con molte `assert_eq!`: messaggi CLI, JSON serializzato, errori formattati, output di parser, template, debug output e report.

## Quando usarlo

Usa snapshot testing quando:

- l'output e leggibile e importante;
- vuoi revisionare differenze in modo visuale;
- hai output multilinea;
- vuoi proteggere messaggi di errore o CLI;
- il risultato e stabile tra esecuzioni;
- vuoi evitare assert manuali troppo verbosi.

Non usarlo per output instabile, timestamp, path assoluti o dati casuali senza normalizzazione.

## Come funziona

Il primo run crea o aggiorna snapshot. I run successivi confrontano il nuovo output con quello salvato. Se cambia, il test fallisce e lo sviluppatore decide se:

- accettare il nuovo snapshot;
- correggere il codice;
- normalizzare dati instabili;
- rendere il test piu specifico.

La review dello snapshot e parte del test. Accettare automaticamente ogni snapshot elimina il valore del controllo.

## API / Sintassi

Esempio con `insta`:

```rust
#[test]
fn renders_error_message() {
    let message = format_error("missing config");
    insta::assert_snapshot!(message);
}

fn format_error(reason: &str) -> String {
    format!("error: {reason}")
}
```

Snapshot JSON:

```rust
use serde::Serialize;

#[derive(Serialize)]
struct Report {
    passed: usize,
    failed: usize,
}

#[test]
fn report_shape_is_stable() {
    let report = Report { passed: 3, failed: 1 };
    insta::assert_json_snapshot!(report);
}
```

## Esempio pratico

Snapshot di una CLI:

```rust
#[test]
fn help_output_is_stable() {
    let output = "\
my-tool

Usage: my-tool <COMMAND>

Commands:
  check
  format
";

    insta::assert_snapshot!(output);
}
```

In un progetto reale l'output puo venire dall'esecuzione della CLI o da una funzione che renderizza help/report.

## Varianti

- **Snapshot testuale**: stringhe e output multilinea.
- **Snapshot JSON/YAML**: strutture serializzate.
- **Redazioni**: sostituiscono valori instabili.
- **Inline snapshot**: snapshot nel file sorgente.
- **CLI snapshot**: verifica stdout/stderr.
- **Snapshot review**: workflow esplicito di accettazione.

## Errori comuni

- Accettare snapshot senza leggerli.
- Salvare output troppo grande e poco significativo.
- Includere timestamp, path assoluti o ID casuali.
- Usare snapshot per dati dove basterebbe una assert semplice.
- Rendere il test fragile a dettagli non importanti.
- Non documentare il workflow di aggiornamento snapshot.
- Committare snapshot non revisionati.

## Checklist

- Lo snapshot e leggibile?
- L'output e stabile?
- I valori instabili sono redatti?
- La diff aiuta a capire la regressione?
- Il test non copre dettagli irrilevanti?
- Il workflow di review e chiaro?
- Gli snapshot sono committati quando devono esserlo?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Unit test]]
- [[Programmazione/Rust/Pagine/Integration test]]
- [[Programmazione/Rust/Pagine/Doc test]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/CLI con clap]]

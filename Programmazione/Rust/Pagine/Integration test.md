---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - "Integration test"
  - "Test di integrazione Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/Unit test]]"
  - "[[Programmazione/Rust/Pagine/Mocking]]"
  - "[[Programmazione/Rust/Pagine/cargo-nextest]]"
---

# Integration test

## Sintesi

Gli **integration test** in Rust vivono di solito nella cartella `tests/` e verificano la crate dall'esterno, come farebbe un utente della libreria. A differenza degli unit test, non accedono ai dettagli privati: usano solo API pubbliche.

Sono utili per verificare che moduli diversi collaborino correttamente e che l'interfaccia pubblica resti usabile.

## Quando usarlo

Usa integration test quando:

- vuoi testare il comportamento pubblico della crate;
- vuoi verificare flussi completi;
- vuoi testare una CLI, un backend o un modulo con piu componenti;
- vuoi evitare di dipendere da dettagli privati;
- devi proteggere compatibilita dell'API;
- vuoi testare configurazione, filesystem temporaneo o database di test.

Gli integration test non sostituiscono gli unit test: sono piu lenti ma piu vicini all'uso reale.

## Come funziona

Cargo tratta ogni file in `tests/` come un crate separato di test. Questo significa che il test importa la libreria usando il nome della crate, non `super::*`.

Struttura tipica:

```text
my_crate/
  src/
    lib.rs
  tests/
    api_test.rs
    cli_test.rs
```

I test in `tests/` possono condividere helper tramite moduli locali, ma bisogna evitare di trasformare i test in un framework parallelo troppo complesso.

## API / Sintassi

File `tests/api_test.rs`:

```rust
use my_crate::normalize_name;

#[test]
fn normalizes_names() {
    assert_eq!(normalize_name(" Luca "), "luca");
}
```

Esecuzione:

```powershell
cargo test
cargo test --test api_test
cargo test normalizes_names
```

Per test con risorse esterne, usa nomi chiari e isolamento tra casi.

## Esempio pratico

Testare un parser pubblico:

```rust
use my_crate::{parse_command, Command};

#[test]
fn parses_add_command() {
    let command = parse_command("add task").expect("command should parse");

    assert_eq!(
        command,
        Command::Add {
            title: "task".to_string()
        }
    );
}

#[test]
fn rejects_empty_input() {
    let error = parse_command("").expect_err("empty input should fail");
    assert_eq!(error.to_string(), "empty command");
}
```

Il test non sa come il parser e implementato: verifica solo il contratto pubblico.

## Varianti

- **API integration test**: verifica funzioni pubbliche.
- **CLI test**: esegue binari con argomenti e controlla output.
- **Database test**: usa database temporaneo o transazionale.
- **HTTP test**: avvia router o server in memoria.
- **End-to-end leggero**: attraversa piu layer senza servizi reali non necessari.
- **Test con fixture**: dati di input/versionati per casi complessi.

## Errori comuni

- Usare integration test per controllare funzioni private.
- Rendere i test dipendenti da ordine o stato condiviso.
- Richiedere servizi esterni non controllati.
- Non pulire file temporanei o database.
- Nascondere troppa logica negli helper di test.
- Testare output fragile invece di comportamento stabile.
- Eseguire test lenti in ogni ciclo locale senza separazione.

## Checklist

- Il test usa solo API pubbliche?
- Le risorse esterne sono isolate?
- Il fallimento indica chiaramente cosa non funziona?
- I dati di fixture sono piccoli e leggibili?
- I test lenti sono marcati o separati?
- La CLI/API viene testata come la userebbe un utente?
- Gli helper di test restano semplici?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Unit test]]
- [[Programmazione/Rust/Pagine/Doc test]]
- [[Programmazione/Rust/Pagine/Mocking]]
- [[Programmazione/Rust/Pagine/cargo-nextest]]
- [[Programmazione/Rust/Pagine/Public API design]]

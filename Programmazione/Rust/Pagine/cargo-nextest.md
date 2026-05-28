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
  - "cargo-nextest"
  - "nextest"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Unit test]]"
  - "[[Programmazione/Rust/Pagine/Integration test]]"
  - "[[Programmazione/Rust/Pagine/Cargo]]"
related:
  - "[[Programmazione/Rust/Pagine/Benchmarking con Criterion]]"
  - "[[Programmazione/Rust/Pagine/Clippy]]"
  - "[[Programmazione/Rust/Pagine/cargo deny]]"
---

# cargo-nextest

## Sintesi

`cargo-nextest` e un test runner alternativo per progetti Rust. Usa Cargo per compilare i test, poi li esegue con un modello separato da `cargo test`, spesso con output migliore, isolamento piu chiaro, retry, profili e configurazione avanzata.

Non sostituisce il sistema di test Rust: esegue test gia scritti con `#[test]`, integration test e test compatibili. Cambia soprattutto il modo in cui vengono orchestrati e riportati.

## Quando usarlo

Usa `cargo-nextest` quando:

- la suite di test e grande;
- vuoi output piu leggibile in CI;
- vuoi retry per test flaky mentre li stai correggendo;
- vuoi configurare timeout per gruppi di test;
- vuoi separare test lenti, seriali o sensibili all'ambiente;
- vuoi una gestione piu controllata della concorrenza.

Per progetti piccoli `cargo test` puo bastare.

## Come funziona

`cargo-nextest` compila i test tramite Cargo, scopre i test binari e poi li esegue con il proprio runner. Questo consente:

- esecuzione parallela piu controllata;
- profili di esecuzione;
- timeout;
- retry;
- output strutturato;
- configurazione per test specifici.

La configurazione puo vivere in `.config/nextest.toml`. In CI e comune usare `cargo nextest run` al posto di `cargo test`, mantenendo eventualmente `cargo test --doc` per doc test se necessario.

## API / Sintassi

Comandi tipici:

```powershell
cargo nextest run
cargo nextest run my_test_name
cargo nextest run --profile ci
```

Configurazione schematica:

```toml
[profile.default]
retries = 0
slow-timeout = "60s"

[profile.ci]
retries = 1
fail-fast = false
```

I profili permettono regole diverse tra sviluppo locale e CI.

## Esempio pratico

Pipeline locale:

```powershell
cargo fmt --check
cargo clippy --all-targets --all-features
cargo nextest run
cargo test --doc
```

Separare `cargo test --doc` e utile perche i doc test hanno un comportamento diverso dai test binari ordinari.

## Varianti

- **Profilo default**: esecuzione locale.
- **Profilo CI**: output e retry adatti a pipeline.
- **Test seriali**: per casi che condividono risorse.
- **Timeout per test lenti**: evita blocchi indefiniti.
- **Filter expression**: seleziona sottoinsiemi di test.
- **JUnit output**: utile per integrazioni CI.

## Errori comuni

- Pensare che nextest trovi bug diversi dai test esistenti.
- Usare retry per ignorare test flaky invece di correggerli.
- Dimenticare doc test se la pipeline sostituisce del tutto `cargo test`.
- Eseguire in parallelo test che condividono database, porte o file.
- Non configurare timeout in CI.
- Avere comportamento diverso tra locale e CI senza documentarlo.
- Non mantenere `cargo test` funzionante per workflow standard.

## Checklist

- La suite passa anche con `cargo test` quando serve?
- I doc test sono eseguiti?
- I test con risorse condivise sono serializzati o isolati?
- I timeout sono configurati?
- I retry sono temporanei e motivati?
- Il profilo CI e documentato?
- L'output e integrato nel sistema CI?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Unit test]]
- [[Programmazione/Rust/Pagine/Integration test]]
- [[Programmazione/Rust/Pagine/Doc test]]
- [[Programmazione/Rust/Pagine/Benchmarking con Criterion]]
- [[Programmazione/Rust/Pagine/Clippy]]
- [[Programmazione/Rust/Pagine/Cargo]]

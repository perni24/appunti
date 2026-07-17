---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - "Clippy"
  - "cargo clippy"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/rustfmt]]"
related:
  - "[[Programmazione/Rust/Pagine/cargo-nextest]]"
  - "[[Programmazione/Rust/Pagine/cargo deny]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
---

# Clippy

## Sintesi

Clippy e il linter ufficiale dell'ecosistema Rust. Aggiunge lint oltre a quelli del compilatore per individuare errori comuni, codice non idiomatico, pattern sospetti, inefficienze e semplificazioni possibili.

Non e un sostituto della review: e un controllo automatico che aiuta a mantenere qualita uniforme.

## Quando usarlo

Usa Clippy:

- prima di aprire una PR;
- in CI;
- quando vuoi migliorare idiomaticita del codice;
- per intercettare errori comuni;
- su tutti i target e feature rilevanti;
- quando mantieni librerie pubbliche.

Conviene trattare alcuni lint come errori in CI, ma con attenzione: nuove versioni possono introdurre nuovi warning.

## Come funziona

Clippy analizza il codice Rust usando il compilatore e segnala lint divisi in categorie. Alcuni lint sono sempre utili, altri sono opinabili o dipendono dal contesto.

Comando tipico:

```powershell
cargo clippy --all-targets --all-features
```

Per rendere i warning errori:

```powershell
cargo clippy --all-targets --all-features -- -D warnings
```

`-D warnings` e utile in CI, ma puo rendere la pipeline sensibile ad aggiornamenti della toolchain.

## API / Sintassi

Attributi per configurare lint:

```rust
#![warn(clippy::pedantic)]
#![allow(clippy::module_name_repetitions)]
```

Su un blocco specifico:

```rust
#[allow(clippy::too_many_arguments)]
fn build_query(
    table: &str,
    select: &[&str],
    filters: &[&str],
    order_by: &[&str],
    limit: Option<u32>,
    offset: Option<u32>,
) {
    // Caso giustificato o da rifattorizzare.
}
```

Ogni `allow` dovrebbe essere motivato quando non e ovvio.

## Esempio pratico

Pipeline di controllo:

```powershell
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-features
```

Questo ordine evita di discutere stile e lint durante test falliti per problemi piu banali.

## Varianti

- **clippy::all**: set di lint comune.
- **clippy::pedantic**: piu severo e opinabile.
- **clippy::nursery**: lint sperimentali.
- **clippy::cargo**: lint su metadata e packaging.
- **Allow locale**: disabilita lint in punto specifico.
- **CI strict**: `-D warnings`.

## Errori comuni

- Applicare `allow` a livello crate senza motivo.
- Trattare ogni suggerimento come obbligatorio.
- Usare `-D warnings` senza fissare o controllare toolchain.
- Eseguire Clippy solo sul target default.
- Ignorare feature alternative.
- Confondere lint stilistici con bug certi.
- Rendere il codice meno chiaro solo per soddisfare un lint.

## Checklist

- Clippy gira in CI?
- Include `--all-targets`?
- Include le feature rilevanti?
- Gli `allow` sono localizzati?
- I lint severi sono scelti consapevolmente?
- La toolchain e gestita?
- La review valuta anche il senso del suggerimento?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/rustfmt]]
- [[Programmazione/Rust/Pagine/cargo-nextest]]
- [[Programmazione/Rust/Pagine/cargo deny]]
- [[Programmazione/Rust/Pagine/Public API design]]
- [[Programmazione/Rust/Pagine/Cargo]]

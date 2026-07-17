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
  - "rustfmt"
  - "cargo fmt"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
related:
  - "[[Programmazione/Rust/Pagine/Clippy]]"
  - "[[Programmazione/Rust/Pagine/rustdoc]]"
  - "[[Programmazione/Rust/Pagine/cargo-nextest]]"
---

# rustfmt

## Sintesi

`rustfmt` e il formatter ufficiale per codice Rust. Formatta automaticamente sorgenti Rust secondo uno stile coerente, riducendo discussioni manuali su spazi, indentazione, wrapping e layout.

Di solito viene invocato con `cargo fmt`, che applica il formatter al workspace o al package corrente.

## Quando usarlo

Usa `rustfmt`:

- prima di committare codice;
- in CI con controllo `--check`;
- dopo refactor meccanici;
- in progetti condivisi;
- quando vuoi ridurre rumore nelle review;
- insieme a Clippy e test.

Non dovrebbe essere un'attivita manuale: va integrato nell'editor o nella pipeline.

## Come funziona

`rustfmt` legge file Rust, costruisce una rappresentazione del codice e riscrive layout e spaziatura. Non cambia la semantica intenzionalmente, ma puo modificare molto la forma.

Comandi principali:

```powershell
cargo fmt
cargo fmt --check
```

`--check` non modifica file: fallisce se il codice non e formattato. E la forma adatta alla CI.

## API / Sintassi

Configurazione opzionale in `rustfmt.toml`:

```toml
max_width = 100
edition = "2024"
```

Nella maggior parte dei progetti conviene mantenere configurazione minima, usando i default ufficiali.

Disabilitare formattazione in casi rari:

```rust
#[rustfmt::skip]
const TABLE: &[(&str, &str)] = &[
    ("short",        "aligned"),
    ("much_longer",  "aligned"),
];
```

Usare `skip` con parsimonia: rende lo stile meno uniforme.

## Esempio pratico

Pipeline tipica:

```powershell
cargo fmt --check
cargo clippy --all-targets --all-features
cargo test
```

In locale:

```powershell
cargo fmt
```

Poi controlli il diff per verificare che il formatter non abbia reso meno leggibile una sezione delicata.

## Varianti

- **cargo fmt**: uso standard nel progetto.
- **rustfmt diretto**: formatta file specifici.
- **rustfmt.toml**: configurazione del progetto.
- **format on save**: integrazione editor.
- **CI check**: impedisce codice non formattato.
- **skip locale**: eccezione limitata.

## Errori comuni

- Discutere stile manualmente invece di usare il formatter.
- Avere configurazioni diverse tra sviluppatori.
- Usare troppe opzioni custom senza motivo.
- Dimenticare `cargo fmt --check` in CI.
- Committare refactor e formattazione non correlata insieme.
- Usare `rustfmt::skip` per evitare di sistemare codice troppo complesso.
- Formattare codice generato che non dovrebbe essere modificato.

## Checklist

- `cargo fmt --check` gira in CI?
- L'editor formatta con la stessa toolchain?
- La configurazione e minima?
- Il codice generato e escluso se necessario?
- I diff di formattazione sono separati da refactor grandi?
- Gli skip sono rari e motivati?
- Il team usa lo stesso standard?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Clippy]]
- [[Programmazione/Rust/Pagine/rustdoc]]
- [[Programmazione/Rust/Pagine/cargo-nextest]]
- [[Programmazione/Rust/Pagine/Cargo]]

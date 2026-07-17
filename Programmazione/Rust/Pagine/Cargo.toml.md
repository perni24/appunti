---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - cargo-editions-e-compatibilita
aliases:
  - "Manifest Cargo"
  - "Cargo manifest"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
related:
  - "[[Programmazione/Rust/Pagine/Cargo.lock]]"
  - "[[Programmazione/Rust/Pagine/Cargo features]]"
  - "[[Programmazione/Rust/Pagine/Workspace dependencies]]"
---

# Cargo.toml

## Sintesi

`Cargo.toml` e il manifest di un package Rust. Contiene metadati del package, edition, dipendenze, feature, target, profili di build e configurazione del workspace.

E il file principale che Cargo legge per capire come compilare e pubblicare il progetto.

## Quando usarlo

- Quando dichiari nome, versione, edition e licenza del package.
- Quando aggiungi dipendenze normali, dev-dependencies o build-dependencies.
- Quando definisci feature opzionali.
- Quando configuri workspace, binari, librerie o profili.
- Quando prepari una crate per la pubblicazione.

## Come funziona

Esempio minimo:

```toml
[package]
name = "my-crate"
version = "0.1.0"
edition = "2024"

[dependencies]
serde = { version = "1", features = ["derive"] }
```

Cargo usa le informazioni del manifest per risolvere dipendenze, invocare `rustc`, generare metadata e decidere cosa includere nel package.

## API / Sintassi

Sezioni comuni:

```toml
[package]
name = "app"
version = "0.1.0"
edition = "2024"
license = "MIT OR Apache-2.0"

[dependencies]
anyhow = "1"

[dev-dependencies]
pretty_assertions = "1"

[build-dependencies]
cc = "1"
```

Target:

```toml
[lib]
path = "src/lib.rs"
```

Per target binari espliciti si usa la tabella array TOML `bin`; conviene aggiungerla solo quando il layout standard `src/main.rs` non basta.

## Esempio pratico

```toml
[package]
name = "cli-notes"
version = "0.1.0"
edition = "2024"
description = "CLI per gestire note markdown"
license = "MIT"

[dependencies]
clap = { version = "4", features = ["derive"] }
anyhow = "1"

[dev-dependencies]
tempfile = "3"
```

Questa configurazione dichiara una CLI con parsing argomenti, error handling applicativo e supporto test su file temporanei.

## Varianti

- `[dependencies]`: dipendenze runtime/build normali.
- `[dev-dependencies]`: dipendenze usate solo da test, esempi e benchmark.
- `[build-dependencies]`: dipendenze del build script.
- `[features]`: feature opzionali.
- `[workspace]`: configurazione workspace.
- `[profile.*]`: ottimizzazioni e debug info.

## Errori comuni

- Lasciare edition implicita o vecchia senza motivo.
- Abilitare feature di dipendenze troppo ampie.
- Mettere dipendenze di test in `[dependencies]`.
- Non dichiarare licenza o repository per crate pubbliche.
- Confondere feature del proprio crate con feature delle dipendenze.

## Checklist

- `name`, `version` ed `edition` sono corretti?
- Le dipendenze sono nella sezione giusta?
- Le feature sono documentate e minimali?
- La licenza e dichiarata se la crate e pubblica?
- Il manifest funziona anche da workspace?

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]
- [[Programmazione/Rust/Pagine/Workspace dependencies|Workspace dependencies]]

---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - cargo-editions-e-compatibilita
aliases:
  - "SemVer"
  - "Versionamento semantico"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
  - "[[Programmazione/Rust/Pagine/Crates.io]]"
related:
  - "[[Programmazione/Rust/Pagine/Cargo.lock]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
  - "[[Programmazione/Rust/Pagine/Compatibility e breaking changes]]"
---

# Semantic Versioning

## Sintesi

Semantic Versioning, spesso abbreviato SemVer, usa versioni nel formato `MAJOR.MINOR.PATCH`. In Rust e importante per comunicare compatibilita delle crate e per permettere a Cargo di risolvere dipendenze in modo prevedibile.

La regola pratica: incrementa `PATCH` per fix compatibili, `MINOR` per nuove feature compatibili, `MAJOR` per breaking changes.

## Quando usarlo

- Quando pubblichi crate su crates.io.
- Quando decidi se una modifica rompe la API pubblica.
- Quando imposti vincoli di versione in `Cargo.toml`.
- Quando aggiorni dipendenze e vuoi capire il rischio.

## Come funziona

Versione:

```text
1.4.2
```

- `1`: major.
- `4`: minor.
- `2`: patch.

In Cargo, il vincolo:

```toml
serde = "1.0"
```

e una requirement compatibile: accetta versioni compatibili secondo le regole Cargo/SemVer, ma non un nuovo major incompatibile.

## API / Sintassi

Vincoli comuni:

```toml
[dependencies]
serde = "1"
tokio = "1.37"
my-crate = "0.3.2"
```

Requirement piu esplicite:

```toml
crate_a = "^1.2.3"
crate_b = "~1.2"
crate_c = ">=1.2, <2.0"
```

## Esempio pratico

Modifica compatibile:

```rust
pub fn parse(input: &str) -> Result<Value, Error>
```

Aggiungere una nuova funzione pubblica e tipicamente una minor release.

Breaking change:

```rust
pub fn parse(input: &str, strict: bool) -> Result<Value, Error>
```

Cambiare la firma di una funzione pubblica richiede una major release, perche rompe i chiamanti.

## Varianti

- `PATCH`: bugfix compatibili.
- `MINOR`: nuove API compatibili.
- `MAJOR`: breaking changes.
- Versioni `0.x`: in Cargo hanno compatibilita piu stretta; `0.2` e `0.3` non sono considerate compatibili.
- Pre-release: versioni come `1.0.0-alpha.1`.

## Errori comuni

- Trattare `0.x` come se avesse le stesse regole pratiche di `1.x`.
- Fare breaking changes in una minor release.
- Dimenticare che cambiare trait pubblici puo rompere utenti.
- Esportare dettagli interni e poi non poterli cambiare.
- Aggiornare dipendenze major senza testare integrazione.

## Checklist

- La modifica cambia API pubblica?
- Aggiunge obblighi a chi implementa un trait?
- Cambia comportamento documentato?
- La crate e ancora `0.x` o gia stabile?
- Il changelog comunica compatibilita e breaking changes?

## Collegamenti

- [[Programmazione/Rust/Pagine/Crates.io|Crates.io]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]

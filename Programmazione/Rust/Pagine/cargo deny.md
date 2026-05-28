---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - testing-qualita-e-sicurezza
aliases:
  - "cargo deny"
  - "cargo-deny"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo.lock]]"
  - "[[Programmazione/Rust/Pagine/cargo audit]]"
  - "[[Programmazione/Rust/Pagine/Workspace]]"
related:
  - "[[Programmazione/Rust/Pagine/Crates.io]]"
  - "[[Programmazione/Rust/Pagine/Semantic Versioning]]"
  - "[[Programmazione/Rust/Pagine/Packaging e release]]"
---

# cargo deny

## Sintesi

`cargo deny` e uno strumento per applicare policy sulle dipendenze Rust. Controlla advisory di sicurezza, licenze, sorgenti delle crate, duplicati e regole organizzative sul grafo delle dipendenze.

Rispetto a `cargo audit`, copre un perimetro piu ampio: non solo vulnerabilita note, ma anche compliance, supply chain e igiene del dependency graph.

## Quando usarlo

Usa `cargo deny` quando:

- hai un progetto professionale o distribuito;
- devi controllare licenze ammesse;
- vuoi bloccare sorgenti non autorizzate;
- vuoi gestire advisory e ban di crate;
- vuoi ridurre duplicati nel grafo delle dipendenze;
- lavori in workspace con molte crate;
- devi rendere esplicite decisioni di supply chain.

Per progetti piccoli puo sembrare pesante, ma diventa utile appena le dipendenze crescono.

## Come funziona

`cargo deny` legge metadata Cargo e lockfile, poi applica controlli configurati in un file, di solito `deny.toml`.

Categorie comuni:

- **advisories**: vulnerabilita note;
- **licenses**: licenze consentite o negate;
- **bans**: crate vietate, versioni multiple, wildcard;
- **sources**: registri e sorgenti autorizzate;
- **duplicates**: versioni multiple della stessa crate.

Il valore principale e rendere le decisioni esplicite e versionate nel repository.

## API / Sintassi

Installazione:

```powershell
cargo install cargo-deny
```

Inizializzazione:

```powershell
cargo deny init
```

Esecuzione:

```powershell
cargo deny check
cargo deny check advisories
cargo deny check licenses
```

Esempio schematico di `deny.toml`:

```toml
[licenses]
allow = ["MIT", "Apache-2.0"]

[advisories]
ignore = []
```

La configurazione reale va adattata alla policy del progetto.

## Esempio pratico

Pipeline CI:

```powershell
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo nextest run
cargo deny check
```

Se `cargo deny` fallisce per una licenza o advisory, la soluzione non e ignorare: bisogna scegliere se aggiornare, sostituire, documentare eccezione o modificare policy.

## Varianti

- **Advisory check**: simile a audit, ma dentro policy unica.
- **License check**: compliance licenze.
- **Bans**: vieta crate o versioni multiple.
- **Sources**: limita registry, git e path.
- **Workspace policy**: regole comuni a piu crate.
- **CI gate**: blocca merge o release.

## Errori comuni

- Copiare una configurazione senza capirla.
- Bloccare licenze necessarie senza processo di eccezione.
- Ignorare advisory in modo permanente.
- Non aggiornare policy quando cambia il progetto.
- Fallire su duplicati innocui senza valutare costo di risoluzione.
- Dimenticare dipendenze opzionali o feature.
- Trattare `cargo deny` come sostituto di review e threat modeling.

## Checklist

- Esiste un `deny.toml` versionato?
- Le licenze ammesse sono coerenti con il progetto?
- Advisory e ignore sono revisionati?
- Le sorgenti autorizzate sono esplicite?
- I duplicati sono monitorati?
- Il check gira in CI?
- Esiste una procedura per eccezioni motivate?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/cargo audit]]
- [[Programmazione/Rust/Pagine/Cargo.lock]]
- [[Programmazione/Rust/Pagine/Crates.io]]
- [[Programmazione/Rust/Pagine/Semantic Versioning]]
- [[Programmazione/Rust/Pagine/Packaging e release]]
- [[Programmazione/Rust/Pagine/Workspace]]

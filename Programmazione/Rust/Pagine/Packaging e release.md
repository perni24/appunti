---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - cli-e-tooling
aliases:
  - "Packaging e release"
  - "Release Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
  - "[[Programmazione/Rust/Pagine/Semantic Versioning]]"
related:
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
  - "[[Programmazione/Rust/Pagine/Cross-compilation]]"
  - "[[Programmazione/Rust/Pagine/Crates.io]]"
  - "[[Programmazione/Rust/Pagine/cargo audit]]"
  - "[[Programmazione/Rust/Pagine/cargo deny]]"
---

# Packaging e release

## Sintesi

**Packaging e release** coprono il processo con cui un progetto Rust diventa un artefatto distribuibile: crate pubblicata, binario CLI, libreria, container, pacchetto per sistema operativo o archivio scaricabile.

In Rust la base e Cargo, ma una release affidabile richiede anche versioning, changelog, profili di build, controlli di qualita, gestione delle dipendenze, cross-compilation e strategia di distribuzione.

## Quando usarlo

Serve ragionare su packaging e release quando:

- pubblichi una crate su crates.io;
- distribuisci una CLI a utenti finali;
- devi produrre binari per piu piattaforme;
- vuoi release ripetibili in CI;
- devi firmare, comprimere o allegare artefatti;
- vuoi evitare rotture accidentali di API pubbliche;
- devi gestire sicurezza delle dipendenze.

Per codice privato o sperimentale puo bastare `cargo build --release`. Per un progetto usato da altri, la release diventa parte dell'API.

## Come funziona

Una release Rust solida passa tipicamente da:

1. aggiornamento versione;
2. aggiornamento changelog;
3. test e lint;
4. verifica dipendenze;
5. build release;
6. packaging degli artefatti;
7. pubblicazione;
8. tagging Git;
9. eventuale annuncio o documentazione.

Per crate pubbliche, `Cargo.toml` deve contenere metadati adeguati: `description`, `license`, `repository`, `readme`, `keywords` e `categories` quando utili.

Per binari, devi decidere:

- target supportati;
- naming degli artefatti;
- formato di distribuzione;
- compatibilita minima;
- dipendenze runtime;
- strategia di installazione.

## API / Sintassi

Comandi comuni:

```powershell
cargo fmt --check
cargo clippy --all-targets --all-features
cargo test --all-features
cargo build --release
cargo publish --dry-run
cargo publish
```

Metadati essenziali in `Cargo.toml`:

```toml
[package]
name = "my-tool"
version = "0.1.0"
edition = "2024"
description = "A command line tool for processing notes"
license = "MIT OR Apache-2.0"
repository = "https://example.com/my-tool"
readme = "README.md"
```

Profilo release:

```toml
[profile.release]
lto = "thin"
strip = "symbols"
codegen-units = 1
```

Queste impostazioni vanno misurate: possono migliorare dimensione o performance, ma aumentare i tempi di build.

## Esempio pratico

Checklist minima per una CLI:

```powershell
cargo fmt --check
cargo clippy --all-targets --all-features
cargo test --all-features
cargo build --release
```

Poi verifica l'artefatto:

```powershell
target\release\my-tool.exe --help
target\release\my-tool.exe --version
```

Per una crate pubblica:

```powershell
cargo publish --dry-run
```

Il dry run intercetta molti problemi prima della pubblicazione effettiva, come file mancanti, metadati incompleti o packaging inatteso.

## Varianti

- **Crate library**: pubblicata su crates.io, API semver centrale.
- **CLI binaria**: artefatti per piattaforme specifiche.
- **Workspace release**: versioni coordinate tra piu crate.
- **Container image**: utile per servizi backend.
- **Static binary**: spesso desiderabile per distribuzione semplice.
- **Installer o package manager**: utile per utenti non Rust.
- **Release automatizzata in CI**: riduce errori manuali.

## Errori comuni

- Pubblicare senza `cargo publish --dry-run`.
- Dimenticare file necessari nel pacchetto.
- Cambiare API pubbliche senza aggiornare versione secondo SemVer.
- Distribuire binari non testati sul target reale.
- Non verificare licenze e vulnerabilita delle dipendenze.
- Mettere credenziali o file locali nel pacchetto.
- Assumere che `--release` basti per un artefatto pronto alla distribuzione.

## Checklist

- Versione e changelog sono aggiornati?
- Test, formatter e lint passano?
- Le dipendenze sono controllate?
- `Cargo.toml` contiene metadati corretti?
- La build release e ripetibile?
- Gli artefatti funzionano sul target previsto?
- La pubblicazione ha un dry run?
- Il tag Git corrisponde alla versione pubblicata?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml]]
- [[Programmazione/Rust/Pagine/Build profiles]]
- [[Programmazione/Rust/Pagine/Semantic Versioning]]
- [[Programmazione/Rust/Pagine/Crates.io]]
- [[Programmazione/Rust/Pagine/Cross-compilation]]
- [[Programmazione/Rust/Pagine/cargo audit]]
- [[Programmazione/Rust/Pagine/cargo deny]]
- [[Programmazione/Rust/Pagine/CLI con clap]]

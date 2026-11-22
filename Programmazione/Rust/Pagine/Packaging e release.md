---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - cli-e-tooling
aliases:
  - Packaging e release
  - Release Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo|Cargo]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]"
  - "[[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]"
related:
  - "[[Programmazione/Rust/Pagine/Build profiles|Build profiles]]"
  - "[[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]"
  - "[[Programmazione/Rust/Pagine/Crates.io|Crates.io]]"
  - "[[Programmazione/Rust/Pagine/cargo audit|cargo audit]]"
  - "[[Programmazione/Rust/Pagine/cargo deny|cargo deny]]"
title: Packaging e release
---

# Packaging e release

## Sintesi

**`cargo build --release` sceglie un profilo di compilazione, non pubblica una release.** Prima di compilare, scegli cosa consegnare e a chi:

| Destinatario | Cosa riceve | Come lo usa |
| --- | --- | --- |
| Chi sviluppa in Rust o installa la CLI con Cargo | Un pacchetto sorgente `.crate` | Cargo risolve le dipendenze e compila; servono toolchain ed eventuali librerie di sistema. |
| Chi vuole eseguire subito la CLI | Un archivio per uno specifico sistema, architettura e ABI | Estrae il binario e lo avvia. Non serve Cargo; potrebbero servire librerie di runtime. |
| Chi distribuisce un servizio o amministra macchine | Un'immagine container o un pacchetto di sistema | Il formato determina come installare, aggiornare e dichiarare le dipendenze. Un eseguibile da solo non definisce queste operazioni. |

Un **tag Git** identifica il commit scelto. Una **GitHub Release** può associare a quel tag le note di rilascio e i binari che alleghi. Gli archivi del *codice sorgente* offerti automaticamente da GitHub non sono i binari e non sono il pacchetto preparato da Cargo.

## Esempio pratico

Prepariamo due artefatti dalla stessa CLI senza inviare nulla in rete. I percorsi assumono la directory di output predefinita di Cargo. Per i sorgenti serve Rust con edition 2024 (1.85 o successiva); per lo ZIP mostrato più avanti servono Windows x64, toolchain MSVC, linker e PowerShell.

### 1. Una versione sola nel manifest

Crea un progetto di prova fuori dagli altri repository. Tutti i comandi successivi vanno eseguiti dalla directory `etichetta-build` appena creata.

```sh
cargo new --bin --edition 2024 --vcs none etichetta-build
```

Usa questo `Cargo.toml`:

```toml
[package]
name = "etichetta-build"
version = "0.1.0"
edition = "2024"
description = "Mostra la versione incorporata nel binario"
readme = "README.md"
license-file = "LICENSE.txt"
include = ["src/**", "Cargo.toml", "Cargo.lock", "README.md", "LICENSE.txt"]
```

Crea `README.md` con le istruzioni d'uso e `LICENSE.txt` con il testo della licenza scelta per il tuo codice. La lista `include` riguarda il pacchetto **sorgente**, non seleziona i file dello ZIP. Se il progetto usa template, migrazioni o altri dati a runtime, decidi esplicitamente come distribuirli.

Sostituisci `src/main.rs` con questa CLI minima: invocata senza argomenti, stampa l'identità della build su stdout e termina.

```rust
fn main() {
    println!("{} {}", env!("CARGO_PKG_NAME"), env!("CARGO_PKG_VERSION"));
}
```

Se il lockfile non esiste, crealo prima di usare `--locked`. In un'applicazione conserva `Cargo.lock` in Git: `--locked` fa fallire il comando se Cargo deve crearlo o modificarlo. Non fissa linker, toolchain o librerie native e non promette binari identici byte per byte.

```sh
cargo generate-lockfile
```

### 2. Percorso sorgente: cosa finisce nel pacchetto?

Elenca i file prima di creare l'archivio. Devono esserci codice, README e licenza; non devono esserci configurazioni personali o credenziali. Cargo normalizza il manifest e può aggiungere file generati: la lista effettiva conta più di una lettura di `.gitignore`.

```sh
cargo package --list --locked
```

Crea il pacchetto. Per impostazione predefinita Cargo lo estrae e verifica che compili. Il risultato, `target/package/etichetta-build-0.1.0.crate`, contiene **sorgenti**, non l'eseguibile. La verifica non sostituisce i test della CLI.

```sh
cargo package --locked
```

**Solo per un progetto destinato a un registry**, simula il passaggio successivo. Il dry run può contattare il registry, ma non carica la crate, non riserva il nome e non garantisce i permessi di pubblicazione. Per caricamento reale, versioni e yank vedi [[Programmazione/Rust/Pagine/Crates.io|Crates.io]].

```sh
cargo publish --dry-run --locked
```

### 3. Percorso binario: costruire e provare lo ZIP

Questa build indica esplicitamente il target Windows x64 MSVC. Con `--target` Cargo inserisce il *target triple* nel percorso; con il solo `cargo build --release` il binario per l'host è normalmente in `target/release/`.

```powershell
cargo build --release --locked --target x86_64-pc-windows-msvc
```

In PowerShell comprimi **il file eseguibile**, README e licenza, non la cartella del progetto. Il nome dello ZIP riporta versione e target; su altri sistemi cambiano binario, nome dell'archivio e prova richiesta.

```powershell
Compress-Archive -LiteralPath .\target\x86_64-pc-windows-msvc\release\etichetta-build.exe, .\README.md, .\LICENSE.txt -DestinationPath .\etichetta-build-0.1.0-x86_64-pc-windows-msvc.zip
```

Estrai lo ZIP in una cartella nuova e vuota. Così controlli anche di non aver impacchettato una sottocartella o un altro eseguibile.

```powershell
Expand-Archive -LiteralPath .\etichetta-build-0.1.0-x86_64-pc-windows-msvc.zip -DestinationPath .\prova-release
```

```powershell
.\prova-release\etichetta-build.exe
```

Output atteso: **`etichetta-build 0.1.0`**, codice di uscita 0. Questa prova verifica il contenuto dell'archivio sull'host di build. Per dichiarare il target supportato, ripetila su una macchina pulita rappresentativa dell'ambiente minimo: una DLL già installata sul runner potrebbe mancare all'utente.

Calcola il digest **dello ZIP finale**, non del solo eseguibile. L'utente può confrontarlo con un valore atteso ottenuto da una fonte fidata. Un hash distribuito accanto a un archivio sostituibile non è una firma e non dimostra chi lo abbia prodotto.

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath .\etichetta-build-0.1.0-x86_64-pc-windows-msvc.zip
```

## Checklist di rilascio

1. **Prima del tag:** scegli la versione secondo [[Programmazione/Rust/Pagine/Semantic Versioning|SemVer]], aggiorna il changelog e verifica che il commit contenga manifest, lockfile e sorgenti previsti. In un workspace specifica il pacchetto con `-p nome` quando non vuoi operare sui membri predefiniti.
2. **Sul commit da distribuire:** esegui `cargo fmt --check`, poi Clippy e test con le feature realmente supportate. `--all-features` non è un test sensato se due feature sono mutuamente esclusive. Controlla anche licenze e avvisi delle dipendenze.
3. **Per ogni target promesso:** compila e prova l'archivio finale su quel target. LTO, stripping e linking statico sono scelte da misurare, non requisiti per una release. Compilare da un altro sistema non dimostra che il programma si avvii sul sistema destinatario.
4. **Al momento della pubblicazione:** associa tag, versione del manifest, changelog e artefatti allo stesso commit. Allega gli archivi per target e i relativi digest alla release; carica una crate sul registry solo se prevedi anche quel canale. Non sovrascrivere i file già consegnati per correggere un errore: prepara una nuova versione.

## Fonti ufficiali

- [Cargo: cosa fa cargo package e come verifica il pacchetto](https://doc.rust-lang.org/cargo/commands/cargo-package.html)
- [Cargo: comportamento di cargo publish e del dry run](https://doc.rust-lang.org/cargo/commands/cargo-publish.html)
- [Cargo: directory degli artefatti per host e target esplicito](https://doc.rust-lang.org/cargo/reference/build-cache.html)
- [GitHub: differenza tra tag, sorgenti e asset di una release](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]
- [[Programmazione/Rust/Pagine/Crates.io|Crates.io]]
- [[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]
- [[Programmazione/Rust/Pagine/cargo audit|cargo audit]]
- [[Programmazione/Rust/Pagine/cargo deny|cargo deny]]
- [[Programmazione/Rust/Pagine/CLI con clap|CLI con clap]]

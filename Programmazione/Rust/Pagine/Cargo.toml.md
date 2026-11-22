---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - rust
  - cargo-editions-e-compatibilita
aliases:
  - Manifest Cargo
  - Cargo manifest
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
related:
  - "[[Programmazione/Rust/Pagine/Cargo.lock]]"
  - "[[Programmazione/Rust/Pagine/Cargo features]]"
  - "[[Programmazione/Rust/Pagine/Workspace dependencies]]"
title: Cargo.toml
---

# Cargo.toml

## Sintesi

`Cargo.toml` e il **manifest** che descrive un package Rust: identita, dipendenze, target compilabili e opzioni condivise del progetto. Puo anche descrivere un workspace.

Il manifest **configura** il progetto: aggiungere `clap` non crea un parser di argomenti, dichiarare `cc` non compila automaticamente file C e una feature non implementa da sola una funzionalita. Serve il relativo codice.

## Quando usarlo

- Per cambiare nome, versione, edition e metadati del package.
- Per aggiungere dipendenze distinguendo codice normale, test e build script.
- Per configurare libreria, binari, feature e lint del package.
- Per centralizzare impostazioni di workspace o preparare una pubblicazione.

Per i comandi quotidiani parti da [[Programmazione/Rust/Pagine/Cargo|Cargo]]; qui interessa capire **cosa scrivere nel file e quale effetto produce**.

## Come funziona

### Manifest, lockfile e configurazione non sono lo stesso file

| File | Responsabilita |
| --- | --- |
| `Cargo.toml` | Dichiara package, requisiti delle dipendenze e target |
| `Cargo.lock` | Registra le versioni e le sorgenti risolte; vedi [[Programmazione/Rust/Pagine/Cargo.lock\|Cargo.lock]] |
| `.cargo/config.toml` | Configura Cargo: per esempio alias, linker e directory degli output |
| `rust-toolchain.toml` | Indica una toolchain a rustup, secondo le sue regole di precedenza |

Una tabella `[build]` con `jobs` appartiene alla configurazione Cargo, non al manifest. Il campo `package.build` del manifest, invece, indica il **build script**: nomi simili, scopi diversi. [Configurazione Cargo](https://doc.rust-lang.org/cargo/reference/config.html), [selezione della toolchain](https://rust-lang.github.io/rustup/overrides.html#the-toolchain-file).

### Nome, versione, edition e MSRV

- `name` identifica il package.
- `version` e la versione del **tuo package**, non quella del compilatore.
- `edition` sceglie le regole dell'edizione Rust.
- `rust-version` dichiara la versione minima di Rust supportata, detta MSRV.

Non confondere `edition = "2024"` con Rust 2.024 o con un aggiornamento automatico del compilatore. Se ometti edition dal manifest, il default resta **2015**, anche se `cargo new` genera oggi progetti con edition 2024.

Nelle versioni correnti di Cargo, l'unico campo obbligatorio dentro `[package]` e `name`: da Cargo 1.75, `version` omessa vale `0.0.0`. Per pubblicare serve una versione dichiarata. Conviene indicare comunque versione ed edition esplicitamente. Questi requisiti riguardano i metadati: servono anche sorgenti/target validi. [Formato del manifest](https://doc.rust-lang.org/cargo/reference/manifest.html).

`rust-version` non installa un compilatore e non dimostra che il progetto funzioni sulla versione dichiarata: va verificata anche con dipendenze e feature supportate. Cargo normalmente rifiuta una toolchain troppo vecchia. [Rust version](https://doc.rust-lang.org/cargo/reference/rust-version.html).

### Le tabelle TOML hanno uno scope

Una chiave dopo `[package]` appartiene a quella tabella fino alla successiva intestazione. Una riga vuota **non** torna al livello principale.

- `[lib]` e una tabella singola.
- `[[bin]]` introduce un elemento di una lista di tabelle: puoi ripeterla per piu binari.
- Le versioni sono stringhe, per esempio `"0.1.0"`; `publish = false` usa invece un booleano.
- Non ripetere la stessa tabella normale per aggiungere campi: modificala nel punto in cui esiste gia.

Una chiave nella tabella sbagliata puo causare un errore oppure un avviso di chiave inutilizzata. Un comando riuscito non basta se Cargo sta ignorando la configurazione desiderata. [Sintassi TOML](https://toml.io/en/v1.0.0#table).

## API / Sintassi

### Dipendenze normali, di sviluppo e di build

| Sezione | Dove e disponibile la dipendenza |
| --- | --- |
| `[dependencies]` | Codice della libreria e dei binari; utilizzabile anche da test ed esempi |
| `[dev-dependencies]` | Test, esempi e benchmark; non dal normale codice della libreria |
| `[build-dependencies]` | Build script, normalmente `build.rs`; non automaticamente dal programma |

Le dipendenze di sviluppo non si propagano ai progetti che usano la tua libreria. Le dipendenze del build script sono compilate per la macchina **host**, dove lo script viene eseguito; il programma puo essere compilato per un'altra piattaforma.

Una dipendenza normale non diventa automaticamente importabile in `build.rs`. Se serve in entrambi i contesti, va dichiarata in entrambe le sezioni. Evita la scorciatoia "dependencies = solo runtime": per esempio le procedural macro lavorano durante la compilazione. [Dichiarare dipendenze](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html).

### Manifest alternativo con librerie esterne

Questo e un **esempio dichiarativo separato** dal progetto eseguibile piu sotto. Presuppone almeno `src/main.rs`; per usare `cc` occorrerebbe anche un build script scritto appositamente. Non aggiungere queste librerie se non servono.

```toml
[package]
name = "cli-notes"
version = "0.1.0"
edition = "2024"
description = "CLI didattica per note Markdown"
license = "MIT OR Apache-2.0"
publish = false

[dependencies]
clap = { version = "4", features = ["derive"] }
anyhow = "1"
serde = { version = "1", features = ["derive"] }

[dev-dependencies]
tempfile = "3"
pretty_assertions = "1"

[build-dependencies]
cc = "1"
```

Il manifest rende disponibili librerie per parsing degli argomenti, gestione degli errori e serializzazione, ma **non contiene il codice** che le usa. `tempfile` e `pretty_assertions` sono scelte per i test; `cc` e un possibile strumento del build script. Vedi gli esempi ufficiali di [clap](https://docs.rs/clap/latest/clap/), [Serde](https://serde.rs/derive.html) e [cc](https://docs.rs/cc/latest/cc/).

`features = ["derive"]` abilita feature della **dipendenza indicata**, non una feature del tuo package. Le feature predefinite della dipendenza rimangono abilitate salvo richiesta esplicita di `default-features = false`; altre dipendenze possono comunque riabilitarle. [Cargo features](https://doc.rust-lang.org/cargo/reference/features.html).

Qui `license` illustra una scelta possibile: usa soltanto la licenza realmente applicabile al tuo codice e aggiungi i testi necessari. La stringa nel manifest non crea i file di licenza. `publish = false` impedisce la pubblicazione Cargo, non rende privati Git o i sorgenti.

### Requisiti di versione e sorgenti

`version = "1.2.3"` in una dipendenza significa un requisito compatibile, equivalente a `^1.2.3`: da `1.2.3` inclusa a `2.0.0` esclusa. `"0.2.3"` consente invece aggiornamenti inferiori a `0.3.0`.

Per richiedere esattamente una versione esiste `"=1.2.3"`, ma non e un sostituto generale del lockfile. Non irrigidire tutti i requisiti senza una ragione.

Oltre al registry, Cargo supporta dipendenze `path` e `git`. Un `path` e relativo alla directory del manifest che lo dichiara; `package` permette di rinominare la dipendenza nel codice. Le forme e i vincoli di pubblicazione sono nella [documentazione delle dipendenze](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html).

### Target: libreria, binario e piattaforma

Normalmente Cargo riconosce `src/lib.rs`, `src/main.rs` e i binari sotto `src/bin/`. Un package puo avere **una libreria e piu binari**.

Il nome predefinito della libreria deriva dal package, sostituendo i trattini con underscore. Puoi modificarlo con `[lib].name`; il codice importera quel nome. Il nome del binario, invece, seleziona cosa eseguire con `--bin`.

Con edition 2024, una dichiarazione `[[bin]]` non disattiva da sola la ricerca degli altri binari: per farlo intenzionalmente esiste `package.autobins = false`. [Cargo targets](https://doc.rust-lang.org/cargo/reference/cargo-targets.html).

Un target Cargo come un binario non e una piattaforma di destinazione. Per dipendenze specifiche di una piattaforma esistono tabelle come `[target.'cfg(windows)'.dependencies]`; non sono il posto dove dichiarare le feature del package.

## Esempio pratico

Crea i quattro file seguenti in una **nuova directory di prova esterna al vault**. I percorsi sono relativi alla directory del progetto; non sovrascrivere un progetto esistente.

Il programma stampa un'etichetta. Serve a osservare manifest, nomi e compilazione condizionale: non salva note e non e un'applicazione completa. Non richiede crate esterne.

### Cargo.toml

```toml
[package]
name = "cli-notes"
version = "0.1.0"
edition = "2024"
publish = false
default-run = "notes"

[lib]
name = "notes_core"
path = "src/lib.rs"

[[bin]]
name = "notes"
path = "src/main.rs"

[features]
default = []
uppercase = []

[dependencies]

[lints.rust]
unsafe_code = "forbid"
```

I nomi sono volutamente diversi: **package** `cli-notes`, **libreria** `notes_core`, **binario** `notes`. `default-run` sceglie il binario per `cargo run`; non rinomina la libreria.

`uppercase = []` dichiara una feature senza ulteriori dipendenze. `default = []` non la abilita. La tabella `[dependencies]` vuota e facoltativa.

`[lints.rust]` configura i lint del package: qui vieta codice unsafe nel suo codice compilato. Non e un audit di sicurezza e non proibisce unsafe dentro tutte le dipendenze.

### src/lib.rs

```rust
pub fn label(title: &str) -> String {
    #[cfg(feature = "uppercase")]
    let title = title.to_uppercase();

    format!("Note: {title}")
}
```

La feature ha effetto perche il codice usa `#[cfg(feature = "uppercase")]`. Senza quel collegamento, aggiungere il nome al manifest non convertirebbe alcun testo.

### src/main.rs

```rust
fn main() {
    println!("{}", notes_core::label("Rust"));
}
```

### tests/label.rs

```rust
#[test]
fn label_follows_feature() {
    let expected = if cfg!(feature = "uppercase") {
        "Note: RUST"
    } else {
        "Note: Rust"
    };

    assert_eq!(notes_core::label("Rust"), expected);
}
```

Il test d'integrazione usa l'API pubblica della libreria. E un target distinto; non accede alle funzioni private del binario.

### Verificare il risultato

Esegui i comandi **dalla directory che contiene il manifest**. Cargo puo creare `Cargo.lock` e gli output sotto `target/`. Per questo esempio bastano una toolchain con edition 2024 e il linker necessario; le verifiche della nota usano Rust/Cargo **1.99.1** su Windows GNU, non una matrice MSRV.

Leggi come Cargo interpreta package e target, in JSON, senza includere i pacchetti dipendenti. Non e una compilazione ne una verifica del comportamento:

```bash
cargo metadata --no-deps --format-version 1
```

Controlla anche i target di test, senza eseguirli. `--all-targets` non significa tutte le piattaforme o tutte le feature:

```bash
cargo check --all-targets
```

Esegui il binario predefinito. Stampa `Note: Rust`:

```bash
cargo run
```

Seleziona esplicitamente lo stesso binario:

```bash
cargo run --bin notes
```

Abilita la feature. Ora stampa `Note: RUST`:

```bash
cargo run --features uppercase
```

Esegui il test nella configurazione predefinita:

```bash
cargo test
```

Eseguilo anche con la feature attiva:

```bash
cargo test --features uppercase
```

Un manifest valido non garantisce sorgenti compilabili o test corretti. Su progetti di terzi, anche un controllo puo eseguire build script: Cargo non isola automaticamente codice non fidato. [Build scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html).

## Varianti

### Workspace e profili

Un manifest con `[workspace]` e senza `[package]` e **virtuale**: coordina i membri, non rappresenta una crate compilabile. In un workspace virtuale dichiara esplicitamente il resolver.

`[workspace.dependencies]` centralizza dichiarazioni, ma i membri devono richiamarle con `workspace = true`. Lo stesso principio di adesione esplicita vale per metadati e lint condivisi. `[profile.dev]` e `[profile.release]` sono riconosciuti nel manifest **radice** del workspace, non nei singoli membri. [Workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html).

Vedi [[Programmazione/Rust/Pagine/Workspace dependencies|Workspace dependencies]] e [[Programmazione/Rust/Pagine/Build profiles|Build profiles]] per configurazioni complete.

### Metadati e distribuzione

`[package.metadata]` ospita dati per strumenti esterni: Cargo non attribuisce loro automaticamente un comportamento.

Prima di distribuire una crate, controlla descrizione, licenza, README, repository e contenuto del pacchetto. `include` e `exclude` riguardano l'archivio Cargo: non sostituiscono `.gitignore` e non impediscono di pubblicare segreti attraverso altri canali. [Manifest: metadati e packaging](https://doc.rust-lang.org/cargo/reference/manifest.html).

## Errori comuni

- Copiare due manifest completi nello stesso file, duplicando le tabelle.
- Scrivere `[bin]` invece di `[[bin]]`, oppure mettere `default-run` fuori da `[package]`.
- Ignorare un avviso di chiave inutilizzata: la configurazione puo non avere effetto.
- Confondere nome del package, nome importato della libreria e nome del binario.
- Usare nel codice normale una crate dichiarata solo in dev-dependencies o build-dependencies.
- Considerare `"1.2.3"` una versione esatta o `rust-version` una selezione del compilatore.
- Aspettarsi che feature e dipendenze implementino automaticamente nuove funzioni.
- Interpretare `metadata` o `check` riusciti come prova di test passati.

## Checklist

- [ ] Package, libreria e binari hanno nomi e percorsi coerenti?
- [ ] Versione ed edition sono esplicite e la MSRV, se dichiarata, viene verificata?
- [ ] Le dipendenze sono nel contesto corretto e servono davvero?
- [ ] Le feature cambiano il codice previsto e sono provate separatamente?
- [ ] Ogni chiave appartiene alla tabella e al file corretti?
- [ ] Cargo non segnala configurazioni ignorate?
- [ ] Profili e impostazioni condivise sono nella radice del workspace?
- [ ] Licenza, contenuti dell'archivio e possibilita di pubblicazione sono intenzionali?

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Moduli crate e package|Moduli, crate e package]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]
- [[Programmazione/Rust/Pagine/Workspace dependencies|Workspace dependencies]]
- [[Programmazione/Rust/Pagine/Build scripts|Build scripts]]
- [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV]]

## Fonti

- [Cargo Book: manifest](https://doc.rust-lang.org/cargo/reference/manifest.html).
- [Cargo Book: dipendenze](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html).
- [Cargo Book: target](https://doc.rust-lang.org/cargo/reference/cargo-targets.html).
- [Cargo Book: feature](https://doc.rust-lang.org/cargo/reference/features.html).
- [Cargo Book: workspace](https://doc.rust-lang.org/cargo/reference/workspaces.html).
- [Cargo Book: configurazione](https://doc.rust-lang.org/cargo/reference/config.html).
- [Cargo Book: Rust version](https://doc.rust-lang.org/cargo/reference/rust-version.html).
- [TOML: tabelle](https://toml.io/en/v1.0.0#table).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

---
date: 2026-05-22
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - cargo-editions-e-compatibilita
aliases:
  - MSRV
  - Minimum Supported Rust Version
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024]]"
related:
  - "[[Programmazione/Rust/Pagine/Semantic Versioning]]"
  - "[[Programmazione/Rust/Pagine/Compatibility e breaking changes]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
title: "MSRV: Minimum Supported Rust Version"
---


# MSRV: Minimum Supported Rust Version

## Sintesi

La **MSRV** e la versione minima di Rust che il progetto si impegna a supportare. Va dichiarata, ma soprattutto verificata: un campo nel manifest non dimostra che sorgenti, dipendenze e test funzionino con quella toolchain.

Questa nota usa un progetto completo senza dipendenze esterne, con MSRV **1.85.0** ed edition **2024**. La prova confronta Rust **1.85.0** e **1.99.1** sul target `x86_64-pc-windows-gnu`; non certifica altre piattaforme o tutte le versioni intermedie.

## Quando usarlo

- Quando distribuisci una libreria a utenti con toolchain differenti.
- Quando un'applicazione deve compilare in un ambiente con versioni fissate.
- Prima di adottare nuove API standard o aggiornare dipendenze.
- Quando definisci quali combinazioni di feature e piattaforme verificare in CI.

## Come funziona

### Quattro impostazioni diverse

| Impostazione | Responsabilita |
| --- | --- |
| `rust-version` in `Cargo.toml` | Minimo dichiarato dal package. |
| `edition` in `Cargo.toml` | Edizione del linguaggio usata dai sorgenti. |
| `rust-toolchain.toml` | Toolchain selezionata da rustup per lavorare nel progetto. |
| `Cargo.lock` | Versioni risolte delle dipendenze, non versione del compilatore. |

`rust-version = "1.85"` indica un minimo di Rust 1.85.0. Il valore e una versione, non un requisito come `">=1.85"` e neppure un canale come `"stable"`. Non va confuso con `package.version`, che identifica la release del tuo software.

Cargo rifiuta normalmente una build se il compilatore e piu vecchio del minimo dichiarato. Non installa pero quella versione e non impedisce a un compilatore recente di accettare API troppo nuove per il minimo. `--ignore-rust-version` salta il controllo della dichiarazione, non aggiunge al vecchio compilatore le funzionalita mancanti. [Riferimento Cargo](https://doc.rust-lang.org/cargo/reference/rust-version.html).

### Edition e API standard

Rust 1.85.0 ha introdotto l'edition 2024: una crate con questa edition non puo dichiarare MSRV 1.74. Una crate edition 2021 puo dichiararla, ma deve comunque essere provata su Rust 1.74.0. [Release Rust 1.85.0](https://blog.rust-lang.org/2025/02/20/Rust-1.85.0/).

Il metodo `u32::is_multiple_of` e stabile da **1.87.0**. Usarlo richiede almeno quella versione, anche senza cambiare edition. La versione minima di una singola API non dimostra il minimo dell'intero progetto. [API standard](https://doc.rust-lang.org/std/primitive.u32.html#method.is_multiple_of).

## API / Sintassi

### Installare e selezionare la toolchain

Prerequisiti: rustup installato, relativi proxy `cargo` e `rustc` nel `PATH`, linker e strumenti di sistema adatti al target. Questi comandi scaricano toolchain nel deposito di rustup; non cambiano la toolchain predefinita.

Installa la versione minima:

```bash
rustup toolchain install 1.85.0 --profile minimal
```

Installa la versione di confronto fissata per questo esempio:

```bash
rustup toolchain install 1.99.1 --profile minimal
```

Il profilo `minimal` non include rustfmt e Clippy. La verifica della MSRV non richiede necessariamente di eseguire anche questi strumenti con la versione minima. [Profili rustup](https://rust-lang.github.io/rustup/concepts/profiles.html).

Controlla il compilatore selezionato esplicitamente:

```bash
rustc +1.85.0 --version
```

Controlla anche Cargo, non soltanto rustc:

```bash
cargo +1.85.0 --version
```

La sintassi `+versione` viene interpretata dai proxy di rustup; non e una normale opzione di un eseguibile Cargo indipendente. Ha precedenza sulla selezione del progetto. [Override rustup](https://rust-lang.github.io/rustup/overrides.html).

### rust-toolchain.toml opzionale

Questo file seleziona una toolchain di sviluppo. Non e necessario all'esempio e non sostituisce `rust-version`:

```toml
[toolchain]
channel = "1.99.1"
profile = "minimal"
```

Dalla cartella del progetto, mostra la selezione effettiva e la sua origine:

```bash
rustup show active-toolchain
```

Con questo file, un comando senza `+versione` usa normalmente 1.99.1; `cargo +1.85.0` continua a scegliere la versione minima. Controlla eventuali override o `RUSTUP_TOOLCHAIN` se la selezione senza prefisso e diversa dal previsto.

## Esempio pratico

Crea una cartella di prova separata dagli appunti con i tre file seguenti. Tutti i comandi successivi vanno eseguiti nella sua radice.

### Cargo.toml

```toml
[package]
name = "msrv-demo"
version = "0.1.0"
edition = "2024"
rust-version = "1.85"
publish = false

[features]
default = ["labels"]
labels = []

[dependencies]
```

### src/lib.rs

```rust
/// Verifica se un intero e pari.
///
/// ```
/// assert!(msrv_demo::is_even(42));
/// assert!(!msrv_demo::is_even(3));
/// ```
pub fn is_even(value: u32) -> bool {
    value % 2 == 0
}

#[cfg(feature = "labels")]
pub fn label(value: u32) -> &'static str {
    if is_even(value) { "even" } else { "odd" }
}
```

### tests/even.rs

```rust
#[test]
fn parity() {
    assert!(msrv_demo::is_even(0));
    assert!(msrv_demo::is_even(42));
    assert!(!msrv_demo::is_even(u32::MAX));
}

#[cfg(feature = "labels")]
#[test]
fn labels() {
    assert_eq!(msrv_demo::label(42), "even");
    assert_eq!(msrv_demo::label(3), "odd");
}
```

### Provare la versione minima

Il primo test crea anche `Cargo.lock`. Non serve accedere al registro per questo progetto senza dipendenze esterne:

```bash
cargo +1.85.0 test --all-features
```

Risultato atteso: due test di integrazione e un doctest superati. Le stesse tre prove sono attive con le feature predefinite dell'esempio.

Controlla tutti i target compilabili senza modificare il lockfile:

```bash
cargo +1.85.0 check --all-targets --all-features --locked
```

Prova separatamente la configurazione senza feature predefinite:

```bash
cargo +1.85.0 test --no-default-features --locked
```

Qui restano un test di integrazione e un doctest. `label` non e disponibile.

Esegui esplicitamente gli esempi nella documentazione:

```bash
cargo +1.85.0 test --doc --all-features --locked
```

Questa ultima verifica esegue soltanto il doctest. `check` non esegue asserzioni; `--all-targets` non comprende i doctest. Inoltre `--all-features` abilita tutto insieme, non prova tutte le combinazioni possibili. Nei progetti con feature mutuamente esclusive occorre scegliere le combinazioni supportate. [Opzioni di cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html).

### Confrontare una toolchain recente

Ripeti i test con lo stesso lockfile:

```bash
cargo +1.99.1 test --all-features --locked
```

Verifica anche i target:

```bash
cargo +1.99.1 check --all-targets --all-features --locked
```

Il risultato positivo su 1.99.1 non sostituisce la prova su 1.85.0.

### Controesempio: dichiarazione corretta, codice incompatibile

Nella sola funzione `is_even` sostituisci `value % 2 == 0` con `value.is_multiple_of(2)`, lasciando invariati manifest, test e doctest.

Ripeti i due comandi di test con `--all-features`:

- Rust 1.99.1: le tre prove continuano a passare.
- Rust 1.85.0: la compilazione fallisce per l'uso di una funzionalita allora instabile.

Il problema esiste anche se `rust-version` e ancora `"1.85"`. Puoi ripristinare l'implementazione originale oppure decidere un nuovo minimo, provarlo e aggiornare dichiarazione e politica di supporto. Alzare solo il campo a `"1.87"` non rende il codice compilabile con 1.85, nemmeno aggiungendo `--ignore-rust-version`.

Ripristina l'espressione originale prima di usare il progetto come esempio compatibile con 1.85.0.

## Varianti

### Dipendenze e resolver

L'edition 2024 implica il resolver 3 per un package autonomo. Questo resolver preferisce dipendenze con `rust-version` compatibile con quello del package, anche se stai compilando con una toolchain piu recente. Nei workspace conta il resolver della radice; nei workspace virtuali impostalo esplicitamente. [Resolver nell'edition 2024](https://doc.rust-lang.org/edition-guide/rust-2024/cargo-resolver.html).

Con Cargo che supporta questa opzione, puoi esplicitare la preferenza nel seguente file, **non in Cargo.toml**.

### .cargo/config.toml opzionale

```toml
[resolver]
incompatible-rust-versions = "fallback"
```

`fallback` preferisce una versione compatibile quando disponibile; `allow` non applica questa preferenza. Non e un divieto assoluto: se il requisito non ammette candidati compatibili, il resolver puo selezionarne uno con MSRV superiore. [Configurazione Cargo](https://doc.rust-lang.org/cargo/reference/config.html#resolverincompatible-rust-versions).

Un lockfile esistente ha priorita nella risoluzione: attivare `fallback` non ripara automaticamente tutte le versioni gia bloccate. Nei workspace con minimi diversi la risoluzione e condivisa e non equivale a una prova separata di ogni package. Una dipendenza puo anche dichiarare un minimo inesatto: la compilazione sulla vecchia toolchain resta necessaria. [Dependency resolution](https://doc.rust-lang.org/cargo/reference/resolver.html).

### Lockfile e distribuzione

Per un'applicazione, prova il lockfile che distribuisci e aggiorna le dipendenze intenzionalmente. `--locked` impedisce modifiche alla risoluzione, non dimostra che le versioni scelte siano compatibili con la MSRV.

Per una libreria, il lockfile del repository non impone la risoluzione ai consumatori: affianca alla prova bloccata un progetto consumer o una risoluzione controllata senza quel lockfile. Controlla inoltre che il Cargo minimo sappia leggere il formato del lockfile. I due aspetti sono approfonditi in [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]].

### Workspace e CI

Una MSRV comune puo essere definita in `[workspace.package]`; ogni membro deve aderire con `rust-version.workspace = true` in `[package]`. Non viene ereditata automaticamente. Vedi [[Programmazione/Rust/Pagine/Workspace|Workspace]] e il [riferimento ufficiale](https://doc.rust-lang.org/cargo/reference/workspaces.html#the-package-table).

In CI mantieni almeno una prova sulla versione minima e una su stable aggiornata, con feature e piattaforme coerenti con il supporto promesso. Il job stable puo usare:

```bash
cargo +stable test --all-features --locked
```

Questo comando seleziona il canale stable installato: non lo aggiorna da solo. Prevedi il suo aggiornamento nella preparazione dell'ambiente CI. Non confondere questa verifica con la prova riproducibile fissata a 1.99.1 svolta nella nota. [CI con Cargo](https://doc.rust-lang.org/cargo/guide/continuous-integration.html).

### Politica di supporto

Puoi mantenere un minimo fisso oppure una finestra mobile di release supportate. Spiega quando lo alzi e se mantieni rami precedenti.

Alzare la MSRV puo interrompere le build degli utenti anche senza cambiare l'API. La guida Cargo la considera generalmente una incompatibilita da minor release, non una richiesta automatica di major: applica la politica pubblicata dal progetto e documenta il cambiamento. [MSRV e SemVer](https://doc.rust-lang.org/cargo/reference/semver.html#possibly-breaking-changing-the-minimum-version-of-rust-required).

### Esempio di dichiarazione nel README

Questo testo descrive soltanto l'ambito effettivamente verificato nell'esempio:

```md
MSRV: Rust 1.85.0, edition 2024.
Verificata per feature predefinite, senza default e con tutte le feature,
sul target x86_64-pc-windows-gnu.
```

## Errori comuni

- Considerare `rust-version` un selettore di toolchain o un controllo completo delle API.
- Provare soltanto con il compilatore di sviluppo.
- Limitarsi a `check` quando il contratto comprende anche test ed esempi eseguibili.
- Dimenticare feature opzionali, build script, dipendenze di sviluppo e librerie native.
- Confondere una risoluzione valida con una build riuscita sul minimo.
- Attribuire a un test su un sistema operativo una copertura multipiattaforma.
- Modificare il minimo senza aggiornare CI, documentazione e changelog.

## Checklist

- [ ] Minimo ed edition sono coerenti e documentati.
- [ ] Cargo, rustc e rustdoc usati nella prova appartengono alla toolchain prevista.
- [ ] Test, doctest e combinazioni di feature promesse passano sul minimo.
- [ ] Target e dipendenze native richiesti sono disponibili nell'ambiente di prova.
- [ ] Lockfile e dipendenze sono compatibili con il Cargo minimo.
- [ ] La CI verifica anche stable aggiornata.
- [ ] Un aumento della MSRV segue la politica di rilascio del progetto.

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024|Rust 2018 2021 e 2024]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]
- [[Programmazione/Rust/Pagine/Crates.io|Crates.io]]

## Fonti

- [Cargo Book: rust-version](https://doc.rust-lang.org/cargo/reference/rust-version.html).
- [Cargo Book: dependency resolution](https://doc.rust-lang.org/cargo/reference/resolver.html).
- [Rustup Book: toolchain override](https://rust-lang.github.io/rustup/overrides.html).
- [Standard library: u32::is_multiple_of](https://doc.rust-lang.org/std/primitive.u32.html#method.is_multiple_of).

Le altre fonti ufficiali sono collegate accanto ai relativi comportamenti. I comandi CI sono indicazioni di configurazione; le prove locali dell'esempio non costituiscono una nuova esecuzione di GitHub Actions.

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

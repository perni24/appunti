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
  - Migrazione edition
  - cargo fix edition
prerequisites:
  - "[[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024]]"
  - "[[Programmazione/Rust/Pagine/Cargo]]"
related:
  - "[[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version]]"
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
  - "[[Programmazione/Rust/Pagine/rustfmt]]"
title: Edition migration
---

# Edition migration

## Sintesi

Una **edition migration** adatta una crate alle regole di una nuova edition. Non equivale ad aggiornare tutte le dipendenze o a cambiare versione di Rust.

L'ordine e: **verificare il punto di partenza, applicare i fix nella vecchia edition, controllare le modifiche, cambiare il manifest, verificare nella nuova edition**. Il comando `cargo fix --edition` non modifica `Cargo.toml`. [Procedura ufficiale](https://doc.rust-lang.org/edition-guide/editions/transitioning-an-existing-project-to-a-new-edition.html).

Questa nota segue una libreria da **2021 a 2024**. Per differenze tra edition, MSRV e resolver, vedi [[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024|Rust 2018, 2021 e 2024]].

## Quando usarlo

- Vuoi adottare la sintassi e le regole di una nuova edition.
- Devi migrare una crate senza cambiare contemporaneamente la sua API e le dipendenze.
- Vuoi preparare una migrazione graduale di un workspace.

Non serve cambiare edition soltanto per usare un compilatore piu recente. Crate con edition diverse possono collaborare nello stesso progetto.

## Come funziona

`cargo fix --edition` usa i lint di compatibilita e applica suggerimenti del compilatore al codice analizzato. **Prepara la prossima edition**, non salta automaticamente alla piu recente: da 2018 si prepara prima 2021, poi si ripete il percorso verso 2024.

Il controllo automatico non equivale a una prova di comportamento identico. Feature disattivate, altri sistemi operativi, espansioni di macro e codice generato possono richiedere lavoro separato. I doctest non vengono aggiornati automaticamente. [Migrazioni avanzate](https://doc.rust-lang.org/edition-guide/editions/advanced-migrations.html).

La migrazione puo comportare anche una modifica della MSRV. Rust 2024 richiede almeno Rust 1.85; il progetto puo avere requisiti superiori per API o dipendenze. Nel laboratorio `rust-version = "1.85"` e gia sufficiente e rimane invariato.

## API / Sintassi

Le opzioni della procedura hanno scopi diversi:

- `--edition` abilita la preparazione della prossima edition; non ne cambia il valore nel manifest.
- `--all-targets` seleziona target Cargo come libreria, binari, test, esempi e benchmark. **Non significa tutte le architetture o tutti i sistemi operativi**.
- `--all-features` attiva tutte le feature dei pacchetti selezionati in una sola configurazione; non prova ogni combinazione.
- `--locked` impone di usare il lockfile senza aggiornarlo. Se manca o necessita modifiche, bisogna risolvere esplicitamente il problema.
- `-p nome-pacchetto` limita i pacchetti selezionati; `--workspace` seleziona tutti i membri.

Le opzioni che aggirano le protezioni non sono la procedura ordinaria:

| Opzione | Effetto e cautela |
| --- | --- |
| `--allow-no-vcs` | Consente i fix senza controllo versione; non crea un backup. |
| `--allow-staged` | Accetta modifiche gia nell'area di staging. |
| `--allow-dirty` | Accetta modifiche locali, anche in staging; rende piu difficile distinguere i fix dal lavoro precedente. |
| `--broken-code` | Puo lasciare applicati suggerimenti che non producono codice compilabile; richiede riparazione manuale. |
| `--edition-idioms` | Applica suggerimenti idiomatici per l'edition corrente; non sostituisce `--edition`. |

Riferimento delle opzioni: [cargo fix](https://doc.rust-lang.org/cargo/commands/cargo-fix.html).

## Esempio pratico

### Preparare il laboratorio

Crea una **nuova cartella vuota fuori dal vault** e i cinque file seguenti. Tutti i comandi vanno eseguiti dalla sua radice. Non eseguire `git init` o i commit del laboratorio nella cartella degli appunti.

Servono Git con identita configurata, Rust/Cargo almeno 1.85 e un linker funzionante. Per gli ultimi controlli servono anche rustfmt e Clippy. I comandi Git creano un repository e un commit **locali**, senza pubblicare nulla.

La feature `extra` aggiunge una seconda funzione in un file separato. Usiamo intenzionalmente `gen`: in edition 2024 e una parola riservata e diventa `r#gen`. Il prefisso permette di mantenere il nome logico della funzione, non la rinomina in `r_gen`. [Migrazione di gen](https://doc.rust-lang.org/edition-guide/rust-2024/gen-keyword.html).

### Cargo.toml

```toml
[package]
name = "migration-demo"
version = "0.1.0"
edition = "2021"
rust-version = "1.85"
publish = false

[features]
default = []
extra = []

[dependencies]
```

### src/lib.rs

```rust
/// Restituisce il successivo, oppure None in caso di overflow.
///
/// ```
/// assert_eq!(migration_demo::gen(41), Some(42));
/// ```
pub fn gen(value: u32) -> Option<u32> {
    value.checked_add(1)
}

#[cfg(feature = "extra")]
pub mod extra;
```

### src/extra.rs

```rust
/// Raddoppia il valore senza overflow.
///
/// ```
/// assert_eq!(migration_demo::extra::gen(21), Some(42));
/// ```
pub fn gen(value: u32) -> Option<u32> {
    value.checked_mul(2)
}
```

### tests/api.rs

```rust
use migration_demo::gen;

#[test]
fn next_value() {
    assert_eq!(gen(41), Some(42));
    assert_eq!(gen(u32::MAX), None);
}

#[cfg(feature = "extra")]
#[test]
fn doubled_value() {
    assert_eq!(migration_demo::extra::gen(21), Some(42));
    assert_eq!(migration_demo::extra::gen(u32::MAX), None);
}
```

### .gitignore

```gitignore
/target/
```

### 1. Verificare il punto di partenza

Controlla la toolchain effettiva; un override locale puo cambiarla.

```bash
rustc --version
```

```bash
cargo --version
```

Inizializza il repository del nuovo laboratorio:

```bash
git init
```

Controlla anche i target e la feature opzionale. Questo comando **non esegue le asserzioni dei test**:

```bash
cargo check --all-targets --all-features
```

Esegui i test prima di introdurre modifiche:

```bash
cargo test --all-features
```

Risultato atteso: **due test di integrazione e due doctest superati**. Viene creato anche `Cargo.lock`; `target/` e esclusa da Git.

Registra i file iniziali:

```bash
git add Cargo.toml Cargo.lock .gitignore src tests
```

```bash
git commit -m "Baseline prima della migrazione"
```

Crea una branch dedicata:

```bash
git switch -c codex/rust-2024-edition
```

Controlla lo stato:

```bash
git status --short
```

L'output deve essere vuoto. **Una branch non e un backup delle modifiche non committate**. In un progetto esistente, prima completa o separa consapevolmente il lavoro in corso; non usare `--allow-dirty` per nascondere un punto di partenza incerto.

### 2. Applicare i fix restando in edition 2021

Non cambiare ancora `edition` nel manifest.

```bash
cargo fix --edition --all-targets --all-features --locked
```

Questo comando **modifica i sorgenti**. Controlla il diff:

```bash
git diff -- src tests
```

Nel laboratorio vengono aggiornate le definizioni, gli import e le chiamate a `r#gen`. Le righe nei commenti di documentazione restano invece con `gen`.

Controlla separatamente manifest e lockfile:

```bash
git diff -- Cargo.toml Cargo.lock
```

Il diff deve essere vuoto: entrambi sono invariati in questo esempio. Su progetti reali non aggiornare le dipendenze incidentalmente per far sparire un errore; analizza la causa e separa eventuali aggiornamenti necessari.

### 3. Cambiare edition e completare i fix manuali

In `Cargo.toml` cambia **solo** `edition = "2021"` in `edition = "2024"`. Lascia invariati `version` e `rust-version` del laboratorio.

Verifica i target compilati:

```bash
cargo check --all-targets --all-features --locked
```

Il comando passa, ma non basta. Esegui i doctest:

```bash
cargo test --doc --all-features --locked
```

**Questo primo tentativo deve fallire**: i due esempi nei commenti usano ancora `gen`, ora riservato. Non e un errore della procedura: mostra un limite verificabile di `cargo fix`.

Correggi manualmente solo le due chiamate nei commenti:

- In `src/lib.rs`: `migration_demo::gen(41)` diventa `migration_demo::r#gen(41)`.
- In `src/extra.rs`: `migration_demo::extra::gen(21)` diventa `migration_demo::extra::r#gen(21)`.

Ripeti lo stesso comando per i doctest: ora devono passare entrambi. Non disabilitare i doctest e non marcarli con la vecchia edition soltanto per nascondere il problema.

### 4. Ripetere i controlli nella nuova edition

Esegui la configurazione completa:

```bash
cargo test --all-features --locked
```

Risultato atteso: **quattro test complessivi superati**, come prima della migrazione.

Verifica anche la configurazione senza feature predefinite:

```bash
cargo test --no-default-features --locked
```

Risultato atteso in questo progetto: **un test di integrazione e un doctest**, perche `extra` non e attiva. In altri progetti questa configurazione puo non essere supportata: usa la matrice dichiarata dalla crate.

Non sostituire questi controlli con il solo `cargo test --all-targets`: la selezione esplicita di tutti i target Cargo non include i doctest. [Selezione dei test](https://doc.rust-lang.org/cargo/commands/cargo-test.html).

Ripeti i test con la MSRV dichiarata e con la toolchain di sviluppo, usando toolchain effettivamente installate: vedi [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|verifica della MSRV]].

### 5. Formattare e controllare il risultato

La formattazione **riscrive i sorgenti** e puo introdurre un diff separato dai fix di compatibilita:

```bash
cargo fmt --all
```

Verifica che la formattazione sia stabile, senza ulteriori modifiche:

```bash
cargo fmt --all -- --check
```

Esegui Clippy sulla toolchain di sviluppo:

```bash
cargo clippy --all-targets --all-features --locked -- -D warnings
```

Qui `-D warnings` trasforma gli avvisi in errori; non attiva ogni lint esistente e non prova l'assenza di bug. E una forma utilizzabile anche con Cargo precedenti a 1.97; le versioni recenti documentano anche `build.warnings`. [Clippy: uso e livelli dei lint](https://doc.rust-lang.org/clippy/usage.html).

Controlla gli errori di spaziatura nel diff:

```bash
git diff --check
```

Ripeti i test dopo eventuali modifiche manuali o di formattazione e rileggi il diff prima del commit. `git diff --check` non verifica la correttezza di Rust.

Il laboratorio e stato eseguito con **Rust/Cargo 1.85.0 e 1.99.1, Windows GNU**. Formattazione e Clippy sono stati verificati sulla toolchain 1.99.1. Non e una verifica su ogni piattaforma o di ogni cambiamento introdotto dall'edition.

## Varianti

### Workspace e migrazione graduale

Puoi selezionare una crate con `cargo fix --edition -p nome-pacchetto` oppure l'intero workspace con `cargo fix --edition --workspace`, aggiungendo feature e target pertinenti. Controlla quali pacchetti sono selezionati: lavorare dalla radice non significa sempre includere tutti i membri.

Cambia l'edition dei pacchetti effettivamente preparati. Se e ereditata tramite `edition.workspace = true`, la modifica a `[workspace.package].edition` coinvolge tutti i membri che la ereditano. Non e obbligatorio migrare insieme tutte le crate.

Per una crate autonoma, edition 2024 implica normalmente resolver 3. In un workspace il resolver e una scelta globale; un workspace virtuale deve dichiararlo esplicitamente. Non dedurre che il cambio di edition di un membro modifichi il resolver di tutti. Una nuova risoluzione puo cambiare le dipendenze selezionate: controlla lockfile e MSRV. [Resolver e Rust 2024](https://doc.rust-lang.org/edition-guide/rust-2024/cargo-resolver.html).

### Feature, piattaforme, macro e codice generato

Nel laboratorio, senza `--all-features` il file `src/extra.rs` non e analizzato: una migrazione del solo percorso predefinito puo sembrare riuscita e fallire quando si attiva `extra`.

Nei progetti reali, verifica separatamente le combinazioni supportate. `--all-features` puo perfino essere una combinazione non valida; non abilita rami `cfg` per altri sistemi operativi. Per un diverso target servono i relativi componenti, dipendenze native e, per eseguire i test, un ambiente adatto.

Le macro esportate vanno provate anche nelle crate consumatrici. Per codice generato correggi il generatore o il template, non soltanto il file in `OUT_DIR` che verra riscritto. Non presumere che un fix sintattico renda sicuro codice `unsafe` o mantenga ogni comportamento. [Limiti delle migrazioni automatiche](https://doc.rust-lang.org/edition-guide/editions/advanced-migrations.html).

## Errori comuni

- **Cambiare prima il manifest:** i vecchi costrutti possono diventare errori prima che i lint di migrazione li correggano. Parti dalla vecchia edition compilabile.
- **Eseguire solo check:** passa anche senza eseguire test che fallirebbero. Nel laboratorio non rileva i doctest da aggiornare.
- **Confondere raw identifier e nuova API:** `r#gen` conserva il nome; rinominare davvero una funzione pubblica richiede una valutazione di compatibilita separata.
- **Aggirare le protezioni Git:** un diff misto rende difficile rivedere o recuperare le modifiche. Fermati, ispeziona il punto di partenza e separa il lavoro; non cancellare modifiche altrui con un ripristino globale.
- **Ignorare un lockfile incompatibile con --locked:** correggi deliberatamente manifest o risoluzione e ripeti i controlli. Non eliminare il lockfile alla cieca.
- **Considerare tutti gli avvisi risolti come prova finale:** controlla anche API pubbliche, comportamento, dipendenze e configurazioni supportate.

## Checklist

- [ ] Toolchain e MSRV supportano la nuova edition.
- [ ] Punto di partenza compilabile, testato e salvato in Git.
- [ ] Fix applicati con il manifest ancora nella vecchia edition.
- [ ] Diff controllato prima di cambiare `edition`.
- [ ] Doctest, esempi e chiamate nelle crate consumatrici verificati.
- [ ] Configurazioni di feature e piattaforme supportate coperte.
- [ ] MSRV, resolver e lockfile valutati separatamente.
- [ ] Test, formattazione e lint ripetuti dopo le modifiche.
- [ ] Eventuali requisiti nuovi o variazioni di API/comportamento riportati nel changelog.

## Collegamenti

- [[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024|Rust 2018, 2021 e 2024]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]
- [[Programmazione/Rust/Pagine/rustfmt|rustfmt]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]

## Fonti

- [Rust Edition Guide: procedura di migrazione](https://doc.rust-lang.org/edition-guide/editions/transitioning-an-existing-project-to-a-new-edition.html).
- [Rust Edition Guide: casi avanzati e limiti](https://doc.rust-lang.org/edition-guide/editions/advanced-migrations.html).
- [Cargo Book: cargo fix](https://doc.rust-lang.org/cargo/commands/cargo-fix.html).
- [Rust Edition Guide: gen keyword](https://doc.rust-lang.org/edition-guide/rust-2024/gen-keyword.html).
- [Cargo Book: cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html).
- [Rust Edition Guide: resolver 3](https://doc.rust-lang.org/edition-guide/rust-2024/cargo-resolver.html).
- [Clippy: utilizzo](https://doc.rust-lang.org/clippy/usage.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

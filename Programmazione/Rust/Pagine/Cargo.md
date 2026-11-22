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
  - Cargo Rust
  - Rust package manager
prerequisites:
  - "[[Programmazione/Rust/Pagine/Moduli crate e package]]"
related:
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
  - "[[Programmazione/Rust/Pagine/Rust 2018 2021 e 2024]]"
  - "[[Programmazione/Rust/Pagine/Cargo.lock]]"
  - "[[Programmazione/Rust/Pagine/Crates.io]]"
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
title: Cargo
---

# Cargo

## Sintesi

Cargo e il gestore dei progetti e delle dipendenze Rust: coordina compilazione, test, documentazione e distribuzione dei package. Invoca altri strumenti, per esempio `rustc` e `rustdoc`; non e il compilatore e non sostituisce `rustup`, che gestisce toolchain e componenti.

Il punto di partenza e il package descritto da `Cargo.toml`. Scegli il comando in base alla verifica desiderata: "compila", "funziona nei test" e "rispetta le regole di stile" non significano la stessa cosa.

## Quando usarlo

- Creare un'applicazione, una libreria o un workspace.
- Dichiarare e risolvere dipendenze e feature.
- Controllare il codice durante lo sviluppo, poi costruire ed eseguire il programma.
- Ripetere test, lint e controlli di formattazione anche in CI.
- Generare documentazione o preparare un package da pubblicare.

## Come funziona

### Package, file e directory di lavoro

Cargo cerca `Cargo.toml` nella directory corrente e nei suoi parent, salvo indicazione con `--manifest-path`. Un package puo contenere una libreria e piu binari; un workspace riunisce piu package. Ripasso: [[Programmazione/Rust/Pagine/Moduli crate e package|Moduli, crate e package]].

- `Cargo.toml`: sorgente della configurazione, da modificare intenzionalmente.
- `Cargo.lock`: risoluzione concreta delle dipendenze, generata e aggiornata da Cargo quando necessario.
- `src/lib.rs` e `src/main.rs`: root convenzionali della libreria e del binario.
- `tests/`: test di integrazione, separati dalla crate della libreria.
- `target/`: output generato nella root del workspace per impostazione predefinita; configurazione e variabili ambiente possono cambiarne il percorso.

`cargo build` produce normalmente gli artefatti del profilo `dev` in `target/debug`; `--release` seleziona il profilo `release`, normalmente in `target/release`. Profilo, target di compilazione e configurazione possono cambiare opzioni e percorsi. Vedi [cargo build](https://doc.rust-lang.org/cargo/commands/cargo-build.html).

**Compilare non equivale a leggere soltanto i sorgenti:** build script e macro procedurali possono eseguire codice durante la compilazione, anche quando usi `cargo check`. Non trattare un progetto non fidato come innocuo solo perche non lanci il suo binario. Vedi [[Programmazione/Rust/Pagine/Build scripts|Build scripts]] e la [documentazione dei build script](https://doc.rust-lang.org/cargo/reference/build-scripts.html).

### Lockfile e codice versionato

Versiona sorgenti e manifest; non includere gli artefatti di `target/`. Per applicazioni e binari conserva normalmente `Cargo.lock`. Anche una libreria puo versionarlo per sviluppo e CI: il suo lockfile **non impone** le dipendenze ai progetti che la usano.

Non confondere un lockfile con la riproducibilita completa: toolchain, piattaforma e ambiente restano rilevanti. Vedi la [FAQ ufficiale](https://doc.rust-lang.org/cargo/faq.html#why-have-cargolock-in-version-control) e [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]].

## API / Sintassi

### Prerequisiti

Serve una toolchain Rust con Cargo e gli strumenti di sistema necessari per il linking. Gli esempi sono verificati con Rust/Cargo 1.99.1 ed edition 2024; la versione di Cargo non e l'edition del sorgente.

Controlla Cargo:

```bash
cargo --version
```

Controlla il compilatore:

```bash
rustc --version
```

Se usi rustup e mancano formatter o linter, aggiungili alla toolchain attiva. Il comando installa componenti e puo accedere alla rete:

```bash
rustup component add rustfmt clippy
```

Sono componenti della toolchain, non dipendenze da inserire in `Cargo.toml`. Vedi [componenti rustup](https://rust-lang.github.io/rustup/concepts/components.html).

### Cosa controlla ciascun comando

| Comando | Scopo | Non dimostra |
| --- | --- | --- |
| `cargo check` | Controlli del compilatore sui target selezionati, senza generare il loro eseguibile finale | Che linking, esecuzione e test funzionino |
| `cargo build` | Costruzione dei target selezionati | Correttezza dei risultati a runtime |
| `cargo run` | Costruzione se necessaria ed esecuzione di un binario | Esito di tutta la suite di test |
| `cargo test` | Esecuzione dei test selezionati | Assenza di bug fuori dai casi coperti |
| `cargo fmt` | Formattazione dei sorgenti tramite rustfmt | Correttezza dei tipi o della logica |
| `cargo clippy` | Analisi statica con lint aggiuntivi | Verifica completa di sicurezza o logica |
| `cargo doc` | Generazione della documentazione | Esecuzione degli esempi documentati |

Un codice zero significa successo del comando richiesto, non certificazione generale del progetto. La documentazione di [cargo check](https://doc.rust-lang.org/cargo/commands/cargo-check.html) precisa che alcuni errori emergono soltanto nella generazione del codice.

## Esempio pratico

Il progetto seguente non richiede crate esterne. Usa una directory di esercizi separata dal vault o da altri workspace; `hello-rust` non deve esistere.

### Creare il package

```bash
cargo new hello-rust --bin --edition 2024 --vcs none
```

`--vcs none` evita di creare un repository Git per l'esercizio; non configura un file `.gitignore`. In un progetto versionato aggiungi `/target/` alle esclusioni. Senza l'opzione, Cargo puo inizializzare il VCS secondo contesto e configurazione. Vedi [cargo new](https://doc.rust-lang.org/cargo/commands/cargo-new.html).

Entra nel package; i comandi successivi del percorso pratico partono da questa directory:

```bash
cd hello-rust
```

Nel solo progetto dimostrativo sostituisci il manifest e `src/main.rs` generati, poi aggiungi `src/lib.rs` e `tests/greeting.rs`. Questi sono i file completi.

### Cargo.toml

```toml
[package]
name = "hello-rust"
version = "0.1.0"
edition = "2024"
publish = false

[dependencies]
```

`publish = false` impedisce di pubblicare accidentalmente il package in un registry. Non impedisce l'esecuzione o la condivisione manuale dei file.

### src/lib.rs

```rust
/// Compone un saluto senza validare o normalizzare il nome.
///
/// ```
/// use hello_rust::greeting;
/// assert_eq!(greeting("Ada"), "Ciao, Ada!");
/// ```
pub fn greeting(name: &str) -> String {
    format!("Ciao, {name}!")
}

#[cfg(test)]
mod tests {
    use super::greeting;

    #[test]
    fn greets_a_name() {
        assert_eq!(greeting("Rust"), "Ciao, Rust!");
    }
}
```

### src/main.rs

```rust
use hello_rust::greeting;

fn main() {
    let name = std::env::args()
        .nth(1)
        .unwrap_or_else(|| String::from("mondo"));
    println!("{}", greeting(&name));
}
```

La crate della libreria si importa come `hello_rust`, mentre il binario si chiama `hello-rust`. Questa CLI didattica legge soltanto il primo argomento dopo il nome del programma, richiede argomenti Unicode validi e non implementa un parser di opzioni.

### tests/greeting.rs

```rust
use hello_rust::greeting;

#[test]
fn public_api_keeps_the_name() {
    assert_eq!(greeting("Ada Lovelace"), "Ciao, Ada Lovelace!");
}
```

Il test di integrazione usa l'API pubblica come una crate esterna; non accede direttamente ai dettagli privati della libreria.

### Controllare, compilare ed eseguire

Controllo rapido di libreria e binario:

```bash
cargo check
```

Includi anche target di test, esempi e benchmark nei controlli statici:

```bash
cargo check --all-targets
```

`--all-targets` non significa tutte le piattaforme, tutte le combinazioni di feature o esecuzione dei doctest. Un test con un'asserzione falsa puo superare questo controllo.

Costruisci senza avviare il programma:

```bash
cargo build
```

Avvia il binario, che stampa `Ciao, mondo!`:

```bash
cargo run
```

Scegli il binario e passagli un argomento, ottenendo `Ciao, Ada!`:

```bash
cargo run --bin hello-rust -- Ada
```

Prima di `--` stanno le opzioni Cargo, dopo gli argomenti dell'applicazione. `--bin` usa il nome del target, non il percorso del file. Vedi [cargo run](https://doc.rust-lang.org/cargo/commands/cargo-run.html).

### Formattare e applicare lint

Formatta i sorgenti **modificandoli**:

```bash
cargo fmt
```

Controlla la formattazione senza riscrivere i file, utile in CI:

```bash
cargo fmt --all -- --check
```

Analizza anche i target di test con Clippy:

```bash
cargo clippy --all-targets
```

Con la configurazione normale i warning non fanno fallire il comando. Per renderli bloccanti puoi usare la forma compatibile anche con toolchain precedenti:

```bash
cargo clippy --all-targets -- -D warnings
```

`-D warnings` include anche i warning del compilatore, ma non abilita ogni gruppo di lint. Da Cargo 1.97 la documentazione raccomanda invece la configurazione `build.warnings = "deny"`, che evita l'invalidazione della cache associata al cambio dei flag del compilatore. Questa impostazione appartiene a `.cargo/config.toml`, non al manifest `Cargo.toml`. La policy va concordata nel progetto.

Vedi [rustfmt](https://github.com/rust-lang/rustfmt#running) e [Clippy](https://doc.rust-lang.org/clippy/usage.html).

### Eseguire test reali

```bash
cargo test
```

Con questi file e le impostazioni predefinite passano **un unit test, un integration test e un doctest**. La sezione del binario puo riportare zero test: non e un errore, ma non va confusa con la copertura del programma.

Compila i target di test senza eseguirli; questo comando non verifica le asserzioni ne esegue i doctest:

```bash
cargo test --no-run
```

Esegui solo gli esempi della documentazione della libreria:

```bash
cargo test --doc
```

Seleziona l'integration test `tests/greeting.rs`; l'opzione dopo `--` viene inoltrata al test harness:

```bash
cargo test --test greeting -- --nocapture
```

Selezione dei target, filtri e attributi possono escludere test. Controlla cosa e stato eseguito, non soltanto il codice di uscita. Vedi [cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html).

### Costruire la versione release

```bash
cargo build --release
```

La build release usa normalmente ottimizzazioni, ma non esegue automaticamente i test. Le opzioni dei profili sono personalizzabili: [[Programmazione/Rust/Pagine/Build profiles|Build profiles]].

### Generare documentazione e leggere i metadati

Genera la documentazione del package senza quella delle dipendenze:

```bash
cargo doc --no-deps
```

Con la configurazione dell'esercizio la pagina della libreria e `target/doc/hello_rust/index.html`. Aggiungere `--open` apre il browser predefinito. La generazione non esegue i doctest: per quelli usa il comando dedicato sopra. Vedi [cargo doc](https://doc.rust-lang.org/cargo/commands/cargo-doc.html).

Ottieni dati JSON del workspace senza includere i package delle dipendenze:

```bash
cargo metadata --no-deps --format-version 1
```

Usa un parser JSON e identifica il package per nome o ID, non per posizione nell'array. `--no-deps` non fornisce il grafo risolto completo. Vedi [cargo metadata](https://doc.rust-lang.org/cargo/commands/cargo-metadata.html).

## Varianti

### Creare una libreria

Alternativa da eseguire nella directory di esercizi, **accanto** a `hello-rust`, non al suo interno:

```bash
cargo new libreria --lib --edition 2024 --vcs none
```

`cargo init` serve invece a inizializzare un package in una directory gia esistente. Un workspace non si ottiene creando casualmente package annidati: va dichiarato nel manifest.

### Aggiungere dipendenze

I comandi seguenti partono dalla directory di `hello-rust`. Sono varianti facoltative, non necessarie al saluto; modificano manifest e risoluzione delle dipendenze.

Se hai creato la libreria sorella, aggiungila come dipendenza locale:

```bash
cargo add --path ../libreria
```

Per aggiungere Serde dal registry configurato, normalmente crates.io:

```bash
cargo add serde
```

Esempio con una feature esplicita di Tokio:

```bash
cargo add tokio --features full
```

`full` attiva un insieme ampio di funzionalita: non e una scelta minima universale. Seleziona le feature necessarie al progetto. Aggiungere la dipendenza non aggiunge automaticamente import, derive o un runtime al programma.

Le operazioni sul registry possono richiedere rete. `cargo add` modifica le dipendenze del progetto; `cargo install` installa invece eseguibili e non sostituisce questa operazione. Vedi [cargo add](https://doc.rust-lang.org/cargo/commands/cargo-add.html), [cargo install](https://doc.rust-lang.org/cargo/commands/cargo-install.html) e [[Programmazione/Rust/Pagine/Cargo features|Cargo features]].

### Lockfile, rete e CI

Richiedi che la risoluzione non modifichi il lockfile; se e assente o da aggiornare il comando fallisce:

```bash
cargo build --locked
```

Lavora senza accesso alla rete da parte di Cargo; le dipendenze necessarie devono essere disponibili localmente:

```bash
cargo build --offline
```

Combina lockfile invariato e modalita offline:

```bash
cargo build --frozen
```

Prima di lavorare offline puoi scaricare le dipendenze del lockfile gia presente:

```bash
cargo fetch --locked
```

`--locked` non blocca la rete; `--offline` puo ancora creare o aggiornare il lockfile; `--frozen` combina le due restrizioni. Queste opzioni non isolano build script o processi figli dal sistema. Vedi [cargo fetch](https://doc.rust-lang.org/cargo/commands/cargo-fetch.html).

### Workspace, pulizia e distribuzione

Dalla root di un workspace, verifica tutti i membri:

```bash
cargo test --workspace
```

Senza `--workspace` la selezione predefinita dipende dal manifest e dai `default-members`; `-p` seleziona un package. Vedi [[Programmazione/Rust/Pagine/Workspace|Workspace]].

Per eliminare gli artefatti generati, **solo dopo aver controllato workspace e directory di output**:

```bash
cargo clean
```

E una cancellazione reale: normalmente rimuove `target/`, non i sorgenti, ma elimina anche eventuali file che vi hai salvato manualmente. Non usarlo come primo tentativo per ogni errore: perdi la cache e la build successiva sara piu costosa. Vedi [cargo clean](https://doc.rust-lang.org/cargo/commands/cargo-clean.html).

`cargo bench` e il punto di ingresso per benchmark con l'harness scelto; non e sinonimo di `cargo test`. `cargo publish` invia un package al registry: e un'azione remota, non un passaggio di build locale. `cargo publish --dry-run` evita l'upload, ma puo compilare e usare la rete. L'esercizio ha `publish = false` e non prevede pubblicazione. Vedi [cargo publish](https://doc.rust-lang.org/cargo/commands/cargo-publish.html).

## Errori comuni

- Lanciare `cargo build` dalla directory sbagliata e usare involontariamente il manifest di un parent.
- Considerare `check` un sostituto di build, linking o test.
- Interpretare zero test eseguiti come copertura sufficiente.
- Credere che `fmt` o Clippy dimostrino la correttezza della logica.
- Usare `--all-targets` come se abilitasse tutte le feature o verificasse ogni sistema operativo.
- Confondere package, crate e target binario, oppure `cargo add` e `cargo install`.
- Ignorare gli effetti di formattazione, modifica del lockfile, pulizia o pubblicazione.
- Eseguire progetti non fidati supponendo che `--offline` li isoli.

## Checklist

- Hai selezionato manifest, package, target e toolchain corretti?
- I comandi che modificano file sono distinti dai controlli?
- Hai eseguito test reali, non soltanto compilato i target di test?
- La CI usa una policy esplicita per warning, formattazione e lockfile?
- Le dipendenze hanno le sole feature necessarie?
- Gli artefatti sono esclusi da Git e il lockfile ha una policy documentata?
- Gli effetti di build script e comandi remoti sono accettabili per il progetto?

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Crates.io|Crates.io]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]
- [[Programmazione/Rust/Pagine/Build scripts|Build scripts]]
- [[Programmazione/Rust/Pagine/Workspace|Workspace]]
- [[Programmazione/Rust/Pagine/Moduli crate e package|Moduli, crate e package]]
- [[Programmazione/Rust/Pagine/rustfmt|rustfmt]]
- [[Programmazione/Rust/Pagine/Clippy|Clippy]]
- [[Programmazione/Rust/Pagine/Unit test|Unit test]]
- [[Programmazione/Rust/Pagine/Integration test|Integration test]]
- [[Programmazione/Rust/Pagine/Commenti e documentazione|Commenti e documentazione]]

## Fonti

Documentazione ufficiale consultata per Rust/Cargo 1.99.1; i capitoli specifici approfondiscono manifest, lockfile, feature, profili e pubblicazione.

- [Cargo Book: comandi](https://doc.rust-lang.org/cargo/commands/index.html)
- [cargo check](https://doc.rust-lang.org/cargo/commands/cargo-check.html)
- [cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html)
- [cargo new](https://doc.rust-lang.org/cargo/commands/cargo-new.html)
- [cargo run](https://doc.rust-lang.org/cargo/commands/cargo-run.html)
- [rustfmt](https://github.com/rust-lang/rustfmt)
- [Clippy: utilizzo](https://doc.rust-lang.org/clippy/usage.html)

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

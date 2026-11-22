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
  - workspace.dependencies
  - Dipendenze workspace
prerequisites:
  - "[[Programmazione/Rust/Pagine/Workspace]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
  - "[[Programmazione/Rust/Pagine/Cargo features]]"
related:
  - "[[Programmazione/Rust/Pagine/Cargo.lock]]"
  - "[[Programmazione/Rust/Pagine/Cargo features]]"
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
title: Workspace dependencies
---

# Workspace dependencies

## Sintesi

`[workspace.dependencies]` raccoglie dichiarazioni di dipendenze riutilizzabili dai membri di un workspace Cargo. Ogni membro sceglie quali ereditare con `workspace = true`: la tabella centrale **non aggiunge dipendenze a tutti i package**.

Serve a mantenere coerenti sorgenti, requisiti di versione e feature comuni. Non sostituisce `Cargo.lock`, non impedisce altre versioni nel grafo e non rende identiche tutte le configurazioni di compilazione.

## Quando usarlo

- Piu package interni consumano la stessa libreria.
- Vuoi aggiornare un requisito comune in un solo manifest.
- Devi coordinare feature di base senza nascondere le dipendenze dei membri.
- Vuoi separare regole condivise ed esigenze specifiche di CLI, servizi o strumenti di build.

Per una dipendenza usata da un solo membro, una dichiarazione locale puo essere piu leggibile. La centralizzazione e una scelta di manutenzione, non un requisito di Cargo.

## Come funziona

### Elementi da distinguere

| Elemento | Cosa decide |
| --- | --- |
| `[workspace].members` | Quali package appartengono al workspace |
| `[workspace.dependencies]` | Quali dichiarazioni possono essere ereditate |
| `[dependencies]` del membro | Quali dipendenze usa quel package |
| `[features]` del membro | Quali capacita opzionali espone quel package |
| `Cargo.lock` | Quali versioni e sorgenti sono state risolte |

Un package puo essere membro senza essere dipendenza di un altro. Una dipendenza puo essere centralizzata senza essere utilizzata da nessuno. Il campo `path` nella dichiarazione centrale parte dalla **radice del workspace**, non dalla directory di ogni membro. [Workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html).

La chiave ereditata deve esistere nella tabella centrale. `format-core.workspace = true` e la forma breve di `format-core = { workspace = true }`. Non aggiungere al membro un nuovo `version` o `path` pensando di sovrascrivere quello ereditato: usa una dichiarazione locale distinta quando non vuoi ereditare. [Dipendenze ereditate](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#inheriting-a-dependency-from-a-workspace).

### Feature additive, non sottrattive

Le feature nominate nella radice si sommano a quelle richieste dal membro. Una lista locale vuota non cancella la lista centrale.

Inoltre Cargo unifica le feature richieste per lo stesso package nel medesimo contesto di compilazione. Compilare due membri insieme puo quindi attivare piu feature rispetto a compilarne uno da solo. I resolver 2 e 3 separano alcuni contesti, come build-dependencies e dipendenze normali, ma **non eliminano** questa unione fra normali dipendenze condivise. [Risoluzione delle feature](https://doc.rust-lang.org/cargo/reference/resolver.html#features).

Questo spiega perche un test dell'intero workspace non basta a dimostrare che ogni membro compili con il proprio insieme minimo di feature.

## API / Sintassi

### Cosa si eredita e cosa resta locale

- Nella radice definisci sorgente, requisito di versione, eventuale nome originale tramite `package`, feature comuni e politica delle feature predefinite.
- Nel membro abiliti l'ereditarieta, aggiungi feature oppure dichiari opzionale una dipendenza normale.
- `optional = true` **non va** in `[workspace.dependencies]`: l'opzionalita e una decisione del consumatore.
- L'ereditarieta funziona anche nelle sezioni `dev-dependencies`, `build-dependencies` e nelle dipendenze specifiche di target; ciascuna conserva il proprio ruolo.

Con una rinomina, il membro eredita la **chiave** della dichiarazione centrale. Per esempio una chiave `fmt` con `package = "format-core"` viene usata come `fmt.workspace = true` e, nel codice Rust, come `fmt::...`. [Dichiarazioni e rinomina](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#renaming-dependencies-in-cargotoml).

### default-features: specificare versione ed edition

Considera il caso in cui la radice lascia le feature predefinite attive e il membro scrive `default-features = false`:

| Membro e toolchain | Comportamento |
| --- | --- |
| Edition precedenti alla 2024 | Il tentativo locale di disabilitarle viene ignorato con avviso |
| Edition 2024, Rust 1.85-1.98 | La combinazione viene rifiutata |
| Edition 2024, Rust 1.99+ | Il valore locale puo sovrascrivere quello ereditato |

Il comportamento 1.99 e descritto nel [Cargo Book aggiornato](https://doc.rust-lang.org/cargo/reference/workspaces.html#the-dependencies-table) e nella [Edition Guide aggiornata](https://doc.rust-lang.org/nightly/edition-guide/rust-2024/cargo-inherited-default-features.html). La [pagina storica della migrazione 2024](https://doc.rust-lang.org/edition-guide/rust-2024/cargo-inherited-default-features.html) descrive il rifiuto originario: non applicarlo indistintamente alle toolchain successive.

Per mantenere compatibilita con Rust 1.85, il laboratorio disabilita i default **nella radice**. Il membro eredita quella scelta; puo riabilitarli con `default-features = true`. In ogni versione, un altro percorso nel grafo puo comunque richiederli: `false` non e un divieto globale. [Default e unificazione](https://doc.rust-lang.org/cargo/reference/features.html#the-default-feature).

### Baseline e resolver

L'ereditarieta di dipendenze e metadati richiede Cargo 1.64; i lint condivisi sono rispettati da 1.74. Qui usiamo **Rust 1.85+**, edition 2024 e `resolver = "3"`.

La radice del laboratorio e virtuale, quindi il resolver va dichiarato: non viene dedotto dall'edition di un membro. Il resolver 3 aggiunge una preferenza per versioni compatibili con `rust-version`; non installa una toolchain e non certifica da solo la MSRV. [Resolver 3](https://doc.rust-lang.org/edition-guide/rust-2024/cargo-resolver.html).

## Esempio pratico

In una directory di prova `workspace-deps-demo`, fuori dal vault, crea i sette file seguenti rispettando i percorsi nei titoli. Sono tre package locali: **non devi scaricare crate da crates.io**. Servono toolchain, libreria standard e linker per il tuo sistema.

Il laboratorio stampa formati e feature per rendere osservabile Cargo; non e una libreria di serializzazione.

### Cargo.toml

```toml
[workspace]
members = ["crates/format-core", "crates/note-cli", "crates/note-export"]
default-members = ["crates/note-cli"]
resolver = "3"

[workspace.package]
version = "0.1.0"
edition = "2024"
rust-version = "1.85"
license = "MIT"
publish = false

[workspace.dependencies]
format-core = { path = "crates/format-core", default-features = false, features = ["plain"] }

[workspace.lints.rust]
unsafe_code = "forbid"
```

`publish = false` impedisce la pubblicazione dei package che ereditano il campo; non cambia le dipendenze. Il percorso condiviso e valido per entrambi i consumatori, anche se si trovano in directory differenti.

### crates/format-core/Cargo.toml

```toml
[package]
name = "format-core"
version.workspace = true
edition.workspace = true
rust-version.workspace = true
license.workspace = true
publish.workspace = true

[features]
default = ["pretty"]
plain = []
pretty = []

[lints]
workspace = true
```

Il default della libreria e intenzionalmente `pretty`: serve a osservare che la dichiarazione centrale lo disabilita quando viene consumata come dipendenza. `plain` viene richiesto esplicitamente dalla radice.

### crates/format-core/src/lib.rs

```rust
/// Rimuove gli spazi ai bordi senza allocare.
///
/// ```
/// assert_eq!(format_core::normalize_name(" Rust "), "Rust");
/// ```
pub fn normalize_name(name: &str) -> &str {
    name.trim()
}

pub fn enabled_features() -> (bool, bool) {
    (cfg!(feature = "plain"), cfg!(feature = "pretty"))
}

#[cfg(feature = "plain")]
pub fn plain_label(name: &str) -> String {
    format!("name={}", normalize_name(name))
}

#[cfg(feature = "pretty")]
pub fn pretty_label(name: &str) -> String {
    format!("[{}]", normalize_name(name))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalization() {
        assert_eq!(normalize_name(" Rust "), "Rust");
        assert_eq!(normalize_name("   "), "");
    }

    #[cfg(feature = "plain")]
    #[test]
    fn plain_format() {
        assert_eq!(plain_label(" Rust "), "name=Rust");
    }

    #[cfg(feature = "pretty")]
    #[test]
    fn pretty_format() {
        assert_eq!(pretty_label(" Rust "), "[Rust]");
    }
}
```

### crates/note-cli/Cargo.toml

```toml
[package]
name = "note-cli"
version.workspace = true
edition.workspace = true
rust-version.workspace = true
license.workspace = true
publish.workspace = true

[dependencies]
format-core.workspace = true

[lints]
workspace = true
```

### crates/note-cli/src/main.rs

```rust
fn main() {
    println!("{}", format_core::plain_label(" Rust "));
    println!("features={:?}", format_core::enabled_features());
}
```

Il trattino del nome `format-core` diventa underscore nel percorso Rust `format_core`. Se manca la dichiarazione del membro, la presenza della libreria nel workspace non rende questo codice compilabile.

### crates/note-export/Cargo.toml

```toml
[package]
name = "note-export"
version.workspace = true
edition.workspace = true
rust-version.workspace = true
license.workspace = true
publish.workspace = true

[dependencies]
format-core = { workspace = true, optional = true, features = ["pretty"] }

[features]
default = []
pretty = ["dep:format-core"]

[lints]
workspace = true
```

`pretty` e la feature pubblica di `note-export`; `dep:format-core` abilita la dipendenza opzionale senza esporre anche una feature implicita chiamata `format-core`. La feature `pretty` della libreria viene richiesta dalla dichiarazione di dipendenza: non si attiva soltanto perche ha lo stesso nome. [Dipendenze opzionali](https://doc.rust-lang.org/cargo/reference/features.html#optional-dependencies).

### crates/note-export/src/main.rs

```rust
#[cfg(feature = "pretty")]
fn main() {
    println!("{}", format_core::pretty_label(" Rust "));
    println!("features={:?}", format_core::enabled_features());
}

#[cfg(not(feature = "pretty"))]
fn main() {
    println!("export disabled");
}
```

### Osservare i tre casi

Esegui dalla radice del laboratorio.

CLI con la sola feature centrale `plain`:

```bash
cargo run --quiet -p note-cli
```

Stampa `name=Rust` e `features=(true, false)`. La coppia indica rispettivamente `plain` e `pretty`.

Esportatore senza dipendenza opzionale attiva:

```bash
cargo run --quiet -p note-export
```

Stampa `export disabled`. In questa invocazione non occorre compilare `format-core` per il programma selezionato.

Esportatore con la capacita opzionale:

```bash
cargo run --quiet -p note-export --features pretty
```

Stampa `[Rust]` e `features=(true, true)`: `plain` arriva dalla radice, `pretty` dal membro.

### Osservare l'unificazione

Compila entrambi i consumatori nella stessa invocazione:

```bash
cargo build -p note-cli -p note-export --features note-export/pretty
```

La libreria condivisa riceve entrambe le feature anche per la CLI. Per vedere chi le richiede:

```bash
cargo tree -p note-cli -p note-export --features note-export/pretty -e features
```

Visualizzazione inversa centrata sulla dipendenza:

```bash
cargo tree -p note-export --features pretty -e features -i format-core
```

Ripetere poi il comando di esecuzione della sola CLI ripristina la configurazione richiesta per quell'invocazione: le feature non sono un'impostazione globale permanente.

Attenzione a `--workspace`: seleziona anche `format-core` come package da costruire, attivandone normalmente i default. Non equivale a costruire soltanto i due consumatori senza feature aggiuntive. [Selezione dei package](https://doc.rust-lang.org/cargo/reference/workspaces.html#package-selection).

### Verificare tutto e verificare il minimo

Controllo di tutti i target del workspace:

```bash
cargo check --workspace --all-targets
```

Test con tutte le feature dei membri:

```bash
cargo test --workspace --all-features
```

La libreria ha tre unit test e un doctest in questa configurazione. Per verificare che non dipenda accidentalmente da feature abilitate da altri membri, usa anche invocazioni separate:

```bash
cargo test -p format-core --no-default-features
```

```bash
cargo test -p format-core --no-default-features --features plain
```

```bash
cargo test -p format-core --no-default-features --features pretty
```

```bash
cargo test -p format-core --all-features
```

Il primo caso esegue un unit test e un doctest; i casi `plain` e `pretty` ne eseguono due piu un doctest. `--all-features` non rappresenta una prova di ogni combinazione possibile.

Manifest effettivi e metadati ereditati:

```bash
cargo metadata --format-version 1 --no-deps
```

Il JSON mostra i package e le loro dichiarazioni; con `--no-deps` non fornisce il grafo risolto completo. Non interpretare una feature dichiarata come prova che sia attiva in un eseguibile.

Formattazione, senza riscrivere i sorgenti:

```bash
cargo fmt --all -- --check
```

Lint, con Clippy installato:

```bash
cargo clippy --workspace --all-targets --all-features -- -D warnings
```

Eventuali versioni duplicate nel grafo:

```bash
cargo tree --workspace --duplicates
```

Nel laboratorio non ci sono duplicati. Nel progetto reale, una lista vuota non dimostra che tutte le dipendenze siano ereditate dalla radice. [Cargo tree](https://doc.rust-lang.org/cargo/commands/cargo-tree.html).

Dopo che un comando precedente ha generato il lockfile:

```bash
cargo test --workspace --all-features --locked
```

`--locked` impedisce di cambiare la risoluzione registrata; non installa componenti mancanti e non significa automaticamente offline. [Cargo.lock](https://doc.rust-lang.org/cargo/guide/cargo-toml-vs-cargo-lock.html).

## Varianti

### Registry, Git e dipendenze locali

Lo stesso meccanismo vale per dipendenze da registry o Git. Esempi applicativi sono `serde` con `derive`, `tokio` con una base `rt` e `macros` aggiunta dal membro, oppure `clap`, `anyhow` e `thiserror` condivise. I loro requisiti e le feature vanno scelti secondo il progetto: non sono dipendenze del laboratorio ne esempi di quelle API eseguiti qui.

Con un requisito come `version = "1"` centralizzi un intervallo compatibile, non una versione esatta. Il lockfile registra la scelta concreta; dipendenze transitive o dichiarazioni locali differenti possono introdurre versioni diverse. Non cercare di correggere ogni duplicazione imponendo un numero arbitrario: verifica prima vincoli e compatibilita dei tipi.

Per una dipendenza interna destinata alla pubblicazione puo servire `path` insieme a un requisito `version` valido nel registry. Il laboratorio ha solo percorsi locali e `publish = false`: non e una procedura di pubblicazione. Vedi [[Programmazione/Rust/Pagine/Crates.io|Crates.io]].

### Metadati e lint condivisi

`[workspace.package]` definisce valori riutilizzabili, ma ogni membro deve richiederli, per esempio con `edition.workspace = true`. Un valore esplicito nel membro resta una scelta locale.

Analogamente `[workspace.lints]` richiede `[lints] workspace = true` nel membro: dichiarare un lint in radice non lo impone a chi non aderisce. Nel laboratorio tutti i membri aderiscono; una prova che introduce codice `unsafe` deve quindi fallire. I profili di compilazione hanno invece una regola diversa: si configurano nella radice, senza un'adesione per membro. Vedi [[Programmazione/Rust/Pagine/Build profiles|Build profiles]].

### Dipendenze di build, test e target

Ereditare in `build-dependencies` rende la crate disponibile a `build.rs`, non automaticamente al normale sorgente. Ereditare in `dev-dependencies` non la rende una dipendenza normale della libreria.

Una sezione condizionata da target decide quando usare la dipendenza; `workspace = true` decide da dove leggere la dichiarazione. Sono dimensioni diverse. Per le feature dei vari contesti, vedi [[Programmazione/Rust/Pagine/Cargo features|Cargo features]].

## Errori comuni

- Dichiarare una dipendenza soltanto in radice e usarla in un membro: manca l'adesione locale.
- Usare un percorso relativo al membro nella tabella centrale: Cargo cerca nel posto sbagliato.
- Mettere `optional = true` nella radice: l'opzionalita va dichiarata dal consumatore.
- Aggiungere `features = []` pensando di eliminare le feature centrali.
- Ignorare edition e toolchain quando si sovrascrive `default-features`.
- Scambiare `--no-default-features` per una disattivazione globale dei default di tutte le dipendenze.
- Considerare un test con `--workspace --all-features` sufficiente per tutte le configurazioni minime.
- Usare `cfg(feature = "pretty")` pensando che osservi le feature di un altro package: si riferisce a quelle della crate corrente.
- Credere che centralizzare un requisito elimini ogni versione duplicata o aggiorni da solo il lockfile.
- Ereditare un campo da `workspace.package` o `workspace.lints` senza definirlo nella radice.

## Checklist

- La dipendenza e veramente condivisa?
- Ogni consumatore dichiara esplicitamente cio che usa?
- I percorsi centrali sono relativi alla radice?
- Le feature comuni sono necessarie a tutti i consumatori?
- La politica dei default e compatibile con la MSRV e l'edition dei membri?
- Le dipendenze opzionali hanno API e `cfg` coerenti?
- Hai testato sia il workspace sia le configurazioni minime isolate?
- Hai controllato grafo, lockfile e duplicazioni dopo la modifica?
- Metadati, lint e profili sono configurati secondo le rispettive regole?

## Collegamenti

- [[Programmazione/Rust/Pagine/Workspace|Workspace]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]
- [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]

## Fonti

- [Cargo Book: workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html), sezioni dependencies, package e lints.
- [Cargo Book: dichiarare dipendenze](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html), ereditarieta e rinomina.
- [Cargo Book: resolver](https://doc.rust-lang.org/cargo/reference/resolver.html), feature e lockfile.
- [Edition Guide: override dei default ereditati](https://doc.rust-lang.org/nightly/edition-guide/rust-2024/cargo-inherited-default-features.html), distinzione introdotta in Rust 1.99 per edition 2024.
- Fonti specifiche nelle sezioni; prove riproducibili in `_Meta/tests/rust-workspace-dependencies.test.mjs` nel repository.

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

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
  - SemVer
  - Versionamento semantico
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
  - "[[Programmazione/Rust/Pagine/Crates.io]]"
related:
  - "[[Programmazione/Rust/Pagine/Cargo.lock]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
  - "[[Programmazione/Rust/Pagine/Compatibility e breaking changes]]"
title: Semantic Versioning
---


# Semantic Versioning

## Sintesi

**Semantic Versioning (SemVer)** comunica l'evoluzione di un contratto pubblico mediante `MAJOR.MINOR.PATCH`. Non misura quanto codice hai scritto: una piccola modifica puo rompere tutti i chiamanti.

Distingui tre cose: la versione dichiarata dal produttore, il requisito accettato dal consumer in `Cargo.toml` e la versione effettivamente scelta in `Cargo.lock`. Cargo controlla i requisiti numerici, **non dimostra che il produttore abbia mantenuto la compatibilita**.

## Quando usarlo

- Per scegliere il numero di una nuova release.
- Per esprimere quali aggiornamenti puo ricevere una dipendenza.
- Per valutare una migrazione e leggere un changelog.
- Per progettare test che rappresentino il codice degli utilizzatori.

## Come funziona

### Contratto pubblico e numero della release

In `1.4.2`, `1` e la major, `4` la minor e `2` la patch. Da una versione stabile `1.4.2`:

- `1.4.3`: correzione compatibile.
- `1.5.0`: nuova funzionalita compatibile; anche una deprecazione pubblica richiede una minor secondo SemVer.
- `2.0.0`: modifica incompatibile.

Gli incrementi azzerano le componenti successive. La specifica richiede un'API pubblica definita e vieta di modificare una release gia distribuita. La forma completa richiede tre interi senza zeri iniziali: `1.02.3` non e valida. [SemVer 2.0.0](https://semver.org/spec/v2.0.0.html).

Il contratto puo comprendere comportamento documentato, formati, errori, feature e piattaforme, non soltanto funzioni `pub`. Non classificare automaticamente come patch una modifica chiamata "bugfix": valuta cosa cambia per chi la usa.

### Prima della versione 1.0

La specifica SemVer considera `0.y.z` sviluppo iniziale, senza una promessa generale di stabilita. **Cargo applica comunque intervalli precisi**: nelle requirement caret, cambia compatibilita quando cambia la prima componente non zero.

Per una crate `0.3.2`, una modifica incompatibile porta normalmente a `0.4.0`; le modifiche compatibili possono andare in `0.3.3`. Fra `0.0.3` e `0.0.4` Cargo considera invece cambiata la linea compatibile. [Convenzioni Rust](https://doc.rust-lang.org/cargo/reference/semver.html#change-categories).

Questo non significa che tutti i requisiti che iniziano con zero abbiano un intervallo stretto: `"0"` e molto piu ampio di `"0.3.2"`. La tabella seguente distingue i casi.

### Requisito, risoluzione e lockfile

`version = "1.2.3"` in `[package]` identifica una release; `version = "1.2.3"` in una dipendenza esprime un requisito compatibile. Non sono intercambiabili. [Manifest](https://doc.rust-lang.org/cargo/reference/manifest.html#the-version-field).

Il resolver combina i vincoli dell'intero grafo e normalmente conserva le versioni gia bloccate se restano ammissibili. Nelle nuove risoluzioni tende a preferire versioni alte, ma entrano in gioco anche altri vincoli, compresa la toolchain supportata. Non basta dire "sceglie sempre l'ultima". [Resolver Cargo](https://doc.rust-lang.org/cargo/reference/resolver.html).

## API / Sintassi

### Intervalli per le release stabili

La colonna destra descrive **solo versioni senza prerelease**. Nella colonna sinistra e mostrata la stringa da usare nel requisito di una dipendenza.

| Requisito | Intervallo stabile |
| --- | --- |
| `1.2.3` | `>=1.2.3, <2.0.0` |
| `^1.2.3` | `>=1.2.3, <2.0.0` |
| `1.0` | `>=1.0.0, <2.0.0` |
| `~1.2.3` | `>=1.2.3, <1.3.0` |
| `~1` | `>=1.0.0, <2.0.0` |
| `1.2.*` | `>=1.2.0, <1.3.0` |
| `=1.2.3` | `=1.2.3` |
| `>=1.2, <2.0` | `>=1.2.0, <2.0.0` |
| `0.3.2` | `>=0.3.2, <0.4.0` |
| `0.0.3` | `>=0.0.3, <0.0.4` |
| `0.0` | `>=0.0.0, <0.1.0` |
| `0` | `>=0.0.0, <1.0.0` |
| `*` | Tutte le release stabili |

Caret e implicito quando ometti `^`; tilde e wildcard hanno regole diverse. I confronti separati da virgola sono in **AND**, non alternative. Il requisito `*` e valido per Cargo, ma crates.io non lo ammette come vincolo nudo nelle dipendenze pubblicate. [Requirement Cargo](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#version-requirement-syntax).

Esempio **alternativo**, da leggere come tabella di dipendenze, non da aggiungere al progetto locale piu sotto:

```toml
[dependencies]
serde = "1"
tokio = "1.37"
my-crate = "0.3.2"
crate_a = "^1.2.3"
crate_b = "~1.2"
crate_c = ">=1.2, <2.0"
```

I nomi `my-crate` e `crate_a/b/c` sono segnaposto didattici, non una selezione di librerie da installare. Ogni chiave dichiara una dipendenza distinta.

### Prerelease e build metadata

Per SemVer, una prerelease precede la release corrispondente; gli identificatori numerici si confrontano numericamente. I suffissi dopo `+` non cambiano la precedenza:

```text
1.2.3-alpha.2 < 1.2.3-alpha.10 < 1.2.3-beta.1 < 1.2.3-rc.1 < 1.2.3
1.2.3+build.7 e 1.2.3+build.8 hanno la stessa precedenza
```

[Ordine SemVer](https://semver.org/spec/v2.0.0.html#spec-item-11).

Il filtro Cargo sulle prerelease si aggiunge all'intervallo numerico:

- `"1.2.3"` non ammette automaticamente `1.3.0-alpha.1`.
- `"1.2.3-alpha.1"` puo ammettere `1.2.3-beta.1` e release stabili compatibili, anche `1.4.0`.
- Lo stesso requisito non ammette `1.2.4-alpha.1`: la base della prerelease richiesta deve coincidere.
- `"=1.2.3-alpha.1"` restringe alla prerelease indicata.

Non usare build metadata per bloccare una build specifica: Cargo li ignora nei requisiti. [Prerelease e metadata](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#pre-releases).

## Esempio pratico

### Progetto locale completo

Crea questi **cinque file** in una directory di prova esterna al vault. Il workspace contiene un consumer e una libreria didattica, entrambi non pubblicabili. Non richiede dipendenze esterne.

Verificato con **Rust/Cargo 1.99.1**, edition **2024**, Windows GNU. Il percorso `path` punta alla copia locale: questo esercizio verifica vincolo e compatibilita del codice, **non simula il download delle release da crates.io**.

### Cargo.toml

```toml
[package]
name = "semver-client"
version = "0.1.0"
edition = "2024"
publish = false

[dependencies]
number-parser = { path = "number-parser", version = "1.2.3" }

[workspace]
members = ["number-parser"]
resolver = "3"
```

### src/main.rs

```rust
fn main() {
    let value = number_parser::parse(" 42 ").expect("input valido");
    assert_eq!(value, 42);
    println!("{value}");
}
```

### number-parser/Cargo.toml

```toml
[package]
name = "number-parser"
version = "1.2.3"
edition = "2024"
publish = false
```

### number-parser/src/lib.rs

```rust
use std::num::ParseIntError;

/// Legge un u32 dopo aver rimosso il whitespace esterno.
pub fn parse(input: &str) -> Result<u32, ParseIntError> {
    input.trim().parse()
}
```

`ParseIntError` e un tipo reale della libreria standard. L'esempio non accetta numeri negativi o oltre `u32::MAX`. La gestione degli spazi dipende dal `trim` esplicito; non e una conversione di formati numerici locali. [Parsing di interi](https://doc.rust-lang.org/std/num/struct.ParseIntError.html).

### number-parser/tests/parse.rs

```rust
#[test]
fn public_contract() {
    assert_eq!(number_parser::parse(" 42 ").unwrap(), 42);
    assert_eq!(number_parser::parse("0").unwrap(), 0);
    assert!(number_parser::parse("").is_err());
    assert!(number_parser::parse("-1").is_err());
    assert!(number_parser::parse("4294967296").is_err());
}
```

### Verificare la versione iniziale

Dalla directory principale, controlla il formato senza riscrivere i file. Serve rustfmt:

```bash
cargo fmt --all -- --check
```

Controlla tutti i target del workspace:

```bash
cargo check --workspace --all-targets
```

Esegui il consumer: deve stampare `42`.

```bash
cargo run -p semver-client
```

Esegui anche i test pubblici della libreria:

```bash
cargo test --workspace
```

Questi comandi possono generare `Cargo.lock` e file sotto `target/`. Un check riuscito non esegue le asserzioni: per questo run e test restano separati.

### Evoluzione compatibile: 1.3.0

Nel manifest **della libreria**, modifica `version` da `1.2.3` a `1.3.0`. Sostituisci il suo `src/lib.rs` con:

```rust
use std::num::ParseIntError;

/// Legge un u32 dopo aver rimosso il whitespace esterno.
pub fn parse(input: &str) -> Result<u32, ParseIntError> {
    input.trim().parse()
}

/// Legge un u32 senza rimuovere il whitespace esterno.
pub fn parse_strict(input: &str) -> Result<u32, ParseIntError> {
    input.parse()
}
```

Ripeti run e test: il consumer e il test precedente restano invariati. Il requisito `"1.2.3"` accetta `1.3.0`; l'aggiunta di `parse_strict` preserva qui la vecchia API e il suo comportamento.

Se il consumer inizia a usare `parse_strict`, deve dichiarare almeno `"1.3.0"`: riuscire a compilare con una versione recente non dimostra che funzioni anche con il minimo ancora ammesso dal manifest.

Se cambiassi `parse` affinche non rimuova piu gli spazi, il consumer compilerebbe ma fallirebbe durante l'esecuzione. La stessa firma non basta a conservare il contratto.

### Evoluzione incompatibile: 2.0.0

Questa e un'**alternativa alla versione iniziale 1.2.3**, non una continuazione obbligata della variante minor. Cambia la versione della libreria a `2.0.0` e sostituisci il suo sorgente con:

```rust
use std::num::ParseIntError;

/// Il parametro strict decide se conservare il whitespace esterno.
pub fn parse(input: &str, strict: bool) -> Result<u32, ParseIntError> {
    let text = if strict { input } else { input.trim() };
    text.parse()
}
```

Controlla il consumer:

```bash
cargo check -p semver-client
```

Con il requisito originale Cargo rifiuta la versione locale `2.0.0`. Cambia quindi **solo** il requisito del consumer in `version = "2"`, lasciando `path`: la risoluzione passa, ma il vecchio consumer non compila perche manca il secondo argomento (**E0061**).

### Consumer adattato alla 2.0.0

Cambiare il numero della release segnala la rottura: non migra il chiamante. Per adattarlo, sostituisci il suo `src/main.rs` con:

```rust
fn main() {
    let value = number_parser::parse(" 42 ", false).expect("input valido");
    assert_eq!(value, 42);
    assert!(number_parser::parse(" 42 ", true).is_err());
    println!("{value}");
}
```

Aggiorna anche le chiamate in `number-parser/tests/parse.rs` aggiungendo `false` come secondo argomento, poi ripeti run e test. Questo esempio mostra il costo della migrazione; non raccomanda il booleano come scelta di API rispetto a due funzioni dai nomi espliciti.

## Varianti

### Aggiornare una dipendenza da registry

In un progetto reale, dopo aver controllato il changelog puoi simulare l'aggiornamento di **una dipendenza Serde gia presente**:

```bash
cargo update -p serde --dry-run
```

Per applicarlo al lockfile:

```bash
cargo update -p serde
```

Questi comandi possono consultare il registry e non appartengono all'esercizio offline. L'aggiornamento rispetta il manifest, non cambia da solo un vincolo `"1"` in `"2"`; alcune transitive possono cambiare se necessario. Esegui poi i test della tua applicazione. [cargo update](https://doc.rust-lang.org/cargo/commands/cargo-update.html).

Un requisito esatto limita quella dipendenza, **non fissa l'intero grafo**. Per il ruolo del lockfile e gli aggiornamenti mirati vedi [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]].

### Compatibilita non significa assenza assoluta di rischi

Aggiungere una funzione libera e normalmente minor, ma import glob o ambiguita possono causare rotture anche in cambiamenti convenzionalmente compatibili.

Rimuovere item pubblici, aggiungere parametri obbligatori, introdurre varianti in enum esaustivi o obblighi in trait pubblici richiede invece di valutare una release incompatibile. Deprecare senza rimuovere puo preparare la migrazione.

MSRV e requisiti di piattaforma richiedono una policy dichiarata: un aumento non e automaticamente sempre una major. Le linee guida Cargo lo classificano come potenzialmente breaking e generalmente suggeriscono una minor. [Compatibilita Rust](https://doc.rust-lang.org/cargo/reference/semver.html).

Per l'analisi delle superfici pubbliche vedi [[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]; per la toolchain minima vedi [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV]].

## Errori comuni

- Leggere `"1.2.3"` come `"=1.2.3"`.
- Considerare equivalenti `"0"`, `"0.3.2"` e `"0.0.3"`.
- Deducere la compatibilita dal numero di righe modificate o dalla parola bugfix.
- Credere che il resolver analizzi automaticamente la vecchia API.
- Considerare una prerelease parte di ogni intervallo numerico che la contiene.
- Confondere build metadata, versione del package, edition e MSRV.
- Usare un vincolo esatto pensando di congelare anche tutte le transitive.
- Eseguire soltanto check e non i test del comportamento pubblico.

## Checklist

- [ ] L'API e il comportamento promessi sono espliciti?
- [ ] La release segue SemVer e le convenzioni Cargo per 0.x?
- [ ] Ho provato un consumer che usava la versione precedente?
- [ ] Ho verificato anche errori, feature, target e MSRV supportati?
- [ ] Requisito, prerelease e lockfile hanno il significato voluto?
- [ ] Le deprecazioni e la migrazione sono descritte nel changelog?
- [ ] I test verificano il comportamento, non solo la compilazione?

## Collegamenti

- [[Programmazione/Rust/Pagine/Crates.io|Crates.io]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Workspace|Workspace]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]
- [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV]]

## Fonti

- [SemVer 2.0.0](https://semver.org/spec/v2.0.0.html).
- [Cargo: sintassi dei requisiti](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html).
- [Cargo: compatibilita delle API](https://doc.rust-lang.org/cargo/reference/semver.html).
- [Cargo: risoluzione delle dipendenze](https://doc.rust-lang.org/cargo/reference/resolver.html).
- [Cargo: aggiornamento del lockfile](https://doc.rust-lang.org/cargo/commands/cargo-update.html).
- [Standard library: ParseIntError](https://doc.rust-lang.org/std/num/struct.ParseIntError.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

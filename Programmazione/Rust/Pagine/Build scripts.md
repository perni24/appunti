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
  - build.rs
  - Cargo build scripts
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo]]"
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
related:
  - "[[Programmazione/Rust/Pagine/bindgen e cbindgen]]"
  - "[[Programmazione/Rust/Pagine/FFI]]"
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
title: Build scripts
---

# Build scripts

## Sintesi

Un **build script** e un programma Rust che Cargo compila ed esegue durante la build, prima dei target del package che ne usano il risultato. Il nome convenzionale e `build.rs`, nella radice del package.

Serve per generare codice, rilevare prerequisiti o integrare librerie native. Non e un punto di inizializzazione dell'applicazione: puo essere eseguito anche durante `cargo check` o `cargo test`, quando Cargo ritiene necessario rigenerare gli output.

Usalo solo quando dati statici, feature o normale codice Rust non bastano. Un build script esegue codice con i permessi del processo di build: valutalo anche quando proviene da una dipendenza. [Ciclo di vita](https://doc.rust-lang.org/cargo/reference/build-scripts.html#life-cycle-of-a-build-script).

## Quando usarlo

- Generare sorgenti da uno schema o da un input del progetto.
- Compilare codice C/C++ o trovare una libreria nativa.
- Verificare una capacita dell'ambiente di compilazione.
- Incorporare un identificativo di release in un artefatto.
- Comunicare al compilatore configurazioni che non sono feature scelte dall'utente.

Per una porta, una password o un'impostazione modificabile all'avvio, usa configurazione runtime. Non inserire segreti nei sorgenti generati o in valori incorporati nel binario.

## Come funziona

### Un programma separato

Cargo riconosce automaticamente `build.rs`. `[package].build` puo indicare un altro file oppure essere `false` per disabilitarlo. Nel laboratorio il percorso e dichiarato esplicitamente per renderlo visibile.

Le crate usate dal build script vanno in `[build-dependencies]`. Non diventano per questo disponibili al codice dell'applicazione; neppure le normali `[dependencies]` sono automaticamente dipendenze del build script. [Tipi di dipendenze](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#build-dependencies).

### Host e target non sono la stessa cosa

Il build script gira sull'**host**, la macchina che compila. I target del package vengono compilati per il **target** scelto. Con cross-compilazione possono essere diversi.

`cfg!(target_os = "windows")` dentro `build.rs` descrive l'host dello script. Per prendere decisioni sul target usa le variabili che Cargo fornisce al processo:

| Variabile | Uso |
| --- | --- |
| `HOST` | Triple della piattaforma che esegue lo script. |
| `TARGET` | Triple per cui si sta compilando il package. |
| `CARGO_CFG_TARGET_OS` | Sistema operativo del target. |
| `CARGO_MANIFEST_DIR` | Directory del manifest del package. |
| `OUT_DIR` | Directory degli output generati per questa build. |

Leggile durante l'esecuzione dello script con `std::env::var` o `var_os`, non presumere che siano disponibili con `env!` mentre lo script stesso viene compilato. Per percorsi non necessariamente UTF-8, `var_os` restituisce un `OsString`. [Ambiente dei build script](https://doc.rust-lang.org/cargo/reference/environment-variables.html#environment-variables-cargo-sets-for-build-scripts).

### Output e nuove esecuzioni

Lo script stampa su stdout istruzioni per Cargo e scrive i file generati in `OUT_DIR`. La directory puo conservare file delle esecuzioni precedenti: non deve essere considerata vuota.

Cargo puo riusare output gia prodotti. Dichiara gli input reali con `rerun-if-changed` e `rerun-if-env-changed`: aggiungere soltanto `build.rs` non copre un file di configurazione letto dallo script. I cambiamenti ai normali sorgenti Rust continuano comunque a far ricompilare i target interessati.

Per i file, il rilevamento usa attualmente le date di modifica, non una garanzia generale di confronto del contenuto. Cambiamenti allo script o alle sue dipendenze possono inoltre richiederne la ricompilazione. [Rilevamento dei cambiamenti](https://doc.rust-lang.org/cargo/reference/build-scripts.html#change-detection).

## API / Sintassi

Ogni istruzione occupa una riga stampata su stdout:

| Istruzione | Scopo |
| --- | --- |
| `cargo::rerun-if-changed=percorso` | Dichiara un file o una directory di input. |
| `cargo::rerun-if-env-changed=NOME` | Dichiara una variabile esterna ricevuta da Cargo. |
| `cargo::rustc-env=NOME=valore` | Imposta un valore per la compilazione del package. |
| `cargo::rustc-check-cfg=cfg(nome)` | Dichiara un custom cfg atteso; non lo attiva. |
| `cargo::rustc-cfg=nome` | Attiva il custom cfg per il package. |
| `cargo::rustc-link-search=native=percorso` | Aggiunge un percorso di ricerca per il linker. |
| `cargo::rustc-link-lib=dylib=nome` | Richiede una libreria dinamica; `static=nome` richiede quella statica. |

La forma `cargo::KEY=VALUE` richiede Cargo/Rust **1.77**; per toolchain precedenti esiste `cargo:KEY=VALUE`. Questo non rende automaticamente disponibili tutte le direttive moderne: `rustc-check-cfg` viene rispettata da **1.80**. Il laboratorio richiede **1.85** anche per edition 2024. [Direttive e versioni](https://doc.rust-lang.org/cargo/reference/build-scripts.html).

Dichiara sempre i cfg possibili, anche quando sono disattivati. `rustc-check-cfg` aiuta a rilevare nomi errati tramite `unexpected_cfgs`; `rustc-cfg` non attiva una dipendenza opzionale e non sostituisce una feature Cargo. [Controllo dei custom cfg](https://doc.rust-lang.org/rustc/check-cfg/cargo-specifics.html).

## Esempio pratico

### Preparazione

Crea una cartella di prova **fuori dal vault** con i sei file seguenti. Servono Rust/Cargo almeno 1.85 e un linker; non servono crate esterne. Esegui i comandi dalla radice del progetto.

Il laboratorio legge un numero da `settings/max-items.txt` e un identificativo opzionale da `APP_BUILD_ID`. Genera una costante, passa un valore al compilatore e abilita `has_large_limit` quando il limite e almeno 64.

### Cargo.toml

```toml
[package]
name = "build-script-demo"
version = "0.1.0"
edition = "2024"
rust-version = "1.85"
build = "build.rs"
publish = false

[dependencies]
```

### settings/max-items.txt

```text
32
```

### build.rs

```rust
use std::env;
use std::error::Error;
use std::fs;
use std::path::PathBuf;

fn main() -> Result<(), Box<dyn Error>> {
    println!("cargo::rerun-if-changed=settings/max-items.txt");
    println!("cargo::rerun-if-env-changed=APP_BUILD_ID");
    println!("cargo::rustc-check-cfg=cfg(has_large_limit)");

    let source = fs::read_to_string("settings/max-items.txt")?;
    let max_items: u16 = source.trim().parse()?;
    if !(1..=1024).contains(&max_items) {
        return Err("max-items deve essere compreso tra 1 e 1024".into());
    }

    let build_id = match env::var("APP_BUILD_ID") {
        Ok(value) => value,
        Err(env::VarError::NotPresent) => String::from("dev"),
        Err(error) => return Err(error.into()),
    };
    if build_id.is_empty()
        || build_id.len() > 64
        || !build_id
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"-_.".contains(&byte))
    {
        return Err("APP_BUILD_ID: usare 1..64 caratteri ASCII alfanumerici, -, _ o .".into());
    }

    let out_dir = PathBuf::from(env::var_os("OUT_DIR").ok_or("OUT_DIR assente")?);
    let generated = format!("pub const MAX_ITEMS: usize = {max_items};\n");
    fs::write(out_dir.join("limits.rs"), generated)?;

    println!("cargo::rustc-env=DEMO_BUILD_ID={build_id}");
    if max_items >= 64 {
        println!("cargo::rustc-cfg=has_large_limit");
    }
    Ok(())
}
```

I percorsi relativi sono risolti dalla directory del package, che Cargo usa come directory di lavoro dello script. Il file generato contiene un numero gia validato, non testo arbitrario da interpretare come Rust.

La validazione dell'identificativo rifiuta anche newline e caratteri di controllo: un input esterno non deve poter aggiungere altre righe al protocollo stdout di Cargo. In questo esempio un errore termina la build, senza un valore predefinito silenzioso per input non validi.

### src/lib.rs

```rust
mod generated {
    include!(concat!(env!("OUT_DIR"), "/limits.rs"));
}

pub use generated::MAX_ITEMS;
pub const BUILD_ID: &str = env!("DEMO_BUILD_ID");

/// Verifica se il numero richiesto rispetta il limite compilato.
///
/// ```
/// assert!(build_script_demo::within_limit(0));
/// assert!(!build_script_demo::within_limit(usize::MAX));
/// ```
pub fn within_limit(count: usize) -> bool {
    count <= MAX_ITEMS
}

pub fn large_limit() -> bool {
    cfg!(has_large_limit)
}
```

`include!` inserisce il file generato come codice Rust durante la compilazione. Il modulo evita di mescolarne i nomi con tutti gli altri elementi della libreria. Non e un caricamento di configurazione durante l'esecuzione. [include!](https://doc.rust-lang.org/std/macro.include.html).

### src/main.rs

```rust
fn main() {
    println!("build_id={}", build_script_demo::BUILD_ID);
    println!("max_items={}", build_script_demo::MAX_ITEMS);
    println!("large_limit={}", build_script_demo::large_limit());
}
```

### tests/config.rs

```rust
use build_script_demo::{BUILD_ID, MAX_ITEMS, large_limit, within_limit};

#[test]
fn limit_boundaries() {
    assert!(within_limit(0));
    assert!(within_limit(MAX_ITEMS));
    assert!(!within_limit(MAX_ITEMS + 1));
}

#[test]
fn cfg_matches_generated_limit() {
    assert_eq!(large_limit(), MAX_ITEMS >= 64);
}

#[test]
fn build_identifier_is_present() {
    assert!(!BUILD_ID.is_empty());
}
```

### Prima compilazione

Con il file a 32 e `APP_BUILD_ID` non impostata:

```bash
cargo run --quiet
```

Output atteso: `build_id=dev`, `max_items=32` e `large_limit=false`, ciascuno su una riga. Cargo genera anche `Cargo.lock` e gli artefatti sotto `target/`; non modifica i sorgenti del progetto.

Esegui i test:

```bash
cargo test
```

Devono passare **tre test di integrazione e un doctest**. I test usano il limite generato, quindi restano validi anche cambiando il file di input.

### Cambiare gli input

Modifica manualmente `settings/max-items.txt` da `32` a `128` e ripeti il comando di esecuzione: ora il limite deve essere 128 e `large_limit=true`. Riporta poi il file a 32: il cfg deve tornare falso, non restare attivo per una build precedente.

Per la variabile d'ambiente, questi passaggi sono per **PowerShell**, nella stessa sessione. Conserva prima il valore precedente:

```powershell
$savedDemoBuildId = $env:APP_BUILD_ID
```

Imposta l'identificativo:

```powershell
$env:APP_BUILD_ID = 'release-42'
```

Ripeti `cargo run --quiet`: la riga deve diventare `build_id=release-42`. Poi ripristina il valore precedente:

```powershell
$env:APP_BUILD_ID = $savedDemoBuildId
```

Al successivo comando Cargo, l'input ripristinato viene valutato di nuovo. Questi passaggi non cambiano l'ambiente globale di Windows; su altre shell cambia la sintassi per impostare l'ambiente.

**APP_BUILD_ID e l'input dello script; DEMO_BUILD_ID e il valore passato al codice compilato.** `env!` incorpora quest'ultimo nel binario. Cambiare una variabile quando avvii direttamente un eseguibile gia compilato non cambia la costante: per configurazione runtime usa `std::env::var` nel programma, non nello script. [env! e lettura runtime](https://doc.rust-lang.org/std/macro.env.html).

### Controllare generazione e diagnostica

Per vedere anche l'output dello script quando viene realmente eseguito:

```bash
cargo build -vv
```

Una build gia aggiornata puo riusare il risultato senza rieseguire lo script. Non dedurre un'esecuzione nuova dal solo fatto che il file generato esiste o che Cargo ne riporta il percorso.

Controlla tutti i target Cargo; anche questo comando puo eseguire il build script:

```bash
cargo check --all-targets
```

Esegui separatamente i doctest:

```bash
cargo test --doc
```

Con rustfmt e Clippy installati, controlla stile e lint:

```bash
cargo fmt --all -- --check
```

```bash
cargo clippy --all-targets -- -D warnings
```

Questi controlli non sostituiscono i test del programma o una build per ciascuna piattaforma supportata. Il laboratorio e verificato con **Rust/Cargo 1.85.0 e 1.99.1, Windows GNU**; fmt e Clippy con 1.99.1. I passaggi d'ambiente sono verificati in PowerShell.

## Varianti

### Codice generato e invalidazione

Aggiungi una direttiva per ogni file letto dal generatore e per le variabili esterne da cui dipende il risultato. `rerun-if-env-changed` riguarda l'ambiente ricevuto da Cargo, non le variabili come `TARGET` che Cargo prepara appositamente per lo script.

Una lettura `env!` o `option_env!` nel codice Rust e tracciata automaticamente; una lettura procedurale nello script con `std::env::var` va trattata come input della generazione.

Non usare `cargo clean` come soluzione ordinaria agli input non dichiarati: nasconde il problema e obbliga a rigenerare anche lavoro valido. Scrivi o aggiorna solo gli output di cui sei responsabile; non cancellare genericamente `OUT_DIR` o altre directory.

Se vuoi versionare sorgenti generati, separa il generatore dalla build normale e verifica in un test che gli output salvati siano aggiornati. [Generazione di codice](https://doc.rust-lang.org/cargo/reference/build-script-examples.html#code-generation).

### Librerie native e cross-compilazione

Per compilare C/C++ e cercare librerie installate si usano spesso `cc` e `pkg-config` come build-dependencies. `bindgen` genera binding Rust da header; `cbindgen` affronta il verso opposto, producendo header per API Rust. Non sono necessari nel laboratorio.

Le istruzioni di linking non installano librerie e non dimostrano compatibilita di architettura o ABI. L'ordine delle direttive puo influire sull'ordine degli argomenti al linker. In cross-compilazione servono toolchain native, header e librerie adatti al target, non soltanto quelli dell'host. [Esempi di integrazione nativa](https://doc.rust-lang.org/cargo/reference/build-script-examples.html#building-a-native-library).

Vedi [[Programmazione/Rust/Pagine/FFI|FFI]] e [[Programmazione/Rust/Pagine/bindgen e cbindgen|bindgen e cbindgen]] per i dettagli. La guida qui non esegue compilazioni C o cross-compilazioni.

## Errori comuni

- **Usare cfg dell'host per scegliere librerie del target:** nello script leggi `TARGET` e `CARGO_CFG_*`.
- **Confondere check-cfg e cfg:** dichiarare `has_large_limit` come atteso non lo rende vero.
- **Aspettarsi dipendenze opzionali da rustc-cfg:** la risoluzione Cargo avviene separatamente; usa feature o dipendenze nel manifest.
- **Scrivere in src durante una build:** modifica i sorgenti e rende problematico l'uso come dipendenza; genera in `OUT_DIR`.
- **Affidarsi a un vecchio file generato:** la directory persiste e puo contenere residui. Rigenera ogni output necessario dai suoi input.
- **Considerare un identificativo incorporato come configurazione dinamica:** `env!` legge in compilazione; l'eseguibile va ricostruito per cambiarlo.
- **Ignorare un fallimento dello script:** un vecchio binario puo ancora esistere. Non eseguirlo pensando che rappresenti la build fallita; `cargo run` deve prima completare con successo la build.
- **Usare rete, orologio o strumenti impliciti:** rendono la build meno riproducibile; documenta gli input e i prerequisiti necessari.

## Checklist

- [ ] Il lavoro richiede davvero un build script.
- [ ] Dipendenze di build separate da quelle dell'applicazione.
- [ ] Decisioni sul target basate sulle variabili Cargo corrette.
- [ ] File e variabili esterne dichiarati come input.
- [ ] Output limitati a file gestiti in OUT_DIR.
- [ ] Input validati prima di generare Rust o direttive stdout.
- [ ] Cfg attesi dichiarati anche quando non attivi.
- [ ] Build invariata, input cambiati, errori e ripristino verificati.
- [ ] MSRV, piattaforme e strumenti nativi controllati separatamente.

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Cargo features|Cargo features]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]
- [[Programmazione/Rust/Pagine/FFI|FFI]]
- [[Programmazione/Rust/Pagine/bindgen e cbindgen|bindgen e cbindgen]]
- [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV]]
- [[Programmazione/Rust/Pagine/Process e Command|Process e Command]]

## Fonti

- [Cargo Book: build scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html).
- [Cargo Book: esempi di build script](https://doc.rust-lang.org/cargo/reference/build-script-examples.html).
- [Cargo Book: ambiente dei build script](https://doc.rust-lang.org/cargo/reference/environment-variables.html#environment-variables-cargo-sets-for-build-scripts).
- [Cargo Book: build-dependencies](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#build-dependencies).
- [rustc Book: custom cfg con Cargo](https://doc.rust-lang.org/rustc/check-cfg/cargo-specifics.html).
- [Standard library: env!](https://doc.rust-lang.org/std/macro.env.html).
- [Standard library: include!](https://doc.rust-lang.org/std/macro.include.html).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

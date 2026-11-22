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
  - Feature Cargo
  - Cargo feature flags
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo.toml]]"
  - "[[Programmazione/Rust/Pagine/Crates.io]]"
related:
  - "[[Programmazione/Rust/Pagine/Feature flags ben progettate]]"
  - "[[Programmazione/Rust/Pagine/Build profiles]]"
  - "[[Programmazione/Rust/Pagine/Workspace dependencies]]"
title: Cargo features
---

# Cargo features

## Sintesi

Le **feature Cargo** selezionano codice e dipendenze al momento della compilazione. Non sono impostazioni modificabili mentre il programma gira e non sono gli attributi nightly `#![feature(...)]`.

Una feature e un nome definito in `[features]`; puo attivarne altre o abilitare dipendenze opzionali. Va progettata in modo **additivo**: abilitare una funzionalita non dovrebbe togliere API gia disponibili. [Cargo Book: features](https://doc.rust-lang.org/cargo/reference/features.html).

Questa nota spiega la meccanica con un progetto locale completo. Le decisioni di progettazione sono approfondite in [[Programmazione/Rust/Pagine/Feature flags ben progettate|Feature flags ben progettate]].

## Quando usarlo

- Offrire un'integrazione opzionale, per esempio serializzazione o un runtime async.
- Esporre funzionalita aggiuntive senza imporle a tutti i consumatori.
- Supportare una libreria con e senza standard library.
- Controllare quali dipendenze vengono compilate in una configurazione.

Per scegliere una porta, una lingua o un database durante l'esecuzione, usa una configurazione runtime. Per codice specifico di Windows o Unix usa i relativi `cfg` di piattaforma: una feature Cargo non cambia il target.

## Come funziona

### Dal manifest al codice

Cargo determina le feature attive e passa al compilatore condizioni come `feature = "checksum"`. L'attributo `#[cfg(feature = "checksum")]` include l'elemento solo quando la condizione e vera; `#[cfg_attr(...)]` applica condizionalmente un attributo.

`cfg!(...)` produce invece un booleano. In un normale `if cfg!(...)` entrambi i rami devono comunque essere validi per il compilatore: non usarlo per nascondere una dipendenza assente. [Compilazione condizionale](https://doc.rust-lang.org/reference/conditional-compilation.html).

### Unificazione, non preferenze locali

Se due percorsi del grafo richiedono feature diverse dello stesso package, Cargo normalmente ne usa l'unione nello stesso contesto di compilazione. `default-features = false` significa «questo collegamento non richiede le feature predefinite», non «vietale a tutti».

I resolver 2 e 3 separano alcuni contesti: dipendenze normali rispetto a build-dependencies/proc-macro; dev-dependencies quando non si stanno costruendo i target che le richiedono; dipendenze per piattaforme non attive. Non eliminano l'unificazione tra normali dipendenze dello stesso package. Versioni o sorgenti diverse possono identificare package distinti.

Anche selezionare piu membri di un workspace nella stessa invocazione puo unificare le feature delle dipendenze comuni. Per controllare una configurazione isolata, seleziona il package e, quando necessario, usa invocazioni separate. [Risoluzione e feature](https://doc.rust-lang.org/cargo/reference/resolver.html#features).

## API / Sintassi

Queste forme compaiono nel laboratorio:

| Forma | Significato |
| --- | --- |
| `std = []` | Dichiara una feature senza attivare automaticamente altre feature. |
| `default = ["std"]` | Attiva normalmente `std` per il package. |
| `checksum = ["dep:checksum-core"]` | Espone `checksum` e abilita la dipendenza opzionale. |
| `hex = ["checksum-core?/hex"]` | Inoltra `hex` solo se la dipendenza e gia attiva. |
| `"checksum-core/hex"` | Variante senza `?`: attiva anche la dipendenza opzionale. |

Senza `dep:`, una dipendenza `optional = true` crea normalmente una feature implicita omonima. Usare `dep:checksum-core` sopprime quella feature implicita: nel laboratorio l'interfaccia pubblica e `checksum`, non `checksum-core`.

Il nome usato nei collegamenti di feature e quello della dipendenza nel manifest, anche quando il package e rinominato. `dep:` e l'inoltro con `?` sono disponibili da Rust 1.60; il progetto seguente richiede 1.85 per edition 2024. [Sintassi delle feature](https://doc.rust-lang.org/cargo/reference/features.html#optional-dependencies).

## Esempio pratico

### Preparazione

Crea una cartella di prova fuori dal vault con i cinque file seguenti. Servono Rust/Cargo almeno 1.85 e un linker; rustfmt e Clippy servono solo per i controlli finali. Esegui i comandi dalla radice del progetto.

Il workspace contiene `feature-demo` e la piccola dipendenza locale `checksum-core`. **Non sono librerie da scaricare**: il codice e interamente qui. La somma modulo 256 serve solo a osservare le feature; non e un controllo crittografico o una protezione contro manomissioni.

### Cargo.toml

```toml
[package]
name = "feature-demo"
version = "0.1.0"
edition = "2024"
rust-version = "1.85"
publish = false

[workspace]
members = ["checksum-core"]
default-members = ["."]
resolver = "3"

[features]
default = ["std"]
std = []
checksum = ["dep:checksum-core"]
hex = ["checksum-core?/hex"]

[dependencies]
checksum-core = { path = "checksum-core", optional = true, default-features = false }
```

### src/lib.rs

```rust
#![cfg_attr(not(feature = "std"), no_std)]

/// Conta byte UTF-8, non caratteri.
///
/// ```
/// assert_eq!(feature_demo::byte_len("\u{e9}"), 2);
/// ```
pub fn byte_len(input: &str) -> usize {
    input.len()
}

#[cfg(feature = "std")]
/// Copia il testo in una String.
///
/// ```
/// assert_eq!(feature_demo::owned_text("Rust"), "Rust");
/// ```
pub fn owned_text(input: &str) -> String {
    input.to_owned()
}

#[cfg(feature = "checksum")]
/// Somma i byte modulo 256.
///
/// ```
/// assert_eq!(feature_demo::checksum(b"ABC"), 198);
/// ```
pub fn checksum(input: &[u8]) -> u8 {
    checksum_core::sum(input)
}

#[cfg(all(feature = "checksum", feature = "hex"))]
/// Restituisce due byte ASCII esadecimali.
///
/// ```
/// assert_eq!(feature_demo::checksum_hex(b"ABC"), *b"c6");
/// ```
pub fn checksum_hex(input: &[u8]) -> [u8; 2] {
    checksum_core::hex(input)
}
```

### tests/api.rs

```rust
#[test]
fn byte_length() {
    assert_eq!(feature_demo::byte_len(""), 0);
    assert_eq!(feature_demo::byte_len("\u{e9}"), 2);
}

#[cfg(feature = "std")]
#[test]
fn owned_copy() {
    assert_eq!(feature_demo::owned_text("Rust"), "Rust");
}

#[cfg(feature = "checksum")]
#[test]
fn checksum_values() {
    assert_eq!(feature_demo::checksum(b"ABC"), 198);
    assert_eq!(feature_demo::checksum(&[255, 1]), 0);
    assert_eq!(feature_demo::checksum(b""), 0);
}

#[cfg(all(feature = "checksum", feature = "hex"))]
#[test]
fn hexadecimal_bytes() {
    assert_eq!(feature_demo::checksum_hex(b"ABC"), *b"c6");
    assert_eq!(feature_demo::checksum_hex(&[255]), *b"ff");
}
```

### checksum-core/Cargo.toml

```toml
[package]
name = "checksum-core"
version = "0.1.0"
edition = "2024"
rust-version = "1.85"
publish = false

[features]
default = []
hex = []
```

### checksum-core/src/lib.rs

```rust
#![no_std]

pub fn sum(input: &[u8]) -> u8 {
    input.iter().fold(0u8, |acc, byte| acc.wrapping_add(*byte))
}

#[cfg(feature = "hex")]
pub fn hex(input: &[u8]) -> [u8; 2] {
    let value = sum(input);
    let digits = b"0123456789abcdef";
    [digits[(value >> 4) as usize], digits[(value & 15) as usize]]
}

#[cfg(test)]
mod tests {
    #[test]
    fn sum_wraps() {
        assert_eq!(super::sum(&[255, 1]), 0);
    }

    #[cfg(feature = "hex")]
    #[test]
    fn hex_is_ascii() {
        assert_eq!(super::hex(b"ABC"), *b"c6");
    }
}
```

### Provare le configurazioni

I comandi compilano file in `target/` e generano `Cargo.lock` alla prima risoluzione. Non pubblicano nulla e non cambiano i sorgenti. Con `default-members = ["."]` i comandi senza selezione esplicita testano il solo package principale.

Configurazione predefinita, con `std`:

```bash
cargo test
```

Libreria senza feature predefinite:

```bash
cargo test --no-default-features
```

Solo inoltro debole: `hex` non attiva da sola `checksum-core`.

```bash
cargo test --no-default-features --features hex
```

Dipendenza opzionale, senza conversione esadecimale:

```bash
cargo test --no-default-features --features checksum
```

Dipendenza e inoltro insieme, ancora senza `std`:

```bash
cargo test --no-default-features --features checksum,hex
```

Tutte le feature del package principale:

```bash
cargo test --all-features
```

Risultati attesi per `feature-demo`; ogni riga e una build distinta:

| Configurazione | Test di integrazione + doctest |
| --- | --- |
| Predefinita | 2 + 2 |
| Senza default | 1 + 1 |
| Senza default, solo `hex` | 1 + 1 |
| Senza default, solo `checksum` | 2 + 2 |
| Senza default, `checksum,hex` | 3 + 3 |
| Tutte le feature | 4 + 4 |

Per testare anche i due unit test della dipendenza locale:

```bash
cargo test --workspace --all-features
```

Risultato atteso: **dieci test complessivi**, otto del package principale e due di `checksum-core`.

`--all-features` non prova tutte le combinazioni e non equivale a testare ogni package: serve una selezione come `--workspace`. `--no-default-features` non disattiva automaticamente le feature predefinite delle dipendenze; nel manifest locale sono escluse esplicitamente. [Opzioni di cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html).

### Capire da dove arriva una feature

Osserva il grafo senza attivare la dipendenza:

```bash
cargo tree --no-default-features --features hex -e features
```

In questa invocazione `checksum-core` non compare. Ora abilita anche `checksum`:

```bash
cargo tree --no-default-features --features checksum,hex -e features
```

Per risalire ai percorsi che attivano la dipendenza e le sue feature:

```bash
cargo tree --no-default-features --features checksum,hex -e features -i checksum-core
```

`-e features` mostra gli archi delle feature; `-i` inverte il grafo. Mantieni gli stessi flag della build che stai indagando. Il tree aiuta a capire la risoluzione, ma non e un registro completo di tutte le invocazioni del compilatore. [cargo tree](https://doc.rust-lang.org/cargo/commands/cargo-tree.html).

La presenza di `checksum-core` in `Cargo.lock` **non dimostra che sia stata compilata**: il lockfile considera anche dipendenze opzionali per risolverne le versioni. [Lockfile e risoluzione](https://doc.rust-lang.org/cargo/reference/resolver.html#features).

### Controlli aggiuntivi

Controlla anche test, esempi e altri target Cargo, senza eseguire le asserzioni:

```bash
cargo check --all-targets --all-features
```

Esegui esplicitamente i doctest:

```bash
cargo test --doc --all-features
```

Verifica lo stile senza riscrivere i file:

```bash
cargo fmt --all -- --check
```

Esegui Clippy; `-D warnings` rende gli avvisi errori, non dimostra l'assenza di bug:

```bash
cargo clippy --workspace --all-targets --all-features -- -D warnings
```

Non sostituire la matrice con il solo `--all-targets`: riguarda i target Cargo, non i sistemi operativi, e con `cargo test` non include i doctest. Ripeti inoltre i controlli sulla MSRV dichiarata.

Il laboratorio e verificato con **Rust/Cargo 1.85.0 e 1.99.1 su Windows GNU**; fmt e Clippy sulla toolchain 1.99.1. Non e un collaudo su una scheda embedded o su ogni target.

## Varianti

### std, no_std e alloc

`std = []` e solo un nome convenzionale. Nel laboratorio e `#![cfg_attr(not(feature = "std"), no_std)]` a scegliere il prelude `core` e a togliere il collegamento automatico a `std`.

`owned_text` esiste solo con `std`, mentre checksum e conversione esadecimale usano soltanto tipi `core`. Un consumatore senza `std` non puo chiamare automaticamente tutte le API disponibili nella build predefinita.

Una libreria `no_std` puo usare `alloc` quando l'ambiente lo supporta, ma deve importarla e richiedere un allocatore dove necessario. L'attributo `no_std` non garantisce che tutto il grafo sia privo di `std`; inoltre i test qui girano su un host con standard library. [Prelude e no_std](https://doc.rust-lang.org/reference/names/preludes.html#the-no_std-attribute).

### Integrazioni con librerie esterne

Un'integrazione JSON puo esporre una feature `json` che abilita `dep:serde` e `dep:serde_json`, dichiarando entrambe le dipendenze opzionali. Sulla dichiarazione di `serde`, `features = ["derive"]` abilita le macro `Serialize` e `Deserialize`. Import e derive nel codice vanno resi condizionali alla feature pubblica scelta, per esempio con `cfg_attr`. [Feature di Serde](https://serde.rs/feature-flags.html).

Per Tokio, `rt` abilita il runtime e `macros` le macro: `["rt", "macros"]` non abilita automaticamente il runtime multithread, che richiede `rt-multi-thread`. Anche un inoltro come `tokio/rt` attiva una dipendenza opzionale; `tokio?/rt` no, da solo. [Feature di Tokio](https://docs.rs/tokio/latest/tokio/#feature-flags).

Queste sono applicazioni dello stesso meccanismo, non parti del laboratorio eseguito. Versioni, feature e supporto `no_std` delle integrazioni reali vanno verificati insieme; abilitare JSON o un runtime non rende una libreria automaticamente adatta all'embedded.

### Controesempio cfg!

Questa funzione e **intenzionalmente errata senza la feature checksum**. Non aggiungerla alla libreria corretta:

```rust
pub fn maybe_checksum(input: &[u8]) -> u8 {
    if cfg!(feature = "checksum") {
        checksum_core::sum(input)
    } else {
        0
    }
}
```

Il ramo falso non elimina la risoluzione del nome `checksum_core`. Per escludere un elemento usa `#[cfg(...)]`, come nella funzione `checksum` del laboratorio; per mantenere un'API sempre disponibile, definisci esplicitamente implementazioni condizionali coerenti.

## Errori comuni

- **Attivare checksum-core invece di checksum:** il prefisso `dep:` sopprime la feature implicita della dipendenza; usa l'interfaccia pubblica del manifest.
- **Aspettarsi che hex da sola basti:** l'inoltro debole non abilita la dipendenza; nel laboratorio servono `checksum` e `hex` per esporre `checksum_hex`.
- **Confondere feature del package e della dipendenza:** il `cfg(feature = "hex")` della crate consumatrice non legge direttamente le feature di tutte le altre crate.
- **Considerare false un veto globale:** un altro consumer puo abilitare le feature che tu non richiedi.
- **Testare soltanto all-features:** puo nascondere import o API non protetti correttamente nelle configurazioni minime.
- **Usare feature mutualmente esclusive:** Cargo puo abilitarle insieme. Preferisci API additive o selezioni runtime; se una combinazione e realmente impossibile, documentala e rifiutala chiaramente.
- **Cambiare default o nomi senza valutare i consumer:** rimuovere una feature, togliere API dalla configurazione predefinita o rendere opzionale un'API prima incondizionata puo rompere la compatibilita. [Compatibilita SemVer](https://doc.rust-lang.org/cargo/reference/semver.html).

## Checklist

- [ ] Ogni feature ha uno scopo compile-time e un nome pubblico chiaro.
- [ ] Dipendenze opzionali e codice che le usa sono abilitati insieme.
- [ ] Inoltro normale e debole sono scelti consapevolmente.
- [ ] Le configurazioni predefinita, minima e significative sono testate separatamente.
- [ ] Test e doctest coprono le API effettivamente esposte in ogni configurazione.
- [ ] Il grafo reale e controllato, senza dedurre la compilazione dal solo lockfile.
- [ ] Requisiti no_std, MSRV e piattaforme sono verificati separatamente.
- [ ] Le modifiche a feature e default sono valutate rispetto alla compatibilita pubblica.

## Collegamenti

- [[Programmazione/Rust/Pagine/Cargo.toml|Cargo.toml]]
- [[Programmazione/Rust/Pagine/Cargo.lock|Cargo.lock]]
- [[Programmazione/Rust/Pagine/Feature flags ben progettate|Feature flags ben progettate]]
- [[Programmazione/Rust/Pagine/no_std|no_std]]
- [[Programmazione/Rust/Pagine/Crates.io|Crates.io]]
- [[Programmazione/Rust/Pagine/Workspace dependencies|Workspace dependencies]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]
- [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]

## Fonti

- [Cargo Book: features](https://doc.rust-lang.org/cargo/reference/features.html).
- [Cargo Book: resolver](https://doc.rust-lang.org/cargo/reference/resolver.html#features).
- [Rust Reference: compilazione condizionale](https://doc.rust-lang.org/reference/conditional-compilation.html).
- [Cargo Book: cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html).
- [Cargo Book: cargo tree](https://doc.rust-lang.org/cargo/commands/cargo-tree.html).
- [Rust Reference: prelude e no_std](https://doc.rust-lang.org/reference/names/preludes.html#the-no_std-attribute).
- [Cargo Book: SemVer](https://doc.rust-lang.org/cargo/reference/semver.html).
- [Serde: feature flags](https://serde.rs/feature-flags.html).
- [Tokio: feature flags](https://docs.rs/tokio/latest/tokio/#feature-flags).

## Navigazione

- [[Programmazione/Rust/Indice Rust|Indice Rust]]

---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - api-design-idiomatico
aliases:
  - Compatibility e breaking changes
  - Breaking changes Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]"
  - "[[Programmazione/Rust/Pagine/Public API design|Public API design]]"
  - "[[Programmazione/Rust/Pagine/Cargo features|Cargo features]]"
related:
  - "[[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV Minimum Supported Rust Version]]"
  - "[[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]"
  - "[[Programmazione/Rust/Pagine/Documentazione delle crate|Documentazione delle crate]]"
title: Compatibility e breaking changes
---

# Compatibility e breaking changes

## Sintesi

Per valutare una modifica a una libreria, mantieni **invariato il codice di chi la usa** e sostituisci solo la libreria. Il client importa ancora gli stessi nomi? Può costruire gli stessi valori e distinguere gli stessi errori? A parità di input ottiene ancora il risultato promesso?

Cargo seleziona versioni ammesse dal manifest: non dimostra che siano davvero compatibili. Qui confrontiamo il contratto di due API; per gli intervalli accettati da Cargo e l'effetto del lockfile vedi [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]].

## Che cosa può rompersi?

| Contratto | Esempio | Come accorgersene |
| --- | --- | --- |
| Sorgente | Scompare un re-export, un metodo richiede un parametro in più o un enum pubblico acquista una variante che il client non gestisce | Compila il codice **esterno** precedente, non solo la libreria |
| Comportamento | Il parser ha la stessa firma, ma elimina spazi che prima prometteva di conservare | Esegui test con input e risultati che rappresentano quella promessa |
| Configurazione supportata | Un metodo prima disponibile per default richiede ora una feature esplicita, oppure il client non può più compilare con la toolchain minima dichiarata | Ripeti la build con le feature e la MSRV che il progetto si impegna a supportare |
| Binario | Cambia la disposizione di una struttura esposta tramite un'interfaccia C | Verifica separatamente layout, ABI e piattaforme promesse: ricompilare un client Rust non è una prova di compatibilità binaria |

## Laboratorio: conservare il vecchio chiamante

In una directory libera crea una libreria senza dipendenze esterne:

```sh
cargo new --lib --edition 2024 config_line
```

Entra in `config_line` e imposta `version = "1.3.0"` in `Cargo.toml`. Sostituisci `src/lib.rs` con questa versione di partenza. Un documento rappresenta una riga `chiave=valore`: la chiave viene ripulita dagli spazi esterni, ma il valore conserva **tutto** ciò che segue il primo `=`, anche altri segni di uguale o una stringa vuota.

```rust
#[derive(Debug, PartialEq, Eq)]
pub struct Document<'a> {
    pub key: &'a str,
    pub value: &'a str,
}

#[derive(Debug, PartialEq, Eq)]
pub enum ParseError {
    MissingSeparator,
    EmptyKey,
}

pub fn parse(input: &str) -> Result<Document<'_>, ParseError> {
    let (key, value) = input.split_once('=').ok_or(ParseError::MissingSeparator)?;
    let key = key.trim();
    if key.is_empty() {
        return Err(ParseError::EmptyKey);
    }
    Ok(Document { key, value })
}
```

Crea `tests/downstream.rs`. Cargo compila il test di integrazione come crate separata: il suo import, il literal della struct e il `match` usano esclusivamente ciò che è pubblico. Questo file è il **client di riferimento**: non modificarlo quando provi una candidata compatibile.

```rust
use config_line::{parse, Document, ParseError};

fn hint(error: ParseError) -> &'static str {
    match error {
        ParseError::MissingSeparator => "insert =",
        ParseError::EmptyKey => "insert a key",
    }
}

#[test]
fn keeps_the_entire_value() {
    assert_eq!(
        parse(" mode = fast=on "),
        Ok(Document { key: "mode", value: " fast=on " })
    );
    assert_eq!(parse("mode=").unwrap().value, "");
}

#[test]
fn distinguishes_errors() {
    assert_eq!(hint(parse("mode").unwrap_err()), "insert =");
    assert_eq!(hint(parse("  =on").unwrap_err()), "insert a key");
}
```

Esegui dalla cartella con il manifest. Devono passare entrambi i casi.

```sh
cargo test --test downstream
```

### 1.4: introdurre un nome senza rimuovere il precedente

Porta la versione a `1.4.0`. In `src/lib.rs` rinomina la **definizione** di `parse` in `parse_document`, lascia invariato il corpo e aggiungi questa funzione:

```rust
#[deprecated(since = "1.4.0", note = "use parse_document instead")]
pub fn parse(input: &str) -> Result<Document<'_>, ParseError> {
    parse_document(input)
}
```

Ripeti il test precedente. Il vecchio import continua a funzionare, con un **avviso di deprecazione**, e i due risultati non cambiano. Il client può migrare sostituendo solo l'import con `use config_line::{parse_document as parse, Document, ParseError};`. L'alias conserva il nome locale, non richiama il wrapper deprecato. Una CI che imposta `#![deny(deprecated)]` può già fallire con il vecchio import: è la sua politica sui lint a trasformare l'avviso in errore. L'attributo `since` documenta la versione, non pianifica la rimozione.

### Tre controprove indipendenti

Riparti ogni volta dalla 1.4 con il **client originale** e applica una sola modifica nella libreria.

1. **Rimuovi il wrapper `parse`.** La libreria continua a compilare; il client no, perché importa un nome che non esiste più. Il client già migrato a `parse_document` funziona. Per questa crate stabile la rimozione va riservata a una release incompatibile, per esempio la 2.0.
2. **Aggiungi `InvalidEscape` a `ParseError`, senza mai restituirlo.** Basta la nuova variante per rendere non esaustivo il `match` del client. Neppure aggiungere oggi `#[non_exhaustive]` all'enum originariamente esaustivo salva quel client. Se l'enum fosse stato non esaustivo **fin dalla prima release**, al chiamante esterno sarebbe già servito un ramo residuale.
3. **Sostituisci `Ok(Document { key, value })` con `Ok(Document { key, value: value.trim() })`.** Libreria e client compilano, ma il primo test riceve `"fast=on"` invece di `" fast=on "`. Non è un dettaglio interno: la conservazione degli spazi era parte del formato documentato.

Per distinguere i tre esiti, comincia dalla sola libreria:

```sh
cargo check --lib
```

Poi compila anche il client:

```sh
cargo check --tests
```

Infine esegui `cargo test --test downstream`: a differenza di `check`, valuta le asserzioni. Una correzione che riporta un comportamento non documentato alla specifica non è automaticamente una rottura del contratto; occorre comunque valutare i dati e i client reali coinvolti.

## Quando un'aggiunta è davvero compatibile?

Un setter opzionale è utile soltanto se lascia invariati i vecchi default **e** cambia qualcosa quando viene usato. Per esempio, aggiungi in fondo a `src/lib.rs` questa politica: il numero di tentativi comprende la prima esecuzione più gli eventuali retry. Il tipo non effettua richieste di rete.

```rust
#[derive(Default)]
pub struct RetryPolicy {
    retries: u8,
}

impl RetryPolicy {
    pub fn retry_count(mut self, count: u8) -> Self {
        self.retries = count;
        self
    }

    pub fn max_attempts(&self) -> u16 {
        1 + u16::from(self.retries)
    }
}
```

Aggiungi questo test a `tests/downstream.rs` dopo aver ripristinato la versione compatibile:

```rust
#[test]
fn retries_are_opt_in() {
    use config_line::RetryPolicy;

    assert_eq!(RetryPolicy::default().max_attempts(), 1);
    assert_eq!(RetryPolicy::default().retry_count(2).max_attempts(), 3);
    assert_eq!(RetryPolicy::default().retry_count(255).max_attempts(), 256);
}
```

Lo stesso comando di test deve ora passare **tre** casi. Un setter che ignora `count` supera il primo controllo ma non gli altri due. Il tipo di ritorno `u16` evita che il massimo valido trabocchi. Per i costi e i benefici del pattern vedi [[Programmazione/Rust/Pagine/Builder pattern|Builder pattern]].

## Checklist prima della release

- **Percorsi e costruzione:** oltre alle firme, controlla re-export, campi pubblici e costruzione tramite literal. Aggiungere un campo, anche con un default disponibile, rompe un literal esterno che prima elencava tutti i campi.
- **Trait e vincoli:** un nuovo metodo obbligatorio rompe chi implementa il trait dall'esterno. Un metodo con default evita quell'obbligo ma il nome può collidere con un [[Programmazione/Rust/Pagine/Extension traits|extension trait]]. Restringere un bound o perdere `Send` o `Sync` su un tipo pubblico può rompere codice prima valido anche se i campi sono privati. Non dare per innocua qualsiasi nuova implementazione: valuta sovrapposizioni e inferenza.
- **Feature e toolchain:** verifica le combinazioni promesse e la MSRV con la toolchain corrispondente. Alzare la MSRV esclude davvero chi usa il vecchio compilatore; come versionare il cambiamento dipende dalla policy dichiarata. Segnalarlo nel changelog non ripristina il supporto.
- **Versione e migrazione:** per una crate stabile una nuova API compatibile o una deprecazione richiede normalmente una minor, una rimozione incompatibile una major. Prima di 1.0, Cargo considera incompatibili, per esempio, `0.4.x` e `0.5.x`. Documenta il vecchio uso, quello sostitutivo e la prima versione che lo offre.
- **Portata delle verifiche:** un client campione o uno strumento che confronta API trova controesempi, non dimostra che *tutti* i client funzionino. Integra la compilazione con test del comportamento promesso e, quando possibile, con un progetto dipendente reale.

## Fonti

- [Cargo Book: classificazione dei cambiamenti SemVer](https://doc.rust-lang.org/cargo/reference/semver.html)
- [Rust Reference: attributo deprecated](https://doc.rust-lang.org/reference/attributes/diagnostics.html#the-deprecated-attribute)
- [Cargo Book: politica della versione Rust supportata](https://doc.rust-lang.org/cargo/reference/rust-version.html)
- [Semantic Versioning: deprecazione e numerazione delle release](https://semver.org/spec/v2.0.0.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]
- [[Programmazione/Rust/Pagine/Feature flags ben progettate|Feature flags ben progettate]]
- [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version|MSRV Minimum Supported Rust Version]]
- [[Programmazione/Rust/Pagine/Documentazione delle crate|Documentazione delle crate]]

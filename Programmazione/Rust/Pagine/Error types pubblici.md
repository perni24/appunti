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
  - Error types pubblici
  - Errori pubblici
prerequisites:
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]"
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]"
  - "[[Programmazione/Rust/Pagine/Public API design|Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/Error reporting|Error reporting]]"
  - "[[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]"
  - "[[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]"
title: Error types pubblici
---

# Error types pubblici

## Sintesi

Una libreria dovrebbe permettere a chi la usa di decidere **come reagire** senza analizzare il testo di un errore. Se un file di configurazione facoltativo non esiste, usare un valore predefinito può essere corretto. Se il file esiste ma contiene un valore invalido, quel ripiego nasconderebbe un errore di configurazione.

Separa tre cose: la **categoria pubblica** per decidere, `Display` per spiegare l'operazione fallita e `Error::source()` per risalire alla causa. Non promettere che il testo di un messaggio o il tipo concreto della causa rimarranno stabili, a meno che tu non voglia mantenerli come parte dell'API.

## Quale forma esporre?

| Forma | Quando sceglierla | Impegno verso il chiamante |
| --- | --- | --- |
| Enum pubblico con dati nelle varianti | Il client deve estrarre dati stabili, per esempio un numero di riga | I nomi delle varianti e i tipi dei campi accessibili fanno parte dell'API |
| Struct con campi privati e metodo `kind()` | Il client deve distinguere poche categorie, ma la libreria vuole poter cambiare parser o backend | Il tipo restituito da `kind()` e il significato delle categorie sono pubblici; il modo di conservare la causa no |
| Errore dinamico, per esempio `Box<dyn Error>` o `anyhow::Error` | Al confine di un'applicazione interessa soprattutto riportare il problema | Da solo non offre categorie di dominio su cui il chiamante possa fare affidamento |

## Esempio: un file facoltativo, non un errore facoltativo

In una directory libera crea la libreria di esempio. Usa solo la libreria standard.

```sh
cargo new --lib --edition 2024 port_config
```

Entra in `port_config` e sostituisci `src/lib.rs` con il codice seguente. Il formato del file è un singolo numero non nullo rappresentabile come `u16`, in testo UTF-8; gli spazi esterni sono ignorati. Il divieto di zero è una scelta di **questa configurazione**, non una regola generale delle porte di rete.

```rust
use std::{error::Error, fmt, fs, io, num::NonZeroU16, path::Path, str};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[non_exhaustive]
pub enum ConfigErrorKind {
    Missing,
    Unreadable,
    Invalid,
}

#[derive(Debug)]
pub struct ConfigError {
    kind: ConfigErrorKind,
    cause: Box<dyn Error + Send + Sync>,
}

impl ConfigError {
    fn new(kind: ConfigErrorKind, cause: impl Error + Send + Sync + 'static) -> Self {
        Self { kind, cause: Box::new(cause) }
    }

    pub fn kind(&self) -> ConfigErrorKind {
        self.kind
    }
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self.kind {
            ConfigErrorKind::Missing => "configuration file not found",
            ConfigErrorKind::Unreadable => "cannot read configuration file",
            ConfigErrorKind::Invalid => "invalid port configuration",
        })
    }
}

impl Error for ConfigError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        Some(self.cause.as_ref())
    }
}

pub fn load_port(path: &Path) -> Result<NonZeroU16, ConfigError> {
    use ConfigErrorKind::{Invalid, Missing, Unreadable};

    let bytes = fs::read(path).map_err(|e| {
        let kind = if e.kind() == io::ErrorKind::NotFound { Missing } else { Unreadable };
        ConfigError::new(kind, e)
    })?;
    let text = str::from_utf8(&bytes).map_err(|e| ConfigError::new(Invalid, e))?;
    text.trim().parse().map_err(|e| ConfigError::new(Invalid, e))
}
```

Qui `map_err` **sposta** la causa originale dentro `ConfigError`: non la sostituisce con una stringa. La decisione si prende nel punto in cui si conosce l'operazione. `fs::read` che restituisce `NotFound` produce `Missing`; altri errori di lettura producono `Unreadable`. Se invece i byte sono stati letti ma non sono UTF-8, il problema è nel contenuto: `Invalid`, come per `0`, `65536` o testo non numerico. L'esempio legge l'intero file in memoria ed è pensato per una piccola configurazione locale.

Un `From<io::Error>` è utile quando la conversione ha lo stesso significato ovunque; non conosce da solo né il percorso né l'operazione che ha fallito. Analogamente, `#[from]` di `thiserror` genera una conversione e conserva la causa, ma non decide la tua politica di classificazione. Un wrapper come `map_err(|_| ...)`, invece, scarta proprio l'errore che potrebbe spiegare il problema.

### Provare il contratto dal chiamante

Crea la cartella `tests`. Scrivi in `tests/port.txt` una sola riga, salvata in UTF-8 senza BOM:

```text
3000
```

Crea `tests/consumer.rs`. Il client decide quando usare la porta predefinita; la libreria si limita a classificare il risultato.

```rust
use port_config::{load_port, ConfigError, ConfigErrorKind};
use std::{error::Error, path::Path};

fn port_or_default(path: &Path) -> Result<u16, ConfigError> {
    match load_port(path) {
        Ok(port) => Ok(port.get()),
        Err(e) if e.kind() == ConfigErrorKind::Missing => Ok(8080),
        Err(e) => Err(e),
    }
}

const ROOT: &str = env!("CARGO_MANIFEST_DIR");

#[test]
fn configured_port_wins() {
    assert_eq!(port_or_default(&Path::new(ROOT).join("tests/port.txt")).unwrap(), 3000);
}

#[test]
fn fallback_only_for_missing_file() {
    let path = Path::new(ROOT).join("tests/absent-port.txt");
    assert_eq!(load_port(&path).unwrap_err().kind(), ConfigErrorKind::Missing);
    assert_eq!(port_or_default(&path).unwrap(), 8080);
}

#[test]
fn malformed_file_is_reported_with_a_cause() {
    // Il manifest esiste ed è testo, ma non è un numero di porta.
    let error = port_or_default(&Path::new(ROOT).join("Cargo.toml")).unwrap_err();
    assert_eq!(error.kind(), ConfigErrorKind::Invalid);
    assert!(error.source().is_some());
}
```

Lascia inesistente `tests/absent-port.txt` ed esegui dalla radice della crate:

```sh
cargo test --test consumer
```

I tre test devono passare. Il ramo finale propaga *anche le categorie future* invece di applicare un default indiscriminato. Il chiamante può aggiungere il percorso quando presenta l'errore e percorrere `source()` per la diagnostica. Se `Display` ristampasse anche la causa, un reporter che percorre la catena potrebbe mostrarla due volte. Evita di pubblicare la diagnostica interna senza valutare quali dati contiene.

## Evoluzione e limiti

- **Aggiungere una categoria.** `#[non_exhaustive]` sull'enum richiede, fuori dalla crate, un ramo residuale in un `match` sulle varianti. Dentro la crate il compilatore continua a segnalare, per esempio, un ramo mancante nel nostro `Display`. Mettere l'attributo *dopo* avere pubblicato un enum esaustivo può rompere i client esistenti.
- **Cambiare una categoria esistente.** Classificare domani un file invalido come `Missing` lascerebbe compilare il client, ma gli farebbe scegliere silenziosamente `8080`. L'attributo non protegge da regressioni di significato, né rende compatibili rimozioni o rinomine delle varianti.
- **Cambiare la causa o il messaggio.** In questa API il client può diagnosticare la causa originale, ma non gli viene promesso un particolare tipo da ottenere con un downcast. Se serve una decisione stabile, esponila tramite `kind()` o un accessor documentato, non tramite `to_string().contains(...)`. Se invece pubblichi una variante come `Io(std::io::Error)`, il tipo del campo diventa deliberatamente parte del contratto.
- **Assenza prevista o fallimento?** Una ricerca può usare `Result<Option<User>, E>` se l'assenza è un esito normale. Qui `load_port` promette di caricare un valore e restituisce `Missing` se non ci riesce; solo il suo chiamante sa se la configurazione è facoltativa. Le due scelte non sono intercambiabili.

## Fonti

- [Libreria standard: Error e la catena delle cause](https://doc.rust-lang.org/std/error/trait.Error.html#example)
- [Rust Reference: non_exhaustive e confini tra crate](https://doc.rust-lang.org/reference/attributes/type_system.html#the-non_exhaustive-attribute)
- [Cargo Book: compatibilità SemVer](https://doc.rust-lang.org/cargo/reference/semver.html)
- [thiserror: generazione di From e source](https://docs.rs/thiserror/latest/thiserror/#details)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico|Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/Error reporting|Error reporting]]
- [[Programmazione/Rust/Pagine/Public API design|Public API design]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]
- [[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]

---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - api-design-idiomatico
aliases:
  - "Compatibility e breaking changes"
  - "Breaking changes Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Semantic Versioning]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
  - "[[Programmazione/Rust/Pagine/Cargo features]]"
related:
  - "[[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version]]"
  - "[[Programmazione/Rust/Pagine/Error types pubblici]]"
  - "[[Programmazione/Rust/Pagine/Documentazione delle crate]]"
---

# Compatibility e breaking changes

## Sintesi

La **compatibilita** di una crate Rust riguarda la possibilita per gli utenti di aggiornare versione senza modificare il proprio codice. Un **breaking change** e una modifica che puo rompere compilazione, comportamento atteso o contratti documentati.

In Rust la compatibilita non riguarda solo firme di funzione: trait, varianti enum, feature, MSRV, re-export, bounds generici, derive, errori pubblici e documentazione possono diventare parte dell'API.

## Quando usarlo

Valuta compatibilita e breaking changes quando:

- pubblichi una nuova versione;
- modifichi item `pub`;
- cambi feature Cargo;
- aggiorni MSRV;
- aggiungi bounds generici;
- cambi errori pubblici;
- rimuovi re-export o moduli;
- cambi comportamento documentato.

Ogni crate pubblica dovrebbe avere una strategia chiara di versioning.

## Come funziona

Cargo usa SemVer per risolvere dipendenze. In pratica gli utenti si aspettano che aggiornamenti compatibili non rompano il codice. Una modifica incompatibile richiede l'incremento della versione incompatibile secondo le regole Cargo/SemVer.

Esempi spesso breaking:

- rimuovere un item pubblico;
- cambiare firma di funzione;
- rendere privato un campo pubblico;
- rimuovere una variante enum;
- aggiungere un metodo obbligatorio a un trait implementabile dagli utenti;
- aggiungere trait bounds a una funzione pubblica;
- cambiare tipo di errore pubblico;
- aumentare MSRV senza comunicarlo.

Esempi spesso compatibili:

- aggiungere una funzione libera pubblica;
- aggiungere un metodo con default a un trait, con cautela;
- aggiungere una feature additiva;
- aggiungere implementazioni trait per tipi propri;
- deprecare senza rimuovere.

## API / Sintassi

Deprecazione:

```rust
#[deprecated(
    since = "0.4.0",
    note = "use parse_document instead"
)]
pub fn parse(input: &str) -> Result<Document, ParseError> {
    parse_document(input)
}

pub fn parse_document(input: &str) -> Result<Document, ParseError> {
    todo!()
}

# pub struct Document;
# #[derive(Debug)]
# pub struct ParseError;
```

Enum non esaustivo:

```rust
#[non_exhaustive]
pub enum ApiError {
    NotFound,
    InvalidInput,
}
```

Questo lascia spazio a varianti future senza rompere matching degli utenti.

## Esempio pratico

Evoluzione compatibile di una configurazione:

```rust
pub struct ClientBuilder {
    timeout_ms: u64,
    user_agent: String,
}

impl ClientBuilder {
    pub fn timeout_ms(mut self, value: u64) -> Self {
        self.timeout_ms = value;
        self
    }

    pub fn retry_count(mut self, value: u8) -> Self {
        // Nuova opzione additiva: non rompe il codice esistente.
        let _ = value;
        self
    }
}
```

Aggiungere un metodo opzionale al builder e di solito compatibile. Aggiungere un parametro obbligatorio a `Client::new(timeout, user_agent)` non lo sarebbe.

## Varianti

- **Compatibilita sorgente**: il codice utente continua a compilare.
- **Compatibilita binaria**: meno centrale nell'ecosistema Rust puro.
- **Compatibilita comportamentale**: il comportamento documentato resta valido.
- **Compatibilita MSRV**: la toolchain minima resta supportata.
- **Compatibilita feature**: feature additive e stabili.
- **Deprecazione**: transizione prima della rimozione.

## Errori comuni

- Pensare che solo rimuovere funzioni sia breaking.
- Aggiungere metodi obbligatori a trait pubblici.
- Esporre campi pubblici e poi volerli cambiare.
- Cambiare feature default senza valutare impatto.
- Aumentare MSRV in patch release senza policy.
- Nascondere breaking changes nel changelog.
- Non avere test o esempi che rappresentano uso pubblico.

## Checklist

- La modifica cambia item `pub`?
- Cambia bounds, trait, errori o feature?
- Gli utenti possono fare matching esaustivo su questo tipo?
- La MSRV cambia?
- Serve deprecazione prima della rimozione?
- Il changelog spiega migrazione e impatto?
- La versione scelta comunica correttamente il rischio?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Semantic Versioning]]
- [[Programmazione/Rust/Pagine/Public API design]]
- [[Programmazione/Rust/Pagine/Error types pubblici]]
- [[Programmazione/Rust/Pagine/Feature flags ben progettate]]
- [[Programmazione/Rust/Pagine/MSRV Minimum Supported Rust Version]]
- [[Programmazione/Rust/Pagine/Documentazione delle crate]]

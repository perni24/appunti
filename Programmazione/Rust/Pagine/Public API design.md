---
date: 2026-05-28
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - api-design-idiomatico
aliases:
  - "Public API design"
  - "API pubbliche Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Visibilita pub use e mod]]"
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Semantic Versioning]]"
related:
  - "[[Programmazione/Rust/Pagine/Error types pubblici]]"
  - "[[Programmazione/Rust/Pagine/Builder pattern]]"
  - "[[Programmazione/Rust/Pagine/Newtype pattern]]"
  - "[[Programmazione/Rust/Pagine/Documentazione delle crate]]"
---

# Public API design

## Sintesi

Il **public API design** in Rust riguarda come esporre tipi, funzioni, moduli, trait, feature ed errori a chi usa una crate. Una API pubblica non e solo codice accessibile con `pub`: e un contratto di compatibilita, documentazione e comportamento.

Una buona API Rust tende a essere piccola, esplicita, tipizzata, documentata e difficile da usare male. Le decisioni pubbliche diventano costose da cambiare perche gli utenti potrebbero dipenderne.

## Quando usarlo

Ragiona sul design dell'API pubblica quando:

- pubblichi una crate;
- esponi moduli usati da altri team;
- stabilizzi una libreria interna;
- vuoi evitare breaking changes frequenti;
- scegli nomi, trait, errori o feature;
- decidi quali dettagli rendere `pub`.

Per codice applicativo privato puoi essere piu pragmatico, ma le stesse regole aiutano a mantenere confini chiari tra moduli.

## Come funziona

In Rust l'API pubblica include:

- item `pub`;
- trait e loro metodi;
- generic bounds visibili;
- tipi di errore;
- feature Cargo;
- layout dei moduli;
- re-export;
- documentazione;
- semantica promessa dagli esempi.

Principi utili:

- esponi concetti di dominio, non dettagli interni;
- preferisci tipi espliciti a combinazioni ambigue di primitive;
- mantieni invarianti dentro costruttori e metodi;
- usa `pub(crate)` quando non serve esportare;
- aggiungi trait solo se sono parte del contratto;
- documenta errori, panics e safety.

## API / Sintassi

Modulo pubblico con re-export:

```rust
mod parser;
mod error;

pub use error::ParseError;
pub use parser::{parse_document, Document};
```

Costruttore che preserva invarianti:

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Username(String);

impl Username {
    pub fn new(value: impl Into<String>) -> Result<Self, UsernameError> {
        let value = value.into();

        if value.trim().is_empty() {
            return Err(UsernameError::Empty);
        }

        Ok(Self(value))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, thiserror::Error)]
pub enum UsernameError {
    #[error("username cannot be empty")]
    Empty,
}
```

Il campo interno resta privato: gli utenti non possono costruire `Username` invalido.

## Esempio pratico

API piu stabile con tipi di dominio:

```rust
pub fn find_user(id: UserId) -> Result<Option<User>, RepositoryError> {
    // Implementazione interna.
    todo!()
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub struct UserId(u64);

impl UserId {
    pub fn new(value: u64) -> Self {
        Self(value)
    }

    pub fn get(self) -> u64 {
        self.0
    }
}

# #[derive(Debug)]
# pub struct User;
# #[derive(Debug, thiserror::Error)]
# pub enum RepositoryError {
#     #[error("database unavailable")]
#     DatabaseUnavailable,
# }
```

`UserId` comunica significato meglio di `u64` e lascia spazio a validazione futura.

## Varianti

- **API library**: stabilita e documentazione forti.
- **API interna**: meno vincoli, ma confini chiari.
- **API builder**: utile per configurazione complessa.
- **API trait-based**: utile per estensibilita e mocking.
- **API sealed**: limita implementazioni esterne di trait.
- **API feature-gated**: parti opzionali tramite feature Cargo.

## Errori comuni

- Rendere `pub` tutto per comodita.
- Esportare tipi interni che poi diventano difficili da cambiare.
- Usare `String`, `u64` o `bool` dove serve un tipo di dominio.
- Esporre generic bounds troppo specifici.
- Aggiungere trait pubblici senza una storia di compatibilita.
- Non documentare errori, panics e invarianti.
- Cambiare feature o re-export senza considerare SemVer.

## Checklist

- Ogni item `pub` e davvero parte del contratto?
- I nomi sono chiari e coerenti?
- Gli invarianti sono protetti dai costruttori?
- Gli errori pubblici sono documentati?
- I dettagli interni sono `pub(crate)` o privati?
- Le feature opzionali sono progettate come API?
- Una modifica futura richiederebbe breaking change?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Error types pubblici]]
- [[Programmazione/Rust/Pagine/Builder pattern]]
- [[Programmazione/Rust/Pagine/Newtype pattern]]
- [[Programmazione/Rust/Pagine/Extension traits]]
- [[Programmazione/Rust/Pagine/Feature flags ben progettate]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes]]
- [[Programmazione/Rust/Pagine/Documentazione delle crate]]
- [[Programmazione/Rust/Pagine/Visibilita pub use e mod]]

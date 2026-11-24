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
  - Public API design
  - API pubbliche Rust
prerequisites:
  - "[[Programmazione/Rust/Pagine/Visibilita pub use e mod|Visibilita pub use e mod]]"
  - "[[Programmazione/Rust/Pagine/Traits|Traits]]"
  - "[[Programmazione/Rust/Pagine/Semantic Versioning|Semantic Versioning]]"
related:
  - "[[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]"
  - "[[Programmazione/Rust/Pagine/Builder pattern|Builder pattern]]"
  - "[[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]"
  - "[[Programmazione/Rust/Pagine/Documentazione delle crate|Documentazione delle crate]]"
title: Public API design
---

# Public API design

## Sintesi

Progetta un'API pubblica partendo dal codice che vorresti far scrivere a chi usa la libreria. Per esempio: «posso costruire un nome utente da testo ricevuto in input, distinguere un nome vuoto e leggere il valore senza copiarlo». Il chiamante ha bisogno di queste tre operazioni; non ha bisogno di sapere in quale modulo o contenitore è salvato il nome.

Il contratto non è solo ciò che il compilatore accetta. Se prometti di conservare gli spazi di un nome valido, eliminarli in una release successiva cambia il risultato anche se firme e import rimangono identici.

## Cosa diventa pubblico

| Scelta | Su cosa può contare il chiamante | Cosa rimane interno |
| --- | --- | --- |
| `pub use account::Username` alla radice, con `mod account` privato | Il percorso `names_api::Username` | Il nome del modulo e la disposizione dei file |
| Campo privato e costruttore che restituisce `Result` | Quali input sono validi e come gestire quelli rifiutati | Il contenitore usato e come viene fatta la validazione |
| `as_str(&self) -> &str` | Può prendere in prestito il testo, senza ottenere la proprietà né poterlo modificare | Non gli serve un `&String` né un campo pubblico |

`pub` su un tipo non basta a renderlo importabile da un'altra crate: serve un percorso accessibile, eventualmente tramite un re-export. Usa `pub(crate)` per elementi che devono essere condivisi **solo dentro** la libreria. Anche i trait implementati, i vincoli generici e le feature che rendono un elemento disponibile possono essere parte del contratto.

## Esempio: un nome utente con un invariante

In una directory libera, crea una libreria senza dipendenze esterne:

```sh
cargo new --lib --edition 2024 names_api
```

Entra in `names_api`. Sostituisci `src/lib.rs` con la sola interfaccia di ingresso della crate:

```rust
mod account;

pub use account::{Username, UsernameError};
```

Crea `src/account.rs`. La regola è precisa: stringa vuota o composta soltanto da spazi bianchi → errore; ogni altro input viene **conservato integralmente**, maiuscole e spazi inclusi. Non è una regola generale per gli account: è la scelta di questa libreria.

```rust
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Username(String);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[non_exhaustive]
pub enum UsernameError {
    Empty,
}

impl Username {
    /// Conserva il testo originale, senza normalizzarlo.
    ///
    /// # Errors
    /// Restituisce `UsernameError::Empty` se il testo è vuoto o solo whitespace.
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

impl fmt::Display for UsernameError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Empty => f.write_str("username cannot be empty"),
        }
    }
}

impl std::error::Error for UsernameError {}
```

`trim()` serve soltanto al controllo: restituirne il risultato sarebbe una scelta diversa. Con `Into<String>` il chiamante può passare una `String` cedendone la proprietà, oppure un `&str`, da cui viene costruita la stringa posseduta. `as_str()` invece prende in prestito il contenuto dal nome esistente. Non esponiamo un `&mut String`: consentirebbe al chiamante di svuotare un valore già validato. Il tipo di errore è importabile; `#[non_exhaustive]` richiede un ramo di riserva a chi fa un `match` esaustivo dall'esterno.

### Provarla dal punto di vista del chiamante

Crea `tests/public_api.rs`. Cargo compila questo file come **crate separata**: gli import e l'accesso ai campi hanno gli stessi limiti di una libreria cliente. Non usare `use super::*`, che proverebbe un confine diverso in un test unitario.

```rust
use names_api::{Username, UsernameError};

#[test]
fn preserves_valid_input() -> Result<(), UsernameError> {
    let name = Username::new(String::from(" Ada "))?;
    assert_eq!(name.as_str(), " Ada ");
    assert_eq!(Username::new("Ada")?.as_str(), "Ada");
    Ok(())
}

#[test]
fn rejects_blank_input() {
    for input in ["", " ", "\t\n"] {
        assert_eq!(Username::new(input), Err(UsernameError::Empty));
    }
}
```

Esegui entrambi i casi dalla directory con il manifest:

```sh
cargo test --test public_api
```

**Prova di visibilità:** in una funzione del test prova, una riga alla volta, `let _ = names_api::account::Username::new("Ada");` e `let _ = Username(String::new());`. La prima non compila perché il modulo è privato, la seconda perché lo è il campo della tuple struct. L'import dalla radice funziona in entrambi i test originali. Rimuovi le righe di prova per tornare al caso valido.

## Cosa puoi cambiare senza riscrivere il client?

- **Spostare l'implementazione.** Rinomina `account.rs` in `identity.rs` e aggiorna sia `mod` sia `pub use` in `lib.rs`. Il client continua a importare `names_api::Username`: i due test passano senza modifiche. Rimuovere invece il re-export romperebbe quell'import.
- **Cambiare la rappresentazione.** Nell'esempio puoi sostituire il campo `String` con `Box<str>` e la costruzione con `Ok(Self(value.into_boxed_str()))`. `as_str` continua a restituire `&str`. I test non devono conoscere il nuovo contenitore. Questo non significa che *ogni* cambio interno sia innocuo: conserva anche gli altri impegni pubblici, per esempio i trait su cui conta il client.
- **Cambiare il comportamento.** Sulla versione originale sostituisci `Ok(Self(value))` con `Ok(Self(value.trim().to_owned()))`. `cargo check --tests` passa: l'API ha gli stessi tipi. Riesegui il test: `preserves_valid_input` fallisce perché riceve `"Ada"` invece di `" Ada "`. Un controllo di compilazione da solo non avrebbe rilevato la regressione.

## Applicare il criterio ad altre API

Un `UserId(u64)` privato evita di confondere un identificativo con un altro numero, ma non autorizza domani a rifiutare input che oggi prometti di accettare. Se zero non è valido, stabiliscilo all'inizio: un costruttore fallibile o un parametro `NonZeroU64` rendono la restrizione esplicita. Trasformare in seguito `UserId::new(u64) -> Self` in un metodo che restituisce `Result` richiede modifiche ai chiamanti.

Anche i livelli di un risultato esprimono decisioni di dominio. In una firma di repository come `find_user(id: UserId) -> Result<Option<User>, RepositoryError>`, `Ok(Some(user))` significa *trovato*, `Ok(None)` significa *ricerca riuscita, utente assente*, `Err(e)` significa *ricerca non completata*. Restituire `None` quando il database è indisponibile toglierebbe al chiamante proprio la distinzione utile. La nota sui [[Programmazione/Rust/Pagine/Error types pubblici|tipi di errore pubblici]] approfondisce come esporre questi fallimenti.

## Checklist

- Posso scrivere un esempio da una crate esterna usando solo i percorsi e i tipi che intendo mantenere?
- Posso costruire o modificare un valore aggirando il suo invariante? Al contrario, per un semplice record, i campi pubblici sono un impegno intenzionale?
- I test coprono sia gli input rifiutati sia il risultato promesso per quelli validi? La documentazione chiarisce errori, eventuali panic e, per un'API unsafe, gli obblighi del chiamante?
- Mi serve davvero un trait implementabile dall'esterno? Ogni metodo richiesto e ogni vincolo in più hanno un costo per chi lo implementa. Un trait sigillato limita le implementazioni, ma non rende liberamente modificabili i suoi metodi pubblici.

## Fonti

- [Rust Reference: visibilità e re-export](https://doc.rust-lang.org/reference/visibility-and-privacy.html)
- [Rust API Guidelines: campi privati, newtype e trait sigillati](https://rust-lang.github.io/api-guidelines/future-proofing.html)
- [Cargo Book: test di integrazione](https://doc.rust-lang.org/cargo/reference/cargo-targets.html#integration-tests) e [compatibilità SemVer](https://doc.rust-lang.org/cargo/reference/semver.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Visibilita pub use e mod|Visibilità, pub use e mod]]
- [[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]
- [[Programmazione/Rust/Pagine/Builder pattern|Builder pattern]]
- [[Programmazione/Rust/Pagine/Newtype pattern|Newtype pattern]]
- [[Programmazione/Rust/Pagine/Extension traits|Extension traits]]
- [[Programmazione/Rust/Pagine/Feature flags ben progettate|Feature flags ben progettate]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes|Compatibility e breaking changes]]
- [[Programmazione/Rust/Pagine/Documentazione delle crate|Documentazione delle crate]]

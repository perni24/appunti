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
  - "Error types pubblici"
  - "Errori pubblici"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Error handling idiomatico]]"
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow]]"
  - "[[Programmazione/Rust/Pagine/Public API design]]"
related:
  - "[[Programmazione/Rust/Pagine/Error reporting]]"
  - "[[Programmazione/Rust/Pagine/Compatibility e breaking changes]]"
  - "[[Programmazione/Rust/Pagine/Semantic Versioning]]"
---

# Error types pubblici

## Sintesi

Gli **error types pubblici** sono i tipi di errore esposti da una crate o da un modulo stabile. Fanno parte dell'API: gli utenti possono fare pattern matching, convertirli, mostrarli, loggarli e dipendere dalle loro varianti.

In Rust, progettare bene gli errori pubblici significa bilanciare precisione, stabilita e usabilita. Un errore troppo generico nasconde informazione; uno troppo dettagliato blocca evoluzioni future.

## Quando usarlo

Progetta errori pubblici quando:

- pubblichi una libreria;
- un errore deve essere gestito programmaticamente;
- vuoi distinguere categorie di fallimento;
- vuoi preservare la causa originale;
- vuoi evitare `String` come errore opaco;
- l'errore attraversa confini tra moduli o crate.

In un binario applicativo puoi usare `anyhow` internamente, ma ai confini pubblici conviene esporre tipi specifici.

## Come funziona

Scelte comuni:

- enum pubblico con varianti significative;
- struct opaca con metodi di introspezione;
- wrapper attorno a errori interni;
- conversioni `From`;
- implementazione di `std::error::Error`;
- `Display` per messaggi leggibili.

Se esponi un enum, aggiungere varianti puo essere un cambiamento rilevante per chi fa pattern matching esaustivo. Per API molto stabili puoi valutare pattern non esaustivi o tipi opachi.

## API / Sintassi

Errore enum:

```rust
#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("configuration file not found: {path}")]
    NotFound { path: std::path::PathBuf },

    #[error("invalid configuration: {message}")]
    Invalid { message: String },

    #[error("I/O error")]
    Io(#[from] std::io::Error),
}
```

Enum non esaustivo:

```rust
#[non_exhaustive]
#[derive(Debug, thiserror::Error)]
pub enum ParseError {
    #[error("unexpected end of input")]
    UnexpectedEnd,

    #[error("invalid token")]
    InvalidToken,
}
```

`#[non_exhaustive]` obbliga gli utenti a prevedere varianti future.

## Esempio pratico

Separare errore pubblico e dettaglio interno:

```rust
#[derive(Debug, thiserror::Error)]
pub enum LoadUserError {
    #[error("user not found")]
    NotFound,

    #[error("storage unavailable")]
    StorageUnavailable,
}

pub fn load_user(id: UserId) -> Result<User, LoadUserError> {
    let row = query_user(id).map_err(|_| LoadUserError::StorageUnavailable)?;
    row.ok_or(LoadUserError::NotFound)
}

# #[derive(Debug, Copy, Clone)]
# pub struct UserId(u64);
# #[derive(Debug)]
# pub struct User;
# fn query_user(_: UserId) -> Result<Option<User>, std::io::Error> { Ok(None) }
```

L'API non espone il database specifico, ma preserva categorie utili all'utente.

## Varianti

- **Enum pubblico**: adatto a categorie stabili.
- **Struct opaca**: piu flessibile per evoluzioni future.
- **Errore non esaustivo**: permette nuove varianti.
- **Errore applicativo**: orientato al reporting finale.
- **Errore libreria**: orientato a gestione programmatica.
- **Source chain**: conserva cause interne tramite `source`.

## Errori comuni

- Restituire `String` o `Box<dyn Error>` da API di libreria senza motivo.
- Esporre errori interni di dipendenze come parte stabile dell'API.
- Rendere esaustivo un enum destinato a crescere.
- Non distinguere not found, input invalido e errore infrastrutturale.
- Mettere messaggi utente dentro varianti che servono a logica.
- Perdere la causa originale.
- Cambiare varianti senza considerare SemVer.

## Checklist

- L'utente deve fare matching sull'errore?
- Le categorie sono stabili?
- Serve `#[non_exhaustive]`?
- Le cause interne sono preservate?
- `Display` e utile per una persona?
- L'errore non espone dettagli privati inutili?
- Cambiare questo tipo sarebbe breaking?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Error handling idiomatico]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/Error reporting]]
- [[Programmazione/Rust/Pagine/Public API design]]
- [[Programmazione/Rust/Pagine/Compatibility e breaking changes]]
- [[Programmazione/Rust/Pagine/Semantic Versioning]]

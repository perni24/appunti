---
date: 2026-05-20
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: base
tags: [programmazione, rust, error-handling, idiomatico]
aliases:
  - "Gestione errori idiomatica"
  - "Idiomatic error handling Rust"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Option]]"
  - "[[Programmazione/Rust/Pagine/Result]]"
  - "[[Programmazione/Rust/Pagine/Operatore]]"
related:
  - "[[Programmazione/Rust/Pagine/thiserror e anyhow]]"
  - "[[Programmazione/Rust/Pagine/Error types pubblici]]"
  - "[[Programmazione/Rust/Pagine/panic]]"
---

# Error handling idiomatico

## Sintesi

La gestione idiomatica degli errori in Rust distingue tra assenza, errore recuperabile e bug. `Option` modella assenza, `Result` modella errore recuperabile, `panic!` modella condizioni irrecuperabili o violazioni di invarianti.

Una buona API rende il fallimento esplicito nella firma e conserva contesto sufficiente per diagnosticare il problema.

## Quando usarlo

- Quando progetti funzioni fallibili.
- Quando decidi tra `Option`, `Result` e `panic!`.
- Quando scrivi librerie pubbliche e vuoi errori stabili.
- Quando scrivi applicazioni e vuoi messaggi di errore utili.

## Come funziona

Scelta del tipo:

```rust
fn trova(id: u64) -> Option<Record> {
    // assenza normale
}

fn carica(path: &str) -> Result<String, std::io::Error> {
    std::fs::read_to_string(path)
}
```

In generale:

- `Option<T>`: nessun motivo da comunicare.
- `Result<T, E>`: serve comunicare un errore.
- `panic!`: il programma ha raggiunto uno stato che non dovrebbe esistere.

## API / Sintassi

Alias applicativo:

```rust
type AppResult<T> = Result<T, AppError>;
```

Errore di dominio:

```rust
#[derive(Debug)]
enum AppError {
    Io(std::io::Error),
    Config(String),
}
```

Propagazione:

```rust
fn run() -> Result<(), AppError> {
    // ...
    Ok(())
}
```

## Esempio pratico

```rust
#[derive(Debug)]
enum UserError {
    MissingName,
    NameTooShort,
}

fn validate_name(name: Option<&str>) -> Result<&str, UserError> {
    let name = name.ok_or(UserError::MissingName)?;

    if name.len() < 3 {
        return Err(UserError::NameTooShort);
    }

    Ok(name)
}
```

L'assenza iniziale viene convertita in errore di dominio per spiegare cosa non va.

## Varianti

- Errori di libreria: enum pubblico stabile, spesso con `thiserror`.
- Errori applicativi: tipo aggregato o `anyhow::Result`.
- Errori con contesto: aggiunta di informazioni su file, input, operazione.
- Errori recuperabili: `Result`.
- Bug o invarianti violate: `panic!`, `assert!`, `debug_assert!`.

## Errori comuni

- Usare `Option` quando serve sapere il motivo del fallimento.
- Usare `panic!` per input non valido.
- Restituire `Box<dyn Error>` da una libreria pubblica quando serve un contratto stabile.
- Perdere contesto propagando errori grezzi.
- Usare `unwrap()` come scorciatoia invece di modellare l'errore.

## Checklist

- L'assenza e normale o e un errore?
- Il chiamante deve reagire in modi diversi a errori diversi?
- L'errore contiene contesto utile?
- La funzione e parte di una libreria o di una applicazione?
- Il panic e documentato e realmente irrecuperabile?

## Collegamenti

- [[Programmazione/Rust/Pagine/Option|Option]]
- [[Programmazione/Rust/Pagine/Result|Result]]
- [[Programmazione/Rust/Pagine/Operatore|Operatore ?]]
- [[Programmazione/Rust/Pagine/thiserror e anyhow|thiserror e anyhow]]
- [[Programmazione/Rust/Pagine/Error types pubblici|Error types pubblici]]


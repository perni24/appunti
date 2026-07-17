---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - backend-networking-e-database
aliases:
  - "Connection pooling"
  - "Pool di connessioni"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/Web backend con axum]]"
related:
  - "[[Programmazione/Rust/Pagine/SQLx]]"
  - "[[Programmazione/Rust/Pagine/Diesel]]"
  - "[[Programmazione/Rust/Pagine/SeaORM]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
---

# Connection pooling

## Sintesi

Il **connection pooling** mantiene un insieme di connessioni riutilizzabili verso una risorsa esterna, di solito un database. Aprire una connessione per ogni richiesta e costoso; riusarla riduce latenza e carico sul database.

In Rust backend il pool viene spesso creato all'avvio, inserito nello stato applicativo e condiviso tra handler tramite handle clonabile.

## Quando usarlo

Usa un pool quando:

- un web server serve molte richieste concorrenti;
- ogni richiesta puo accedere al database;
- aprire connessioni e costoso;
- vuoi limitare il numero massimo di connessioni;
- devi gestire timeout e backpressure;
- vuoi riusare connessioni sane e scartare quelle rotte.

Per tool CLI che fanno una sola operazione, una singola connessione puo bastare.

## Come funziona

Un pool gestisce:

- numero massimo di connessioni;
- connessioni inattive;
- acquisizione e rilascio;
- timeout di acquisizione;
- health check o riconnessione;
- chiusura ordinata.

Il chiamante chiede una connessione, la usa e la rilascia. In molte crate il rilascio avviene automaticamente quando il valore esce dallo scope.

Dimensionare un pool e una decisione di sistema: troppe connessioni possono saturare il database; troppo poche possono creare attesa nel backend.

## API / Sintassi

Pool SQLx:

```rust
use std::time::Duration;

use sqlx::postgres::PgPoolOptions;

async fn create_pool(database_url: &str) -> Result<sqlx::PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(20)
        .acquire_timeout(Duration::from_secs(3))
        .connect(database_url)
        .await
}
```

Uso in handler:

```rust
async fn count_users(pool: &sqlx::PgPool) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar!("select count(*) from users")
        .fetch_one(pool)
        .await
}
```

Il pool e passato per riferimento o clonato come handle leggero, non ricreato per richiesta.

## Esempio pratico

Pool nello state di Axum:

```rust
use axum::{extract::State, routing::get, Router};

#[derive(Clone)]
struct AppState {
    pool: sqlx::PgPool,
}

async fn health(State(state): State<AppState>) -> Result<&'static str, AppError> {
    sqlx::query("select 1")
        .execute(&state.pool)
        .await?;

    Ok("ok")
}

fn router(pool: sqlx::PgPool) -> Router {
    Router::new()
        .route("/health", get(health))
        .with_state(AppState { pool })
}

# #[derive(Debug)]
# struct AppError;
# impl From<sqlx::Error> for AppError {
#     fn from(_: sqlx::Error) -> Self { AppError }
# }
```

Il pool viene creato una volta, poi condiviso nello stato applicativo.

## Varianti

- **Pool async**: SQLx, SeaORM e backend Tokio.
- **Pool sync**: spesso usato con Diesel e thread dedicati.
- **Pool per database**: connessioni SQL.
- **Pool per client esterni**: a volte integrato in HTTP client.
- **Pool per tenant**: piu complesso, richiede limiti chiari.
- **No pool**: tool brevi, migrazioni o script monouso.

## Errori comuni

- Creare un pool per ogni richiesta.
- Impostare `max_connections` troppo alto.
- Tenere una connessione durante chiamate HTTP esterne.
- Tenere transazioni aperte mentre si attende input o rete.
- Non impostare timeout di acquisizione.
- Confondere saturazione del pool con lentezza del database.
- Non osservare metriche su attesa, connessioni attive e timeout.

## Checklist

- Il pool viene creato all'avvio?
- Il limite massimo e coerente con il database?
- Esiste un timeout di acquisizione?
- Le transazioni sono brevi?
- Le connessioni non vengono trattenute durante operazioni esterne?
- Il pool e osservabile con metriche o log?
- La chiusura dell'applicazione rilascia risorse ordinatamente?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Web backend con axum]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/SQLx]]
- [[Programmazione/Rust/Pagine/Diesel]]
- [[Programmazione/Rust/Pagine/SeaORM]]
- [[Programmazione/Rust/Pagine/Performance e profiling]]

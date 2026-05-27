---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags:
  - programmazione
  - rust
  - backend-networking-e-database
aliases:
  - "Web backend con axum"
  - "axum"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione]]"
  - "[[Programmazione/Rust/Pagine/Tower e middleware]]"
related:
  - "[[Programmazione/Rust/Pagine/Connection pooling]]"
  - "[[Programmazione/Rust/Pagine/Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Error reporting]]"
---

# Web backend con axum

## Sintesi

`axum` e un framework web Rust basato su Tokio, Hyper e Tower. Permette di costruire API HTTP usando routing, extractor, handler async, middleware e stato condiviso.

Il suo modello e fortemente tipizzato: path, query, body JSON, header e stato applicativo vengono estratti in tipi Rust. Questo riduce parsing manuale e rende gli handler piu espliciti.

## Quando usarlo

Usa `axum` quando:

- devi costruire API HTTP o JSON;
- vuoi integrare middleware Tower;
- lavori gia con Tokio;
- vuoi handler async tipizzati;
- devi condividere stato come pool database, configurazione o client HTTP;
- vuoi una base leggera ma componibile per servizi backend.

Per applicazioni full-stack server-rendered o framework opinionated, potrebbero servire scelte diverse. Per API backend, `axum` e una soluzione molto naturale nell'ecosistema Rust async.

## Come funziona

Un backend `axum` e composto da:

- `Router`: definisce route e layer;
- handler async: funzioni che ricevono extractor e restituiscono response;
- extractor: `Path`, `Query`, `Json`, `State`, header e altri input;
- state: dipendenze condivise, spesso clonate tramite `Arc`;
- middleware: layer Tower applicati a route o router;
- error handling: conversione degli errori in response HTTP.

Un handler non dovrebbe contenere tutto: parsing, dominio, accesso DB e rendering della risposta vanno separati quando il progetto cresce.

## API / Sintassi

Server minimo:

```rust
use axum::{routing::get, Router};

async fn health() -> &'static str {
    "ok"
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let app = Router::new().route("/health", get(health));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;

    axum::serve(listener, app).await?;
    Ok(())
}
```

JSON e state:

```rust
use axum::{extract::State, Json};
use serde::Serialize;

#[derive(Clone)]
struct AppState {
    app_name: String,
}

#[derive(Serialize)]
struct Status {
    app: String,
}

async fn status(State(state): State<AppState>) -> Json<Status> {
    Json(Status {
        app: state.app_name,
    })
}
```

## Esempio pratico

Route con pool database in state:

```rust
use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;

#[derive(Clone)]
struct AppState {
    pool: sqlx::PgPool,
}

#[derive(Debug, Serialize)]
struct UserDto {
    id: i64,
    name: String,
}

async fn list_users(State(state): State<AppState>) -> Result<Json<Vec<UserDto>>, AppError> {
    let users = sqlx::query_as!(
        UserDto,
        "select id, name from users order by id"
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(users))
}

fn router(state: AppState) -> Router {
    Router::new()
        .route("/users", get(list_users))
        .with_state(state)
}

# #[derive(Debug)]
# struct AppError;
# impl From<sqlx::Error> for AppError {
#     fn from(_: sqlx::Error) -> Self { AppError }
# }
```

In codice reale `AppError` dovrebbe implementare `IntoResponse` per convertire gli errori in status HTTP e body coerenti.

## Varianti

- **API JSON**: uso piu comune con `Json<T>`.
- **Backend con database**: state con pool condiviso.
- **Router modulari**: route separate per dominio.
- **Middleware Tower**: timeout, CORS, tracing, auth.
- **WebSocket**: supporto tramite extractor dedicati.
- **Server graceful shutdown**: importante per deploy e container.

## Errori comuni

- Mettere logica di dominio direttamente negli handler.
- Usare state globale non tipizzato invece di `State<AppState>`.
- Clonare oggetti costosi invece di handle clonabili come pool o `Arc`.
- Restituire errori generici senza mappatura HTTP.
- Dimenticare timeout, body limit e tracing.
- Bloccare il runtime async con lavoro CPU o I/O sincrono pesante.
- Non testare route e serializzazione delle response.

## Checklist

- Gli handler sono piccoli e leggibili?
- Lo stato condiviso e esplicito?
- Gli errori implementano una conversione HTTP coerente?
- I middleware essenziali sono applicati?
- Le query database usano un pool?
- Le operazioni bloccanti sono isolate?
- Esiste graceful shutdown?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Tower e middleware]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/Connection pooling]]
- [[Programmazione/Rust/Pagine/SQLx]]
- [[Programmazione/Rust/Pagine/Tracing con tracing]]
- [[Programmazione/Rust/Pagine/Error reporting]]
- [[Programmazione/Rust/Pagine/Graceful shutdown]]

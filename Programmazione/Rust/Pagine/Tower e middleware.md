---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags:
  - programmazione
  - rust
  - backend-networking-e-database
aliases:
  - "Tower e middleware"
  - "Tower"
  - "middleware"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits]]"
  - "[[Programmazione/Rust/Pagine/Future Trait]]"
  - "[[Programmazione/Rust/Pagine/Web backend con axum]]"
related:
  - "[[Programmazione/Rust/Pagine/Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling]]"
---

# Tower e middleware

## Sintesi

Tower e una libreria che definisce astrazioni per servizi asincroni componibili. Nel backend Rust viene usata per modellare middleware come timeout, retry, rate limit, tracing, CORS, autenticazione e trasformazione delle request/response.

`axum` si integra con Tower: molte funzionalita trasversali di un web server vengono applicate come layer invece che riscritte in ogni handler.

## Quando usarlo

Usa Tower e middleware quando:

- devi applicare logica comune a molte route;
- vuoi timeout o rate limit;
- devi aggiungere tracing o request id;
- devi gestire CORS, compression o body limit;
- vuoi separare logica applicativa e infrastrutturale;
- stai costruendo client o server async componibili.

Non usare middleware per logica di dominio specifica: se una regola riguarda un caso d'uso, spesso appartiene al service applicativo o all'handler.

## Come funziona

Il concetto base e `Service<Request>`: un tipo che riceve una request e produce una response asincrona. Un middleware e spesso un layer che avvolge un service con comportamento aggiuntivo.

Catena tipica:

```text
request -> tracing -> timeout -> auth -> router -> handler -> response
```

Ogni layer puo:

- leggere o modificare request;
- rifiutare la request;
- chiamare il servizio interno;
- modificare la response;
- registrare metriche o log;
- applicare timeout o backpressure.

Il vantaggio e composizione. Il costo e maggiore complessita nei tipi, soprattutto quando si scrivono middleware custom.

## API / Sintassi

Uso di layer con `axum`:

```rust
use axum::{routing::get, Router};
use tower_http::trace::TraceLayer;

async fn health() -> &'static str {
    "ok"
}

fn app() -> Router {
    Router::new()
        .route("/health", get(health))
        .layer(TraceLayer::new_for_http())
}
```

Applicare un layer solo a una route o a un gruppo di route cambia lo scope del middleware. In backend reali conviene essere espliciti: middleware globale per aspetti universali, middleware locale per requisiti specifici.

## Esempio pratico

Timeout HTTP:

```rust
use std::time::Duration;

use axum::{routing::get, Router};
use tower_http::timeout::TimeoutLayer;

async fn slow_handler() -> &'static str {
    "done"
}

fn app() -> Router {
    Router::new()
        .route("/work", get(slow_handler))
        .layer(TimeoutLayer::new(Duration::from_secs(5)))
}
```

Un timeout evita che richieste lente consumino risorse indefinitamente. Va pero progettato insieme a cancellazione, idempotenza e gestione degli errori.

## Varianti

- **TraceLayer**: log e span per request HTTP.
- **TimeoutLayer**: limite temporale per chiamate.
- **CorsLayer**: policy CORS.
- **CompressionLayer**: compressione response.
- **Rate limit**: limita frequenza di richieste.
- **Auth middleware**: valida token o sessione.
- **Service custom**: implementazione diretta di `Service`.

## Errori comuni

- Mettere logica di business nei middleware.
- Applicare middleware nell'ordine sbagliato.
- Dimenticare che timeout e retry possono duplicare effetti collaterali.
- Usare retry su POST non idempotenti senza chiave di idempotenza.
- Nascondere errori generati dai layer.
- Rendere i tipi troppo complessi per middleware custom non necessari.
- Non testare interazioni tra layer.

## Checklist

- Il middleware riguarda davvero una preoccupazione trasversale?
- L'ordine dei layer e intenzionale?
- Timeout e retry rispettano idempotenza?
- Gli errori dei layer sono convertiti in response chiare?
- Il tracing include request id o campi utili?
- Il middleware e applicato allo scope giusto?
- Esistono test almeno per auth, timeout e casi di errore?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Web backend con axum]]
- [[Programmazione/Rust/Pagine/Traits]]
- [[Programmazione/Rust/Pagine/Future Trait]]
- [[Programmazione/Rust/Pagine/Tracing con tracing]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/Performance e profiling]]

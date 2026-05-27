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
  - "Networking con reqwest"
  - "reqwest"
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione]]"
related:
  - "[[Programmazione/Rust/Pagine/Error reporting]]"
  - "[[Programmazione/Rust/Pagine/Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Web backend con axum]]"
---

# Networking con reqwest

## Sintesi

`reqwest` e una crate HTTP client di alto livello per Rust. Permette di inviare richieste HTTP, gestire header, query string, body JSON, timeout, redirect e risposta asincrona senza lavorare direttamente con socket o parser HTTP.

E una scelta comune per CLI, servizi backend e integrazioni con API esterne. Il punto importante e trattare il client HTTP come una risorsa riutilizzabile, configurata all'avvio e condivisa tra le parti dell'applicazione.

## Quando usarlo

Usa `reqwest` quando:

- devi chiamare API HTTP esterne;
- devi inviare o ricevere JSON;
- vuoi timeout, redirect e TLS gestiti da una libreria matura;
- stai scrivendo una CLI che consuma servizi remoti;
- un backend deve comunicare con altri microservizi;
- vuoi un client asincrono integrabile con Tokio.

Per protocolli non HTTP, streaming molto specializzato o massima personalizzazione del layer di rete, potrebbe servire lavorare a un livello piu basso.

## Come funziona

Il tipo centrale e `reqwest::Client`. Un client mantiene configurazione e risorse riutilizzabili, come connection pooling interno. Crearlo per ogni richiesta e inefficiente.

Flusso tipico:

1. costruisci un `Client`;
2. prepari la richiesta;
3. aggiungi header, query o body;
4. invii con `.send().await`;
5. controlli lo status;
6. deserializzi la risposta.

Gli errori possono provenire da rete, DNS, TLS, timeout, status HTTP inatteso o parsing del body. Non basta gestire `Err`: una risposta `404` o `500` puo arrivare come `Ok(Response)` se non chiami `error_for_status()`.

## API / Sintassi

Richiesta GET con JSON:

```rust
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct User {
    id: u64,
    name: String,
}

async fn fetch_user(client: &reqwest::Client, id: u64) -> Result<User, reqwest::Error> {
    client
        .get(format!("https://api.example.test/users/{id}"))
        .send()
        .await?
        .error_for_status()?
        .json::<User>()
        .await
}
```

Client configurato:

```rust
use std::time::Duration;

fn build_client() -> Result<reqwest::Client, reqwest::Error> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .user_agent("my-app/0.1")
        .build()
}
```

## Esempio pratico

POST JSON con errore applicativo:

```rust
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct CreateIssue<'a> {
    title: &'a str,
}

#[derive(Debug, Deserialize)]
struct Issue {
    id: u64,
}

async fn create_issue(client: &reqwest::Client, title: &str) -> Result<Issue> {
    let response = client
        .post("https://api.example.test/issues")
        .json(&CreateIssue { title })
        .send()
        .await
        .context("failed to send create issue request")?
        .error_for_status()
        .context("create issue request returned an error status")?;

    response
        .json::<Issue>()
        .await
        .context("failed to decode create issue response")
}
```

Il contesto aggiunto agli errori rende piu chiaro dove e fallita l'operazione.

## Varianti

- **Client async**: scelta tipica per backend e servizi Tokio.
- **Client blocking**: utile in tool semplici senza runtime async.
- **JSON API client**: usa Serde per request e response.
- **Streaming response**: utile per download grandi o eventi.
- **Custom headers**: token, user agent, content type.
- **Retry layer**: spesso va costruito sopra `reqwest`, non improvvisato nel punto di chiamata.

## Errori comuni

- Creare un nuovo `Client` per ogni richiesta.
- Dimenticare timeout.
- Non chiamare `error_for_status()` e trattare `500` come successo.
- Fare retry ciechi su richieste non idempotenti.
- Loggare token o header sensibili.
- Confondere errore di rete e risposta HTTP valida con status di errore.
- Deserializzare direttamente in tipi troppo fragili rispetto all'API esterna.

## Checklist

- Il `Client` e riutilizzato?
- Sono impostati timeout sensati?
- Gli status HTTP non riusciti sono gestiti?
- Le richieste idempotenti e non idempotenti sono distinte?
- I token non finiscono nei log?
- Le risposte sono deserializzate in tipi espliciti?
- Gli errori hanno contesto utile?

## Collegamenti

- [[Programmazione/Rust/Indice rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Async Await]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/Error reporting]]
- [[Programmazione/Rust/Pagine/Tracing con tracing]]
- [[Programmazione/Rust/Pagine/Web backend con axum]]

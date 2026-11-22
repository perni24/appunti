---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - backend-networking-e-database
aliases:
  - Web backend con axum
  - axum
prerequisites:
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]"
related:
  - "[[Programmazione/Rust/Pagine/Networking con reqwest|Networking con reqwest]]"
  - "[[Programmazione/Rust/Pagine/Tower e middleware|Tower e middleware]]"
  - "[[Programmazione/Rust/Pagine/Connection pooling|Connection pooling]]"
  - "[[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Error reporting|Error reporting]]"
title: Web backend con axum
---

# Web backend con axum

## Sintesi

`axum` riceve richieste HTTP; [[Programmazione/Rust/Pagine/Networking con reqwest|reqwest]] le invia. In questa nota costruiamo il server per la CLI della nota su reqwest: **creare una issue** con `POST /issues` e **ritrovarla** con `GET /issues/{id}`. Non serve un database. L'esempio usa **axum 0.8**: un parametro di percorso si scrive `{id}`, non `:id`.

## Dalla richiesta alla risposta

| Passo | Responsabilità | Esempio |
| --- | --- | --- |
| Router | Seleziona percorso e metodo. | `DELETE /issues/1` incontra il percorso ma non un metodo ammesso: `405`. |
| Extractor | Converte le parti della richiesta nei tipi attesi. Può rispondere senza eseguire il corpo dell'handler. | `Path<usize>` rifiuta `abc`; `Json<NewIssue>` rifiuta un corpo che non può deserializzare. |
| Handler | Decide cosa significano i dati validamente estratti. | Un titolo di soli spazi è una stringa valida per Serde, ma non è una issue valida per questa API. |
| `IntoResponse` | Costruisce la risposta HTTP dal valore restituito. | `Json(issue)` produce JSON; una tupla può aggiungere status e header. Anche l'errore di un `Result` deve poter diventare una risposta. |

`State`, `Path`, `Query` e gli header non consumano il corpo. Un extractor che lo consuma, come `Json<T>`, va **per ultimo** nella firma dell'handler: il corpo è uno stream, non un documento che ogni parametro può rileggere. `Json<T>` come parametro **legge** la richiesta; come valore restituito **scrive** la risposta.

## Esempio pratico

Crea un progetto con una toolchain Rust che supporti l'edition 2024 ed entra nella directory generata:

```sh
cargo new --bin --edition 2024 issue-api
```

```sh
cd issue-api
```

Aggiungi queste righe sotto `[dependencies]` in `Cargo.toml`. I tre blocchi Rust successivi formano insieme `src/main.rs`, nell'ordine indicato.

```toml
axum = "0.8"
serde = { version = "1", features = ["derive"] }
tokio = { version = "1", features = ["macros", "net", "rt"] }
```

### 1. Stato ed errori pubblici

Lo stato è una sola lista per processo. Clonare `AppState` clona l'`Arc`, **non** la lista. `ApiError` decide quale errore mostrare al client: un problema interno al lock non deve esporre dettagli dell'implementazione.

```rust
use std::sync::{Arc, Mutex};

use axum::{
    Json, Router,
    extract::{DefaultBodyLimit, Path, State},
    http::{StatusCode, header},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use serde::{Deserialize, Serialize};

#[derive(Clone, Default)]
struct AppState {
    issues: Arc<Mutex<Vec<String>>>,
}

#[derive(Deserialize)]
struct NewIssue {
    title: String,
}

#[derive(Serialize)]
struct Issue {
    id: usize,
    title: String,
}

#[derive(Serialize)]
struct Problem {
    error: &'static str,
}

enum ApiError {
    NotFound,
    EmptyTitle,
    Internal,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error) = match self {
            Self::NotFound => (StatusCode::NOT_FOUND, "issue_not_found"),
            Self::EmptyTitle => (StatusCode::UNPROCESSABLE_ENTITY, "empty_title"),
            Self::Internal => (StatusCode::INTERNAL_SERVER_ERROR, "internal_error"),
        };
        (status, Json(Problem { error })).into_response()
    }
}
```

### 2. Creazione e lettura

L'ID parte da 1 ed è assegnato mentre la lista è protetta: due POST non possono scegliere lo stesso ID. Il modello funziona perché la lista è solo incrementale, senza cancellazioni. La risposta di creazione include `Location`, così il client non deve indovinare il percorso della nuova risorsa.

```rust
async fn create_issue(
    State(state): State<AppState>,
    Json(input): Json<NewIssue>,
) -> Result<impl IntoResponse, ApiError> {
    let title = input.title.trim();
    if title.is_empty() {
        return Err(ApiError::EmptyTitle);
    }
    let id = {
        let mut issues = state.issues.lock().map_err(|_| ApiError::Internal)?;
        issues.push(title.to_owned());
        issues.len()
    };
    let issue = Issue {
        id,
        title: title.to_owned(),
    };
    Ok((
        StatusCode::CREATED,
        [(header::LOCATION, format!("/issues/{id}"))],
        Json(issue),
    ))
}

async fn get_issue(
    State(state): State<AppState>,
    Path(id): Path<usize>,
) -> Result<Json<Issue>, ApiError> {
    let index = id.checked_sub(1).ok_or(ApiError::NotFound)?;
    let issues = state.issues.lock().map_err(|_| ApiError::Internal)?;
    let title = issues.get(index).cloned().ok_or(ApiError::NotFound)?;
    Ok(Json(Issue { id, title }))
}
```

### 3. Router e avvio

`with_state` fornisce la dipendenza richiesta dagli handler; non crea una nuova lista per richiesta. `DefaultBodyLimit` limita a **4096 byte** la lettura fatta dall'extractor JSON: non è un limite sulla lunghezza del solo titolo né sul totale di issue conservate.

```rust
fn app(state: AppState) -> Router {
    Router::new()
        .route("/health", get(|| async { "ok" }))
        .route("/issues", post(create_issue))
        .route("/issues/{id}", get(get_issue))
        .layer(DefaultBodyLimit::max(4096))
        .with_state(state)
}

#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let port: u16 = std::env::args()
        .nth(1)
        .as_deref()
        .unwrap_or("3000")
        .parse()?;
    let listener = tokio::net::TcpListener::bind(("127.0.0.1", port)).await?;
    println!("http://{}", listener.local_addr()?);
    axum::serve(listener, app(AppState::default())).await?;
    Ok(())
}
```

Avvia il server e lascialo aperto. Ascolta solo su loopback. Se la porta 3000 è occupata, usa `cargo run -- 0` e sostituisci la porta nei comandi con quella stampata. Per fermarlo usa `Ctrl+C`: al riavvio la lista sarà vuota.

```sh
cargo run
```

### 4. Prova dal punto di vista del client

Nel secondo terminale crea un file `issue.json` nella directory corrente con questo contenuto:

```json
{"title":"  Prima nota  "}
```

I comandi usano `curl` 7.82 o successivo (`--json` imposta il tipo di contenuto e invia un POST). Su Windows PowerShell usa `curl.exe` se `curl` è un alias. `-i` mostra anche status e header.

```sh
curl -i --json "@issue.json" http://127.0.0.1:3000/issues
```

Su un server appena avviato ottieni **201 Created**, `Location: /issues/1` e `{"id":1,"title":"Prima nota"}`. I due spazi a ciascuna estremità sono stati rimossi dall'handler, non da Serde. Segui il percorso restituito:

```sh
curl -i http://127.0.0.1:3000/issues/1
```

Questa volta ottieni **200 OK** con la stessa issue. Per un confronto, chiedi un ID valido ma assente:

```sh
curl -i http://127.0.0.1:3000/issues/0
```

Ottieni **404** con `{"error":"issue_not_found"}`. Dalla directory del progetto [[Programmazione/Rust/Pagine/Networking con reqwest|issue-client]], puoi eseguire anche `cargo run -- get http://127.0.0.1:3000/issues/1`: il client stampa `1: Prima nota`.

## Chi ha prodotto l'errore?

| Richiesta | Risposta prevista | Dove intervenire |
| --- | --- | --- |
| `GET /issues/abc` | `400`: non si può estrarre un intero. | Extractor `Path`; l'handler non effettua la ricerca. |
| POST senza un `Content-Type` JSON, JSON malformato o JSON con `title` numerico | Rispettivamente `415`, `400`, `422`. | Extractor `Json`: formato del messaggio, sintassi e schema sono controlli diversi. |
| POST con JSON valido ma titolo vuoto dopo `trim()` | `422` con `{"error":"empty_title"}`. | Handler: una regola applicativa, non un errore di deserializzazione. |
| POST con corpo JSON oltre 4096 byte | `413`; la issue non viene creata. | Limite per l'extractor. Si contano i byte del documento, non i caratteri del titolo. |
| ID assente, percorso sconosciuto, metodo non ammesso | `404` JSON per l'ID assente; `404` del router per il percorso sconosciuto; `405` per il metodo. | Solo il primo passa da `ApiError::NotFound`. |

**Uno status non garantisce un formato del corpo.** Qui gli errori di dominio sono JSON; i rifiuti predefiniti degli extractor e del router non passano dal nostro `IntoResponse`. Se l'API promette un unico formato, gestisci anche le rejection (per esempio ricevendo `Result<Json<NewIssue>, JsonRejection>` nell'handler) e i fallback per percorso e metodo.

## Limiti e scelte

- **Concorrenza e persistenza.** Il mutex sincrono protegge operazioni brevi in memoria; nessuna guardia attraversa un `.await`. Non usarlo per tenere bloccata una richiesta durante una query o un'operazione di rete. Qui la memoria non ha un tetto complessivo, i dati non sopravvivono al processo e due repliche non condividono gli ID.
- **Quando aggiungi PostgreSQL**, metti un `sqlx::PgPool` nello stato e passa `&state.pool` alle query, senza avvolgere il pool in un altro mutex. Per una ricerca distingui una riga assente da un errore del database; restituisci al client un errore pubblico e registra internamente la causa. Le macro di query hanno prerequisiti di compilazione propri: vedi [[Programmazione/Rust/Pagine/SQLx|SQLx]] e [[Programmazione/Rust/Pagine/Connection pooling|Connection pooling]].
- **Quando cresce il servizio**, separa i router per risorsa e usa [[Programmazione/Rust/Pagine/Tower e middleware|i layer Tower]] per comportamenti trasversali (tracing, timeout, CORS). Un controllo di vitalità come `/health` non prova che il database sia pronto. Il Ctrl+C del demo non implementa il drenaggio delle richieste: vedi [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]. Per connessioni persistenti come WebSocket occorrono l'upgrade e la relativa feature, non un normale handler JSON.

## Fonti ufficiali

- [axum 0.8: Router, parametri di percorso e stato](https://docs.rs/axum/0.8/axum/struct.Router.html)
- [Extractor: ordine, rejection e consumo del corpo](https://docs.rs/axum/0.8/axum/extract/index.html)
- [Json come extractor e come risposta](https://docs.rs/axum/0.8/axum/struct.Json.html)
- [DefaultBodyLimit: ambito e configurazione](https://docs.rs/axum/0.8/axum/extract/struct.DefaultBodyLimit.html)
- [IntoResponse e tipi componibili](https://docs.rs/axum/0.8/axum/response/trait.IntoResponse.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Networking con reqwest|Networking con reqwest]]
- [[Programmazione/Rust/Pagine/Tower e middleware|Tower e middleware]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/Connection pooling|Connection pooling]]
- [[Programmazione/Rust/Pagine/SQLx|SQLx]]
- [[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]
- [[Programmazione/Rust/Pagine/Error reporting|Error reporting]]
- [[Programmazione/Rust/Pagine/Graceful shutdown|Graceful shutdown]]

---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - rust
  - backend-networking-e-database
aliases:
  - Tower e middleware
  - Tower
  - middleware
prerequisites:
  - "[[Programmazione/Rust/Pagine/Traits|Traits]]"
  - "[[Programmazione/Rust/Pagine/Future Trait|Future Trait]]"
  - "[[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]"
related:
  - "[[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]"
title: Tower e middleware
---

# Tower e middleware

## Sintesi

Un middleware può rispondere **al posto dell'handler**. Un esempio: l'handler non ha ancora finito, ma un timeout restituisce già `503`. Il middleware che aggiunge un header vedrà quel `503`? **Solo se sta all'esterno del timeout.** Questa è la ragione pratica per cui l'ordine dei layer conta sia sulle richieste sia sulle risposte.

Usa i middleware per regole condivise come tracing, timeout, CORS o compressione. Lascia nell'handler o nel dominio le regole specifiche della risorsa: il controllo del titolo di una issue in [[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]] non appartiene a ogni richiesta HTTP.

## Servizio, layer e ordine

Un `Service<Request>` ha due operazioni distinte. `poll_ready` segnala se il servizio può accettare una chiamata; `call` prende la richiesta e restituisce una future che produce `Result<Response, Error>`. La disponibilità riguarda **quell'istanza**: non controllare un servizio per poi chiamare un clone arbitrario. Nei test sotto, `ServiceExt::oneshot` aspetta la disponibilità e chiama il servizio una volta. Un `Layer` trasforma un servizio interno in un altro servizio, che può anche rispondere senza inoltrare la richiesta.

| Come componi i layer | Ingresso della richiesta | Ritorno di una risposta normale |
| --- | --- | --- |
| `ServiceBuilder::new().layer(A).layer(B)` applicato una volta | A, poi B, poi handler | handler, poi B, poi A |
| `router.layer(A).layer(B)` sullo stesso insieme di route | B, poi A, poi handler | handler, poi A, poi B |

Il builder mette il **primo** layer dichiarato all'esterno; due chiamate successive sul router avvolgono ogni volta ciò che c'era già. Se B genera direttamente la risposta, il servizio interno non può modificarla. Inoltre, **ordine** e **ambito** sono scelte diverse: `Router::route_layer` applica il layer alle route già registrate che corrispondono al percorso; non trasforma il normale `404` per un percorso sconosciuto. Le route aggiunte dopo non ereditano retroattivamente quel layer.

## Esempio pratico

Costruiamo una piccola libreria con due route: `/quick` risponde subito e `/slow` registra l'ingresso e poi aspetta. Possiamo verificare il router direttamente, senza aprire porte, dipendere dalla velocità della macchina o misurare millisecondi con un cronometro.

```sh
cargo new --lib --edition 2024 strati-http
```

```sh
cd strati-http
```

In `Cargo.toml` sostituisci la sezione vuota `[dependencies]` con queste due sezioni. `test-util` di Tokio serve solo al test per sospendere il tempo; `timeout` di Tower serve anche alla variante mostrata più avanti.

```toml
[dependencies]
axum = "0.8"
tokio = { version = "1", features = ["time"] }
tower = { version = "0.5", features = ["util", "timeout"] }
tower-http = { version = "0.6.8", features = ["timeout"] }

[dev-dependencies]
tokio = { version = "1", features = ["macros", "rt", "test-util"] }
```

### 1. Un header che rende visibile l'ordine

Sostituisci `src/lib.rs` con il blocco seguente. `observed` aspetta la risposta di `next`, poi aggiunge un header. Il contatore è solo uno strumento didattico per distinguere “non chiamato” da “chiamato ma non completato”.

```rust
use std::{
    sync::{
        Arc,
        atomic::{AtomicUsize, Ordering},
    },
    time::Duration,
};

use axum::{
    Router,
    extract::{Request, State},
    http::{HeaderValue, StatusCode},
    middleware::{self, Next},
    response::Response,
    routing::get,
};
use tower::ServiceBuilder;
use tower_http::timeout::TimeoutLayer;

const BUDGET: Duration = Duration::from_millis(100);

async fn observed(req: Request, next: Next) -> Response {
    let mut res = next.run(req).await;
    res.headers_mut()
        .insert("x-observed", HeaderValue::from_static("yes"));
    res
}

async fn slow(State(starts): State<Arc<AtomicUsize>>) -> &'static str {
    starts.fetch_add(1, Ordering::Relaxed);
    tokio::time::sleep(Duration::from_secs(2)).await;
    "done"
}

fn routes(starts: Arc<AtomicUsize>) -> Router {
    Router::new()
        .route("/quick", get(|| async { "ok" }))
        .route("/slow", get(slow))
        .with_state(starts)
}

pub fn app(starts: Arc<AtomicUsize>) -> Router {
    routes(starts).route_layer(
        ServiceBuilder::new()
            .layer(middleware::from_fn(observed))
            .layer(TimeoutLayer::with_status_code(
                StatusCode::SERVICE_UNAVAILABLE,
                BUDGET,
            )),
    )
}
```

### 2. Osservare il timeout senza una socket

Aggiungi il test in fondo allo stesso `src/lib.rs`. Con il tempo di Tokio sospeso, il runtime può avanzare al prossimo timer quando non resta altro lavoro pronto. Non servono due secondi reali di attesa.

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use tower::ServiceExt;

    #[tokio::test(start_paused = true)]
    async fn timeout_visibile() {
        let starts = Arc::new(AtomicUsize::new(0));
        let req = Request::builder().uri("/slow").body(Body::empty()).unwrap();
        let res = app(starts.clone()).oneshot(req).await.unwrap();

        assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
        assert_eq!(res.headers()["x-observed"], "yes");
        assert_eq!(starts.load(Ordering::Relaxed), 1);
    }
}
```

```sh
cargo test --lib timeout_visibile
```

I tre assert verificano tre fatti diversi. Il servizio ha restituito una **risposta HTTP**, quindi `oneshot(...).await` è `Ok` anche se lo status è `503`. L'header c'è perché il timeout ha restituito quella risposta a `observed`. Infine, l'handler era già entrato: interrompere l'attesa **non annulla** l'incremento già eseguito.

| Richiesta con il router dell'esempio | Status e corpo | Header `x-observed` |
| --- | --- | --- |
| `GET /quick` | `200`, testo `ok` | Presente |
| `GET /slow` | `503`, corpo vuoto creato dal timeout HTTP | Presente |
| `GET /assente` | `404` del router | Assente |

**Controprova:** scambia le due righe `.layer(...)` nel builder. Su `/quick` rimane tutto uguale; su `/slow` resta `503`, ma manca l'header. Il timeout è ora all'esterno: smette di attendere la future di `observed`, quindi il codice dopo `next.run(req).await` non arriva a modificare la risposta.

## Due timeout, due contratti

- **`tower_http::timeout::TimeoutLayer`** conosce HTTP. Alla scadenza produce una risposta con lo status configurato e non introduce un nuovo errore nel tipo `Error` del servizio. Nel demo `503` è una scelta esplicita della nostra API, non uno status obbligatorio per ogni timeout.
- **`tower::timeout::TimeoutLayer`** è generico. Alla scadenza produce un **errore del servizio** (`Elapsed`, in un `BoxError`), non una risposta. Per usarlo su una route axum bisogna trasformare quell'errore in una risposta: lo strato che lo gestisce deve stare **all'esterno** del timeout.

Questa variante opzionale si può aggiungere allo stesso `src/lib.rs`. Mantiene la politica HTTP ma rende esplicita la conversione. Un errore non riconosciuto diventa `500`, non viene etichettato arbitrariamente come scadenza.

```rust
pub fn app_tower(starts: Arc<AtomicUsize>) -> Router {
    use axum::{BoxError, error_handling::HandleErrorLayer};
    use tower::timeout::error::Elapsed;

    routes(starts).route_layer(
        ServiceBuilder::new()
            .layer(middleware::from_fn(observed))
            .layer(HandleErrorLayer::new(|err: BoxError| async move {
                if err.is::<Elapsed>() {
                    StatusCode::SERVICE_UNAVAILABLE
                } else {
                    StatusCode::INTERNAL_SERVER_ERROR
                }
            }))
            .timeout(BUDGET),
    )
}
```

## Limiti e scelte

- **Cosa cronometra il layer?** Negli esempi limita l'attesa della future che produce la risposta. Non stabilisce quanto tempo il client impiegherà a consumare un corpo in streaming **dopo** che la risposta è disponibile, né un budget end-to-end che includa code a monte. Scegli limiti separati per lettura del corpo, attese in coda e chiamate in uscita.
- **Cancellazione e retry.** Scartare una future può interrompere lavoro asincrono cooperativo ancora in attesa; non ferma necessariamente un task separato, non interrompe a forza del codice bloccante e non ritira una scrittura già avvenuta. Prima di ripetere un POST serve un contratto di idempotenza, non basta aver ricevuto un timeout.
- **Carico.** Un limite di concorrenza controlla quante operazioni procedono insieme; un rate limit controlla quante ne ammetti in un intervallo; un timeout limita l'attesa. Non sono tre nomi per lo stesso meccanismo. Una coda non limitata può solo spostare l'attesa.
- **Osservabilità e ambito.** Per vedere anche le risposte generate da un altro layer, metti `TraceLayer` all'esterno e configura un subscriber che raccolga gli eventi; l'header del demo non è un sistema di tracing. Per CORS, compressione o controlli di accesso scegli deliberatamente le route interessate. Un header di diagnostica non è una prova di identità.

## Fonti ufficiali

- [Tower 0.5: Service, poll_ready e call](https://docs.rs/tower/0.5/tower/trait.Service.html)
- [ServiceBuilder: ordine di composizione](https://docs.rs/tower/0.5/tower/struct.ServiceBuilder.html#order)
- [axum 0.8: middleware e ordine dei layer](https://docs.rs/axum/0.8/axum/middleware/index.html)
- [axum: ambito di Router::route_layer](https://docs.rs/axum/0.8/axum/struct.Router.html#method.route_layer)
- [tower-http: timeout HTTP e timeout dei corpi](https://docs.rs/tower-http/0.6/tower_http/timeout/index.html)
- [Tower: timeout generico e tipo di errore](https://docs.rs/tower/0.5/tower/timeout/index.html)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]
- [[Programmazione/Rust/Pagine/Traits|Traits]]
- [[Programmazione/Rust/Pagine/Future Trait|Future Trait]]
- [[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/Performance e profiling|Performance e profiling]]

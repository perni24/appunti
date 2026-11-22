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
  - Networking con reqwest
  - reqwest
prerequisites:
  - "[[Programmazione/Rust/Pagine/Async Await|Async Await]]"
  - "[[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]"
  - "[[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]"
related:
  - "[[Programmazione/Rust/Pagine/Error reporting|Error reporting]]"
  - "[[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]"
  - "[[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]"
title: Networking con reqwest
---

# Networking con reqwest

## Sintesi

`reqwest` è un **client HTTP**: una CLI o un servizio lo usa per chiamare un altro servizio. Non espone route in ascolto: per questo vedi [[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]. La distinzione più utile è fra **ricevere una risposta**, **accettarne lo status** e **capirne il contenuto**. Sono tre risultati diversi.

| Passaggio | Cosa sai se riesce | Cosa non sai ancora |
| --- | --- | --- |
| `send().await` | Sono arrivati gli header della risposta; anche un `503` è una risposta. | Se l'operazione è riuscita o se il corpo arriverà per intero. |
| Controllo di `status()` | Lo status ha il significato previsto per **quella operazione**. | Se il corpo è leggibile o conforme allo schema. |
| Lettura e deserializzazione | Il corpo ricevuto è completo e si può convertire nel tipo richiesto. | Se tutti i valori rispettano le regole applicative (per esempio, un titolo non vuoto). |

`response.error_for_status()?` è una scorciatoia per trasformare **4xx e 5xx** in errori. Non richiede `200`, non scarta ogni `3xx` e non verifica il JSON. Usala quando quella è la politica voluta. Se una GET ammette “non trovato”, controlla `404` **prima** di applicarla.

## Un client per più chiamate

Costruisci `reqwest::Client` all'avvio e passa `&Client` alle operazioni. Il client contiene un pool di connessioni; i suoi cloni lo condividono. Il riuso rende *possibile* riutilizzare una connessione, non garantisce che il server la terrà aperta.

- **Timeout:** `connect_timeout` limita la fase di connessione; `timeout` imposta il budget complessivo, inclusa la lettura del corpo. Ricevere subito gli header non basta per evitare un timeout. I valori dell'esempio non sono raccomandazioni universali.
- **Redirect:** se reqwest li segue, il codice vede normalmente lo status finale. Nell'esempio li disattiviamo per osservare e rifiutare anche un reindirizzamento inatteso.
- **API da scegliere:** `.query(...)` codifica i parametri; `.json(&valore)` serializza il corpo della richiesta. Sulla **risposta**, `.json::<T>().await` legge e deserializza: comoda per piccoli payload fidati, non impone il limite applicativo mostrato sotto. La variante `reqwest::blocking` richiede la feature omonima: usala in codice sincrono, non direttamente dentro un task Tokio.

## Esempio pratico

Il servizio di esempio restituisce una *issue* nel formato `{"id":7,"title":"Prima nota"}`. La ricerca accetta `200` con JSON oppure `404` senza risultato. La creazione accetta **solo `201` con la nuova issue**. Non sono regole universali di HTTP: un'altra API potrebbe prevedere `202` per un lavoro ancora in corso o `204` senza corpo.

Crea il progetto ed entra nella directory generata:

```sh
cargo new --bin --edition 2024 issue-client
```

```sh
cd issue-client
```

Sotto la sezione `[dependencies]` già presente in `Cargo.toml`, aggiungi queste righe. L'esempio usa l'API di **reqwest 0.12**; la feature `rustls-tls` permette anche HTTPS, ma per la prova locale non occorrono certificati o credenziali.

```toml
anyhow = "1"
reqwest = { version = "0.12", default-features = false, features = ["json", "rustls-tls"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["macros", "rt"] }
```

### Leggere una risposta piccola senza fidarsi della dimensione dichiarata

I due blocchi Rust che seguono formano, in ordine, **un unico `src/main.rs`**. Il primo legge al massimo 64 KiB nel buffer applicativo: conta i byte effettivi anche quando manca `Content-Length`. Il limite non include i buffer interni del trasporto e non è adatto al download di file grandi: in quel caso scrivi i chunk a destinazione senza accumularli tutti.

```rust
use std::time::Duration;

use anyhow::{Context, Result, bail};
use reqwest::{Client, Response, StatusCode, redirect::Policy};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct Issue {
    id: u64,
    title: String,
}

#[derive(Serialize)]
struct NewIssue<'a> {
    title: &'a str,
}

fn http_error(stage: &'static str, error: reqwest::Error) -> anyhow::Error {
    let timed_out = error.is_timeout();
    let err = anyhow::Error::new(error.without_url()).context(stage);
    if timed_out {
        err.context("timeout HTTP")
    } else {
        err
    }
}

async fn read_issue(mut response: Response) -> Result<Issue> {
    const LIMIT: usize = 64 * 1024;
    let mut body = Vec::new();
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|e| http_error("lettura del corpo", e))?
    {
        if chunk.len() > LIMIT - body.len() {
            bail!("corpo oltre il limite di {LIMIT} byte");
        }
        body.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&body).context("JSON non valido per Issue")
}
```

### Interpretare lo status prima di leggere il corpo

Il secondo blocco tratta un `404` come assenza **solo nella ricerca**. Se il server risponde `503` con una pagina HTML, l'errore mostrato è `GET: HTTP 503`, non un errore JSON. Il client viene passato alle due operazioni; un'applicazione di lunga durata può chiamarle più volte con la stessa istanza.

```rust
async fn find(client: &Client, url: &str) -> Result<Option<Issue>> {
    let res = client
        .get(url)
        .send()
        .await
        .map_err(|e| http_error("invio GET", e))?;
    match res.status() {
        StatusCode::OK => Ok(Some(read_issue(res).await?)),
        StatusCode::NOT_FOUND => Ok(None),
        other => bail!("GET: HTTP {}", other.as_u16()),
    }
}

async fn create(client: &Client, url: &str, title: &str) -> Result<Issue> {
    let res = client
        .post(url)
        .json(&NewIssue { title })
        .send()
        .await
        .map_err(|e| http_error("invio POST", e))?;
    if res.status() != StatusCode::CREATED {
        bail!("POST: HTTP {}", res.status().as_u16());
    }
    read_issue(res).await
}

#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<()> {
    let client = Client::builder()
        .user_agent("issue-client/0.1")
        .connect_timeout(Duration::from_secs(1))
        .timeout(Duration::from_secs(3))
        .redirect(Policy::none())
        .build()?;

    let args: Vec<String> = std::env::args().skip(1).collect();
    let result = match args.as_slice() {
        [op, url] if op == "get" => find(&client, url).await?,
        [op, url, title] if op == "create" => Some(create(&client, url, title).await?),
        _ => bail!("uso: issue-client get URL | create URL TITOLO"),
    };
    match result {
        Some(issue) => println!("{}: {}", issue.id, issue.title),
        None => println!("non trovata"),
    }
    Ok(())
}
```

### Prova ripetibile su localhost

Dentro `issue-client` crea la cartella `demo` con questo solo file, `demo/issue.json`:

```json
{"id":7,"title":"Prima nota"}
```

Con Python 3 avvia il server statico dalla directory del progetto (su alcuni sistemi il comando è `python3`). Espone solo `demo` sul loopback; arrestalo con `Ctrl+C`.

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory demo
```

In un secondo terminale, sempre da `issue-client`, il primo comando deve stampare `7: Prima nota` e il secondo `non trovata`. Entrambi terminano con successo: l'assenza è un risultato previsto.

```sh
cargo run -- get http://127.0.0.1:8000/issue.json
```

```sh
cargo run -- get http://127.0.0.1:8000/assente.json
```

Il server statico **non implementa il POST**: con il comando seguente il risultato atteso è `POST: HTTP 501` con uscita non zero, non una nuova issue. Per provare la creazione riuscita serve un endpoint che accetti il JSON e restituisca `201` con `id` e `title`.

```sh
cargo run -- create http://127.0.0.1:8000/issues "Nuova nota"
```

## Errori comuni

- **Trattare un timeout come prova che l'operazione non è avvenuta.** Un POST potrebbe essere stato eseguito prima che la risposta andasse persa. Non ripeterlo alla cieca: serve un contratto di idempotenza del servizio. Per una GET, limita comunque i tentativi, distanziali e considera il budget complessivo.
- **Ritornare `None` per qualsiasi errore.** `404` e `503` non sono intercambiabili: solo il primo, in questa ricerca, dice al chiamante che può proseguire senza risultato.
- **Fidarsi del solo header `Content-Type`.** Può essere corretto con un corpo troncato o con uno schema diverso. Viceversa la deserializzazione del JSON non convalida da sola né l'header né le regole di dominio.
- **Mettere dettagli sensibili negli errori.** `without_url()` rimuove l'URL associato all'errore reqwest, non è una sanificazione generale. Non registrare automaticamente header di autenticazione, query, corpi o catene di errore non controllate.

## Fonti ufficiali

- [reqwest 0.12: Client, pool e condivisione](https://docs.rs/reqwest/0.12/reqwest/struct.Client.html)
- [ClientBuilder: timeout di connessione, tempo totale e redirect](https://docs.rs/reqwest/0.12/reqwest/struct.ClientBuilder.html)
- [Response: status, error_for_status, chunk e json](https://docs.rs/reqwest/0.12/reqwest/struct.Response.html)
- [Error: is_timeout e without_url](https://docs.rs/reqwest/0.12/reqwest/struct.Error.html)
- [RFC 9110: metodi idempotenti e ripetizione delle richieste](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/Async Await|Async Await]]
- [[Programmazione/Rust/Pagine/Runtime async Tokio e async-std|Runtime async Tokio e async-std]]
- [[Programmazione/Rust/Pagine/Serde e serializzazione|Serde e serializzazione]]
- [[Programmazione/Rust/Pagine/Error reporting|Error reporting]]
- [[Programmazione/Rust/Pagine/Tracing con tracing|Tracing con tracing]]
- [[Programmazione/Rust/Pagine/Web backend con axum|Web backend con axum]]

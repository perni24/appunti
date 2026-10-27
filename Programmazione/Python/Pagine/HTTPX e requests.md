---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - python
  - http
  - networking
aliases:
  - requests
  - HTTPX
  - Client HTTP Python
prerequisites: []
related: []
title: HTTPX e requests
---

# HTTPX e requests

## Sintesi

`requests` e un client HTTP sincrono. `httpx` offre client sync e async: in un'applicazione asincrona evita di bloccare l'event loop con I/O sincrono. Entrambi richiedono una gestione esplicita di errori, risorse e contratti delle risposte.

Baseline: CPython 3.12.10, **requests 2.34.2** e **httpx 0.28.1**. Qui il package e l'import sono `httpx`, non `httpx2`: sono distribuzioni distinte, anche se altri strumenti del vault usano il secondo nei loro test.

## Quando usarlo

- `requests.Session` per script e servizi sincroni.
- `httpx.Client` quando vuoi API HTTPX in codice sincrono.
- `httpx.AsyncClient` per applicazioni async con molte attese di rete.

Un client condiviso a livello applicativo riusa connessioni e configurazione; crearlo dentro ogni iterazione vanifica il pooling. Cookie e credenziali sono stato del client: non condividerli indiscriminatamente fra utenti.

## Come funziona

Una chiamata attraversa livelli diversi:

1. Connessione, TLS, scrittura e lettura: possono fallire prima di ricevere una risposta.
2. Status HTTP: una risposta ricevuta puo essere 404 o 500.
3. Formato: un 200 puo contenere HTML o JSON malformato.
4. Contratto: JSON valido non garantisce i campi richiesti.

`raise_for_status()` non controlla formato o schema. In Requests segnala 4xx/5xx; HTTPX segnala anche risposte non-2xx come un redirect non seguito. Requests normalmente segue i redirect per GET, HTTPX no: il demo li disabilita esplicitamente in entrambi.

## API / Sintassi

### Timeout, limiti e chiusura

- Requests non imposta timeout di default. La coppia `(connect, read)` non e una durata massima totale del download.
- HTTPX ha timeout distinti per connessione, lettura, scrittura e attesa nel pool; il default e basato su inattivita di rete.
- Un server che invia periodicamente piccoli pezzi puo prolungare una risposta oltre il numero passato come timeout.
- In asyncio una deadline esterna con `asyncio.timeout` limita l'operazione complessiva tramite cancellazione cooperativa. Non interrompe codice sincrono bloccante.
- Una risposta in streaming va consumata o chiusa per liberare la risorsa. Un context manager la chiude anche in caso di errore.

### Installazione

In un ambiente virtuale:

```bash
python -m pip install "requests==2.34.2" "httpx==0.28.1"
```

### api_clients.py

Tre client con lo stesso contratto: GET di un oggetto JSON con `id` intero positivo e `name` non vuoto. Sono wrapper per un endpoint fidato, **non proxy per URL arbitrari forniti dagli utenti**.

```python
import json
import httpx
import requests

MAX_BYTES = 1024 * 1024
HTTPX_TIMEOUT = httpx.Timeout(5.0, connect=2.0, pool=2.0)


def append_chunk(body: bytearray, chunk: bytes, limit: int) -> None:
    if len(body) + len(chunk) > limit:
        raise ValueError("Risposta troppo grande")
    body.extend(chunk)


def parse_user(content_type: str, body: bytes | bytearray) -> dict:
    media_type = content_type.split(";", 1)[0].strip().lower()
    if media_type != "application/json":
        raise ValueError("Atteso application/json")
    data = json.loads(bytes(body).decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("Atteso un oggetto JSON")
    if type(data.get("id")) is not int or data["id"] <= 0:
        raise ValueError("id non valido")
    name = data.get("name")
    if not isinstance(name, str) or not name.strip() or len(name) > 100:
        raise ValueError("name non valido")
    return {"id": data["id"], "name": name.strip()}


def get_user_requests(session, url, *, limit=MAX_BYTES):
    body = bytearray()
    with session.get(
        url,
        headers={"Accept": "application/json"},
        timeout=(2.0, 5.0),
        allow_redirects=False,
        stream=True,
    ) as response:
        response.raise_for_status()
        if response.status_code != 200:
            raise ValueError("Atteso status 200")
        for chunk in response.iter_content(chunk_size=8192):
            append_chunk(body, chunk, limit)
        return parse_user(response.headers.get("Content-Type", ""), body)


def get_user_httpx(client, url, *, limit=MAX_BYTES):
    body = bytearray()
    with client.stream("GET", url, follow_redirects=False) as response:
        response.raise_for_status()
        if response.status_code != 200:
            raise ValueError("Atteso status 200")
        for chunk in response.iter_bytes(chunk_size=8192):
            append_chunk(body, chunk, limit)
        return parse_user(response.headers.get("Content-Type", ""), body)


async def get_user_async(client, url, *, limit=MAX_BYTES):
    body = bytearray()
    async with client.stream("GET", url, follow_redirects=False) as response:
        response.raise_for_status()
        if response.status_code != 200:
            raise ValueError("Atteso status 200")
        async for chunk in response.aiter_bytes(chunk_size=8192):
            append_chunk(body, chunk, limit)
        return parse_user(response.headers.get("Content-Type", ""), body)
```

I wrapper HTTPX ricevono un client configurato dal chiamante, inclusi timeout. Il codice accetta soltanto `application/json` per contratto: per media type `application/problem+json` o vendor `+json` definisci una policy apposita.

Il limite riguarda i byte decodificati accumulati, non `Content-Length`, che puo mancare o descrivere dati compressi. Buffer del trasporto, decompressione e oggetti creati dal parser richiedono memoria ulteriore: **non e una protezione completa contro payload ostili**. Per servizi pubblici servono limiti ulteriori a monte e sul parsing.

## Esempio pratico

### http_demo.py

Nella stessa directory di `api_clients.py`. Avvia un server di prova sul solo loopback con porta effimera, chiama lo stesso endpoint con i tre client e chiude tutto. Non contatta servizi esterni; `http.server` non e un server di produzione.

```python
import asyncio
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import httpx
import requests
from api_clients import (
    HTTPX_TIMEOUT,
    get_user_requests,
    get_user_httpx,
    get_user_async,
)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/user":
            self.send_error(404)
            return
        body = b'{"id": 1, "name": "Alice"}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass


async def async_example(url):
    async with httpx.AsyncClient(
        timeout=HTTPX_TIMEOUT,
        trust_env=False,
    ) as client:
        async with asyncio.timeout(10):
            return await get_user_async(client, url)


def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    worker = threading.Thread(target=server.serve_forever)
    worker.start()
    try:
        url = f"http://127.0.0.1:{server.server_port}/user"
        with requests.Session() as session:
            session.trust_env = False
            first = get_user_requests(session, url)
        with httpx.Client(timeout=HTTPX_TIMEOUT, trust_env=False) as client:
            second = get_user_httpx(client, url)
        third = asyncio.run(async_example(url))
        assert first == second == third == {"id": 1, "name": "Alice"}
        print(first)
    finally:
        server.shutdown()
        server.server_close()
        worker.join()


if __name__ == "__main__":
    main()
```

```bash
python http_demo.py
```

`trust_env=False` isola la prova da proxy, certificati e altre configurazioni ambientali consultate dalla libreria; in produzione e una scelta da valutare, non una raccomandazione universale. La verifica TLS resta attiva per HTTPS: il demo usa HTTP solo su loopback.

### post_json.py

Esempio di funzione per un contratto distinto: POST che deve creare una risorsa e restituire 201 con JSON. Non viene chiamata dal demo GET; richiede un endpoint compatibile e un payload gia validato. La risposta qui viene caricata tutta in memoria: usala solo per risposte piccole e fidate.

```python
def create_remote_user(session, url, payload):
    with session.post(
        url,
        json=payload,
        timeout=(2.0, 5.0),
        allow_redirects=False,
    ) as response:
        response.raise_for_status()
        if response.status_code != 201:
            raise ValueError("Atteso status 201")
        return response.json()
```

`json=` serializza e imposta il Content-Type; `data=` non e equivalente. Dopo il parsing, valida anche lo schema dell'output del servizio. Token e credenziali arrivano dalla configurazione, mai dal codice versionato o dai log.

## Varianti

### Errori da distinguere

| Livello                      | Requests                                                                                            | HTTPX                                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Status non accettato         | `HTTPError` per 4xx/5xx                                                                             | `HTTPStatusError` per non-2xx                |
| Timeout                      | `Timeout` e sottoclassi; in alcuni percorsi streaming un read timeout emerge come `ConnectionError` | `TimeoutException`, con sottoclassi per fase |
| Connessione/trasporto        | `ConnectionError`, altre `RequestException`                                                         | `RequestError` e sottoclassi                 |
| Parsing o contratto del demo | `ValueError`, inclusi errori JSON/Unicode pertinenti                                                | Stessa policy del parser condiviso           |

Non catturare tutto per restituire una lista vuota: confonderesti un errore di rete con una risposta valida senza risultati. Decidi quali errori ritentare, mostrare o propagare; evita log contenenti URL con segreti, Authorization o interi payload.

### Retry, concorrenza e sicurezza

- Un timeout dopo l'invio non dimostra che il server non abbia eseguito l'operazione. Ritentare POST puo duplicare effetti; serve un contratto di idempotenza lato server.
- Backoff, jitter, numero massimo di tentativi, deadline complessiva e `Retry-After` vanno progettati insieme. I retry del transport HTTPX non coprono automaticamente ogni status HTTP o errore di lettura.
- Il pool limita connessioni, non il numero di task creati: limita anche la concorrenza applicativa. Non lanciare milioni di coroutine tutte insieme.
- Non usare `requests` direttamente nell'event loop. `asyncio.to_thread` puo integrare codice sync, ma cancellare l'attesa non uccide la richiesta nel thread.
- Per URL controllati dall'utente servono difese SSRF: policy di destinazione, redirect e indirizzi risolti. `follow_redirects=False` da solo non basta.
- Non disabilitare TLS con `verify=False` per aggirare un problema di certificati.
- HTTP/2 e un'opzione HTTPX con dipendenze e supporto del server; non e garantito dal solo uso di AsyncClient.

## Errori comuni

- Timeout interpretato come tempo massimo dell'intero lavoro.
- Client ricreato nel loop o risposta streaming lasciata aperta.
- Redirect seguito verso una destinazione non prevista.
- 200 o JSON valido scambiato per successo applicativo.
- Retry automatico su operazioni non idempotenti.
- Esempio con `async with` al livello principale di uno script: usa `async def` e `asyncio.run`, come sopra.

## Checklist

- Client sync/async coerente con il chiamante?
- Timeout per fase e budget complessivo dichiarati?
- Status, tipo di contenuto, dimensioni e schema controllati?
- Client e risposte chiusi anche in caso di errore?
- Retry e credenziali compatibili con la destinazione?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Networking base|Networking base]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/FastAPI|FastAPI]]
- [[Programmazione/Python/Pagine/Pydantic|Pydantic]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]

## Fonti

- [Requests: quickstart, errori e timeout](https://requests.readthedocs.io/en/latest/user/quickstart/).
- [Requests: sessioni, TLS e streaming](https://requests.readthedocs.io/en/latest/user/advanced/).
- [HTTPX: timeout](https://www.python-httpx.org/advanced/timeouts/).
- [HTTPX: client e pooling](https://www.python-httpx.org/advanced/clients/).
- [HTTPX: async e streaming](https://www.python-httpx.org/async/).
- [Differenze fra HTTPX e Requests](https://www.python-httpx.org/compatibility/).
- [HTTPX: trasporti e retry](https://www.python-httpx.org/advanced/transports/).
- [HTTPX: gerarchia delle eccezioni](https://www.python-httpx.org/exceptions/).

---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - python
  - web
  - asgi
aliases:
  - Starlette
  - ASGI Starlette
prerequisites: []
related: []
title: Starlette
---

# Starlette

## Sintesi

Starlette e un framework **ASGI**: offre routing HTTP/WebSocket, request e response, middleware e gestione del ciclo di vita. Non aggiunge automaticamente schema dei payload, dependency injection applicativa o OpenAPI come FastAPI.

Baseline: **CPython 3.12.10, Starlette 1.10.0, Uvicorn 0.54.0**. Il test client usa **httpx2 2.16.0**; il client HTTP del lifespan usa **httpx 0.28.1**. Sono pacchetti distinti: nella versione provata il fallback del TestClient a httpx e deprecato.

## Quando usarlo

- Componenti ASGI e servizi con controllo diretto su route e risposte.
- Applicazioni con WebSocket o middleware specifici.
- Backend che non richiedono lo strato di validazione/OpenAPI di FastAPI.

Scegli FastAPI se vuoi dichiarare contratti tipizzati e dipendenze; non significa che validazione e sicurezza siano automatiche in qualsiasi codice.

## Come funziona

ASGI scambia scope e messaggi receive/send tra server e applicazione. Starlette presenta queste operazioni tramite oggetti piu comodi.

- Una route puo avere una funzione **sync o async**. Non sono obbligatori solo endpoint async.
- Gli endpoint sync sono eseguiti in un thread pool; una funzione bloccante chiamata direttamente dentro async def resta bloccante.
- Il lifespan prepara risorse prima delle richieste e le chiude allo shutdown.
- Ogni processo worker ha il proprio lifespan, client e memoria: non sono un singleton distribuito.
- Il routing controlla percorso e metodo; request.json() decodifica JSON ma non controlla il modello applicativo.

Il pool ha capacita limitata e condivisa con altre attivita. Aumentarla non rende una libreria thread-safe ne trasforma lavoro CPU-bound in I/O asincrono.

## API / Sintassi

| API                                      | Uso e limite                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `Route("/users/{user_id:int}", handler)` | Il converter consegna gia un int; valori non corrispondenti non selezionano la route      |
| `JSONResponse(data, status_code=...)`    | Risposta esplicita: un normale dict non sostituisce la response                           |
| `Mount`                                  | Compone sott'applicazioni o static files; considera prefissi e URL reverse                |
| `Request`                                | Path, query, header e corpo; il corpo consumato come stream non e liberamente rileggibile |
| `WebSocketRoute`                         | Handshake e protocollo separati dalle normali route HTTP                                  |
| `TestClient`                             | Trasporto in-process; usa il context manager per eseguire il lifespan                     |

## Esempio pratico

Directory separata e virtualenv attivo:

```powershell
python -m pip install "starlette==1.10.0" "uvicorn==0.54.0" "httpx==0.28.1" "httpx2==2.16.0" "websockets==17.3"
```

### starlette_app.py

```python
from contextlib import asynccontextmanager

import httpx
from starlette.applications import Starlette
from starlette.exceptions import HTTPException
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from starlette.routing import Route, WebSocketRoute
from starlette.websockets import WebSocketDisconnect

DEMO_ORIGIN = "http://localhost:5173"


@asynccontextmanager
async def lifespan(app):
    async with httpx.AsyncClient(timeout=5.0, trust_env=False) as client:
        app.state.http_client = client
        yield {"http_client": client}


async def health(request):
    return JSONResponse({"ready": not request.state.http_client.is_closed})


async def user_detail(request):
    user_id = request.path_params["user_id"]
    if user_id != 1:
        raise HTTPException(404, "user not found")
    return JSONResponse({"id": user_id, "display_name": "Demo"})


async def http_error(request, error):
    return JSONResponse(
        {"error": error.detail},
        status_code=error.status_code,
        headers=error.headers,
    )


async def echo(websocket):
    if websocket.headers.get("origin") != DEMO_ORIGIN:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                break
            text = message.get("text")
            if text is None:
                await websocket.close(code=1003)
                break
            if len(text.encode("utf-8")) > 1024:
                await websocket.close(code=1009)
                break
            await websocket.send_text(text)
    except WebSocketDisconnect:
        pass


def create_app():
    return Starlette(
        debug=False,
        lifespan=lifespan,
        routes=[
            Route("/health", health),
            Route("/users/{user_id:int}", user_detail),
            WebSocketRoute("/ws", echo),
        ],
        exception_handlers={HTTPException: http_error},
    )


core_app = create_app()
app = CORSMiddleware(
    core_app,
    allow_origins=[DEMO_ORIGIN],
    allow_methods=["GET"],
    allow_headers=[],
    allow_credentials=False,
)
```

Il client viene realmente aperto/chiuso ma il demo **non chiama servizi esterni**: ready segnala soltanto l'inizializzazione locale, non la disponibilita della rete. Lo state passato alle richieste e una copia superficiale: il client contenuto resta condiviso nello stesso lifespan.

L'echo e una dimostrazione, non una chat autenticata. Controlla Origin separatamente per i WebSocket; CORSMiddleware riguarda HTTP e non autorizza il socket. Un client non browser puo costruire l'header: Origin non e una credenziale.

Il controllo dei 1024 byte avviene dopo ricezione del messaggio, quindi non limita da solo la memoria usata dal server per leggerlo. Configura anche limiti del protocollo, connessioni, timeout e rate limit nel deployment. Frame binari sono rifiutati con 1003, testo eccessivo con 1009; la disconnessione ordinaria non e un errore da mascherare con un catch generico.

### verify_starlette.py

```python
from starlette.testclient import TestClient
from starlette_app import DEMO_ORIGIN, app, core_app

with TestClient(app) as client:
    assert client.get("/health").json() == {"ready": True}
    assert client.get("/users/nope").status_code == 404
    assert client.get("/users/2").status_code == 404
    response = client.get("/users/1", headers={"Origin": DEMO_ORIGIN})
    assert response.json()["id"] == 1
    assert response.headers["access-control-allow-origin"] == DEMO_ORIGIN
    with client.websocket_connect("/ws", headers={"Origin": DEMO_ORIGIN}) as ws:
        ws.send_text("ciao")
        assert ws.receive_text() == "ciao"
assert core_app.state.http_client.is_closed
print("Starlette demo ok")
```

```powershell
python verify_starlette.py
```

Avvio locale, senza reload o worker aggiuntivi:

```powershell
python -m uvicorn starlette_app:app --host 127.0.0.1 --port 8000 --ws websockets --ws-max-size 4096
```

Usa una porta libera. Il limite del server e aggiuntivo a quello applicativo; questa configurazione non e un piano di produzione.

## Varianti

### Middleware e CORS

L'involucro CORS esterno consente di applicare gli header anche alle risposte di errore dell'app interna. Origini, metodi e credenziali vanno scelti esplicitamente: localhost e 127.0.0.1, o porte diverse, sono origini diverse.

CORS limita la lettura da parte del browser, non impedisce a tutti i client di inviare richieste. I test in-process controllano gli header, non certificano l'enforcement di un browser.

Per middleware personalizzati considera ASGI puro; BaseHTTPMiddleware ha limiti sulla propagazione dei contextvars. Non conservare dati di una richiesta in attributi condivisi del middleware.

### Background tasks

BackgroundTask/BackgroundTasks eseguono lavoro **nello stesso processo**, dopo l'invio della risposta. Non sono una coda durabile: un crash puo perdere lavoro, e un errore non puo cambiare una risposta gia inviata. Le task multiple sono ordinate; il fallimento di una impedisce le successive. Per lavori critici servono persistenza, retry e idempotenza espliciti.

## Errori comuni

- Restituire dict da un handler Starlette come se fosse FastAPI.
- Scrivere async def e poi usare requests o I/O bloccante direttamente.
- Creare un nuovo AsyncClient a ogni iterazione o riusarlo dopo la chiusura.
- Omettere il context manager di TestClient e credere di aver provato startup/shutdown.
- Confondere il converter int con un controllo di autorizzazione.
- Ignorare body limit, schema, backpressure, errori e disconnessioni.
- Rendere permissivo CORS per risolvere un errore senza capire le origini coinvolte.

## Checklist

- Sync/async corrispondono alle librerie effettivamente chiamate?
- Risorse e stato hanno proprietario e durata espliciti?
- Sono provati lifespan, 404/405, chiusura WebSocket e errori?
- CORS, autenticazione e autorizzazione sono distinti?
- Il processo puo perdere il lavoro post-risposta senza conseguenze?
- Le versioni di Starlette, client di test e server sono compatibili?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/FastAPI|FastAPI]]
- [[Programmazione/Python/Pagine/Networking base|Networking base]]
- [[Programmazione/Python/Pagine/HTTPX e requests|HTTPX e requests]]
- [[Programmazione/Python/Pagine/Context Managers|Context managers]]

## Fonti

- [Starlette: routing](https://starlette.dev/routing/), [thread pool](https://starlette.dev/threadpool/).
- [Lifespan e state](https://starlette.dev/lifespan/), [TestClient e dipendenze](https://starlette.dev/testclient/).
- [Middleware e CORS](https://starlette.dev/middleware/).
- [WebSocket](https://starlette.dev/websockets/), [background tasks](https://starlette.dev/background/).
- [Uvicorn: impostazioni e limiti](https://uvicorn.dev/settings/).

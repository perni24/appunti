---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [programmazione, python, web, asgi]
aliases: [Starlette, ASGI Starlette]
prerequisites: []
related: []
---

# Starlette

## Sintesi

Starlette e un framework ASGI leggero per costruire servizi web asincroni in Python. Fornisce routing, request/response, middleware, WebSocket, static files e background tasks.

E anche una base importante per FastAPI.

## Quando usarlo

Usa Starlette quando:

- vuoi controllo diretto sul layer ASGI;
- devi costruire servizi asincroni leggeri;
- ti servono WebSocket o middleware custom;
- non vuoi la validazione automatica di FastAPI;
- stai costruendo componenti framework-level.

Per API business con modelli e OpenAPI automatico, FastAPI e spesso piu comodo.

## Come funziona

App minima:

```python
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route


async def homepage(request):
    return JSONResponse({"status": "ok"})


app = Starlette(routes=[Route("/", homepage)])
```

Le view sono callable async che ricevono una request e restituiscono una response.

## API / Sintassi

Route:

```python
routes = [
    Route("/", homepage),
]
```

Middleware:

```python
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

middleware = [
    Middleware(CORSMiddleware, allow_origins=["*"]),
]
```

WebSocket:

```python
async def websocket_endpoint(websocket):
    await websocket.accept()
    await websocket.send_text("hello")
    await websocket.close()
```

## Esempio pratico

Endpoint con path parameter:

```python
from starlette.responses import JSONResponse
from starlette.routing import Route


async def user_detail(request):
    user_id = int(request.path_params["user_id"])
    return JSONResponse({"id": user_id})


routes = [
    Route("/users/{user_id:int}", user_detail),
]
```

## Varianti

- **ASGI app leggera**: servizi piccoli e custom.
- **Middleware custom**: controllo fine del ciclo request/response.
- **WebSocket**: comunicazione bidirezionale.
- **Background tasks**: lavoro leggero dopo la risposta.
- **Mount**: comporre sott'applicazioni.
- **FastAPI sopra Starlette**: layer piu alto con validazione e OpenAPI.

## Errori comuni

- Usare Starlette quando FastAPI darebbe validazione e documentazione gratis.
- Bloccare l'event loop con codice sincrono pesante.
- Non gestire lifespan, startup e shutdown.
- Non validare input quando non c'e Pydantic automatico.
- Scrivere middleware che consuma body o response in modo non previsto.

## Checklist

- Serve davvero controllo ASGI diretto?
- Il codice async evita chiamate bloccanti?
- Input e output sono validati altrove?
- Middleware e lifespan sono testati?
- FastAPI sarebbe piu produttivo?
- WebSocket e background task hanno gestione errori?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Asyncio]]
- [[FastAPI]]
- [[Networking base]]
- [[HTTPX e requests]]

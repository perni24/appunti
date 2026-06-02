---
date: 2026-06-02
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - python
  - web
  - asgi
aliases: []
prerequisites: []
related: []
---

# Starlette

## Sintesi

**Starlette** e un framework ASGI leggero per costruire servizi web asincroni in Python.

## Quando usarlo

- API ASGI leggere.
- Middleware custom.
- WebSocket.
- Servizi asincroni senza layer di validazione automatico.

## Come funziona

### Concetto chiave
Starlette fornisce routing, middleware, request/response, WebSocket e background task. E anche una base importante per [[Programmazione/Python/Pagine/FastAPI|FastAPI]].

```python
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route

async def homepage(request):
    return JSONResponse({"status": "ok"})

app = Starlette(routes=[Route("/", homepage)])
```

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/FastAPI|FastAPI]]
- [[Programmazione/Python/Pagine/Networking base|Networking base]]

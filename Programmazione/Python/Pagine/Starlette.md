---
date: 2026-05-20
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

## Concetto chiave

Starlette fornisce routing, middleware, request/response, WebSocket e background task. E anche una base importante per [[Programmazione/Python/Pagine/FastAPI|FastAPI]].

```python
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route

async def homepage(request):
    return JSONResponse({"status": "ok"})

app = Starlette(routes=[Route("/", homepage)])
```

## Quando usarlo

- API ASGI leggere.
- Middleware custom.
- WebSocket.
- Servizi asincroni senza layer di validazione automatico.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/FastAPI|FastAPI]]
- [[Programmazione/Python/Pagine/Networking base|Networking base]]



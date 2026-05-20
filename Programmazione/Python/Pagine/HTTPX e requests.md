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
  - http
  - networking
aliases: []
prerequisites: []
related: []
---

# HTTPX e requests

## Sintesi

`requests` e `HTTPX` sono librerie Python per chiamare API HTTP. `requests` e sincrona e semplice; `HTTPX` supporta sia uso sincrono sia asincrono.

## requests

```python
import requests

response = requests.get("https://api.example.com/users", timeout=5)
response.raise_for_status()
data = response.json()
```

## HTTPX async

```python
import httpx

async with httpx.AsyncClient(timeout=5) as client:
    response = await client.get("https://api.example.com/users")
    response.raise_for_status()
```

## Errori comuni

- Non impostare timeout.
- Non chiamare `raise_for_status`.
- Usare `requests` dentro funzioni async.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

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

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Python/Pagine/Networking base|Networking base]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/FastAPI|FastAPI]]



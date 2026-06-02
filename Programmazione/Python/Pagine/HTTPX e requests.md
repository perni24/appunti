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
  - http
  - networking
aliases: []
prerequisites: []
related: []
---

# HTTPX e requests

## Sintesi

`requests` e `HTTPX` sono librerie Python per chiamare API HTTP. `requests` e sincrona e semplice; `HTTPX` supporta sia uso sincrono sia asincrono.

## Quando usarlo

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Come funziona

### requests
```python
import requests

response = requests.get("https://api.example.com/users", timeout=5)
response.raise_for_status()
data = response.json()
```
### HTTPX async
```python
import httpx

async with httpx.AsyncClient(timeout=5) as client:
    response = await client.get("https://api.example.com/users")
    response.raise_for_status()
```

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

- Non impostare timeout.
- Non chiamare `raise_for_status`.
- Usare `requests` dentro funzioni async.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Networking base|Networking base]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/FastAPI|FastAPI]]

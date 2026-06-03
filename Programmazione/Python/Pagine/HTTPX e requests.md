---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [programmazione, python, http, networking]
aliases: [requests, HTTPX, Client HTTP Python]
prerequisites: []
related: []
---

# HTTPX e requests

## Sintesi

`requests` e `HTTPX` sono librerie Python per chiamare API HTTP. `requests` e semplice e sincrona; `HTTPX` offre API sincrona e asincrona, supporto moderno a timeout, client persistenti e integrazione con async.

## Quando usarlo

Usa `requests` quando:

- scrivi script sincroni;
- vuoi una API semplice e stabile;
- non hai bisogno di async.

Usa `HTTPX` quando:

- lavori in applicazioni async;
- vuoi usare lo stesso stile sync e async;
- devi integrare client HTTP in FastAPI o servizi asincroni;
- vuoi controllo piu esplicito su client, timeout e trasporto.

## Come funziona

`requests`:

```python
import requests

response = requests.get("https://api.example.com/users", timeout=5)
response.raise_for_status()
data = response.json()
```

`HTTPX` asincrono:

```python
import httpx


async with httpx.AsyncClient(timeout=5) as client:
    response = await client.get("https://api.example.com/users")
    response.raise_for_status()
    data = response.json()
```

## API / Sintassi

Client persistente con `requests`:

```python
import requests

with requests.Session() as session:
    response = session.get("https://api.example.com/users", timeout=5)
```

Client persistente con `HTTPX`:

```python
import httpx

with httpx.Client(timeout=5) as client:
    response = client.get("https://api.example.com/users")
```

POST JSON:

```python
payload = {"email": "luca@example.com"}
response = requests.post("https://api.example.com/users", json=payload, timeout=5)
response.raise_for_status()
```

## Esempio pratico

Funzione robusta per leggere JSON:

```python
import requests


def fetch_json(url):
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return response.json()
```

Versione async con HTTPX:

```python
import httpx


async def fetch_json(url):
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()
```

## Varianti

- **`requests.get/post/...`**: uso sincrono diretto.
- **`requests.Session`**: riuso connessioni e configurazione.
- **`httpx.Client`**: client HTTPX sincrono.
- **`httpx.AsyncClient`**: client asincrono.
- **Timeout**: obbligatori per evitare processi bloccati.
- **Retry/backoff**: spesso da gestire a livello applicativo o con librerie dedicate.

## Errori comuni

- Non impostare timeout.
- Non chiamare `raise_for_status()`.
- Usare `requests` dentro funzioni async, bloccando l'event loop.
- Creare un nuovo client per ogni richiesta in loop intensivi.
- Loggare token o header sensibili.
- Non distinguere errori HTTP, timeout e problemi di connessione.

## Checklist

- Il codice e sync o async?
- Il timeout e impostato?
- Gli errori HTTP vengono gestiti?
- Serve un client persistente?
- Le credenziali non finiscono nei log?
- Sono previsti retry solo dove sono sicuri?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Networking base]]
- [[Asyncio]]
- [[FastAPI]]
- [[Error Handling]]

---
date: 2026-07-30
area: Programmazione
topic: Promemoria Python
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [python, promemoria, http, requests, httpx]
aliases: [Cheatsheet HTTP Python]
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/HTTPX e requests]]"
---

# Python - Richieste HTTP

## GET con Requests

```python
import requests

response = requests.get(
    "https://api.example.com/entities",
    params={"page": 1},
    timeout=10,
)
response.raise_for_status()

data = response.json()
```

## POST JSON

```python
response = requests.post(
    "https://api.example.com/entities",
    json={"name": "Example"},
    headers={"Accept": "application/json"},
    timeout=10,
)
response.raise_for_status()
```

## Autenticazione

```python
headers = {
    "Authorization": f"Bearer {token}",
}

response = requests.get(url, headers=headers, timeout=10)
```

## Sessione

```python
with requests.Session() as session:
    session.headers.update({"Accept": "application/json"})
    response = session.get(url, timeout=10)
    response.raise_for_status()
```

## Gestire gli errori

```python
try:
    response = requests.get(url, timeout=10)
    response.raise_for_status()
except requests.Timeout:
    print("Timeout")
except requests.HTTPError as error:
    print(error.response.status_code)
except requests.RequestException as error:
    print(error)
```

Impostare sempre un timeout esplicito.

## HTTPX sincrono

```python
import httpx

with httpx.Client(base_url="https://api.example.com", timeout=10) as client:
    response = client.get("/entities")
    response.raise_for_status()
    data = response.json()
```

## HTTPX asincrono

```python
import httpx

async with httpx.AsyncClient(
    base_url="https://api.example.com",
    timeout=10,
) as client:
    response = await client.get("/entities")
    response.raise_for_status()
    data = response.json()
```

## Scaricare a blocchi

```python
with requests.get(url, stream=True, timeout=30) as response:
    response.raise_for_status()

    with open("download.bin", "wb") as file:
        for chunk in response.iter_content(chunk_size=8192):
            file.write(chunk)
```

## Approfondimento

- [[Programmazione/Python/Pagine/HTTPX e requests]]
- [[Programmazione/Python/Pagine/Networking base]]
- [[Programmazione/Python/Pagine/Asyncio]]

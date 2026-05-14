---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, networking, http, sockets, standard-library]
aliases: [Networking Python]
prerequisites: [Error Handling, Context Managers]
related: [Standard Library, Asyncio]
---

# Networking base

## Sintesi

Python include moduli standard per networking HTTP e socket.

Per uso applicativo moderno spesso si usano librerie esterne, ma conoscere le API native aiuta a capire il modello di base.

## HTTP con urllib

```python
from urllib.request import urlopen

with urlopen("https://example.com") as response:
    body = response.read()
```

`urllib` e disponibile nella standard library, ma per progetti reali spesso si preferiscono librerie piu ergonomiche.

## Socket TCP base

```python
import socket

with socket.create_connection(("example.com", 80), timeout=5) as sock:
    sock.sendall(b"GET / HTTP/1.0\r\nHost: example.com\r\n\r\n")
    data = sock.recv(1024)
```

I socket lavorano con byte.

## Timeout

Imposta sempre timeout su rete e I/O esterno.

```python
socket.create_connection(("example.com", 80), timeout=5)
```

## Errori comuni

- Non impostare timeout.
- Confondere stringhe e byte nei socket.
- Non chiudere connessioni.
- Gestire protocolli complessi manualmente senza motivo.

## Collegamenti

- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/Context Managers|Context Managers]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]

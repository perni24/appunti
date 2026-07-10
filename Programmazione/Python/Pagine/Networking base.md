---
date: 2026-06-03
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

Python include moduli standard per networking HTTP e socket. Per applicazioni moderne spesso si usano librerie esterne piu ergonomiche, ma conoscere le API base aiuta a capire timeout, byte, connessioni e gestione errori.

## Quando usarlo

Studia o usa networking base quando:

- vuoi capire come funzionano richieste HTTP e socket;
- devi fare una richiesta semplice senza dipendenze esterne;
- devi integrare codice legacy;
- devi diagnosticare problemi di rete;
- vuoi capire cosa astraggono librerie come `requests`, `httpx` o framework async.

Per applicazioni reali, valuta librerie piu comode e robuste.

## Come funziona

HTTP con `urllib`:

```python
from urllib.request import urlopen

with urlopen("https://example.com", timeout=5) as response:
    body = response.read()
```

Socket TCP:

```python
import socket

with socket.create_connection(("example.com", 80), timeout=5) as sock:
    sock.sendall(b"GET / HTTP/1.0\r\nHost: example.com\r\n\r\n")
    data = sock.recv(1024)
```

I socket lavorano con byte, non con stringhe Unicode.

## API / Sintassi

Timeout:

```python
socket.create_connection(("example.com", 80), timeout=5)
```

Decodifica byte:

```python
text = data.decode("utf-8", errors="replace")
```

Gestione errori:

```python
import socket

try:
    with socket.create_connection(("example.com", 80), timeout=5) as sock:
        sock.sendall(b"GET / HTTP/1.0\r\nHost: example.com\r\n\r\n")
except TimeoutError:
    print("Timeout di connessione")
except OSError as error:
    print(f"Errore di rete: {error}")
```

## Esempio pratico

Controllare se una porta TCP e raggiungibile:

```python
import socket


def is_port_open(host, port, timeout=3):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


print(is_port_open("example.com", 80))
```

Questo tipo di funzione e utile in script diagnostici, non come sostituto di client HTTP completi.

## Varianti

- **`urllib`**: HTTP nella standard library.
- **`socket`**: networking TCP/UDP a basso livello.
- **`ssl`**: connessioni cifrate.
- **`http.client`**: client HTTP piu basso livello.
- **`requests`**: libreria esterna molto usata per HTTP sincrono.
- **`httpx`**: client moderno con supporto sync e async.
- **`asyncio`**: networking asincrono.

## Errori comuni

- Non impostare timeout.
- Confondere stringhe e byte.
- Non chiudere connessioni.
- Gestire protocolli complessi manualmente senza motivo.
- Non considerare retry e backoff.
- Ignorare errori DNS, timeout, TLS e connessioni rifiutate.
- Usare socket raw quando una libreria HTTP sarebbe piu sicura.

## Checklist

- Serve davvero networking low-level?
- Il timeout e impostato?
- Byte e stringhe sono convertiti esplicitamente?
- Le connessioni vengono chiuse con `with`?
- Gli errori di rete sono gestiti?
- Una libreria come `httpx` sarebbe piu adatta?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Asyncio]]
- [[HTTPX e requests]]
- [[Context Managers]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Standard Library]]

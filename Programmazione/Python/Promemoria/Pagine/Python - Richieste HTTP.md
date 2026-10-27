---
date: 2026-07-30
area: Programmazione
topic: Promemoria Python
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - python
  - promemoria
  - http
  - requests
  - httpx
aliases:
  - Cheatsheet HTTP Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/HTTPX e requests]]"
title: Python - Richieste HTTP
---

# Python - Richieste HTTP

## Obiettivo

Richiamare la sintassi dei client HTTP senza confondere trasporto, status, JSON e validazione. Teoria: [[Programmazione/Python/Pagine/HTTPX e requests|HTTPX e requests]].

Baseline verificata: CPython **3.12.10**, Requests **2.34.2**, HTTPX **0.28.1** (package `httpx`, non `httpx2`).

## Quando usarlo

- Requests o HTTPX sync per script sincroni.
- HTTPX async quando il chiamante usa gia asyncio.
- Streaming per evitare di caricare un download interamente in memoria.

## Procedura

1. Usa un virtualenv con il client installato, un endpoint fidato e il contratto della sua API.
2. Copia il blocco necessario: ogni funzione ha i propri import e riceve URL/dati dal chiamante. **Definirla non invia richieste**; invocarla contatta il servizio, e un POST puo modificarlo.
3. Adatta status atteso e schema, imposta timeout e chiudi client/risposte.

Per riprodurre la baseline in un ambiente dedicato; i pin non sono un lockfile completo:

```text
python -m pip install "requests==2.34.2" "httpx==0.28.1"
```

Gli esempi JSON leggono risposte piccole e fidate senza un limite di dimensione. Validane i campi prima di usarli: [[Programmazione/Python/Promemoria/Pagine/Python - JSON e CSV|JSON e CSV]]. I wrapper con limiti aggiuntivi sono nella nota teorica.

## Snippet

### GET con Requests

```python
import requests


def get_entities(url, page=1):
    with requests.get(
        url,
        params={"page": page},
        headers={"Accept": "application/json"},
        timeout=(2, 10),
        allow_redirects=False,
    ) as response:
        response.raise_for_status()
        if response.status_code != 200:
            raise ValueError("Expected status 200")
        return response.json()
```

`params=` codifica la query; non concatenare manualmente valori all'URL. `Accept` esprime una preferenza, non prova il formato ricevuto. Un 200 puo contenere JSON invalido o dati fuori contratto.

### POST JSON

```python
import requests


def create_entity(url, payload):
    with requests.post(
        url,
        json=payload,
        headers={"Accept": "application/json"},
        timeout=(2, 10),
        allow_redirects=False,
    ) as response:
        response.raise_for_status()
        if response.status_code != 201:
            raise ValueError("Expected status 201")
        return response.json()
```

Contratto del demo: **201 con JSON**, non 200/202/204. `json=` serializza e imposta Content-Type; `data=` non e equivalente. Non ritentare un POST alla cieca: anche dopo un timeout il server potrebbe averlo eseguito.

### Autenticazione Bearer

```python
import requests


def get_private_json(url, token):
    with requests.Session() as session:
        session.trust_env = False
        with session.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=(2, 10),
            allow_redirects=False,
        ) as response:
            response.raise_for_status()
            if response.status_code != 200:
                raise ValueError("Expected status 200")
            return response.json()
```

Passa un token dalla configurazione, **mai scritto nel sorgente**, verso un'origine HTTPS verificata. Qui `trust_env=False` evita anche l'autenticazione implicita da `.netrc`, che puo prevalere sull'header; disabilita pero anche proxy e CA bundle da ambiente. Se ti servono, configura esplicitamente autenticazione/trasporto: non copiare questa policy alla cieca. TLS non viene disabilitato.

### Riutilizzare una sessione

```python
import requests


def get_two_pages(url):
    pages = []
    with requests.Session() as session:
        session.headers.update({"Accept": "application/json"})
        for page in (1, 2):
            with session.get(
                url, params={"page": page},
                timeout=(2, 10), allow_redirects=False,
            ) as response:
                response.raise_for_status()
                if response.status_code != 200:
                    raise ValueError("Expected status 200")
                pages.append(response.json())
    return pages
```

Una sessione riusa connessioni, header e cookie: non crearla a ogni iterazione e non condividere credenziali tra utenti. Il risultato contiene **due risposte**, non una lista automaticamente appiattita; non e una paginazione generica.

### Gestire gli errori Requests

```python
import requests


def get_json_checked(url):
    try:
        with requests.get(
            url, timeout=(2, 10), allow_redirects=False,
        ) as response:
            response.raise_for_status()
            if response.status_code != 200:
                raise ValueError("Expected status 200")
            return response.json()
    except requests.Timeout:
        raise RuntimeError("Request timed out") from None
    except requests.exceptions.JSONDecodeError:
        raise RuntimeError("Invalid JSON response") from None
    except requests.HTTPError as error:
        raise RuntimeError(f"HTTP {error.response.status_code}") from None
    except requests.RequestException:
        raise RuntimeError("Request failed") from None
```

Ordine importante: l'errore JSON di Requests e anche una `RequestException`. Il wrapper propaga errori espliciti, non restituisce `[]` in caso di guasto; il `ValueError` sullo status inatteso resta distinto. Messaggi generici per non riportare URL/token; non e una strategia completa di logging.

### HTTPX sincrono

```python
import httpx


def get_json_sync(url):
    timeout = httpx.Timeout(10, connect=2, pool=2)
    with httpx.Client(timeout=timeout, follow_redirects=False) as client:
        response = client.get(url)
        response.raise_for_status()
        if response.status_code != 200:
            raise ValueError("Expected status 200")
        return response.json()
```

Per piu chiamate, sposta la durata del client al livello del chiamante. Requests segue normalmente i redirect GET, HTTPX no; qui li disabilitiamo esplicitamente. `raise_for_status()` in Requests segnala 4xx/5xx, in HTTPX anche altri status non-2xx.

### HTTPX asincrono

```python
import asyncio
import httpx


async def get_json_async(url):
    timeout = httpx.Timeout(10, connect=2, pool=2)
    async with asyncio.timeout(15):
        async with httpx.AsyncClient(
            timeout=timeout, follow_redirects=False,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()
            if response.status_code != 200:
                raise ValueError("Expected status 200")
            return response.json()
```

Nel chiamante async usa `await get_json_async(url)`; al confine di uno script sincrono usa `asyncio.run(get_json_async(url))`, dopo aver definito l'URL. Non usare `asyncio.run` dentro un event loop gia attivo.

Il timeout esterno richiede Python 3.11+ ed e cooperativo: non interrompe immediatamente codice sincrono, per esempio un parsing lungo. HTTPX distingue `TimeoutException`, `RequestError` e `HTTPStatusError`; la deadline asyncio solleva `TimeoutError`.

## Adattamenti comuni

### Scaricare a blocchi

```python
from pathlib import Path
import requests


def download(url, destination, max_bytes=1024 * 1024):
    if type(max_bytes) is not int or max_bytes <= 0:
        raise ValueError("Expected a positive byte limit")
    target = Path(destination)
    total = 0
    with requests.get(
        url, stream=True, timeout=(2, 10), allow_redirects=False,
    ) as response:
        response.raise_for_status()
        if response.status_code != 200:
            raise ValueError("Expected status 200")
        with target.open("xb") as file:
            for chunk in response.iter_content(chunk_size=8192):
                if total + len(chunk) > max_bytes:
                    raise ValueError("Download too large")
                file.write(chunk)
                total += len(chunk)
    return total
```

**Crea un file**, richiede il genitore esistente e rifiuta una destinazione gia presente (`xb`). Se fallisce dopo l'apertura puo lasciare un file parziale: non e un salvataggio atomico, e il chiamante deve gestirlo senza cancellare altri file. Usa una cartella di prova e una destinazione fidata.

Il limite riguarda i byte decodificati scritti, non tutti i buffer di rete/decompressione. `Content-Length` non basta come limite affidabile. Per file grandi, pubblicazione atomica e ripresa servono procedure dedicate.

## Debug rapido

- **Timeout**: Requests non ne ha uno predefinito; `(connect, read)` non e la durata massima totale. Anche un read timeout in streaming puo emergere come `ConnectionError`.
- **JSONDecodeError**: controlla corpo, status e contratto; anche 204 e HTML possono arrivare senza un errore HTTP 4xx/5xx.
- **Redirect**: definisci la policy; rifiutarli non basta come difesa SSRF per URL scelti dall'utente.
- **TLS**: correggi certificati/proxy, non aggirare il problema con `verify=False`.
- **Event loop bloccato**: non chiamare Requests direttamente in una coroutine.
- **Download interrotto**: gestisci file parziale e chiusura; un timeout non prova l'assenza di effetti sul server.

## Checklist finale

- Endpoint, credenziali e destinazione del file sono fidati?
- Timeout per fase, eventuale deadline e retry hanno una policy esplicita?
- Status atteso, formato, dimensioni e schema sono coerenti con il servizio?
- Risorse chiuse e file parziali gestiti?
- Nessun token o URL sensibile finisce nei log?

## Collegamenti

- [[Programmazione/Python/Pagine/HTTPX e requests|HTTPX e requests]]
- [[Programmazione/Python/Pagine/Networking base|Networking base]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Promemoria/Pagine/Python - JSON e CSV|JSON e CSV]]
- [[Programmazione/Python/Promemoria/Pagine/Python - File e percorsi|File e percorsi]]
- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]

## Fonti

- [Requests: query, JSON, status, errori e timeout](https://requests.readthedocs.io/en/latest/user/quickstart/).
- [Requests: sessioni, autenticazione e streaming](https://requests.readthedocs.io/en/latest/user/advanced/).
- [HTTPX: compatibilita con Requests](https://www.python-httpx.org/compatibility/).
- [HTTPX: timeout](https://www.python-httpx.org/advanced/timeouts/) e [client asincroni](https://www.python-httpx.org/async/).
- [Python 3.12: asyncio.timeout](https://docs.python.org/3.12/library/asyncio-task.html#asyncio.timeout).

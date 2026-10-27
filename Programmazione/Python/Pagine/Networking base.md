---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - python
  - networking
  - http
  - sockets
  - standard-library
aliases:
  - Networking Python
prerequisites:
  - "[[Programmazione/Python/Pagine/Error Handling]]"
  - "[[Programmazione/Python/Pagine/Context Managers]]"
related:
  - "[[Programmazione/Python/Pagine/Standard Library]]"
  - "[[Programmazione/Python/Pagine/Asyncio]]"
title: Networking base
---

# Networking base

## Sintesi

La standard library offre `urllib.request` per HTTP, `socket` per TCP/UDP e `ssl` per TLS. Sapere cosa accade sotto un client HTTP aiuta a distinguere connessione, protocollo, timeout, framing e dati applicativi.

Baseline: Python 3.12, esempi verificati con CPython 3.12.10 su Windows. E la versione provata, non l'ultima patch disponibile. Le funzioni non contattano servizi al momento della definizione: i test usano solo loopback.

## Quando usarlo

- Richieste semplici senza dipendenze esterne.
- Integrazione di un protocollo TCP documentato.
- Diagnostica su host e porte di propria competenza.

Per sessioni HTTP, pool, autenticazione e API sync/async piu comode consulta [[Programmazione/Python/Pagine/HTTPX e requests|HTTPX e requests]]. Un socket TCP non e un client HTTP completo.

## Come funziona

### Livelli ed errori distinti

1. DNS traduce il nome in indirizzi.
2. TCP apre un flusso affidabile di byte; non conosce JSON o “messaggi”.
3. TLS, se previsto, cifra e autentica il peer.
4. HTTP definisce richieste, status, header e corpo.
5. L'applicazione interpreta il contenuto e ne verifica lo schema.

Una porta raggiungibile non dimostra che TLS funzioni, che HTTP restituisca successo o che il servizio sia pronto.

Il timeout di un socket o di `urlopen` non e una deadline dell'intera operazione: piu letture e la risoluzione DNS possono allungarne la durata. Una connessione che continua a inviare lentamente puo richiedere un limite totale aggiuntivo.

## API / Sintassi

- `socket.create_connection((host, port), timeout=...)` apre TCP; usa `with` per chiudere.
- `sendall(bytes)` tenta di inviare tutti i byte o solleva errore; non dimostra che il server li abbia elaborati.
- `recv(n)` restituisce **al massimo** `n` byte, anche meno; `b""` significa fine del flusso.
- `urlopen(Request(...), timeout=...)` gestisce il protocollo HTTP, compresi redirect ordinari.
- `urlencode` codifica parametri della query; `urlsplit` separa componenti, non certifica la sicurezza di un URL.
- `ssl.create_default_context()` prepara verifiche di certificato e hostname; non disattivarle per nascondere un errore TLS.

### Costruire una query

```python
from urllib.parse import urlencode

base_url = "https://example.com/search"
query = urlencode({"q": "python & sqlite", "page": 2})
url = f"{base_url}?{query}"
print(url)  # https://example.com/search?q=python+%26+sqlite&page=2
```

Qui la base e fissa e non contiene gia una query. Non concatenare input non codificato e non usare `urljoin` con input arbitrario aspettandoti che mantenga sempre l'host.

## Esempio pratico

### Piccolo client JSON

Contratto: URL HTTP/HTTPS scelto dall'applicazione, risposta JSON UTF-8 con un oggetto al livello principale e corpo non compresso fino a `max_bytes`. Non e un proxy per URL forniti da utenti.

```python
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from urllib.parse import urlsplit

def get_json(url: str, *, timeout: float = 5, max_bytes: int = 65536) -> dict:
    if urlsplit(url).scheme not in {"http", "https"}:
        raise ValueError("Sono ammessi solo HTTP e HTTPS")
    if max_bytes <= 0 or timeout <= 0:
        raise ValueError("Limiti non validi")
    request = Request(
        url,
        headers={"Accept": "application/json", "Accept-Encoding": "identity"},
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            if not 200 <= response.status < 300:
                raise ValueError("Risposta HTTP non riuscita")
            if response.headers.get_content_type() != "application/json":
                raise ValueError("Content-Type inatteso")
            if response.headers.get("Content-Encoding", "identity").lower() != "identity":
                raise ValueError("Corpo compresso non supportato")
            body = response.read(max_bytes + 1)
    except HTTPError as error:
        status = error.code
        error.close()
        raise RuntimeError(f"Errore HTTP {status}") from error
    except URLError as error:
        raise RuntimeError("Connessione HTTP fallita") from error

    if len(body) > max_bytes:
        raise ValueError("Corpo troppo grande")
    data = json.loads(body.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("Atteso un oggetto JSON")
    return data
```

La funzione propaga timeout durante la lettura, errori UTF-8, JSON e altri problemi di trasporto: il chiamante deve decidere quali gestire. `HTTPError` deriva da `URLError` e va intercettato prima; e anche una risposta da chiudere.

Verificare che sia un `dict` non valida i campi dell'applicazione. Il parser JSON predefinito ha inoltre estensioni come NaN: per un contratto rigoroso occorre una validazione dedicata.

Il controllo dello schema dell'URL non previene SSRF. Redirect, proxy da ambiente e destinazioni interne richiedono una politica separata se gli URL non sono fidati. In produzione usa HTTPS; HTTP locale e riservato alle fixture.

### TCP: leggere un messaggio con lunghezza prefissata

Protocollo didattico: quattro byte iniziali contengono la lunghezza unsigned big-endian; seguono esattamente quei byte UTF-8. Il client manda `b"GET\n"` e legge una risposta. Il server deve implementare proprio questo protocollo, non HTTP.

```python
import socket

def recv_exact(sock: socket.socket, size: int) -> bytes:
    if size < 0:
        raise ValueError("Dimensione negativa")
    result = bytearray()
    while len(result) < size:
        chunk = sock.recv(size - len(result))
        if not chunk:
            raise EOFError("Connessione chiusa prima della fine del messaggio")
        result.extend(chunk)
    return bytes(result)

def fetch_message(host: str, port: int, *, timeout: float = 3,
                  max_bytes: int = 65536) -> str:
    if max_bytes <= 0 or timeout <= 0:
        raise ValueError("Limiti non validi")
    with socket.create_connection((host, port), timeout=timeout) as sock:
        sock.sendall(b"GET\n")
        size = int.from_bytes(recv_exact(sock, 4), "big")
        if size > max_bytes:
            raise ValueError("Messaggio troppo grande")
        return recv_exact(sock, size).decode("utf-8")
```

Letture ripetute ricompongono il flusso. La decodifica avviene alla fine: un carattere UTF-8 puo essere diviso tra due letture. Il limite e controllato prima di allocare il corpo, ma non e un limite totale di tempo. Il protocollo non include TLS, autenticazione, retry o piu messaggi per connessione.

### Diagnostica di una porta

```python
import socket

def is_port_open(host: str, port: int, timeout: float = 3) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False
```

`False` raggruppa DNS fallito, rifiuto, timeout e altri errori di rete: utile per un controllo binario, insufficiente per una diagnosi. Non esegue scansioni e va chiamata soltanto su destinazioni autorizzate.

## Varianti

- `ssl` aggiunge TLS a socket con un protocollo compatibile; aprire TCP sulla porta 443 da solo non abilita TLS.
- `http.client` espone HTTP a un livello inferiore rispetto a `urllib`.
- UDP usa datagrammi: non riutilizzare automaticamente il ciclo di framing TCP.
- `asyncio` permette I/O concorrente senza un thread per ogni connessione; non elimina limiti, errori o cancellazione.
- Retry con backoff richiede un budget e una politica legata all'idempotenza. Una risposta persa non prova che il server non abbia eseguito la richiesta.

## Errori comuni

- Leggere una sola volta con `recv(1024)` e considerare completo il messaggio.
- Aspettare EOF quando il protocollo mantiene aperta la connessione.
- Usare `errors="replace"` su dati di protocollo nascondendo una codifica errata.
- Disabilitare TLS o ritentare ogni errore senza distinguere il tipo di operazione.
- Scaricare corpi illimitati in memoria.

## Checklist

- Protocollo, encoding, framing e dimensioni definiti?
- Timeout per operazione distinto dal budget totale?
- Connessioni e risposte di errore chiuse?
- HTTP, trasporto e validazione dei dati gestiti separatamente?
- URL fidati, proxy/redirect e TLS valutati?
- Test locali su frammentazione, EOF anticipato, errori e corpi eccessivi?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/HTTPX e requests|HTTPX e requests]]
- [[Programmazione/Python/Pagine/Context Managers|Context Managers]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Programmazione/Python/Pagine/Standard Library|Standard Library]]

## Fonti

- [Python 3.12: socket](https://docs.python.org/3.12/library/socket.html) e [Socket Programming HOWTO](https://docs.python.org/3.12/howto/sockets.html).
- [Python 3.12: urllib.request](https://docs.python.org/3.12/library/urllib.request.html) e [urllib.error](https://docs.python.org/3.12/library/urllib.error.html).
- [Python 3.12: URL parsing e avvertenze](https://docs.python.org/3.12/library/urllib.parse.html#url-parsing-security).
- [Python 3.12: SSLContext e verifiche TLS](https://docs.python.org/3.12/library/ssl.html).

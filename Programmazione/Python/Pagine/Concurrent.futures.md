---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming, concurrency]
aliases: [Concurrent.futures, ThreadPoolExecutor, ProcessPoolExecutor]
prerequisites: []
related: []
---

# Concurrent.futures in Python

## Sintesi

`concurrent.futures` offre una API ad alto livello per eseguire task in pool di thread o processi. L'astrazione centrale e l'`Executor`, che restituisce oggetti `Future` per rappresentare risultati non ancora disponibili.

E spesso piu pratico di gestire manualmente `threading` o `multiprocessing`.

## Quando usarlo

Usalo quando:

- devi eseguire molti task indipendenti;
- vuoi un pool di thread per I/O-bound;
- vuoi un pool di processi per CPU-bound;
- ti serve raccogliere risultati ed eccezioni;
- vuoi una API uniforme tra thread e processi.

## Come funziona

`ThreadPoolExecutor`:

```python
from concurrent.futures import ThreadPoolExecutor


def download(url):
    return f"data from {url}"


urls = ["a", "b", "c"]

with ThreadPoolExecutor(max_workers=5) as executor:
    results = list(executor.map(download, urls))
```

`ProcessPoolExecutor`:

```python
from concurrent.futures import ProcessPoolExecutor


def square(number):
    return number * number


if __name__ == "__main__":
    with ProcessPoolExecutor() as executor:
        results = list(executor.map(square, [1, 2, 3]))
```

## API / Sintassi

`submit()` restituisce un `Future`:

```python
future = executor.submit(download, "example.com")
result = future.result()
```

`as_completed()` consuma i risultati appena pronti:

```python
from concurrent.futures import ThreadPoolExecutor, as_completed


with ThreadPoolExecutor() as executor:
    futures = [executor.submit(download, url) for url in urls]

    for future in as_completed(futures):
        print(future.result())
```

Gestione eccezioni:

```python
try:
    result = future.result()
except Exception as error:
    print(f"Task failed: {error}")
```

## Esempio pratico

Scaricare piu URL simulati e gestire errori:

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import time


def fetch(url):
    time.sleep(1)
    if url == "bad":
        raise RuntimeError("request failed")
    return f"{url}: ok"


urls = ["a", "bad", "c"]

with ThreadPoolExecutor(max_workers=3) as executor:
    future_to_url = {executor.submit(fetch, url): url for url in urls}

    for future in as_completed(future_to_url):
        url = future_to_url[future]
        try:
            print(future.result())
        except RuntimeError as error:
            print(f"{url} failed: {error}")
```

## Varianti

- **`ThreadPoolExecutor`**: per I/O-bound e librerie sincrone.
- **`ProcessPoolExecutor`**: per CPU-bound e parallelismo reale.
- **`map()`**: risultati nell'ordine degli input.
- **`submit()` + `Future`**: controllo piu esplicito.
- **`as_completed()`**: risultati appena disponibili.
- **Timeout**: `future.result(timeout=...)`.

## Errori comuni

- Usare thread pool per calcoli CPU-bound aspettandosi scaling sui core.
- Usare process pool per task minuscoli con overhead maggiore del lavoro.
- Non chiamare `future.result()` e perdere eccezioni.
- Creare deadlock inviando task allo stesso executor da worker saturi.
- Non usare `with`, lasciando risorse aperte.
- Non limitare `max_workers`.
- Passare oggetti non picklable a `ProcessPoolExecutor`.

## Checklist

- Il task e I/O-bound o CPU-bound?
- Ho scelto thread o processi di conseguenza?
- Le eccezioni dei future vengono gestite?
- `max_workers` e ragionevole?
- Serve preservare ordine (`map`) o consumare appena pronto (`as_completed`)?
- I task sono indipendenti?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Threading]]
- [[Multiprocessing]]
- [[Global Interpreter Lock]]
- [[Asyncio]]
- [[Subprocess]]

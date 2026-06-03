---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming, async]
aliases: [Asyncio, async await Python]
prerequisites: []
related: []
---

# Asyncio in Python

## Sintesi

`asyncio` e la libreria standard per scrivere codice concorrente con `async` e `await`. Usa un event loop e concorrenza cooperativa: una coroutine cede il controllo quando attende I/O, permettendo ad altre coroutine di avanzare.

E adatto soprattutto a carichi **I/O-bound** con molte attese, come rete, API, websocket, scraping e servizi asincroni.

## Quando usarlo

Usa `asyncio` quando:

- devi gestire molte operazioni di rete concorrenti;
- usi librerie async come `httpx.AsyncClient`, driver database async o framework ASGI;
- vuoi evitare un thread per ogni operazione in attesa;
- hai task che passano molto tempo in `await`;
- stai costruendo servizi con molte connessioni simultanee.

Evitalo per calcoli CPU-bound lunghi: bloccherebbero l'event loop.

## Come funziona

Una coroutine si definisce con `async def` e si sospende con `await`.

```python
import asyncio


async def fetch_data(name, delay):
    await asyncio.sleep(delay)
    return f"data from {name}"


async def main():
    result = await fetch_data("api", 1)
    print(result)


asyncio.run(main())
```

`asyncio.run()` crea e gestisce l'event loop per il punto di ingresso principale.

## API / Sintassi

Eseguire piu coroutine insieme:

```python
import asyncio


async def fetch(name, delay):
    await asyncio.sleep(delay)
    return name


async def main():
    results = await asyncio.gather(
        fetch("a", 2),
        fetch("b", 1),
        fetch("c", 1),
    )
    print(results)


asyncio.run(main())
```

Creare un task esplicito:

```python
async def background_worker():
    while True:
        print("working")
        await asyncio.sleep(1)


async def main():
    task = asyncio.create_task(background_worker())
    await asyncio.sleep(3)
    task.cancel()
```

Timeout:

```python
result = await asyncio.wait_for(fetch("api", 1), timeout=2)
```

## Esempio pratico

Eseguire richieste simulate in concorrenza:

```python
import asyncio
from time import perf_counter


async def request(name, delay):
    await asyncio.sleep(delay)
    return f"{name}: ok"


async def main():
    start = perf_counter()

    results = await asyncio.gather(
        request("users", 1),
        request("orders", 1.5),
        request("billing", 0.5),
    )

    elapsed = perf_counter() - start
    print(results)
    print(f"elapsed: {elapsed:.2f}s")


asyncio.run(main())
```

Il tempo totale segue l'operazione piu lenta, non la somma di tutte, perche le attese si sovrappongono.

## Varianti

- **`asyncio.gather()`**: attende piu coroutine e restituisce risultati ordinati.
- **`asyncio.create_task()`**: schedula una coroutine come task.
- **`asyncio.as_completed()`**: consuma risultati appena sono pronti.
- **Timeout e cancellazione**: `wait_for()`, `task.cancel()`.
- **Semaphore**: limita la concorrenza massima.
- **Async context manager**: `async with` per risorse asincrone.
- **Async iterator**: `async for` per stream asincroni.

## Errori comuni

- Usare `time.sleep()` dentro una coroutine invece di `await asyncio.sleep()`.
- Chiamare librerie bloccanti dentro codice async.
- Creare coroutine senza attenderle.
- Usare `asyncio.run()` dentro un event loop gia attivo.
- Fare calcoli CPU-bound dentro l'event loop.
- Non gestire cancellazione e timeout.
- Mescolare codice sync e async senza confini chiari.

## Checklist

- Il carico e davvero I/O-bound?
- Le librerie usate supportano davvero async?
- Ogni coroutine viene attesa o schedulata?
- Esistono timeout per operazioni esterne?
- La concorrenza massima e limitata quando serve?
- Il codice CPU-bound viene spostato fuori dall'event loop?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Threading]]
- [[Concurrent.futures]]
- [[Global Interpreter Lock]]
- [[Networking base]]
- [[HTTPX e requests]]

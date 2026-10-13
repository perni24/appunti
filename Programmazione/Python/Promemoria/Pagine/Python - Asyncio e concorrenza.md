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
  - asyncio
  - concorrenza
aliases:
  - Cheatsheet asyncio Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Asyncio]]"
  - "[[Programmazione/Python/Pagine/Concurrent.futures]]"
title: Python - Asyncio e concorrenza
---

# Python - Asyncio e concorrenza

## Avvio

```python
import asyncio


async def main() -> None:
    await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())
```

## Coroutine

```python
async def load_entity(entity_id: int):
    return await client.get(f"/entities/{entity_id}")
```

Chiamare una funzione `async` crea una coroutine; serve `await` per eseguirla nel flusso corrente.

## Operazioni concorrenti

```python
results = await asyncio.gather(
    load_entity(1),
    load_entity(2),
)
```

## TaskGroup

```python
async with asyncio.TaskGroup() as group:
    first = group.create_task(load_entity(1))
    second = group.create_task(load_entity(2))

first_result = first.result()
second_result = second.result()
```

`TaskGroup` e disponibile da Python 3.11.

## Timeout

```python
async with asyncio.timeout(5):
    result = await load_entity(1)
```

## Eseguire codice bloccante

```python
result = await asyncio.to_thread(blocking_function, argument)
```

Non chiamare direttamente funzioni bloccanti nel loop asincrono.

## Coda

```python
queue = asyncio.Queue()

await queue.put(item)
item = await queue.get()

try:
    await process(item)
finally:
    queue.task_done()
```

## Scelta rapida

| Strumento | Uso principale |
|---|---|
| `asyncio` | Molte operazioni I/O asincrone |
| `threading` | I/O bloccante o librerie sincrone |
| `multiprocessing` | Calcolo CPU-bound |
| `concurrent.futures` | Interfaccia ad alto livello per thread o processi |

## Approfondimento

- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/Threading|Threading]]
- [[Programmazione/Python/Pagine/Multiprocessing|Multiprocessing]]
- [[Programmazione/Python/Pagine/Concurrent.futures|Concurrent.futures]]
- [[Programmazione/Python/Pagine/Global Interpreter Lock|Global Interpreter Lock]]


## Navigazione

- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]

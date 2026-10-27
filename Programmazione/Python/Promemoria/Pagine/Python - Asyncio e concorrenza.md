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

## Obiettivo

Richiamare le forme essenziali di asyncio senza lasciare task o risorse senza gestione. Teoria: [[Programmazione/Python/Pagine/Asyncio|Asyncio]] e [[Programmazione/Python/Pagine/Concurrent.futures|Concurrent.futures]].

Baseline: **CPython 3.12.10 con GIL**, task factory standard. `TaskGroup` e `asyncio.timeout` richiedono Python 3.11+. Solo standard library; le attese dei demo non sono richieste HTTP o benchmark.

## Quando usarlo

- I/O con librerie asincrone.
- Attivita concorrenti da attendere e chiudere insieme.
- Integrazione controllata di una funzione sincrona bloccante.

## Procedura

1. Scegli un solo esempio: ogni blocco e autonomo.
2. In uno script, `asyncio.run` gestisce il loop; in un framework/notebook con loop attivo usa `await` nel chiamante, senza un altro `asyncio.run`.
3. Definisci proprietario dei task, politica degli errori e limiti di lavoro/attesa.

## Snippet

### Avvio

```python
import asyncio


async def main():
    await asyncio.sleep(0)
    return "done"


if __name__ == "__main__":
    print(asyncio.run(main()))  # done
```

`sleep(0)` cede il controllo; una funzione `async` non rende automaticamente non bloccante il codice nel suo corpo.

### Coroutine e await

```python
import asyncio


async def load_entity(entity_id):
    await asyncio.sleep(0)
    return {"id": entity_id}


async def main():
    pending = load_entity(1)
    return await pending


print(asyncio.run(main()))  # {'id': 1}
```

La chiamata crea una coroutine; il corpo parte quando viene attesa o schedulata. Due `await` consecutivi sono sequenziali; la stessa coroutine non si puo attendere due volte. Il demo non effettua I/O reale.

### Operazioni concorrenti con gather

```python
import asyncio


async def load_entity(entity_id):
    await asyncio.sleep(0)
    return entity_id


async def main():
    return await asyncio.gather(load_entity(1), load_entity(2))


print(asyncio.run(main()))  # [1, 2]
```

I risultati seguono l'ordine degli argomenti, non quello di completamento. Con il default, il primo errore viene propagato ma **gli altri task non vengono cancellati automaticamente**. `return_exceptions=True` raccoglie anche errori: non trattarli come risultati validi. Per la gestione completa del fallimento vedi la nota teorica.

### TaskGroup

```python
import asyncio


async def load_entity(entity_id):
    await asyncio.sleep(0)
    return entity_id


async def main():
    async with asyncio.TaskGroup() as group:
        first = group.create_task(load_entity(1))
        second = group.create_task(load_entity(2))
    return first.result(), second.result()


print(asyncio.run(main()))  # (1, 2)
```

L'uscita attende i task. Un errore diverso da cancellazione richiede la cancellazione dei fratelli e puo produrre un `ExceptionGroup`, gestibile con `except*`. Leggi i risultati solo dopo l'uscita riuscita. Non e un rollback degli effetti gia avvenuti.

### Timeout

```python
import asyncio


async def main():
    events = []
    try:
        async with asyncio.timeout(0):
            try:
                await asyncio.Event().wait()
            finally:
                events.append("cleanup")
    except TimeoutError:
        events.append("timeout")
    return events


print(asyncio.run(main()))  # ['cleanup', 'timeout']
```

Zero rende il demo immediato: in un'applicazione scegli un budget reale, per esempio 5 secondi. Cattura `TimeoutError` **fuori** dal context manager. La scadenza e cooperativa: non interrompe codice sincrono bloccante e non annulla operazioni remote gia eseguite.

### Eseguire codice bloccante con to_thread

```python
import asyncio
from pathlib import Path
from tempfile import TemporaryDirectory


async def read_text(path):
    return await asyncio.to_thread(path.read_text, encoding="utf-8")


with TemporaryDirectory() as directory:
    path = Path(directory) / "message.txt"
    path.write_text("demo", encoding="utf-8")
    print(asyncio.run(read_text(path)))  # demo
```

La preparazione del file avviene fuori dal loop e il cleanup dopo l'attesa. `to_thread` sposta la chiamata in un thread; cancellare chi la attende **non ferma una funzione gia partita**. Non e un'accelerazione generale dei calcoli Python CPU-bound con GIL.

## Adattamenti comuni

### Cancellare e attendere un task

```python
import asyncio


async def main():
    ready = asyncio.Event()
    events = []

    async def worker():
        try:
            ready.set()
            await asyncio.Event().wait()
        finally:
            events.append("cleanup")

    task = asyncio.create_task(worker())
    await ready.wait()
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        events.append("cancelled")
    return events


print(asyncio.run(main()))  # ['cleanup', 'cancelled']
```

Conserva il riferimento e attendi l'esito. `cancel()` e una richiesta, non una terminazione forzata. Il worker non sopprime `CancelledError`; il proprietario la osserva dopo il cleanup. Deriva da `BaseException`, non da `Exception`.

### Coda limitata

```python
import asyncio


async def main(values=(1, 2, 3)):
    queue = asyncio.Queue(maxsize=2)
    stop = object()
    results = []

    async def worker():
        while True:
            item = await queue.get()
            try:
                if item is stop:
                    return
                await asyncio.sleep(0)
                results.append(item * 2)
            finally:
                queue.task_done()

    async with asyncio.TaskGroup() as group:
        group.create_task(worker())
        for value in values:
            await queue.put(value)
        await queue.put(stop)
        await queue.join()
    return results


print(asyncio.run(main()))  # [2, 4, 6]
```

Demo con un consumer e input numerici finiti. `task_done()` va chiamato una volta per ogni elemento ottenuto, inclusa la sentinella; `join()` attende l'azzeramento di quel conteggio, **non certifica il successo del lavoro**. Il TaskGroup propaga gli errori del worker.

La coda limita gli elementi in attesa, non l'elenco `results` o il costo di ciascun elemento. Per flussi grandi servono gestione dei risultati e input non bloccanti. Le primitive asyncio non sono thread-safe; un semaforo limita le attivita ammesse ma non il numero di task gia creati ne le richieste al secondo.

### Scelta rapida

| Strumento                 | Uso tipico e limite                                                              |
| ------------------------- | -------------------------------------------------------------------------------- |
| `asyncio`                 | I/O realmente async; il codice bloccante ferma il loop.                          |
| `threading` / `to_thread` | I/O sincrono; cancellazione dell'attesa diversa da arresto del thread.           |
| `multiprocessing`         | CPU-bound Python con GIL; considera serializzazione, spawn e costi dei processi. |
| `concurrent.futures`      | Interfaccia per pool di thread/processi; scegli il pool in base al lavoro.       |

## Debug rapido

- **Coroutine was never awaited**: hai creato una coroutine senza attenderla o schedularla.
- **asyncio.run cannot be called**: il thread ha gia un loop attivo.
- **Loop fermo**: cerca I/O sincrono, `time.sleep` o calcoli lunghi.
- **Task exception was never retrieved**: manca un proprietario che osservi l'esito.
- **join non finisce**: verifica `get`/`task_done`, worker e politica degli errori.
- **Timeout superato ma lavoro attivo**: controlla cancellazione cooperativa e thread gia avviati.

## Checklist finale

- Un solo proprietario del loop?
- Task conservati, attesi e chiusi?
- Politica di gather o TaskGroup scelta consapevolmente?
- Timeout e cleanup non confusi con rollback?
- Task, coda e risultati hanno limiti adeguati?

## Collegamenti

- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/Threading|Threading]]
- [[Programmazione/Python/Pagine/Multiprocessing|Multiprocessing]]
- [[Programmazione/Python/Pagine/Concurrent.futures|Concurrent.futures]]
- [[Programmazione/Python/Pagine/Global Interpreter Lock|Global Interpreter Lock]]
- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]

## Fonti

- [Python 3.12: coroutine, task, cancellazione e timeout](https://docs.python.org/3.12/library/asyncio-task.html).
- [Python 3.12: runner](https://docs.python.org/3.12/library/asyncio-runner.html).
- [Python 3.12: Queue](https://docs.python.org/3.12/library/asyncio-queue.html) e [debug asyncio](https://docs.python.org/3.12/library/asyncio-dev.html).

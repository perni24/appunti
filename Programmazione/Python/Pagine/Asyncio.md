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
  - programming
  - async
aliases:
  - Asyncio
  - async await Python
prerequisites: []
related: []
title: Asyncio in Python
---

# Asyncio in Python

## Sintesi

`asyncio` coordina coroutine attraverso un event loop. La concorrenza e cooperativa: un task lascia avanzare gli altri quando si sospende. `async` non rende automaticamente non bloccante il codice e `await` non equivale a "avvia in parallelo".

E adatto a I/O con librerie asincrone. Un calcolo lungo o una chiamata sincrona bloccante nel thread del loop impedisce agli altri task di procedere.

Baseline: **CPython 3.12.10 su Windows**, task factory standard. Tutti i blocchi sono script autonomi; `TaskGroup` e `asyncio.timeout` richiedono Python 3.11+. Le attese simulate non sono richieste HTTP o benchmark.

## Quando usarlo

- Molte connessioni o attese I/O con client/driver async.
- Servizi ASGI, stream e protocolli cooperativi.
- Attivita concorrenti con un proprietario responsabile di errori e chiusura.
- Non per aggiungere parallelismo CPU a una funzione semplicemente dichiarandola async.

In un framework con loop gia attivo, usa await e i meccanismi di lifecycle del framework. Non aprire un nuovo `asyncio.run` dentro lo stesso thread.

## Come funziona

### Coroutine, task e attese sequenziali

Chiamare una funzione async crea una coroutine, senza eseguirne il corpo. `await coroutine` la esegue nell'attivita corrente; due await consecutivi sono sequenziali. Un Task schedula la coroutine sul loop. Un Future rappresenta un completamento, ma normalmente le applicazioni usano task e API ad alto livello.

Non ogni await sospende davvero: un risultato gia disponibile puo essere restituito subito. `asyncio.sleep(0)`, invece, cede esplicitamente il controllo.

```python
import asyncio


async def job(name, events):
    events.append(("start", name))
    await asyncio.sleep(0)
    events.append(("end", name))
    return name


async def demo():
    sequential = []
    coroutine = job("a", sequential)
    before_await = list(sequential)
    first = await coroutine
    second = await job("b", sequential)

    concurrent = []
    async with asyncio.TaskGroup() as group:
        tasks = [
            group.create_task(job(name, concurrent))
            for name in ("a", "b")
        ]
    return {
        "before": before_await,
        "sequential": sequential,
        "concurrent": concurrent,
        "results": [first, second, *(task.result() for task in tasks)],
    }


print(asyncio.run(demo()))
```

Il campo before e vuoto. Nel percorso sequenziale a finisce prima di iniziare b; nel secondo entrambe le attivita raggiungono sleep prima di terminare, su questa configurazione. Non usare questo ordine dimostrativo come contratto di scheduling generale o misura di velocita.

`asyncio.run` gestisce loop, generatori asincroni e shutdown dell'executor predefinito. Usalo come punto d'ingresso dello script. Un task creato con create_task deve avere un proprietario che ne conservi il riferimento, ne osservi l'esito e ne gestisca la terminazione; un task "dimenticato" non e un servizio affidabile.

## API / Sintassi

### TaskGroup: errore e cleanup dei fratelli

```python
import asyncio


async def group_demo():
    ready = asyncio.Event()
    events = []

    async def waiting():
        try:
            ready.set()
            await asyncio.Event().wait()
        finally:
            events.append("cleanup")

    async def failing():
        await ready.wait()
        raise ValueError("job non valido")

    try:
        async with asyncio.TaskGroup() as group:
            group.create_task(waiting())
            group.create_task(failing())
    except* ValueError as errors:
        events.extend(str(error) for error in errors.exceptions)
    return events


print(asyncio.run(group_demo()))  # ['cleanup', 'job non valido']
```

Il primo errore diverso da CancelledError porta il gruppo a richiedere la cancellazione degli altri task e ad attenderli. Gli errori vengono aggregati; `except*` gestisce la parte corrispondente di un ExceptionGroup, non necessariamente tutti i suoi elementi. KeyboardInterrupt e SystemExit hanno regole speciali.

Il gruppo non annulla scritture gia eseguite e non puo rendere cooperativa una funzione che blocca il loop o sopprime la cancellazione.

### gather non ha la stessa politica

```python
import asyncio


async def gather_demo():
    release = asyncio.Event()

    async def pending():
        await release.wait()
        return "secondo completato"

    async def failing():
        raise ValueError("primo fallito")

    tasks = [
        asyncio.create_task(failing()),
        asyncio.create_task(pending()),
    ]
    try:
        await asyncio.gather(*tasks)
    except ValueError:
        sibling_still_pending = not tasks[1].done()
    finally:
        release.set()
        outcomes = await asyncio.gather(*tasks, return_exceptions=True)
    return sibling_still_pending, [type(outcomes[0]).__name__, outcomes[1]]


print(asyncio.run(gather_demo()))
# (True, ['ValueError', 'secondo completato'])
```

Con il default, gather propaga il primo errore ma non cancella automaticamente i fratelli. `return_exceptions=True` restituisce anche gli errori nella lista: vanno distinti dai valori validi. I risultati seguono l'ordine degli argomenti, non quello di completamento.

Il demo libera e raccoglie comunque tutti i task. Non attribuire a gather una cancellazione che in realta avviene solo quando `asyncio.run` chiude il loop.

### Cancellare e attendere

```python
import asyncio


async def cancellation_demo():
    ready = asyncio.Event()
    events = []

    async def worker():
        try:
            ready.set()
            await asyncio.Event().wait()
        finally:
            events.append("released")

    task = asyncio.create_task(worker())
    await ready.wait()
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        events.append("cancelled")
    return events, task.cancelled()


print(asyncio.run(cancellation_demo()))
# (['released', 'cancelled'], True)
```

`cancel()` e una richiesta, non una terminazione immediata. Il task riceve CancelledError quando puo riprendere. Il worker usa finally senza sopprimerla; il proprietario la osserva dopo aver atteso il task.

CancelledError deriva da BaseException: `except Exception` non la intercetta. Se la intercetti per cleanup, normalmente rilanciala. Inghiottirla puo rompere TaskGroup e timeout. Un'ulteriore cancellazione o un errore puo interrompere un cleanup asincrono: finally non promette una chiusura infallibile.

### Timeout e deadline

```python
import asyncio


async def timeout_demo():
    events = []

    async def wait_forever():
        try:
            await asyncio.Event().wait()
        finally:
            events.append("cleanup")

    try:
        async with asyncio.timeout(0):
            await wait_forever()
    except TimeoutError:
        events.append("timeout")
    return events


print(asyncio.run(timeout_demo()))  # ['cleanup', 'timeout']
```

Lo zero rende osservabile la scadenza al successivo passaggio del loop. In un'applicazione scegli un budget coerente con l'operazione, non questo valore dimostrativo.

- `asyncio.timeout(seconds)` delimita un blocco e usa la cancellazione del task corrente; intercetta TimeoutError **fuori** dal context manager.
- `wait_for(awaitable, timeout=...)` limita l'attesa di una singola attivita e ne richiede la cancellazione alla scadenza. Attende la risposta alla cancellazione: il tempo totale puo superare il timeout.
- `timeout_at(deadline)` usa l'orologio monotono del loop: utile per un budget comune a piu operazioni, invece di ricominciare il timeout a ogni passo.
- `shield(task)` protegge quel task dalla cancellazione propagata dall'attesa, ma il chiamante resta cancellabile. Non elimina la responsabilita di attendere o cancellare il lavoro rimasto.

Timeout non significa rollback o interruzione del codice bloccante. Un loop occupato non puo far scattare puntualmente i suoi timer.

## Esempio pratico

### Pipeline con worker e coda limitati

Il demo distingue errori di input previsti da bug inattesi: i primi diventano risultati, gli altri fanno fallire il TaskGroup. Il producer rimane nello stesso gruppo di vita dei consumer.

```python
import asyncio


async def process(value):
    if type(value) is not int or value < 0:
        raise ValueError("atteso un intero non negativo")
    await asyncio.sleep(0)
    return value * value


async def run_jobs(values, workers=2, capacity=2):
    if type(workers) is not int or workers < 1:
        raise ValueError("workers deve essere un intero positivo")
    if type(capacity) is not int or capacity < 1:
        raise ValueError("capacity deve essere un intero positivo")
    jobs = asyncio.Queue(maxsize=capacity)
    outcomes = []
    stop = object()

    async def worker():
        while True:
            item = await jobs.get()
            try:
                if item is stop:
                    return
                index, value = item
                try:
                    result = await process(value)
                except ValueError as error:
                    outcomes.append((index, "error", str(error)))
                else:
                    outcomes.append((index, "ok", result))
            finally:
                jobs.task_done()

    async with asyncio.TaskGroup() as group:
        for _ in range(workers):
            group.create_task(worker())
        for item in enumerate(values):
            await jobs.put(item)
        for _ in range(workers):
            await jobs.put(stop)
        await jobs.join()
    return sorted(outcomes)


print(asyncio.run(run_jobs([2, -1, 3])))
# [(0, 'ok', 4), (1, 'error', 'atteso un intero non negativo'), (2, 'ok', 9)]
```

Sono limitati i task worker e gli elementi accodati. L'elenco outcomes cresce comunque con gli input; per un flusso grande occorre anche un consumer dei risultati. L'iteratore degli input e sincrono: non deve fare I/O bloccante dentro next.

Un `Semaphore` puo limitare le operazioni attive, ma creare un milione di task che lo aspettano crea comunque un milione di task. La coda evita questa specifica crescita. Semaphore non limita richieste al secondo: rate limiting, retry e backoff sono politiche ulteriori.

Le primitive `asyncio` non sono thread-safe. Nello stesso loop possono comunque esserci race logiche fra lettura e scrittura separate da await: usa `asyncio.Lock` per un'invariante che deve attraversare una sospensione. Non mantenere un lock sincrono mentre attendi una coroutine.

## Varianti

### Una funzione sincrona con to_thread

```python
import asyncio
from pathlib import Path
from tempfile import TemporaryDirectory


async def read_demo(path):
    return await asyncio.to_thread(path.read_text, encoding="utf-8")


with TemporaryDirectory(prefix="appunti-asyncio-") as directory:
    path = Path(directory) / "message.txt"
    path.write_text("ciao", encoding="utf-8")
    result = asyncio.run(read_demo(path))
    print(result)  # ciao
```

Il file esiste fino alla conclusione dell'attesa. `to_thread` permette al loop di proseguire durante la chiamata bloccante, ma non rende il filesystem una API async nativa. Cancellare il task che aspetta **non ferma una funzione gia partita nel thread**: servono timeout e cooperazione nel codice sincrono.

Per CPU-bound su CPython con GIL valuta un process pool tramite `loop.run_in_executor`, con le regole di import/spawn della nota Multiprocessing. Un Future di concurrent.futures non si attende direttamente con await: usa l'integrazione del loop o `asyncio.wrap_future`.

- `asyncio.as_completed`: consumo man mano che arrivano gli esiti; nella baseline 3.12 il normale iteratore restituisce awaitable da attendere, non presumere identita con i task originali.
- `asyncio.wait`: insiemi done/pending, senza cancellare automaticamente i pending al timeout.
- `async with` e `async for`: rilascio e iterazione asincroni, spiegati nelle note collegate.
- Da un altro thread: `loop.call_soon_threadsafe` o `run_coroutine_threadsafe`, non modifiche dirette agli oggetti del loop.
- `asyncio.run(main(), debug=True)` aiuta a rilevare chiamate lente e usi errati; non sostituisce i test.

## Errori comuni

- Scambiare async def per esecuzione concorrente o await per sospensione garantita.
- Usare time.sleep, requests o un ciclo CPU lungo nel loop.
- Creare task senza conservarli, osservarli e chiuderli.
- Trattare gather e TaskGroup come intercambiabili sugli errori.
- Supporre che un timeout fermi thread, processi o operazioni remote.
- Limitare le chiamate attive ma lasciare task, input e risultati illimitati.
- Ripetere una scrittura dopo timeout senza sapere se il server l'ha gia applicata.

## Checklist

- Chi e proprietario del loop e di ogni task?
- I/O e librerie rispettano davvero la cooperazione?
- C'e un budget complessivo e una politica di cancellazione?
- Gli errori causano fail-fast o vengono raccolti intenzionalmente?
- Task e buffer sono limitati e il cleanup viene atteso?
- Eventuali retry richiedono idempotenza o riconciliazione?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Threading|Threading]]
- [[Programmazione/Python/Pagine/Multiprocessing|Multiprocessing]]
- [[Programmazione/Python/Pagine/Concurrent.futures|Concurrent.futures]]
- [[Programmazione/Python/Pagine/Global Interpreter Lock|Global Interpreter Lock]]
- [[Programmazione/Python/Pagine/Context Managers|Context managers sincroni e asincroni]]
- [[Programmazione/Python/Pagine/Generatori|Generatori]]
- [[Programmazione/Python/Pagine/Networking base|Networking base]]
- [[Programmazione/Python/Pagine/HTTPX e requests|HTTPX e requests]]

## Fonti

- [Python 3.12: coroutine, task, gruppi e cancellazione](https://docs.python.org/3.12/library/asyncio-task.html).
- [Python 3.12: runner e gestione del loop](https://docs.python.org/3.12/library/asyncio-runner.html).
- [Python 3.12: primitive di sincronizzazione](https://docs.python.org/3.12/library/asyncio-sync.html).
- [Python 3.12: code asincrone](https://docs.python.org/3.12/library/asyncio-queue.html).
- [Python 3.12: sviluppo, thread e diagnostica asyncio](https://docs.python.org/3.12/library/asyncio-dev.html).
- [Python 3.12: except\* e gruppi di eccezioni](https://docs.python.org/3.12/reference/compound_stmts.html#except-star).

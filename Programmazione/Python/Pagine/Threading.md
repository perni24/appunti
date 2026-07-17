---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming, concurrency]
aliases: [Threading, Thread Python]
prerequisites: []
related: []
---

# Threading in Python

## Sintesi

Il modulo `threading` permette di eseguire piu thread nello stesso processo. I thread condividono memoria e sono utili soprattutto per task **I/O-bound**, cioe operazioni che passano molto tempo in attesa di rete, file, database o input esterno.

Nelle build CPython tradizionali, il [[Global Interpreter Lock]] limita il parallelismo reale dei thread per codice Python CPU-bound. Le build free-threaded disponibili da Python 3.13 possono eseguire thread Python in parallelo, ma compatibilita delle estensioni e prestazioni vanno verificate.

## Quando usarlo

Usa `threading` quando:

- devi mantenere responsivo un programma durante attese I/O;
- vuoi eseguire piu operazioni di rete o file in parallelo apparente;
- devi integrare librerie sincrone bloccanti;
- hai pochi worker e logica relativamente semplice;
- una coda di lavoro con thread e sufficiente.

Per calcoli CPU-bound su una build con GIL, valuta `multiprocessing` o `ProcessPoolExecutor`. Su una build free-threaded misura invece se i thread e le librerie usate scalano realmente.

## Come funziona

Creare e avviare un thread:

```python
import threading
import time


def worker(name):
    time.sleep(1)
    print(f"{name} done")


thread = threading.Thread(target=worker, args=("task-1",))
thread.start()
thread.join()
```

`start()` avvia il thread. `join()` attende che finisca.

## API / Sintassi

Piu thread:

```python
threads = [
    threading.Thread(target=worker, args=(f"task-{index}",))
    for index in range(3)
]

for thread in threads:
    thread.start()

for thread in threads:
    thread.join()
```

Proteggere stato condiviso con `Lock`:

```python
counter = 0
lock = threading.Lock()


def increment():
    global counter
    for _ in range(100_000):
        with lock:
            counter += 1
```

Usare una coda thread-safe:

```python
from queue import Queue

queue = Queue()
queue.put("job")
job = queue.get()
queue.task_done()
```

## Esempio pratico

Worker che consumano una coda di URL simulati:

```python
import threading
import time
from queue import Queue


def worker(queue):
    while True:
        url = queue.get()
        if url is None:
            queue.task_done()
            break

        time.sleep(1)
        print(f"downloaded {url}")
        queue.task_done()


queue = Queue()
threads = [threading.Thread(target=worker, args=(queue,)) for _ in range(3)]

for thread in threads:
    thread.start()

for url in ["a", "b", "c", "d", "e"]:
    queue.put(url)

for _ in threads:
    queue.put(None)

queue.join()
```

## Varianti

- **Thread manuali**: controllo esplicito su `Thread`.
- **`Lock`**: protegge sezioni critiche.
- **`RLock`**: lock rientrante.
- **`Event`**: segnala condizioni tra thread.
- **`Queue`**: comunicazione sicura tra produttori e consumatori.
- **`ThreadPoolExecutor`**: alternativa ad alto livello per molti casi.

## Errori comuni

- Usare thread per velocizzare calcoli CPU-bound su CPython con GIL aspettandosi parallelismo sui core.
- Condividere oggetti mutabili senza lock o queue.
- Dimenticare `join()` quando serve attendere completamento.
- Creare troppi thread.
- Usare daemon thread per lavoro che deve completare in modo affidabile.
- Produrre deadlock acquisendo lock in ordine incoerente.
- Pensare che il GIL elimini ogni race condition.

## Checklist

- Il carico e I/O-bound?
- Lo stato condiviso e protetto?
- I thread terminano in modo controllato?
- Le eccezioni nei worker vengono osservate?
- Serve davvero `threading` o basta `ThreadPoolExecutor`?
- Esiste un limite ragionevole al numero di thread?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Global Interpreter Lock]]
- [[Concurrent.futures]]
- [[Multiprocessing]]
- [[Asyncio]]
- [[Networking base]]

## Fonti

- [Python - threading](https://docs.python.org/3/library/threading.html)
- [Python - Support for free threading](https://docs.python.org/3/howto/free-threading-python.html)

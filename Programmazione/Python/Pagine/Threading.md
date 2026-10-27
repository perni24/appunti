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
  - concurrency
aliases:
  - Threading
  - Thread Python
prerequisites: []
related: []
title: Threading in Python
---

# Threading in Python

## Sintesi

`threading` coordina piu flussi di esecuzione nello stesso processo. I thread condividono oggetti e risorse: questo facilita la comunicazione, ma richiede regole su accesso, errori e terminazione.

E utile con librerie sincrone che attendono I/O. Non garantisce accelerazione: sulle build CPython con GIL il codice Python CPU-bound non viene normalmente eseguito in parallelo sui core; alcune estensioni native rilasciano il GIL. Per le build free-threaded vedi la nota dedicata, senza assumere che qualunque libreria sia compatibile.

Riferimento degli esempi: **CPython 3.12.10 su Windows**. Ogni blocco e autonomo e usa solo la standard library. Non sono benchmark o download reali.

## Quando usarlo

- Integrare I/O bloccante con un numero controllato di worker.
- Separare un'attivita di servizio dal flusso principale.
- Coordinare produttori e consumatori in memoria.
- Preferire `ThreadPoolExecutor` per chiamate indipendenti di cui vuoi risultati ed eccezioni; usare thread manuali quando serve controllarne il ciclo di vita.

Un thread non isola il codice non fidato. Una connessione database o un client non diventano thread-safe solo perche li passi a un worker: controlla il contratto della libreria.

## Come funziona

`Thread(target=worker, args=(value,))` prepara il lavoro senza eseguirlo. `start()` lo avvia una sola volta; chiamare direttamente `run()` esegue invece nel thread chiamante. `join()` attende la terminazione, ma non restituisce il risultato del target e non rilancia la sua eccezione.

### Attendere non significa fermare

Il demo usa due Event invece di ipotizzare un ordine basato su sleep. Dopo `ready` sappiamo che il worker e partito; prima di `stop.set()` non puo terminare.

```python
from threading import Event, Thread


def lifecycle_demo():
    ready = Event()
    stop = Event()

    def worker():
        ready.set()
        stop.wait()

    thread = Thread(target=worker, name="demo-worker")
    thread.start()
    try:
        if not ready.wait(timeout=5):
            raise TimeoutError("worker non avviato")
        joined = thread.join(timeout=0)
        still_alive = thread.is_alive()
    finally:
        stop.set()
        thread.join()

    return joined, still_alive, thread.is_alive()


print(lifecycle_demo())  # (None, True, False)
```

Anche `join(timeout=...)` restituisce None: controlla `is_alive()` per sapere se il thread e ancora attivo. Il timeout limita l'attesa del chiamante, non la durata del lavoro.

Python non offre un arresto forzato sicuro del singolo thread. La terminazione cooperativa richiede che il worker controlli un Event o riceva un messaggio. Se e bloccato in I/O senza timeout, il segnale da solo non lo libera. Per un ciclo periodico, `stop.wait(interval)` permette di svegliarlo prima della scadenza.

## API / Sintassi

### Proteggere un'invariante con Lock

Il lock va condiviso da **tutti** gli accessi che devono partecipare alla stessa regola. Bloccare soltanto una scrittura non rende coerenti letture concorrenti fatte altrove.

```python
from threading import Lock, Thread


def count_updates():
    counter = 0
    lock = Lock()

    def increment():
        nonlocal counter
        for _ in range(1000):
            with lock:
                counter += 1

    threads = [Thread(target=increment) for _ in range(4)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    return counter


print(count_updates())  # 4000
```

`with lock` rilascia il lock anche se il corpo solleva un'eccezione; non annulla modifiche gia effettuate. Mantieni breve la sezione critica, evita chiamate esterne mentre la possiedi e stabilisci un ordine unico quando acquisisci piu lock.

| Strumento   | Uso                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| `Lock`      | Accesso esclusivo a una sezione critica. Non rientrante.                                                   |
| `RLock`     | Riacquisizione nello stesso thread, con rilasci corrispondenti.                                            |
| `Event`     | Segnale persistente set/clear; non conta quanti eventi sono avvenuti.                                      |
| `Condition` | Attesa di un predicato sullo stato protetto; usare wait_for o ricontrollarlo in un ciclo.                  |
| `Semaphore` | Limite agli accessi simultanei a una risorsa; non e un rate limiter.                                       |
| `Barrier`   | Punto di incontro per un numero definito di partecipanti. Un partecipante mancante puo bloccare gli altri. |
| `local`     | Stato locale al thread, non automaticamente locale a ogni richiesta o task.                                |

## Esempio pratico

### Worker con coda, errori e chiusura

Il contratto accetta interi built-in non negativi. Ogni lavoro produce un risultato o un errore, identificato dall'indice originale. Il demo continua dopo un errore del singolo job.

```python
from queue import Queue
from threading import Thread


def square_nonnegative(value):
    if type(value) is not int or value < 0:
        raise ValueError("atteso un intero non negativo")
    return value * value


def run_jobs(values, workers=2):
    if type(workers) is not int or workers < 1:
        raise ValueError("workers deve essere un intero positivo")
    items = list(values)
    jobs = Queue(maxsize=2)
    outcomes = Queue()
    stop = object()

    def worker():
        while True:
            item = jobs.get()
            try:
                if item is stop:
                    return
                index, value = item
                try:
                    result = square_nonnegative(value)
                except Exception as error:
                    outcomes.put((index, "error", str(error)))
                else:
                    outcomes.put((index, "ok", result))
            finally:
                jobs.task_done()

    threads = [Thread(target=worker) for _ in range(workers)]
    for thread in threads:
        thread.start()
    try:
        for item in enumerate(items):
            jobs.put(item)
    finally:
        for _ in threads:
            jobs.put(stop)
        jobs.join()
        for thread in threads:
            thread.join()

    return sorted(outcomes.get_nowait() for _ in items)


print(run_jobs([2, -1, 3]))
# [(0, 'ok', 4), (1, 'error', 'atteso un intero non negativo'), (2, 'ok', 9)]
```

Una sentinella per worker; un `task_done()` per ogni `get()`, sentinelle incluse. `Queue.join()` attende la contabilizzazione, `Thread.join()` la fine dei thread: non sono intercambiabili. `task_done` non certifica il successo.

`maxsize` limita i job **in attesa**, non gli input gia materializzati, i risultati accumulati o la RAM complessiva. Il numero di risultati e noto; per questo non viene usato `empty()` come condizione di consumo. I messaggi scambiano riferimenti: non modificare un oggetto condiviso dopo averlo affidato al worker senza un contratto preciso.

Il demo raccoglie Exception come fallimenti dei job; in un servizio scegli quali errori tollerare, conserva traceback utili e valuta una politica fail-fast. Non e un supervisore contro crash, BaseException, fallimento nell'avvio di un thread o funzioni che non ritornano: in quei casi una coda/join puo restare in attesa. La materializzazione iniziale evita almeno di lasciare thread avviati se l'iteratore degli input fallisce.

## Varianti

- `threading.excepthook` riceve le eccezioni non gestite dei thread; per default le segnala su stderr. Non trasforma join in una propagazione al chiamante.
- Un Future di `ThreadPoolExecutor` raccoglie risultato/eccezione: resta necessario osservarlo.
- Un thread daemon puo essere interrotto dalla fine del processo senza completare cleanup o scritture. Non usarlo come strategia per salvare dati.
- Per coroutine usa le primitive `asyncio`; un Lock sincrono conteso blocca il thread dell'event loop.

## Errori comuni

- Affidare l'ordine a sleep o al GIL invece di sincronizzare.
- Confondere una singola operazione thread-safe con una sequenza atomica.
- Non osservare le eccezioni perche join e terminato normalmente.
- Dimenticare task_done o chiamarlo due volte; continuare ad aspettare dopo la morte di un consumer.
- Creare thread senza limiti o tenere un lock durante I/O indefinito.
- Attendere nel worker un lavoro che puo essere svolto solo dallo stesso worker occupato.

## Checklist

- Chi possiede stato, connessioni e risultati?
- I job bloccanti hanno timeout e un protocollo di arresto?
- Errori e successi arrivano al chiamante?
- Ogni attivita avviata viene attesa o gestita esplicitamente?
- Sono limitati worker, code e accumulo dei risultati?
- Il percorso di errore puo lasciare un consumer morto o un lock acquisito?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Global Interpreter Lock|Global Interpreter Lock]]
- [[Programmazione/Python/Pagine/Concurrent.futures|Concurrent.futures]]
- [[Programmazione/Python/Pagine/Multiprocessing|Multiprocessing]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/Standard Library|Queue e standard library]]
- [[Programmazione/Python/Pagine/Networking base|Networking base]]

## Fonti

- [Python 3.12: threading](https://docs.python.org/3.12/library/threading.html).
- [Python 3.12: queue](https://docs.python.org/3.12/library/queue.html).
- [Python 3.12: ThreadPoolExecutor](https://docs.python.org/3.12/library/concurrent.futures.html#threadpoolexecutor).
- [Python 3.12: asyncio e interazione con thread](https://docs.python.org/3.12/library/asyncio-dev.html#concurrency-and-multithreading).

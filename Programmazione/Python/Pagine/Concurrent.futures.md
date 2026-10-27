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
  - Concurrent.futures
  - ThreadPoolExecutor
  - ProcessPoolExecutor
prerequisites: []
related: []
title: Concurrent.futures in Python
---

# Concurrent.futures in Python

## Sintesi

`concurrent.futures` offre pool di thread e processi con una API comune. `submit` restituisce un Future che rappresenta un lavoro: puo essere in attesa, in esecuzione, concluso con un valore/errore oppure cancellato prima dell'avvio.

E spesso piu semplice dei worker manuali, ma non decide per te timeout, limiti della coda, gestione degli errori o consistenza dei dati condivisi.

Baseline degli esempi: **CPython 3.12.10 su Windows**, sola standard library. Ogni blocco e autonomo. I calcoli piccoli mostrano i contratti, non un beneficio prestazionale.

## Quando usarlo

- ThreadPoolExecutor per I/O sincrono con librerie adatte ai thread.
- ProcessPoolExecutor per calcoli Python indipendenti che giustificano avvio e serializzazione.
- Raccolta esplicita di risultati/errori senza gestire direttamente ogni thread o processo.
- Non e una coda persistente: i job e i risultati non sopravvivono automaticamente al crash dell'applicazione.

Un pool limita i worker simultanei, non necessariamente il numero di job inviati. Una richiesta submit per ogni elemento di un input enorme puo saturare la memoria.

## Come funziona

### map conserva l'ordine degli input

```python
from concurrent.futures import ThreadPoolExecutor


def square(value):
    return value * value


with ThreadPoolExecutor(max_workers=2) as executor:
    results = list(executor.map(square, [3, 1, 2]))
print(results)  # [9, 1, 4]
```

L'ordine restituito non e quello di completamento: un primo risultato lento puo ritardare il consumo di quelli gia pronti. Gli errori vengono sollevati quando si consuma la posizione corrispondente; non ignorare l'iteratore pensando che with garantisca il successo.

Nella baseline 3.12 `Executor.map` raccoglie e invia gli input senza una finestra configurabile. `buffersize` e stato aggiunto in Python 3.14; non usarlo in codice dichiarato compatibile con 3.12. Per dati grandi vedi il demo limitato sotto.

Il with chiama shutdown con attesa: esce dopo il completamento dei lavori, ma non rilancia da solo le eccezioni contenute nei Future. Le risorse si chiudono anche quando il corpo solleva un errore; l'attesa puo durare a lungo.

## API / Sintassi

### submit, as_completed e associazione all'input

```python
from concurrent.futures import ThreadPoolExecutor, as_completed


def square_nonnegative(value):
    if type(value) is not int or value < 0:
        raise ValueError("atteso un intero non negativo")
    return value * value


def collect(values):
    outcomes = []
    with ThreadPoolExecutor(max_workers=2) as executor:
        pending = {
            executor.submit(square_nonnegative, value): index
            for index, value in enumerate(values)
        }
        for future in as_completed(pending):
            index = pending[future]
            try:
                result = future.result()
            except ValueError as error:
                outcomes.append((index, "error", str(error)))
            else:
                outcomes.append((index, "ok", result))
    return sorted(outcomes)


print(collect([2, -1, 3]))
# [(0, 'ok', 4), (1, 'error', 'atteso un intero non negativo'), (2, 'ok', 9)]
```

Il consumo avviene al completamento; solo la presentazione finale viene ordinata. Se piu Future sono gia pronti, non assumere un ordine fra loro. Il demo distingue un errore previsto; quelli inattesi propagano al chiamante.

- `result()` restituisce o rilancia l'errore del worker; se cancellato, solleva `concurrent.futures.CancelledError`.
- `exception()` consente di osservare l'errore invece di rilanciarlo; puo comunque attendere e sollevare per cancellazione/timeout.
- `done()` include successo, errore e cancellazione: non significa "riuscito".
- `wait(...)` restituisce insiemi done/not_done; non raccoglie da solo valori o eccezioni e non cancella gli altri.
- I callback devono essere brevi e gestire i propri errori; non assumere il thread dell'interfaccia grafica.

### Timeout e cancellazione non sono kill

Il solo worker resta occupato finche il main non apre un Event. Questo rende deterministica la differenza fra job in corso e job ancora accodato.

```python
from concurrent.futures import CancelledError, ThreadPoolExecutor
from threading import Event


def cancellation_demo():
    started = Event()
    release = Event()
    events = []

    def blocking():
        started.set()
        release.wait()
        return "finito"

    with ThreadPoolExecutor(max_workers=1) as executor:
        running = executor.submit(blocking)
        try:
            if not started.wait(timeout=5):
                raise TimeoutError("worker non avviato")
            queued = executor.submit(lambda: "non eseguito")
            events.append(("cancel queued", queued.cancel()))
            events.append(("cancel running", running.cancel()))
            try:
                running.result(timeout=0)
            except TimeoutError:
                events.append("attesa scaduta")
            try:
                queued.result()
            except CancelledError:
                events.append("accodato cancellato")
        finally:
            release.set()
    events.append(running.result())
    return events


print(cancellation_demo())
# [('cancel queued', True), ('cancel running', False),
#  'attesa scaduta', 'accodato cancellato', 'finito']
```

`Future.cancel` riesce solo se il lavoro non e gia in esecuzione o concluso. Nei process pool un lavoro puo diventare non cancellabile prima che la sua funzione cominci materialmente nel figlio.

`result(timeout=...)` limita quell'attesa: non cancella il lavoro. Uscire subito dopo dal with puo quindi attendere ancora il completamento. `shutdown(wait=False)` ritorna prima, ma non termina i job e non garantisce l'uscita immediata del programma.

`shutdown(cancel_futures=True)` cancella i job non ancora avviati, non quelli in corso. Per questi ultimi serve cooperazione, timeout nelle operazioni sottostanti o una strategia di processo distinta.

Il timeout di `map` e `as_completed` e relativo alla chiamata originale, non un nuovo budget per ciascun risultato. Quello di result e relativo a quella attesa. Una serie di result con lo stesso timeout puo consumare un tempo complessivo molto maggiore.

## Esempio pratico

### Limitare anche i lavori inviati

La funzione seguente mantiene al massimo limit Future non ancora consegnati al consumer. Smette di produrre nuovo lavoro quando il consumer si ferma. E un generatore sincrono: le sue attese non vanno eseguite nel thread di un event loop.

```python
from concurrent.futures import FIRST_COMPLETED, ThreadPoolExecutor, wait
from contextlib import closing
from itertools import islice


def bounded_results(executor, function, values, limit=4):
    if type(limit) is not int or limit < 1:
        raise ValueError("limit deve essere un intero positivo")
    inputs = enumerate(values)
    pending = {}
    try:
        for index, value in islice(inputs, limit):
            pending[executor.submit(function, value)] = index

        while pending:
            completed, _ = wait(pending, return_when=FIRST_COMPLETED)
            for future in completed:
                index = pending.pop(future)
                yield index, future.result()
                next_item = next(inputs, None)
                if next_item is not None:
                    next_index, value = next_item
                    pending[executor.submit(function, value)] = next_index
    finally:
        for future in pending:
            future.cancel()


def square(value):
    return value * value


with ThreadPoolExecutor(max_workers=2) as executor:
    with closing(bounded_results(executor, square, range(6), limit=3)) as results:
        collected = sorted(results)
print(collected)  # [(0, 0), (1, 1), (2, 4), (3, 9), (4, 16), (5, 25)]
```

Gli indici permettono di ricostruire l'ordine. Il contratto qui e fail-fast al consumo del primo errore osservato: la funzione non genera una scheda per ogni job fallito. Se il consumer interrompe con break, closing esegue il finally; il solo break non chiuderebbe il generatore.

La cancellazione finale non ferma i lavori gia in corso e il with esterno li attende. Non chiudere l'executor prima del generatore. Gli argomenti del generatore vengono validati alla prima iterazione, non quando lo crei.

E limitato il numero di job trattenuti, non il peso del singolo dato. Inoltre collected accumula tutti i risultati per mostrare l'output: per uso streaming consumali senza list/sorted globale.

## Varianti

### ProcessPoolExecutor con spawn

Questo blocco va eseguito come file .py: worker al livello del modulo e avvio protetto.

```python
import multiprocessing as mp
from concurrent.futures import ProcessPoolExecutor


def sum_squares(limit):
    if type(limit) is not int or limit < 0:
        raise ValueError("atteso un intero non negativo")
    return sum(value * value for value in range(limit))


def main():
    context = mp.get_context("spawn")
    with ProcessPoolExecutor(max_workers=2, mp_context=context) as executor:
        results = list(executor.map(sum_squares, [3, 4, 5], chunksize=1))
    return results


if __name__ == "__main__":
    print(main())  # [5, 14, 30]
```

Input, risultati e funzioni devono rispettare le regole di serializzazione/import. Lambda e funzioni locali non sono worker portabili. Non passare un client o una connessione aperta come se i processi condividessero memoria.

`chunksize` raggruppa input del process pool: puo ridurre overhead, ma cambia bilanciamento e granularita. Non ha effetto sul ThreadPoolExecutor. Un processo terminato bruscamente puo rendere inutilizzabile il pool e produrre BrokenProcessPool: non e un normale errore di validazione del job.

Con asyncio usa `run_in_executor` / `to_thread` o `wrap_future`, senza chiamare result bloccante nel loop. Ulteriori executor e API delle release successive richiedono una verifica di versione: questa nota non li considera eseguiti sulla baseline 3.12.

## Errori comuni

- Credere che max_workers limiti anche job e risultati accumulati.
- Non consumare i Future e perdere gli errori.
- Aspettarsi che with rilanci automaticamente gli errori dei task.
- Scambiare timeout/cancel per interruzione di un lavoro gia avviato.
- Far attendere a un worker un Future che richiede una risorsa occupata dallo stesso pool: rischio di deadlock.
- Chiamare API di Executor/Future dall'interno di un worker ProcessPoolExecutor: caso espressamente da evitare.
- Considerare map una garanzia di ordine degli effetti collaterali.
- Restituire oggetti enormi dai processi o condividere stato mutabile nei thread senza protocollo.

## Checklist

- Ho distinto parallelismo CPU, attese I/O e compatibilita dei client?
- Limito sia worker sia lavoro in attesa?
- Osservo tutti gli esiti importanti, compresi errori e cancellazioni?
- Il timeout riguarda l'attesa, l'operazione o l'intera procedura?
- Cosa succede ai lavori in corso se il consumer interrompe?
- Le funzioni dei processi sono importabili e i dati trasferibili?
- Ho misurato una baseline sequenziale prima di aumentare il pool?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Threading|Threading]]
- [[Programmazione/Python/Pagine/Multiprocessing|Multiprocessing]]
- [[Programmazione/Python/Pagine/Global Interpreter Lock|Global Interpreter Lock]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/Subprocess|Subprocess]]
- [[Programmazione/Python/Pagine/Generatori|Generatori e chiusura]]

## Fonti

- [Python 3.12: concurrent.futures](https://docs.python.org/3.12/library/concurrent.futures.html).
- [PEP 3148: modello Futures](https://peps.python.org/pep-3148/).
- [Python 3.12: multiprocessing](https://docs.python.org/3.12/library/multiprocessing.html).
- [Python 3.12: integrazione asyncio con thread ed executor](https://docs.python.org/3.12/library/asyncio-dev.html#running-blocking-code).
- [Python 3.14: map e buffersize](https://docs.python.org/3.14/library/concurrent.futures.html#concurrent.futures.Executor.map), verifica documentale, non baseline eseguita.

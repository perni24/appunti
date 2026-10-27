---
date: 2026-06-03
area: Programmazione
topic: Python
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - python
  - programming
  - concurrency
aliases:
  - Global Interpreter Lock
  - GIL
prerequisites: []
related: []
title: Global Interpreter Lock
---

# Global Interpreter Lock

## Sintesi

Nelle build tradizionali di CPython il GIL limita a un thread per volta l'esecuzione di codice Python nello stesso interprete. Non impedisce la concorrenza, non rende inutili i thread e **non protegge automaticamente gli invarianti dell'applicazione**.

Esempi verificati con **CPython 3.12.10 su Windows con GIL**. La sezione free-threaded descrive la documentazione ufficiale 3.13/3.14, non un runtime provato qui e non una dichiarazione dell'ultima versione disponibile.

## Problema che risolve

Il GIL protegge parti interne dell'interprete e la gestione degli oggetti. Per chi scrive applicazioni, conoscerlo serve a scegliere fra thread, processi, I/O asincrono e librerie native senza dedurre prestazioni dal solo numero di worker.

Occorre separare:

- **concorrenza**: piu attivita avanzano nello stesso intervallo;
- **parallelismo**: piu attivita vengono eseguite nello stesso istante;
- **correttezza**: gli accessi condivisi rispettano il contratto.

Un programma puo essere concorrente e scorretto anche senza parallelismo del bytecode.

## Concetto chiave

### CPU e I/O non hanno lo stesso comportamento

Nel medesimo interprete con GIL, due thread che eseguono calcoli Python non ottengono automaticamente due core di esecuzione Python parallela. Durante molte attese di I/O il runtime rilascia il GIL, permettendo ad altri thread di procedere.

Anche un'estensione nativa puo rilasciarlo durante un calcolo, ma dipende dall'operazione e dall'implementazione: “scritto in C” non basta.

```python
from concurrent.futures import ThreadPoolExecutor

def count(limit: int) -> int:
    total = 0
    for number in range(limit):
        total += number
    return total

with ThreadPoolExecutor(max_workers=2) as executor:
    results = list(executor.map(count, [100_000, 100_000]))
print(results)  # [4999950000, 4999950000]
```

Il blocco dimostra risultati e attesa dei worker, non un'accelerazione. Per confrontare prestazioni misura anche la versione sequenziale con lo stesso workload, considerando avvio, serializzazione e memoria.

### Il GIL non e un lock applicativo

Una sequenza “leggi, decidi, scrivi” puo essere interrotta. Il seguente controesempio forza due letture dello stesso valore tramite una barriera; non dipende dal caso fortuito che un incremento venga interrotto.

```python
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier, Lock

counter = 0
barrier = Barrier(2)

def unsafe_increment():
    global counter
    previous = counter
    barrier.wait(timeout=5)
    counter = previous + 1

with ThreadPoolExecutor(max_workers=2) as executor:
    futures = [executor.submit(unsafe_increment) for _ in range(2)]
    for future in futures:
        future.result()
lost_update = counter
print(lost_update)  # 1, non 2

counter = 0
lock = Lock()

def safe_increments():
    global counter
    for _ in range(1000):
        with lock:
            counter += 1

with ThreadPoolExecutor(max_workers=2) as executor:
    futures = [executor.submit(safe_increments) for _ in range(2)]
    for future in futures:
        future.result()
print(counter)  # 2000
```

Il lock protegge l'intera modifica condivisa. Non mettere la barriera dentro il lock: il primo thread aspetterebbe un secondo thread che non puo entrare. Il timeout della barriera serve a far emergere un guasto del demo, non a garantire il completamento del lavoro in cinque secondi.

## Dettagli importanti

### Scelta del modello

- I/O con API sincrone: thread o `ThreadPoolExecutor` possono sovrapporre le attese.
- I/O con API asincrone: `asyncio` organizza le attese cooperative; un calcolo bloccante continua a bloccare l'event loop.
- CPU Python con GIL: processi separati possono sfruttare piu core, con costi di comunicazione e memoria.
- CPU in librerie native: verifica rilascio del GIL e thread interni; troppi pool sovrapposti possono peggiorare il risultato.

Il lock non sostituisce code, ownership dei dati o protocolli di sincronizzazione. Non usare il comportamento osservato di un singolo bytecode come contratto di atomicita fra versioni.

### Build free-threaded e stato effettivo

CPython 3.13 ha introdotto build free-threaded sperimentali; in 3.14 hanno raggiunto lo stato supportato descritto dalla PEP 779. Non significa che tutte le installazioni siano senza GIL.

Una build capace di funzionare senza GIL puo eseguirsi con GIL attivo, anche per compatibilita con estensioni. Per questo configurazione della build e stato corrente sono informazioni diverse.

```python
import platform
import sys
import sysconfig

probe = getattr(sys, "_is_gil_enabled", None)
gil_enabled = probe() if probe is not None else None
build_flag = sysconfig.get_config_var("Py_GIL_DISABLED")

print(platform.python_implementation())
print(sys.version_info[:3])
print("free-threaded build:", build_flag)
print("GIL attivo:", gil_enabled)
```

`sys._is_gil_enabled()` e documentata per le versioni CPython che la espongono; sulla baseline 3.12 manca, percio `None` significa “questa sonda non e disponibile”, non “GIL disabilitato”. Non basare la correttezza dell'applicazione sulla sonda.

Anche senza GIL, protezioni interne di liste e dizionari non rendono transazionale una sequenza di operazioni. Controlla compatibilita di estensioni, accessi condivisi e benefici sul workload reale.

## Esempio

### Processi separati per un calcolo indipendente

Script completo `parallel_sum.py`. Usa esplicitamente `spawn` per rendere chiaro il requisito di importazione, senza dipendere dal metodo predefinito del sistema.

```python
from concurrent.futures import ProcessPoolExecutor
import multiprocessing

def count(limit: int) -> int:
    total = 0
    for number in range(limit):
        total += number
    return total

def main() -> list[int]:
    context = multiprocessing.get_context("spawn")
    with ProcessPoolExecutor(max_workers=2, mp_context=context) as executor:
        results = list(executor.map(count, [100_000, 100_000]))
    return results

if __name__ == "__main__":
    print(main())  # [4999950000, 4999950000]
```

Eseguilo come file, non incollandolo nel REPL:

```powershell
python parallel_sum.py
```

I worker importano il modulo: la guardia `__main__` evita di creare nuovi pool durante quell'importazione. Funzioni locali e lambda non sono sostituti generali di una funzione importabile. Dati e risultati devono poter attraversare il confine dei processi.

Ogni worker ha un interprete e memoria separati; aggiornare una lista ordinaria nel figlio non aggiorna quella del genitore. Questo piccolo demo prova il meccanismo, non e un benchmark a favore dei processi.

## Limiti

- Il GIL riguarda CPython e la sua configurazione, non tutte le implementazioni del linguaggio.
- Subinterpreti, estensioni native e build free-threaded hanno vincoli propri.
- Piu core non eliminano costi di serializzazione, lock, memoria o I/O.
- Le prove qui non collaudano una build free-threaded o un'estensione che rilascia il GIL.

## Errori comuni

- Dire “Python non ha thread” o “con il GIL non esistono race”.
- Aspettarsi scaling lineare dal solo numero di worker.
- Scambiare un'attesa asincrona per parallelismo CPU.
- Importare codice che avvia processi senza una guardia.
- Presentare una singola misura di durata come regola universale.

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Threading|Threading]]
- [[Programmazione/Python/Pagine/Multiprocessing|Multiprocessing]]
- [[Programmazione/Python/Pagine/Concurrent.futures|Concurrent.futures]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/Memory Management|Memory Management]]
- [[Programmazione/Python/Pagine/Profiling|Profiling]]

## Fonti

- [CPython 3.12: GIL, thread state e rilascio durante I/O](https://docs.python.org/3.12/c-api/init.html#thread-state-and-the-global-interpreter-lock).
- [Python 3.12: thread, Lock e Barrier](https://docs.python.org/3.12/library/threading.html).
- [Python 3.12: concurrent.futures e processi](https://docs.python.org/3.12/library/concurrent.futures.html).
- [Python 3.14: free threading e identificazione del runtime](https://docs.python.org/3.14/howto/free-threading-python.html).
- [PEP 703: GIL opzionale](https://peps.python.org/pep-0703/) e [PEP 779: stato supportato in 3.14](https://peps.python.org/pep-0779/).

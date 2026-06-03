---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming, concurrency]
aliases: [Multiprocessing, Processi Python]
prerequisites: []
related: []
---

# Multiprocessing in Python

## Sintesi

`multiprocessing` permette di eseguire piu processi Python separati. Ogni processo ha il proprio interprete, la propria memoria e il proprio GIL, quindi puo sfruttare piu core per carichi **CPU-bound**.

Il costo e maggiore rispetto ai thread: piu memoria, avvio piu lento e comunicazione piu complessa.

## Quando usarlo

Usa multiprocessing quando:

- il collo di bottiglia e la CPU;
- vuoi sfruttare piu core;
- i task sono abbastanza pesanti da giustificare l'overhead;
- i dati passati ai worker sono serializzabili;
- vuoi isolare lavoro rischioso in processi separati.

Per I/O-bound leggero, spesso bastano thread o `asyncio`.

## Come funziona

Processo manuale:

```python
import multiprocessing


def worker(value):
    print(value * 2)


if __name__ == "__main__":
    process = multiprocessing.Process(target=worker, args=(10,))
    process.start()
    process.join()
```

Il blocco `if __name__ == "__main__":` e essenziale, specialmente su Windows, per evitare creazioni ricorsive di processi.

## API / Sintassi

Pool di processi:

```python
from multiprocessing import Pool


def square(number):
    return number * number


if __name__ == "__main__":
    with Pool() as pool:
        results = pool.map(square, [1, 2, 3, 4])
        print(results)
```

Queue tra processi:

```python
from multiprocessing import Process, Queue


def worker(queue):
    queue.put("done")


if __name__ == "__main__":
    queue = Queue()
    process = Process(target=worker, args=(queue,))
    process.start()
    print(queue.get())
    process.join()
```

## Esempio pratico

Parallelizzare calcoli indipendenti:

```python
from multiprocessing import Pool


def count_primes(limit):
    count = 0
    for number in range(2, limit):
        for divisor in range(2, int(number ** 0.5) + 1):
            if number % divisor == 0:
                break
        else:
            count += 1
    return count


if __name__ == "__main__":
    limits = [20_000, 22_000, 24_000, 26_000]

    with Pool() as pool:
        results = pool.map(count_primes, limits)

    print(results)
```

Il lavoro e CPU-bound e ogni input puo essere calcolato indipendentemente.

## Varianti

- **`Process`**: controllo esplicito su singoli processi.
- **`Pool`**: distribuisce task omogenei su processi worker.
- **`Queue` e `Pipe`**: comunicazione tra processi.
- **`Value` e `Array`**: memoria condivisa semplice.
- **`ProcessPoolExecutor`**: API piu moderna tramite `concurrent.futures`.
- **Worker esterni**: per sistemi piu grandi, code come Celery o task queue dedicate.

## Errori comuni

- Dimenticare `if __name__ == "__main__":`.
- Passare funzioni lambda o oggetti non picklable ai processi.
- Usare multiprocessing per task troppo piccoli.
- Creare troppi processi rispetto ai core e alla RAM.
- Condividere grandi quantita di dati tra processi senza considerare serializzazione.
- Aspettarsi memoria condivisa come nei thread.
- Ignorare eccezioni nei worker.

## Checklist

- Il carico e CPU-bound?
- I task sono abbastanza grandi?
- I dati sono picklable?
- Il codice ha il guard `if __name__ == "__main__":`?
- Il numero di processi e ragionevole?
- Il costo di serializzazione e accettabile?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Global Interpreter Lock]]
- [[Concurrent.futures]]
- [[Threading]]
- [[Profiling]]
- [[Memory Management]]

---
date: 2026-06-03
area: Programmazione
topic: Python
type: theory-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming, concurrency]
aliases: [Global Interpreter Lock, GIL]
prerequisites: []
related: []
---

# Global Interpreter Lock

## Sintesi

Il Global Interpreter Lock, o GIL, e un meccanismo di CPython che permette a un solo thread alla volta di eseguire bytecode Python nello stesso processo.

Il GIL non rende i thread inutili: limita soprattutto il parallelismo dei task CPU-bound. Per task I/O-bound, i thread restano spesso utili.

## Quando usarlo

Devi capire il GIL quando:

- scegli tra thread, processi e asyncio;
- vuoi velocizzare codice CPU-bound;
- un programma multithread non scala sui core;
- lavori con librerie native che rilasciano il GIL;
- devi spiegare perche `threading` non sempre aumenta le performance.

## Come funziona

In CPython, molti dettagli interni dell'interprete e del memory management sono protetti dal GIL. Questo semplifica l'implementazione, ma impedisce a piu thread nello stesso processo di eseguire contemporaneamente bytecode Python puro.

Thread CPU-bound:

```python
import threading


def count():
    total = 0
    for _ in range(10_000_000):
        total += 1


threads = [threading.Thread(target=count) for _ in range(2)]

for thread in threads:
    thread.start()

for thread in threads:
    thread.join()
```

Questo non raddoppia automaticamente la velocita su due core.

## API / Sintassi

Il GIL non e una API da chiamare nel codice quotidiano. E un vincolo dell'implementazione CPython da considerare nelle scelte architetturali.

Scelte pratiche:

```text
I/O-bound + librerie sync     -> threading / ThreadPoolExecutor
I/O-bound + librerie async    -> asyncio
CPU-bound Python puro         -> multiprocessing / ProcessPoolExecutor
CPU-bound con librerie native -> NumPy, estensioni C/Rust, librerie che rilasciano il GIL
```

## Esempio pratico

Per lavoro CPU-bound, passare a processi separati puo sfruttare piu core:

```python
from concurrent.futures import ProcessPoolExecutor


def count(limit):
    total = 0
    for number in range(limit):
        total += number
    return total


if __name__ == "__main__":
    with ProcessPoolExecutor() as executor:
        results = list(executor.map(count, [10_000_000, 10_000_000]))

    print(results)
```

Ogni processo ha il proprio interprete e quindi il proprio GIL.

## Varianti

- **Threading**: utile per I/O-bound, limitato per CPU-bound.
- **Multiprocessing**: aggira il limite usando processi separati.
- **Asyncio**: evita molti thread per alta concorrenza I/O.
- **Librerie native**: alcune rilasciano il GIL durante calcoli intensivi.
- **Implementazioni Python diverse**: il tema riguarda soprattutto CPython.

## Errori comuni

- Pensare che Python non supporti thread.
- Pensare che il GIL renda inutili tutti i thread.
- Usare thread per CPU-bound aspettandosi scaling lineare.
- Ignorare race condition perche "tanto c'e il GIL".
- Ottimizzare contro il GIL senza prima fare profiling.
- Usare multiprocessing senza considerare serializzazione e memoria.

## Checklist

- Il collo di bottiglia e CPU, I/O o memoria?
- Sto usando CPython?
- I thread stanno aspettando I/O o facendo calcolo puro?
- Serve parallelismo reale sui core?
- Multiprocessing ha overhead accettabile?
- Una libreria nativa o un algoritmo migliore risolverebbe prima del parallelismo?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Threading]]
- [[Multiprocessing]]
- [[Concurrent.futures]]
- [[Asyncio]]
- [[Memory Management]]
- [[Profiling]]

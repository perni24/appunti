---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming, performance]
aliases: [Profiling]
prerequisites: []
related: []
---

# Profiling in Python

## Sintesi

Il profiling misura dove un programma consuma tempo o memoria. Serve a individuare i veri colli di bottiglia invece di ottimizzare sulla base di intuizioni.

La regola pratica e: misura, cambia una cosa, misura di nuovo.

## Quando usarlo

Usa profiling quando:

- una funzione e lenta su input realistici;
- un'applicazione consuma troppa memoria;
- vuoi capire hot path e numero di chiamate;
- stai valutando un'ottimizzazione;
- devi distinguere CPU, I/O, memoria e attese esterne.

## Come funziona

`cProfile` misura tempo e chiamate delle funzioni:

```python
import cProfile


def compute():
    total = 0
    for number in range(1_000_000):
        total += number
    return total


cProfile.run("compute()")
```

Per report piu leggibili si usa `pstats`:

```python
import cProfile
import pstats


profiler = cProfile.Profile()
profiler.enable()
compute()
profiler.disable()

stats = pstats.Stats(profiler)
stats.sort_stats("cumtime").print_stats(10)
```

## API / Sintassi

Micro-benchmark con `timeit`:

```python
import timeit

elapsed = timeit.timeit("sum(range(1000))", number=10_000)
print(elapsed)
```

Profiling memoria con `tracemalloc`:

```python
import tracemalloc

tracemalloc.start()

data = [number for number in range(100_000)]

snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics("lineno")

for stat in top_stats[:5]:
    print(stat)
```

Metriche da leggere:

- **tempo totale**: tempo speso direttamente in una funzione;
- **tempo cumulativo**: tempo della funzione piu quello delle funzioni chiamate;
- **numero chiamate**: quante volte una funzione viene eseguita;
- **allocazioni**: dove cresce la memoria.

## Esempio pratico

Workflow pragmatico:

```python
import cProfile
import pstats


def main():
    # Esegui qui il caso reale da misurare.
    ...


profiler = cProfile.Profile()
profiler.enable()
main()
profiler.disable()

pstats.Stats(profiler).sort_stats("cumtime").print_stats(20)
```

Dopo aver individuato il collo di bottiglia, modifica solo quella parte e riesegui lo stesso profiling per confrontare prima e dopo.

## Varianti

- **`cProfile`**: quadro generale sulle funzioni.
- **`pstats`**: ordinamento e lettura dei risultati.
- **`timeit`**: confronto di snippet piccoli.
- **`tracemalloc`**: allocazioni di memoria.
- **Benchmark applicativo**: misura end-to-end su input realistici.
- **Profiling I/O**: logging e metriche possono aiutare quando il costo e rete, disco o database.

## Errori comuni

- Ottimizzare prima di misurare.
- Usare input troppo piccoli o non realistici.
- Guardare solo tempo totale ignorando tempo cumulativo.
- Fidarsi di un singolo run rumoroso.
- Migliorare micro-benchmark senza effetto sul programma reale.
- Aumentare complessita per ottimizzare codice non critico.
- Confondere lentezza CPU con attese di rete, database o filesystem.

## Checklist

- Il problema e definito in modo misurabile?
- L'input del profiling e realistico?
- Ho una baseline prima della modifica?
- Sto misurando CPU, memoria o I/O?
- Il cambiamento migliora davvero il caso reale?
- Esistono test per evitare regressioni di correttezza?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Memory Management]]
- [[Caching]]
- [[Generatori]]
- [[Logging]]
- [[Programmazione/Python/Pagine/Testing|Testing]]

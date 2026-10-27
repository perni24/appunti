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
  - performance
aliases:
  - Profiling
prerequisites: []
related: []
title: Profiling in Python
---

# Profiling in Python

## Sintesi

Il profiling individua dove un programma spende lavoro; il benchmark misura quanto costa un caso definito. Sono strumenti complementari, non sinonimi. Un profiler introduce overhead e puo cambiare il rapporto apparente fra codice Python e codice nativo.

Prima definisci il problema: latenza, throughput, CPU, memoria, startup oppure attesa di un servizio. Conserva input, versione, configurazione e criterio di correttezza; modifica una cosa alla volta.

Baseline: **CPython 3.12.10 su Windows**, py-spy **0.4.2**. I tempi stampati sono misure locali, non valori attesi o prove di accelerazione.

## Quando usarlo

- Una funzione e lenta su input rappresentativi.
- Servono dati per scegliere fra cambio di algoritmo, cache, parallelismo o codice nativo.
- Il numero di chiamate cresce in modo inatteso.
- La memoria aumenta durante il ciclo di vita dell'applicazione.

Un profilo CPU non descrive da solo query lente, lock, traffico o coda di richieste. Correlalo con metriche e log del sistema osservato, senza inserire segreti nei report.

## Come funziona

### Caso riproducibile: profile_demo.py

Questo file completo simula una trasformazione CPU-bound in memoria. L'opzione seconds prolunga il carico per il sampling; non rappresenta un obiettivo di prestazioni.

```python
import argparse
import math
from time import perf_counter


def transform_batch(rows):
    return sum(len(text.strip().casefold()) for text in rows)


def workload(seconds=0):
    if not math.isfinite(seconds) or seconds < 0:
        raise ValueError("seconds deve essere finito e non negativo")
    rows = [" Alpha ", "BETA", " gamma "] * 1000
    deadline = perf_counter() + seconds
    rounds = 0
    while True:
        result = transform_batch(rows)
        rounds += 1
        if perf_counter() >= deadline:
            return result, rounds


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--seconds", type=float, default=0)
    args = parser.parse_args()
    print(workload(args.seconds))


if __name__ == "__main__":
    main()
```

Il risultato del batch e 14000; il numero di round varia. Input e stampa fanno parte dell'esecuzione globale, ma non del solo transform_batch. Il modulo importato non avvia il carico.

### cProfile e pstats

Dalla directory contenente quel file, questi sono **comandi separati**. Il primo esegue realmente il programma e scrive un artefatto: scegli un percorso che non contenga un profilo da conservare.

```powershell
python -m cProfile -o profile.pstats profile_demo.py --seconds 1
```

Il comando successivo apre la console interattiva di pstats:

```powershell
python -m pstats profile.pstats
```

Nella console usa `sort cumulative` e poi `stats 15`; `quit` esce. Per un report non interattivo usa invece questo script, nello stesso progetto:

```python
import cProfile
import pstats

from profile_demo import workload

profiler = cProfile.Profile()
result = profiler.runcall(workload)
stats = pstats.Stats(profiler)
stats.strip_dirs().sort_stats(pstats.SortKey.CUMULATIVE).print_stats(15)
print(result)
```

`runcall` restituisce il risultato della funzione. Le colonne distinguono:

| Campo   | Lettura                                                                           |
| ------- | --------------------------------------------------------------------------------- |
| ncalls  | Numero di chiamate; nelle ricorsioni puo distinguere chiamate totali e primitive. |
| tottime | Tempo nella funzione, escluso quello attribuito alle sottochiamate.               |
| cumtime | Tempo inclusivo delle sottochiamate. Non sommare i cumtime di tutta la tabella.   |
| percall | Media per chiamata secondo la colonna; non e un percentile di latenza.            |

Il timer predefinito non va interpretato come CPU esclusiva. Profila il thread/processo interessato: un singolo Profile non certifica tutti i thread o figli. Una chiamata nativa puo apparire come un unico blocco; non dedurne quali istruzioni interne costino.

## API / Sintassi

### Benchmark locale con timeit

Esempio autonomo: due algoritmi sommano valori per categoria. Prima si controlla che restituiscano gli stessi risultati.

```python
from collections import defaultdict
from timeit import repeat


def grouped_scan(rows):
    keys = {key for key, _ in rows}
    return {key: sum(value for item, value in rows if item == key) for key in keys}


def single_pass(rows):
    totals = defaultdict(int)
    for key, value in rows:
        totals[key] += value
    return dict(totals)


rows = [(index % 20, index) for index in range(1000)]
assert grouped_scan(rows) == single_pass(rows)

number = 50
measurements = {}
for function in (grouped_scan, single_pass):
    samples = repeat(lambda: function(rows), repeat=5, number=number)
    measurements[function.__name__] = [sample / number for sample in samples]
print(measurements)
```

Ogni campione restituito da repeat misura number esecuzioni: dividere produce secondi medi per chiamata in quel campione. Con k categorie, grouped_scan rilegge i dati k volte; single_pass li percorre una volta. Il test di equivalenza precede qualunque conclusione sui tempi.

timeit disabilita normalmente il garbage collector ciclico durante la misura. Se il carico lo richiede, riabilitalo nel setup. Preparazione dei dati, cache calda/fredda, I/O escluso e dimensione degli input vanno dichiarati. Il minimo puo suggerire il costo con meno interferenze, ma non e la latenza tipica o il p95 di un servizio.

### Tempo trascorso e tempo CPU

```python
from time import perf_counter, process_time, sleep

wall_start = perf_counter()
cpu_start = process_time()
sleep(0.02)
wall_elapsed = perf_counter() - wall_start
cpu_elapsed = process_time() - cpu_start
print({"wall_seconds": wall_elapsed, "cpu_seconds": cpu_elapsed})
```

perf_counter misura tempo trascorso monotono; process_time misura CPU del processo, escludendo l'attesa di sleep e senza aggregare automaticamente i figli. Il demo mostra cosa si misura: non asserire un rapporto preciso fra i valori su macchine diverse.

## Esempio pratico

### Memoria: crescita trattenuta e picco

```python
import tracemalloc

tracemalloc.start()
try:
    before = tracemalloc.take_snapshot()
    buffers = [bytearray(1024) for _ in range(200)]
    after = tracemalloc.take_snapshot()
    differences = after.compare_to(before, "lineno")
    current, peak = tracemalloc.get_traced_memory()
    print({"current": current, "peak": peak})
    for entry in differences[:3]:
        print(entry)
finally:
    tracemalloc.stop()
```

Una differenza fra snapshot mostra allocazioni tracciate ancora presenti, non tutte le allocazioni avvenute e gia liberate. Tracemalloc non misura l'intera RSS, la memoria di ogni libreria nativa o la memoria restituita al sistema. Va avviato prima della parte osservata; anche il profiler consuma memoria. Per ownership e GC vedi Memory Management.

### Sampling con py-spy

Installazione opzionale in un ambiente dedicato:

```powershell
python -m pip install "py-spy==0.4.2"
```

Registra solo il programma dimostrativo, dalla directory di profile_demo.py:

```powershell
py-spy record --subprocesses --rate 100 --output profile.svg -- python profile_demo.py --seconds 3
```

Il sampling osserva periodicamente stack e attivita, con overhead ma senza inserire chiamate nel sorgente. La larghezza di un frame nel flame graph rappresenta campioni, non l'ordine temporale delle chiamate o una misura esatta di ogni invocazione. Funzioni brevissime possono non comparire.

Per osservazione live esiste `py-spy top --pid PID`; per una fotografia `py-spy dump --pid PID`. PID va sostituito con quello di un processo che sei autorizzato a ispezionare. Permessi, sistema e policy possono impedirlo: non disabilitare protezioni per aggirare il problema. L'osservazione di processi estranei al demo non fa parte della verifica di questa nota.

`--subprocesses` include i processi Python figli: su Windows e importante anche quando il python.exe del virtualenv avvia l'interprete reale tramite un processo launcher. Senza questa opzione py-spy puo non riconoscere il launcher come interprete. Il profiling del solo padre non equivale a quello dell'intero albero. L'opzione `--native` ha ulteriori limiti di piattaforma e non e verificata qui.

## Varianti

- Profilo deterministico per chiamate e relazioni fra funzioni.
- Sampling per carichi continuativi e panoramica degli stack.
- Benchmark end-to-end per il percorso realmente percepito dall'utente.
- Profiling memoria distinto da profiling CPU.
- Test di carico per concorrenza e percentili, non sostituibile da timeit.

## Errori comuni

- Ottimizzare sulla base di un solo run o input troppo piccolo.
- Usare il profiler per dichiarare che C e piu veloce di Python.
- Sommare tempi inclusivi e contare piu volte le stesse attese.
- Misurare sempre una cache calda quando il problema e lo startup.
- Eliminare controlli o cambiare precisione per migliorare un numero.
- Confrontare esecuzioni con build, altri carichi o configurazioni differenti.

## Checklist

- Criterio di correttezza e metrica sono espliciti?
- Input e ambiente sono riproducibili?
- Sto misurando wall time, CPU, allocazioni o RSS?
- Sono inclusi setup, warm-up, figli e I/O rilevanti?
- Ho ripetuto e osservato variabilita, non solo un valore?
- L'ottimizzazione migliora il percorso applicativo senza peggiorare la manutenzione?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Memory Management|Memory Management]]
- [[Programmazione/Python/Pagine/Caching|Caching]]
- [[Programmazione/Python/Pagine/Generatori|Generatori]]
- [[Programmazione/Python/Pagine/Logging|Logging]]
- [[Programmazione/Python/Pagine/Testing|Testing]]

## Fonti

- [Python 3.12: profiler e pstats](https://docs.python.org/3.12/library/profile.html).
- [Python 3.12: timeit](https://docs.python.org/3.12/library/timeit.html).
- [Python 3.12: orologi](https://docs.python.org/3.12/library/time.html).
- [Python 3.12: tracemalloc](https://docs.python.org/3.12/library/tracemalloc.html).
- [py-spy: documentazione e limitazioni ufficiali](https://github.com/benfred/py-spy).

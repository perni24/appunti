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
  - memory
aliases:
  - Memory Management
prerequisites: []
related: []
title: Memory Management in Python
---

# Memory Management in Python

## Sintesi

La memoria automatica elimina molte operazioni manuali, non la responsabilita di controllare quali oggetti restano raggiungibili. Una cache senza limiti puo crescere pur senza alcun difetto del garbage collector.

Riferimento: Python 3.12, esempi verificati con **CPython 3.12.10 su Windows**, non indicazione dell'ultima patch disponibile. Reference counting, allocator e tempi di distruzione descrivono CPython, non un obbligo di tutte le implementazioni Python.

## Problema che risolve

Serve per distinguere quattro problemi diversi:

- alias e mutazioni dello stesso oggetto;
- oggetti ancora raggiungibili che l'applicazione non usa piu;
- cicli non raggiungibili da raccogliere;
- risorse esterne da chiudere esplicitamente.

Prima di “forzare il GC”, identifica quale problema stai osservando.

## Concetto chiave

### Nomi, riferimenti e del

L'assegnazione collega un nome a un oggetto; non crea necessariamente una copia. Anche liste, dizionari, closure, frame e attributi possono mantenere riferimenti.

```python
numbers = [1, 2, 3]
alias = numbers
alias.append(4)
del numbers
print(alias)  # [1, 2, 3, 4]
```

`del numbers` elimina quel binding, non l'oggetto raggiunto da `alias`. Analogamente, rimuovere una voce da una lista elimina un riferimento, non tutti quelli esistenti.

In CPython il conteggio dei riferimenti gestisce molti casi senza cicli; il collector ciclico cerca gruppi non piu raggiungibili. Alcuni oggetti hanno trattamenti speciali, come gli oggetti immortali: non costruire logica applicativa sul numero esatto di riferimenti o sull'istante della distruzione.

### Un ciclo non e automaticamente un leak

```python
import gc
import weakref

class Node:
    def __init__(self):
        self.other = None

def make_cycle():
    first, second = Node(), Node()
    first.other = second
    second.other = first
    return weakref.ref(first), weakref.ref(second)

first_ref, second_ref = make_cycle()
gc.collect()
print(first_ref() is None, second_ref() is None)  # True True su questa baseline
```

I riferimenti deboli non mantengono vivi gli oggetti. Il demo richiede una raccolta esplicita e osserva due oggetti semplici; non promette lo stesso comportamento con finalizer, resurrezione o altri interpreti. Non testa quanta RAM torni al sistema operativo.

## Dettagli importanti

### Dimensione dell'oggetto, allocazioni e RAM del processo

```python
import sys

payload = bytearray(100_000)
items = [payload, payload]
container_bytes = sys.getsizeof(items)
payload_bytes = sys.getsizeof(payload)
print(container_bytes)
print(payload_bytes)
print(items[0] is items[1])  # True
```

`getsizeof` misura la dimensione attribuita a quell'oggetto, non tutta la struttura raggiungibile. Sommare ricorsivamente senza deduplicare conterebbe due volte `payload`; cicli e memoria nativa complicano ulteriormente la misura.

`sys.getrefcount(obj)` include un riferimento temporaneo dovuto alla chiamata e non e una misura della memoria. `gc.get_stats()` descrive l'attivita del collector, non i byte occupati dall'applicazione.

L'allocator puo trattenere memoria per riuso e soffrire frammentazione: oggetti raccolti non implicano un calo immediato della RSS. Per estensioni native, mmap e buffer esterni possono servire strumenti aggiuntivi.

### Memoria e risorse non sono sinonimi

File, socket, transazioni e lock hanno un ciclo di vita esplicito. Usa `with` o `try/finally`, non `__del__` come garanzia di cleanup. Anche un generatore sospeso puo tenere aperto un file.

```python
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory

def read_lines(path):
    with open(path, encoding="utf-8") as file:
        for line in file:
            yield line.rstrip("\n")

with TemporaryDirectory() as directory:
    path = Path(directory) / "lines.txt"
    path.write_text("alpha\nbeta\n", encoding="utf-8")
    with closing(read_lines(path)) as lines:
        first = next(lines)
        print(first)  # alpha
    print(list(lines))  # []: generatore chiuso anche dopo consumo parziale
```

`break` da solo non chiude un generatore ancora referenziato. `closing` rende esplicita la chiusura del demo; per la spiegazione completa vedi [[Programmazione/Python/Pagine/Context Managers|Context Managers]].

## Esempio

### Una cache raggiungibile ha bisogno di una politica

```python
from functools import lru_cache

results_cache = {}

def store_result(key, value):
    results_cache[key] = value

store_result("first", bytearray(10_000))
results_cache.clear()  # rimuove questi riferimenti; non eventuali alias esterni

@lru_cache(maxsize=2)
def compute_report(user_id: int) -> str:
    return f"report for {user_id}"

compute_report(1)
compute_report(2)
compute_report(1)
compute_report(3)
info = compute_report.cache_info()
print(info.hits, info.misses, info.currsize)  # 1 3 2
compute_report.cache_clear()
```

`lru_cache` trattiene argomenti e risultati. `maxsize` limita le voci, non i byte, non e una scadenza e non aggiorna automaticamente dati obsoleti. Restituire un oggetto mutabile dalla cache puo condividerlo fra chiamanti.

### Osservare le allocazioni con tracemalloc

Esegui il blocco in un processo di prova: avvia e arresta una sessione di tracing propria.

```python
import tracemalloc

tracemalloc.start(5)
try:
    before = tracemalloc.take_snapshot()
    retained = [bytearray(4096) for _ in range(20)]
    after = tracemalloc.take_snapshot()
    changes = after.compare_to(before, "lineno")
    current, peak = tracemalloc.get_traced_memory()
    print(current > 0, peak >= current)  # True True
    for change in changes[:3]:
        print(change)
    retained.clear()
finally:
    tracemalloc.stop()
```

Gli snapshot confrontano blocchi tracciati ancora allocati, non tutti quelli creati e gia liberati fra le misure. Avvia il tracing prima del lavoro da osservare. Numeri e righe dipendono dall'esecuzione; la crescita del demo e intenzionale, non prova un leak.

Per una diagnosi reale ripeti un workload rappresentativo, considera il riscaldamento delle cache e cerca crescita persistente. `tracemalloc` non sostituisce una misura della memoria totale del processo.

## Limiti

- I generatori riducono la materializzazione, ma possono trattenere sorgente, frame e risorse.
- Le weak reference non sono una politica di disponibilita dei dati: il target puo sparire.
- Le modalita debug come `gc.DEBUG_SAVEALL` mantengono oggetti in `gc.garbage` e alterano l'osservazione.
- Soglie, generazioni e allocator possono cambiare fra versioni: non trasferire tuning 3.12 a build free-threaded senza verificarlo.

## Errori comuni

- Interpretare `del` o `gc.collect()` come “svuota la RAM”.
- Cercare cicli mentre una lista globale mantiene tutti i risultati.
- Misurare solo `getsizeof` del contenitore.
- Tenere traceback, frame, callback o cache senza comprenderne i riferimenti.
- Affidare il rilascio di un file al momento in cui il GC decidera di intervenire.

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Generatori|Generatori]]
- [[Programmazione/Python/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Python/Pagine/Context Managers|Context Managers]]
- [[Programmazione/Python/Pagine/Caching|Caching]]
- [[Programmazione/Python/Pagine/Profiling|Profiling]]
- [[Programmazione/Python/Pagine/Global Interpreter Lock|Global Interpreter Lock]]

## Fonti

- [Python 3.12: oggetti, identita e durata](https://docs.python.org/3.12/reference/datamodel.html#objects-values-and-types).
- [Python 3.12: gc](https://docs.python.org/3.12/library/gc.html) e [weakref](https://docs.python.org/3.12/library/weakref.html).
- [Python 3.12: getsizeof e getrefcount](https://docs.python.org/3.12/library/sys.html).
- [Python 3.12: tracemalloc](https://docs.python.org/3.12/library/tracemalloc.html).
- [CPython 3.12: memory manager e allocator](https://docs.python.org/3.12/c-api/memory.html).
- [Python 3.12: lru_cache](https://docs.python.org/3.12/library/functools.html#functools.lru_cache).

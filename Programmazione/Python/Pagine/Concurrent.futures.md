---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Concurrent.futures]
prerequisites: []
related: []
---
# Concurrent.futures in Python

## Sintesi

Nota su Concurrent.futures in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
Il modulo **`concurrent.futures`** fornisce un'interfaccia ad alto livello per l'esecuzione asincrona di task. Utilizza il concetto di **Executor**, un oggetto che gestisce un pool di thread o di processi, astraendo la complessità di gestione manuale presente nei moduli `threading` e `multiprocessing`.

> [!INFO]
> È la soluzione consigliata per la maggior parte dei casi d'uso moderni in cui è necessario eseguire task paralleli senza gestire esplicitamente il ciclo di vita di ogni singolo thread o processo.

---

##  Sintassi
Esistono due classi principali: `ThreadPoolExecutor` (per task I/O-bound) e `ProcessPoolExecutor` (per task CPU-bound).

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

# Concurrent.futures in Python

## Sintesi

Nota su Concurrent.futures in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
with ThreadPoolExecutor(max_workers=5) as executor:
    # Invio di un task
    future = executor.submit(my_function, arg1, arg2)
    
    # Recupero del risultato (bloccante fino al completamento)
    result = future.result()
```

---

##  Esempi Pratici

### Esempio Base: Utilizzo di `map`
`executor.map` funziona in modo simile alla funzione `map` integrata, ma esegue le chiamate in parallelo.

```python
from concurrent.futures import ThreadPoolExecutor
import time

def download_site(url):
    print(f"Scaricando {url}...")
    time.sleep(2) # Simula I/O di rete
    return f"Contenuto di {url}"

urls = ["site-A.com", "site-B.com", "site-C.com"]

if __name__ == "__main__":
    with ThreadPoolExecutor() as executor:
        # map ritorna un generatore con i risultati nell'ordine originale
        results = list(executor.map(download_site, urls))
    
    print(f"Completato: {results}")
```

### Esempio Avanzato: `as_completed`
`as_completed` permette di elaborare i risultati non appena ogni task finisce, indipendentemente dall'ordine di invio.

```python
from concurrent.futures import ProcessPoolExecutor, as_completed

def heavy_task(n):
    return sum(i * i for i in range(10**n))

if __name__ == "__main__":
    with ProcessPoolExecutor() as executor:
        # Crea una mappa tra Future e l'input originale
        future_to_n = {executor.submit(heavy_task, n): n for n in [5, 7, 6]}
        
        for future in as_completed(future_to_n):
            n = future_to_n[future]
            try:
                data = future.result()
                print(f"Task n={n} terminato con risultato: {data}")
            except Exception as exc:
                print(f"Task n={n} ha generato un'eccezione: {exc}")
```

---

##  Funzionamento Interno (Teoria)
- **Executor:** Gestisce la coda dei task e il ciclo di vita dei worker.
- **Future:** Rappresenta il risultato di un'operazione asincrona che non è ancora stata completata. Permette di interrogare lo stato del task (`running()`, `done()`, `cancelled()`).
- **Abstrazione:** Sotto il cofano, `ThreadPoolExecutor` usa `threading` e `ProcessPoolExecutor` usa `multiprocessing`. L'API unificata permette di passare da thread a processi cambiando solo il nome della classe dell'Executor.

---

##  Best Practices & "Gotchas"
-  **Da fare:** Usa sempre il Context Manager (`with`) per garantire che tutte le risorse vengano liberate correttamente.
-  **Da fare:** Gestisci le eccezioni richiamando `future.result()`; se un task fallisce, l'eccezione viene sollevata in quel momento.
-  **Da evitare:** Non usare `ProcessPoolExecutor` per task estremamente brevi; l'overhead della creazione dei processi supererà il guadagno in termini di tempo.
-  **Interazione con GIL:** Come per il threading standard, `ThreadPoolExecutor` è limitato dal [[Programmazione/Python/Pagine/Global Interpreter Lock|GIL]] per task CPU-bound.
-  **Deadlock:** Fare attenzione se un task inviato all'executor tenta di inviare altri task allo stesso executor (rischio di saturazione del pool).

---

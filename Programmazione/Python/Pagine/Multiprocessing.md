---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Multiprocessing]
prerequisites: []
related: []
---
# Multiprocessing in Python

## Sintesi

Nota su Multiprocessing in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
Il **Multiprocessing** è una tecnica che permette di eseguire più processi indipendenti contemporaneamente, ciascuno con la propria istanza dell'interprete Python e il proprio spazio di memoria. A differenza del [[Programmazione/Python/Pagine/Threading]], il multiprocessing permette di superare i limiti del [[Programmazione/Python/Pagine/Global Interpreter Lock|GIL]], rendendolo la scelta ideale per operazioni **CPU-bound** (calcoli intensivi).

> [!INFO]
> Ogni processo ha il suo ID (PID) e la sua memoria privata. La comunicazione tra processi è più lenta rispetto ai thread perché richiede meccanismi di IPC (Inter-Process Communication).

---

##  Sintassi
Il modulo standard è `multiprocessing`.

```python
import multiprocessing

# Multiprocessing in Python

## Sintesi

Nota su Multiprocessing in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
def worker_function(data):
    # Logica computazionale
    return data * 2

if __name__ == "__main__":
    # Creazione del processo
    p = multiprocessing.Process(target=worker_function, args=(10,))
    
    # Avvio
    p.start()
    
    # Attesa
    p.join()
```

---

##  Esempi Pratici

### Esempio Base: Parallelismo Reale
Calcolo di numeri pesanti utilizzando più core della CPU.

```python
import multiprocessing
import time

def heavy_calculation(n):
    result = 0
    for i in range(10**7):
        result += i
    print(f"Processo {n} completato.")

if __name__ == "__main__":
    processes = []
    start_time = time.time()

    for i in range(4): # Avvia 4 processi
        p = multiprocessing.Process(target=heavy_calculation, args=(i,))
        processes.append(p)
        p.start()

    for p in processes:
        p.join()

    print(f"Tempo totale: {time.time() - start_time:.2f} secondi")
```

### Esempio Avanzato: Utilizzo di Pool
Il `Pool` permette di gestire facilmente un gruppo di worker e distribuire i task.

```python
from multiprocessing import Pool

def square(n):
    return n * n

if __name__ == "__main__":
    numbers = [1, 2, 3, 4, 5]
    
    # Crea un pool di processi (default: numero di core della CPU)
    with Pool() as p:
        results = p.map(square, numbers)
    
    print(f"Risultati: {results}")
```

---

##  Funzionamento Interno (Teoria)
- **Gestione Memoria:** Ogni processo ha la sua memoria dedicata (heap e stack). Non c'è rischio di race condition su variabili globali (perché non sono condivise), ma la condivisione di dati richiede oggetti speciali come `Queue`, `Pipe` o `Value/Array`.
- **Bypass del GIL:** Poiché ogni processo ha il proprio interprete Python, ogni processo ha il proprio GIL. Questo permette l'esecuzione parallela effettiva su sistemi multi-core.
- **Overhead:** La creazione di un processo è più costosa (in termini di tempo e RAM) rispetto a quella di un thread. È consigliato per task lunghi e intensivi, non per migliaia di task brevi.

---

##  Best Practices & "Gotchas"
-  **Da fare:** Usa `if __name__ == "__main__":` per evitare ricorsioni infinite nella creazione dei processi (specialmente su Windows).
-  **Da fare:** Usa `Pool` quando devi eseguire lo stesso task su una collezione di dati.
-  **Da evitare:** Non usare il multiprocessing per task I/O-bound leggeri; l'overhead della creazione del processo supererebbe i benefici.
-  **Pickling Error:** I dati passati ai processi devono essere "serializzabili" (picklable). Alcuni oggetti complessi o funzioni lambda potrebbero fallire.
-  **Memoria:** Se crei troppi processi, potresti esaurire rapidamente la RAM disponibile.

---

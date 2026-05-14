---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Global Interpreter Lock (GIL)]
prerequisites: []
related: []
---
# Global Interpreter Lock (GIL)

## Sintesi

Nota su Global Interpreter Lock (GIL) in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
Il **Global Interpreter Lock**, o **GIL**, e un meccanismo presente in **CPython** che permette a **un solo thread alla volta** di eseguire bytecode Python all'interno dello stesso processo.

Questo significa che, anche se un programma Python crea piu thread, i thread non eseguono davvero codice Python in parallelo sui core della CPU quando il lavoro e **CPU-bound**.

> [!INFO] Il GIL non blocca tutto il programma
> Il GIL non impedisce l'uso dei thread in assoluto. I thread restano utili soprattutto per task **I/O-bound** come richieste di rete, lettura di file, accesso a database o attesa di eventi esterni.

---

##  Perche esiste

Il GIL semplifica molto la gestione interna degli oggetti Python in CPython.

In particolare:
- protegge strutture dati interne dell'interprete;
- rende piu semplice la gestione del [[Programmazione/Python/Pagine/Memory Management]];
- evita di dover sincronizzare continuamente l'accesso agli oggetti a basso livello.

Dal punto di vista progettuale, il GIL e un compromesso:
- **vantaggio**: implementazione dell'interprete piu semplice e spesso efficiente per molti casi d'uso comuni;
- **svantaggio**: limitazione del parallelismo reale nei thread CPU-bound.

---

##  Esempi Pratici

### Thread CPU-bound

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

In un caso come questo, i thread non raddoppiano realmente la velocita di esecuzione su CPython, perche competono per il GIL.

### Thread I/O-bound

```python
import threading
import time

def wait_for_resource(name):
    print(f"{name} in attesa...")
    time.sleep(2)
    print(f"{name} completato")

threads = [threading.Thread(target=wait_for_resource, args=(f"Task-{i}",)) for i in range(3)]

for thread in threads:
    thread.start()

for thread in threads:
    thread.join()
```

Qui i thread possono essere utili: durante le attese di I/O o sleep, il GIL viene rilasciato o comunque il thread non sta consumando CPU in modo intensivo.

---

##  Funzionamento Interno (Teoria)

### Un thread alla volta sul bytecode Python
In CPython, il GIL garantisce che solo un thread esegua bytecode Python per volta. L'interprete rilascia periodicamente il controllo, permettendo ad altri thread di proseguire.

### Perche il GIL e legato alla memoria
Molte operazioni interne di CPython, come il **reference counting**, modificano strutture condivise. Senza una protezione globale, servirebbero meccanismi di sincronizzazione molto piu estesi e costosi.

Questo collega direttamente il GIL alla gestione del [[Programmazione/Python/Pagine/Memory Management]].

### Switch tra thread
Il sistema operativo e l'interprete alternano l'esecuzione dei thread. Il risultato percepito puo sembrare parallelo, ma in realta il codice Python puro viene eseguito a turni quando il carico e CPU-bound.

---

##  CPU-bound vs I/O-bound

### CPU-bound
Un task e **CPU-bound** quando passa la maggior parte del tempo a fare calcoli.

Esempi:
- elaborazione numerica;
- compressione dati;
- parsing molto pesante;
- crittografia;
- image processing.

In questi casi, i thread Python in CPython non scalano bene a causa del GIL.

### I/O-bound
Un task e **I/O-bound** quando passa gran parte del tempo in attesa:
- file system;
- rete;
- database;
- API esterne;
- input/output in generale.

In questi scenari il threading resta utile, perche mentre un thread attende, altri possono avanzare.

> [!TIP] Regola pratica
> Se il collo di bottiglia e la CPU, i thread spesso non bastano. Se il collo di bottiglia e l'attesa di I/O, i thread sono spesso una scelta valida.

---

##  Alternative al threading per aggirare il limite

### Multiprocessing
Il modulo `multiprocessing` avvia processi separati. Ogni processo ha il proprio interprete Python e quindi il proprio GIL.

```python
from multiprocessing import Process

def count():
    total = 0
    for _ in range(10_000_000):
        total += 1

processes = [Process(target=count) for _ in range(2)]

for process in processes:
    process.start()

for process in processes:
    process.join()
```

Questo permette il parallelismo reale su piu core, ma introduce costi maggiori:
- piu memoria;
- serializzazione dei dati tra processi;
- comunicazione piu complessa.

### Asyncio
Per carichi I/O-bound, anche `asyncio` e spesso una buona alternativa ai thread, specialmente quando si hanno molte operazioni concorrenti di rete.

### Estensioni native
Librerie scritte in C, C++ o Rust possono eseguire parti computazionalmente intense fuori dal normale bytecode Python e, in certi casi, rilasciare il GIL.

---

##  Fraintendimenti comuni

### "Python non supporta il multithreading"
Falso. Python supporta i thread, ma in CPython il GIL limita il parallelismo reale del bytecode Python.

### "Il GIL rende i thread inutili"
Falso. Per I/O-bound, i thread restano molto utili e semplici da usare.

### "Il GIL esiste in tutte le implementazioni di Python"
Non necessariamente nello stesso modo. Il GIL e soprattutto un tema associato a **CPython**, che e l'implementazione standard piu diffusa.

---

##  Best Practices & "Gotchas"

-  **Usa `threading` per task I/O-bound:** rete, file, attese, polling e integrazioni esterne.
-  **Usa `multiprocessing` per task CPU-bound:** quando vuoi sfruttare davvero piu core della macchina.
-  **Profilare prima di scegliere:** non tutte le lentezze dipendono dal GIL.
-  **Valuta `asyncio` per alta concorrenza I/O:** soprattutto nei servizi che gestiscono molte connessioni.
-  **Non assumere che piu thread significhi piu velocita:** in CPython spesso non e vero per il calcolo puro.
-  **Attenzione alla condivisione dei dati:** anche con il GIL, le race condition logiche possono esistere.
-  **Il GIL non sostituisce i lock applicativi:** strutture condivise e invarianti di business possono richiedere comunque sincronizzazione esplicita.

---

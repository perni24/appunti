---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Threading]
prerequisites: []
related: []
---
# Threading in Python

## Sintesi

Nota su Threading in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
Il **Threading** è una tecnica di programmazione che permette l'esecuzione di più thread (sottoprocessi leggeri) all'interno di un singolo processo. In Python, il modulo `threading` viene utilizzato principalmente per gestire attività **I/O-bound** (operazioni che attendono input/output, come richieste di rete o lettura di file), permettendo al programma di rimanere responsivo invece di bloccarsi in attesa.

> [!IMPORTANT]
> A causa del [[Programmazione/Python/Pagine/Global Interpreter Lock|GIL (Global Interpreter Lock)]], il threading in Python non offre un vero parallelismo per operazioni **CPU-bound** (calcoli intensivi), poiché solo un thread alla volta può eseguire bytecode Python.

---

##  Sintassi
Il modulo standard per gestire i thread è `threading`.

```python
import threading

# Threading in Python

## Sintesi

Nota su Threading in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
def task_function(arg1, arg2):
    # Logica del thread
    pass

# Threading in Python

## Sintesi

Nota su Threading in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
thread = threading.Thread(target=task_function, args=(val1, val2))

# Threading in Python

## Sintesi

Nota su Threading in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
thread.start()

# Threading in Python

## Sintesi

Nota su Threading in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
thread.join()
```

---

##  Esempi Pratici

### Esempio Base
Un esempio semplice che mostra come avviare più thread per simulare task paralleli.

```python
import threading
import time

def print_numbers():
    for i in range(5):
        time.sleep(1)
        print(f"Numero: {i}")

def print_letters():
    for letter in ['A', 'B', 'C', 'D', 'E']:
        time.sleep(1.5)
        print(f"Lettera: {letter}")

# Threading in Python

## Sintesi

Nota su Threading in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
t1 = threading.Thread(target=print_numbers)
t2 = threading.Thread(target=print_letters)

# Threading in Python

## Sintesi

Nota su Threading in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
t1.start()
t2.start()

# Threading in Python

## Sintesi

Nota su Threading in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.
t1.join()
t2.join()

print("Esecuzione completata!")
```

### Esempio Avanzato: Utilizzo di Lock
Per evitare la **Race Condition** (quando più thread modificano la stessa risorsa contemporaneamente), si utilizzano i `Lock`.

```python
import threading

counter = 0
lock = threading.Lock()

def increment():
    global counter
    for _ in range(100000):
        # Il lock garantisce che solo un thread acceda a 'counter' alla volta
        with lock:
            counter += 1

threads = []
for i in range(2):
    t = threading.Thread(target=increment)
    threads.append(t)
    t.start()

for t in threads:
    t.join()

print(f"Valore finale counter: {counter}")
```

---

##  Funzionamento Interno (Teoria)
- **Gestione Memoria:** Tutti i thread di un processo condividono lo stesso spazio di indirizzamento (memoria heap). Questo rende la comunicazione tra thread molto veloce ma richiede sincronizzazione per evitare corruzione dei dati.
- **Context Switching:** Il sistema operativo (o l'interprete Python) scambia rapidamente l'esecuzione tra i thread. In Python, il GIL viene rilasciato durante le operazioni di I/O, rendendo il threading ideale per queste ultime.
- **Performance:** Per task che richiedono calcoli puri (es. crittografia, elaborazione immagini), il threading può risultare più lento a causa dell'overhead del context switching senza il beneficio del parallelismo reale. In quei casi è meglio usare `Multiprocessing`.

---

##  Best Practices & "Gotchas"
-  **Da fare:** Usa il threading per operazioni che passano molto tempo in attesa (Network requests, Database queries, UI responsiveness).
-  **Da fare:** Usa sempre i `Lock` o altre primitive di sincronizzazione (come `Queue`) quando condividi dati mutabili tra thread.
-  **Da evitare:** Non usare il threading per velocizzare cicli `for` intensivi a livello computazionale (CPU-bound); usa `multiprocessing`.
-  **Errori comuni:** Dimenticare di chiamare `.join()`, portando il thread principale a terminare prima dei thread figli (o lasciandoli "zombie" se non sono daemon).
-  **Deadlock:** Situazione in cui il Thread A aspetta una risorsa bloccata dal Thread B, e il Thread B aspetta una risorsa bloccata dal Thread A.

---

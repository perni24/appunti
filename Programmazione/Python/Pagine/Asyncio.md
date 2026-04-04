---
date: 2026-04-04
tags:
  - programmazione
  - python
  - asyncio
  - asincronia
  - concorrenza
type: #permanent-note
status: seedling
---

# Asyncio in Python

## 💡 Concetto Chiave
**Asyncio** è una libreria per scrivere codice concorrente utilizzando la sintassi **async/await**. A differenza del [[Threading]] (concorrenza preemptive), Asyncio utilizza la **concorrenza cooperativa** su un singolo thread. Un **Event Loop** gestisce l'esecuzione di diverse "coroutine", passando dall'una all'altra quando una di esse è in attesa (solitamente per operazioni di I/O).

> [!TIP]
> Asyncio è perfetto per gestire migliaia di connessioni simultanee (web server, scraper, chat) dove il collo di bottiglia è l'attesa della rete, non la potenza di calcolo della CPU.

---

## 📝 Sintassi
Le basi di asyncio ruotano attorno a tre concetti: `async def`, `await` e l'Event Loop.

```python
import asyncio

# Definizione di una coroutine
async def my_coroutine():
    print("Inizio...")
    await asyncio.sleep(1) # Sospende la coroutine senza bloccare il thread
    print("Fine!")

# Punto di ingresso per eseguire coroutine
if __name__ == "__main__":
    asyncio.run(my_coroutine())
```

---

## 💻 Esempi Pratici

### Esempio Base: Esecuzione Concorrente
Utilizzo di `asyncio.gather()` per eseguire più task contemporaneamente.

```python
import asyncio
import time

async def fetch_data(id, delay):
    print(f"Task {id} iniziato (attesa {delay}s)...")
    await asyncio.sleep(delay)
    print(f"Task {id} completato.")
    return f"Dati da {id}"

async def main():
    start = time.perf_counter()
    
    # Avvia più coroutine e attende che tutte finiscano
    results = await asyncio.gather(
        fetch_data(1, 2),
        fetch_data(2, 1),
        fetch_data(3, 1.5)
    )
    
    end = time.perf_counter()
    print(f"Risultati: {results}")
    print(f"Tempo totale: {end - start:.2f} secondi")

if __name__ == "__main__":
    asyncio.run(main())
```

### Esempio Avanzato: Gestione di Task
Creazione di task espliciti per farli girare in "background".

```python
import asyncio

async def background_worker():
    while True:
        print("Worker attivo...")
        await asyncio.sleep(1)

async def main():
    # Crea un task (inizia l'esecuzione subito)
    task = asyncio.create_task(background_worker())
    
    print("Main continua a fare altro...")
    await asyncio.sleep(3)
    
    # Possiamo annullare il task se necessario
    task.cancel()
    print("Main terminato.")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## ⚙️ Funzionamento Interno (Teoria)
- **Event Loop:** È il cuore di asyncio. Gira in un ciclo infinito e decide quale coroutine eseguire in base agli eventi pronti (es. dati arrivati sulla socket).
- **Coroutine:** Sono funzioni speciali che possono "mettere in pausa" la loro esecuzione (`yield` sotto il cofano) per restituire il controllo al loop.
- **Single Threaded:** Tutto gira su un unico thread. Questo elimina il rischio di race condition su variabili globali (nessun bisogno di Lock complessi), ma significa anche che una coroutine che fa calcoli pesanti bloccherà *tutto* il programma.
- **Bypass del GIL:** Non bypassa il [[Global Interpreter Lock|GIL]], ma lo rende irrilevante per task I/O-bound perché il thread viene rilasciato durante l'attesa asincrona.

---

## ⚠️ Best Practices & "Gotchas"
- ✅ **Da fare:** Usa sempre librerie asincrone (es. `aiohttp` invece di `requests`) all'interno di coroutine.
- ✅ **Da fare:** Usa `asyncio.create_task()` per task che non devono bloccare la sequenza principale.
- ❌ **Da evitare:** Mai usare funzioni bloccanti come `time.sleep()` o operazioni di file sincrone in una coroutine; bloccheresti l'intero Event Loop.
- 💣 **"Blocking the Loop":** Se una coroutine esegue un calcolo CPU-bound lungo, nessuna altra coroutine (nemmeno i task in background) potrà avanzare.
- 💣 **Chiamata da sincrono:** È difficile chiamare codice asincrono da un contesto puramente sincrono senza gestire manualmente il loop (usa `asyncio.run()` solo nel main).

---
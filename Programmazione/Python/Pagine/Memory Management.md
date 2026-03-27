---
date: 2026-03-27
tags:
  - programmazione
  - python
  - internals
  - memoria
type: #permanent-note
status: budding
---

# Memory Management in Python

## 💡 Concetto Chiave
Python gestisce la memoria in modo **automatico**: il programmatore non alloca e libera manualmente la memoria come avviene in linguaggi come C o C++. Questo non significa pero che la memoria sia "gratuita": capire come Python alloca, riusa e libera gli oggetti aiuta a scrivere codice piu efficiente, evitare memory leak logici e ragionare meglio sulle performance.

L'implementazione standard, **CPython**, combina principalmente:
- **Reference Counting** per liberare subito molti oggetti non piu usati.
- **Garbage Collector ciclico** per individuare cicli di riferimento che il conteggio dei riferimenti da solo non riesce a eliminare.

> [!INFO] Memoria automatica != assenza di problemi
> Python semplifica enormemente la gestione della memoria, ma un programma puo comunque consumare troppa RAM, mantenere riferimenti inutili o trattenere risorse come file e socket se non vengono rilasciati correttamente.

---

## 📝 Componenti principali

### 1. Reference Counting
Ogni oggetto in CPython mantiene internamente un contatore di quanti riferimenti puntano a lui. Quando il contatore scende a zero, l'oggetto puo essere distrutto immediatamente.

```python
import sys

numbers = [1, 2, 3]
print(sys.getrefcount(numbers))  # Nota: include anche il riferimento temporaneo della funzione

alias = numbers
print(sys.getrefcount(numbers))

del alias
print(sys.getrefcount(numbers))
```

### 2. Garbage Collector ciclico
Il reference counting non basta quando due o piu oggetti si referenziano a vicenda.

```python
class Node:
    def __init__(self):
        self.other = None

a = Node()
b = Node()

a.other = b
b.other = a
```

Se `a` e `b` escono dallo scope, i loro contatori possono non arrivare a zero a causa del ciclo. In questi casi entra in gioco il modulo `gc`, che analizza gli oggetti e rimuove i cicli non piu raggiungibili.

### 3. Allocatore di memoria di CPython
CPython usa un allocatore specializzato chiamato **pymalloc**, ottimizzato per gli oggetti piccoli. Questo riduce il costo delle allocazioni frequenti e migliora le prestazioni in programmi che creano molti oggetti di breve durata.

---

## 💻 Esempi Pratici

### Verificare riferimenti e dimensioni

```python
import sys

data = {"name": "Luca", "age": 30}

print(sys.getsizeof(data))      # dimensione approssimativa dell'oggetto contenitore
print(sys.getrefcount(data))    # numero di riferimenti attivi
```

> [!WARNING] `getsizeof` non misura tutto
> `sys.getsizeof()` misura la dimensione dell'oggetto contenitore, ma non sempre include in modo completo la memoria occupata dagli oggetti referenziati internamente. Per strutture annidate profonde il consumo reale puo essere maggiore.

### Forzare un controllo del garbage collector

```python
import gc

unreachable = gc.collect()
print(f"Oggetti non raggiungibili raccolti: {unreachable}")
```

Questo e utile soprattutto in fase di debug o analisi, non come pratica normale nel codice applicativo.

### Ridurre l'uso di memoria con i generatori

```python
def read_lines(path):
    with open(path, "r", encoding="utf-8") as file:
        for line in file:
            yield line.strip()
```

Un approccio come questo evita di caricare tutto il file in RAM e si collega direttamente al comportamento dei [[Generatori]].

---

## ⚙️ Funzionamento Interno (Teoria)

### Stack vs Heap
- **Stack**: contiene i riferimenti locali delle chiamate di funzione attive.
- **Heap**: contiene gli oggetti Python creati dinamicamente.

Quando dichiari una variabile in Python, in molti casi non stai "contenendo" direttamente l'oggetto, ma un riferimento all'oggetto allocato nell'heap.

```python
x = [1, 2, 3]
y = x
```

Qui `x` e `y` puntano allo stesso oggetto in memoria.

### Identity, mutabilita e condivisione
Il memory management e strettamente legato ai concetti di:
- **identita** dell'oggetto (`id(obj)`);
- **mutabilita**;
- **aliasing** tra variabili diverse.

Se piu riferimenti puntano allo stesso oggetto mutabile, una modifica fatta tramite uno dei riferimenti sara visibile anche dagli altri.

### Distruzione degli oggetti
In CPython, molti oggetti vengono liberati appena il reference count va a zero. Questo spiega perche il rilascio della memoria spesso appare "immediato", ma non bisogna farci troppo affidamento a livello logico, specialmente quando si lavora con risorse esterne.

Per file, lock, connessioni o socket, la strategia corretta non e aspettare il garbage collector, ma usare `with` e i [[Context Managers]].

---

## 🧠 Memory Leak in Python: come possono esistere?

Anche in un linguaggio con garbage collection possono comparire memory leak logici.

### Cause comuni
- collezioni globali che crescono senza limiti;
- cache mai svuotate;
- listener o callback mantenuti oltre il necessario;
- cicli di riferimento associati a finalizer complessi;
- strutture dati troppo grandi mantenute vive accidentalmente.

```python
cache = []

def store_result(result):
    cache.append(result)  # la lista cresce per tutta la vita del processo
```

In questo esempio Python non ha "perso" memoria: la memoria e ancora raggiungibile, quindi non puo liberarla. Il problema e nella logica dell'applicazione.

---

## ⚠️ Best Practices & "Gotchas"

- ✅ **Preferisci `with` per le risorse:** file, lock e connessioni non vanno lasciati alla sola distruzione automatica.
- ✅ **Usa generatori e iterazione lazy:** per dataset grandi, evita di creare liste complete se non servono.
- ✅ **Controlla le strutture condivise:** liste globali, cache e singleton possono trattenere memoria piu del previsto.
- ✅ **Usa `gc` e `tracemalloc` per analisi mirate:** sono strumenti ottimi per capire dove cresce la memoria.
- ❌ **Non chiamare `gc.collect()` come soluzione generica:** se serve spesso, probabilmente c'e un problema architetturale o di design.
- 💣 **Attenzione all'aliasing:** copiare un riferimento non significa copiare l'oggetto.
- 💣 **Non confondere memoria con risorse esterne:** liberare RAM e chiudere un file sono due problemi distinti.

---

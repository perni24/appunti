---
date: 2026-04-16
tags:
  - programmazione
  - python
  - profiling
  - performance
type: #permanent-note
status: budding
---

# Profiling in Python

## 💡 Concetto Chiave
Il **profiling** e la pratica di misurare dove un programma consuma tempo o memoria. Serve a individuare i veri colli di bottiglia, invece di ottimizzare sulla base di intuizioni o supposizioni.

In Python, il profiling e fondamentale perche il codice puo sembrare lento "in generale", ma nella pratica il costo reale si concentra spesso in poche funzioni, cicli o operazioni di I/O.

> [!INFO] Regola fondamentale
> Non ottimizzare prima di misurare. Senza dati reali, il rischio e spendere tempo a migliorare parti irrilevanti del programma.

---

## 📝 Cosa si puo profilare

Le aree principali sono:
- **tempo di esecuzione**: quali funzioni consumano piu CPU o piu tempo totale;
- **numero di chiamate**: quante volte viene eseguita una funzione;
- **uso della memoria**: dove vengono allocate strutture grandi o inutili;
- **hot path**: il percorso di codice che pesa davvero sul runtime.

Il profiling non e la stessa cosa del logging o del testing:
- il [[Logging]] osserva eventi e stato;
- il [[Testing]] verifica correttezza;
- il profiling misura costi e performance.

---

## 💻 Esempi Pratici

### Profilare con `cProfile`

```python
import cProfile

def compute():
    total = 0
    for i in range(1_000_000):
        total += i
    return total

cProfile.run("compute()")
```

Questo produce un report con:
- numero di chiamate;
- tempo totale;
- tempo cumulativo;
- funzioni piu costose.

### Profilare e ordinare con `pstats`

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

Qui il report viene ordinato per **tempo cumulativo**, che spesso e la metrica piu utile per capire dove intervenire.

### Micro-benchmark con `timeit`

```python
import timeit

result = timeit.timeit("sum(range(1000))", number=10000)
print(result)
```

`timeit` e utile quando vuoi confrontare frammenti piccoli e isolati di codice.

---

## ⚙️ Strumenti principali

### `cProfile`
E il profiler standard piu usato per misurare il tempo di esecuzione delle funzioni.

Vantaggi:
- integrato nella Standard Library;
- adatto a programmi reali;
- abbastanza semplice da usare.

### `pstats`
Serve per analizzare e ordinare meglio l'output di `cProfile`.

### `timeit`
Serve per benchmark piccoli, ripetuti e controllati.

### `tracemalloc`
Serve a tracciare allocazioni di memoria e identificare dove il programma consuma RAM.

```python
import tracemalloc

tracemalloc.start()

data = [i for i in range(100000)]

snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics("lineno")

for stat in top_stats[:5]:
    print(stat)
```

Questo modulo e particolarmente utile quando il problema non e la velocita, ma la crescita della memoria. Si collega direttamente a [[Memory Management]].

---

## 🧠 Funzionamento Interno (Teoria)

### Tempo totale vs tempo cumulativo
Quando leggi un report di profiling, due misure sono particolarmente importanti:

- **tempo totale**: tempo speso direttamente in una funzione;
- **tempo cumulativo**: tempo speso nella funzione piu tutto quello delle funzioni chiamate da essa.

Una funzione con poco tempo diretto ma molto tempo cumulativo puo essere il punto giusto dove intervenire, perche orchestra operazioni costose piu in profondita.

### Profiling deterministico vs micro-benchmark
`cProfile` e un profiler deterministico: traccia le chiamate e misura il loro costo complessivo.

`timeit` invece non profila un intero programma: misura ripetutamente uno snippet isolato per stimare il costo medio.

Quindi:
- usa `cProfile` per capire il quadro generale;
- usa `timeit` per confrontare alternative puntuali.

### Profilare memoria e CPU sono problemi diversi
Un programma puo essere:
- lento ma leggero in memoria;
- veloce ma sprecone in RAM;
- pessimo in entrambi gli aspetti.

Per questo bisogna chiarire prima il problema che si vuole misurare.

---

## 📦 Workflow corretto di profiling

Un flusso pragmatico e:

1. definire il problema osservabile;
2. riprodurlo con input realistici;
3. misurare con lo strumento adatto;
4. intervenire sul vero collo di bottiglia;
5. rimisurare per verificare il miglioramento;
6. evitare regressioni con test o benchmark ripetibili.

Esempi di problemi ben formulati:
- "questa funzione impiega troppo tempo su 100.000 record";
- "questa pipeline cresce troppo in memoria";
- "la serializzazione e il collo di bottiglia della request".

Esempi di problemi mal formulati:
- "Python e lento";
- "il progetto sembra pesante";
- "forse questa funzione va ottimizzata".

---

## 🔄 Cosa ottimizzare davvero

Il profiling mostra dove il programma passa tempo o consuma memoria, ma non dice automaticamente come migliorarlo. Le azioni tipiche dopo il profiling sono:
- ridurre lavoro ripetuto;
- evitare allocazioni inutili;
- cambiare struttura dati;
- spostare operazioni fuori dai loop;
- usare lazy evaluation o [[Generatori]];
- ridurre I/O bloccante;
- scegliere algoritmi migliori.

In CPython, il profiling puo anche mostrare quando il collo di bottiglia non e il Python puro ma:
- rete;
- database;
- filesystem;
- serializzazione;
- lock o attese in [[Threading]].

---

## ⚠️ Best Practices & "Gotchas"

- ✅ **Profila prima di ottimizzare:** evita lavoro inutile.
- ✅ **Usa input realistici:** benchmark su dati finti troppo piccoli sono spesso fuorvianti.
- ✅ **Misura piu volte:** rumore, cache e stato del sistema influenzano i risultati.
- ✅ **Scegli lo strumento giusto:** `cProfile` per il quadro generale, `timeit` per snippet, `tracemalloc` per memoria.
- ✅ **Confronta prima e dopo:** senza baseline, non sai se hai davvero migliorato qualcosa.
- ❌ **Non fidarti dell'intuizione sulle performance:** spesso il collo di bottiglia non e dove sembra.
- ❌ **Non ottimizzare codice non critico:** aumenta complessita senza valore reale.
- 💣 **Attenzione ai micro-benchmark fuori contesto:** un frammento piu veloce in isolamento puo non migliorare il programma reale.
- 💣 **Attenzione all'overhead del profiler:** i numeri assoluti possono cambiare; il valore principale sta nei rapporti e nelle aree calde.

---

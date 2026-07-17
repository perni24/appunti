---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: advanced
tags: [programmazione, python, cython, performance]
aliases: [Cython]
prerequisites: []
related: []
---

# Cython

## Sintesi

Cython e un linguaggio e compilatore che trasforma codice simile a Python in estensioni C. Permette di aggiungere tipizzazione statica opzionale e di chiamare codice C, migliorando performance in hot path specifici.

E utile quando una parte misurata del programma e CPU-bound e Python puro introduce troppo overhead.

## Quando usarlo

Usa Cython quando:

- un loop numerico e stato identificato dal profiling;
- devi scrivere binding verso librerie C;
- vuoi mantenere una sintassi vicina a Python;
- vuoi ottimizzare una parte piccola senza riscrivere tutto;
- NumPy da solo non basta o non si adatta bene al problema.

Non usarlo come primo passo di ottimizzazione.

## Come funziona

File Cython tipici hanno estensione `.pyx`. Il codice viene compilato in una estensione nativa importabile da Python.

Esempio:

```python
def sum_values(double[:] values):
    cdef double total = 0
    cdef int i

    for i in range(values.shape[0]):
        total += values[i]

    return total
```

`cdef` dichiara variabili C, riducendo overhead rispetto a oggetti Python dinamici.

## API / Sintassi

Concetti principali:

- `cdef`: dichiara variabili, funzioni o tipi C;
- `cpdef`: funzione chiamabile sia da Cython/C sia da Python;
- memoryview tipizzate: accesso efficiente ad array;
- `.pyx`: file sorgente Cython;
- `.pxd`: dichiarazioni condivise;
- build tramite setuptools o backend compatibili.

Esempio di funzione:

```python
cpdef int add(int a, int b):
    return a + b
```

## Esempio pratico

Workflow:

1. misura con `cProfile` o benchmark;
2. isola la funzione critica;
3. crea una versione Cython;
4. aggiungi tipi dove servono;
5. confronta prima e dopo;
6. mantieni test identici per versione Python e Cython.

La parte importante e non perdere correttezza mentre migliori performance.

## Varianti

- **Python-like Cython**: codice quasi Python, meno veloce ma semplice.
- **Cython tipizzato**: usa `cdef`, memoryview e tipi C.
- **Binding C**: dichiara funzioni C e le richiama da Python.
- **Cython + NumPy**: comune per calcolo numerico.
- **C extensions dirette**: piu controllo, piu complessita.

## Errori comuni

- Usarlo prima di fare profiling.
- Tipizzare tutto senza sapere dove serve.
- Ignorare il costo di conversione tra oggetti Python e tipi C.
- Complicare codice non critico.
- Non gestire packaging e distribuzione delle estensioni compilate.
- Non verificare performance con input realistici.

## Checklist

- Il codice critico e stato misurato?
- La funzione e abbastanza isolata?
- I dati hanno tipi stabili?
- Il guadagno supera la complessita di build?
- Esistono test di correttezza prima dell'ottimizzazione?
- Il package si installa sulle piattaforme target?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[C extensions]]
- [[Profiling]]
- [[NumPy]]
- [[Memory Management]]

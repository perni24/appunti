---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - programmazione
  - python
  - cython
  - performance
aliases:
  - Cython
prerequisites: []
related: []
title: Cython
---

# Cython

## Sintesi

Cython traduce sorgenti Python/Cython in C o C++; un compilatore nativo produce poi un'estensione importabile. Sono **due passaggi distinti**: generare un file C non significa avere un modulo eseguibile.

Tipi C e memoryview possono ridurre overhead nei kernel misurati. Non basta cambiare estensione al file o aggiungere tipi ovunque per ottenere un'accelerazione.

Baseline di riferimento: **CPython 3.12.10 e Cython 3.3.0**. La revisione verifica traduzione e generazione dell'annotazione; **compilazione nativa e import del modulo richiedono un compilatore C compatibile, assente nell'ambiente di prova**.

## Quando usarlo

- Loop numerici ben delimitati e individuati dal profiling.
- Accesso a buffer con formato stabile.
- Binding di una libreria C esistente.
- Ottimizzazione incrementale, dopo aver valutato algoritmi e librerie gia native.

Il costo di conversione deve rientrare nel benchmark. Convertire grandi liste a ogni chiamata puo annullare il beneficio del kernel.

## Come funziona

`.pyx -> C/C++ -> .pyd/.so -> import`. Il wheel resta nativo e specifico per i tag supportati: Cython non rende il binario universale.

Anche con codice compilato, variabili e operazioni rimaste Python possono richiedere dispatch, reference counting e GIL. Il report HTML di annotazione aiuta a riconoscere l'interazione con Python; non e una misura dei tempi.

## API / Sintassi

| Costrutto         | Contratto                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| def               | Funzione esposta a Python, con eventuali conversioni all'ingresso.                                      |
| cdef              | Dichiarazione C o funzione per chiamate Cython; non genera da sola una API Python pubblica.             |
| cpdef             | Entry point Cython e wrapper Python; non e automaticamente una API C pubblica per una libreria esterna. |
| .pxd              | Dichiarazioni usate da altri moduli tramite cimport, non normale import Python.                         |
| double[:]         | Memoryview 1D che puo avere stride.                                                                     |
| const double[::1] | Buffer 1D di double contiguo, accettabile anche read-only.                                              |

Per esportare una API C esterna servono meccanismi dedicati come public/api, con header e ABI appropriati. Anche il pure Python mode con import cython e tipi specifici richiede una fase di compilazione per ottenere un'estensione; non confonderlo con il solo type checking.

### kernel.pyx

Il contratto accetta buffer 1D contigui di double, non liste arbitrarie. L'accumulatore e double: NaN, infinito e arrotondamento seguono quel modello, non gli interi arbitrari di Python.

```cython
def sum_values(const double[::1] values):
    cdef Py_ssize_t index
    cdef double total = 0.0

    if values is None:
        raise TypeError("values must be a double buffer")

    for index in range(values.shape[0]):
        total += values[index]
    return total


cpdef double scale(double value, double factor):
    return value * factor
```

Py_ssize_t e adatto alla dimensione e agli indici dei buffer Python. Usare int per una dimensione enorme potrebbe restringere il valore. Non disabilitiamo boundscheck o wraparound: togliere controlli richiede invarianti e test, altrimenti un errore puo diventare accesso invalido alla memoria.

const impedisce scritture tramite questa vista; non impedisce ad altri alias di modificare il buffer. Il demo conserva il GIL e non garantisce sincronizzazione con codice nativo esterno.

## Esempio pratico

Progetto separato con kernel.pyx e i due file seguenti.

### pyproject.toml

```toml
[build-system]
requires = ["setuptools>=74", "wheel", "Cython==3.3.0"]
build-backend = "setuptools.build_meta"

[project]
name = "appunti-cython-demo"
version = "0.1.0"
requires-python = ">=3.12"
```

### setup.py

```python
from Cython.Build import cythonize
from setuptools import Extension, setup

setup(
    py_modules=[],
    ext_modules=cythonize(
        [Extension("kernel", ["kernel.pyx"])],
        annotate=True,
        compiler_directives={
            "language_level": 3,
            "boundscheck": True,
            "wraparound": True,
        },
    ),
)
```

In un virtualenv dedicato, dalla radice del progetto:

```powershell
python -m pip install "Cython==3.3.0" build
```

Per verificare la traduzione e leggere l'annotazione, senza compilare il modulo nativo:

```powershell
python -m cython -3 --annotate kernel.pyx
```

Produce kernel.c e kernel.html. Non permette ancora `import kernel`. Per creare il wheel, con compilatore e header disponibili:

```powershell
python -m build --wheel
```

Installa il wheel in un ambiente pulito, verificando prima che dist contenga quello desiderato:

```powershell
python -m pip install --no-index --find-links dist appunti-cython-demo==0.1.0
```

### verify_kernel.py

Questo controllo richiede **l'estensione compilata**, non soltanto il file C. Usa array della standard library, senza dipendenza NumPy.

```python
from array import array
import math

from kernel import scale, sum_values

values = array("d", [1.5, 2.0, -0.5])
assert sum_values(values) == 3.0
assert sum_values(array("d")) == 0.0
assert sum_values(memoryview(values).toreadonly()) == 3.0
assert scale(2.5, 4.0) == 10.0
assert math.isnan(sum_values(array("d", [float("nan")])))

for invalid in ([1.0, 2.0], None, array("f", [1.0])):
    try:
        sum_values(invalid)
    except (TypeError, ValueError):
        pass
    else:
        raise AssertionError("buffer non valido accettato")

try:
    sum_values(memoryview(array("d", [1, 2, 3, 4]))[::2])
except ValueError:
    pass
else:
    raise AssertionError("buffer non contiguo accettato")
print("kernel contract ok")
```

L'esempio non converte silenziosamente una lista o float32 in double: il confine resta esplicito. Se aggiungi conversioni, testa costo, copie e perdita di precisione.

Per confronti numerici generali scegli tolleranze coerenti col dominio. La somma sequenziale double puo differire da altre strategie di accumulo: non assumere che la versione Python, NumPy e il kernel abbiano sempre identici bit.

## Varianti

### GIL e nogil

Dichiarare una funzione nogil significa che puo essere chiamata senza GIL, non che ogni chiamata lo rilasci. Un blocco with nogil effettua il rilascio; non rende piu veloce da solo un calcolo su un singolo thread.

Senza GIL non usare arbitrariamente oggetti Python. Anche la propagazione degli errori ha un costo: specifiche noexcept/except vanno scelte in base al contratto, non per eliminare avvisi. Il kernel proposto non usa queste ottimizzazioni.

### Binding e distribuzione

- cdef extern dichiara firme C, ma non scarica o collega da solo la libreria.
- Include, librerie e architetture devono corrispondere alla toolchain.
- Se distribuisci C generato, la policy di sdist/build deve essere coerente; il demo richiede Cython alla build.
- Un wheel gia compilato non richiede Cython all'utente finale solo per eseguire questo kernel.
- Per NumPy, verifica dtype, layout, ABI e versioni richieste; non aggiungerlo se basta il buffer protocol.

## Errori comuni

- Etichettare un frammento con cdef come Python puro.
- Credere che generazione C, build e installazione siano un solo passaggio.
- Esporre tipi C senza considerare intervalli e overflow.
- Scambiare const per immutabilita globale o nogil per parallelismo automatico.
- Rimuovere boundscheck prima di aver provato gli invarianti.
- Dimenticare dtype, dimensioni e contiguita del buffer.
- Chiamare cpdef una API C esterna pronta senza header e dichiarazioni.

## Checklist

- Ho separato costo del kernel e costo delle conversioni?
- Formato, dimensione, mutabilita e layout dei buffer sono documentati?
- Il comportamento numerico e accettabile?
- La generazione e la compilazione sono entrambe verificate?
- Il wheel si importa su un ambiente target pulito?
- L'annotazione e usata per orientarsi, non come benchmark?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/C extensions|C extensions]]
- [[Programmazione/Python/Pagine/Profiling|Profiling]]
- [[Programmazione/Python/Pagine/NumPy|NumPy]]
- [[Programmazione/Python/Pagine/Memory Management|Memory Management]]
- [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]
- [[Programmazione/Python/Pagine/Global Interpreter Lock|Global Interpreter Lock]]

## Fonti

- [Cython 3: processo di build](https://cython.readthedocs.io/en/latest/src/quickstart/build.html).
- [Memoryview tipizzate e const](https://docs.cython.org/en/stable/src/userguide/memoryviews.html).
- [Tipi, def/cdef/cpdef e gestione degli errori](https://docs.cython.org/en/latest/src/userguide/language_basics.html).
- [Cython e GIL](https://docs.cython.org/en/latest/src/userguide/nogil.html).
- [setuptools: moduli nativi](https://setuptools.pypa.io/en/latest/userguide/ext_modules.html).

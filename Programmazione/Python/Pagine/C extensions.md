---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: advanced
tags: [programmazione, python, performance, c]
aliases: [C extensions, Estensioni C Python]
prerequisites: []
related: []
---

# C extensions

## Sintesi

Le C extensions permettono di scrivere moduli Python in C o collegare librerie native a Python. Servono quando il codice Python puro non basta per performance, integrazione con librerie esistenti o accesso a API di basso livello.

Sono potenti, ma aumentano complessita di build, distribuzione, debugging e compatibilita.

## Quando usarlo

Usa estensioni C quando:

- un hot path CPU-bound e stato misurato con profiling;
- devi esporre una libreria C esistente a Python;
- serve accesso a API native di sistema;
- vuoi ridurre overhead in loop molto critici;
- devi controllare memoria e layout dati a basso livello.

Prima valuta alternative piu semplici: NumPy, Cython, multiprocessing, algoritmi migliori o librerie gia ottimizzate.

## Come funziona

Una C extension espone funzioni e oggetti a Python tramite la C API di CPython. Il codice viene compilato in un modulo nativo importabile.

Schema concettuale:

```text
Python code -> import native_module -> compiled C extension -> CPython C API / native library
```

Il vantaggio e che parti del lavoro possono essere eseguite in codice nativo. Lo svantaggio e che devi gestire compatibilita ABI, compilatori, wheel e piattaforme.

## API / Sintassi

Esempio minimale concettuale:

```c
#include <Python.h>

static PyObject* add(PyObject* self, PyObject* args) {
    int a;
    int b;

    if (!PyArg_ParseTuple(args, "ii", &a, &b)) {
        return NULL;
    }

    return PyLong_FromLong(a + b);
}
```

Nel packaging moderno, la build viene descritta tramite `pyproject.toml` e strumenti come setuptools, scikit-build o maturin, a seconda della tecnologia usata.

## Esempio pratico

Caso realistico:

1. profili una funzione Python;
2. scopri che un loop numerico domina il tempo;
3. provi prima NumPy o una struttura dati migliore;
4. se non basta, isoli solo quel kernel;
5. lo sposti in C, Cython o Rust;
6. mantieni una API Python piccola e testabile.

L'obiettivo non e riscrivere l'applicazione in C, ma ottimizzare un confine ristretto.

## Varianti

- **CPython C API**: integrazione diretta, potente ma verbosa.
- **ctypes**: chiama librerie C dinamiche senza compilare estensioni Python.
- **cffi**: alternativa piu ergonomica per interfacciarsi con C.
- **Cython**: codice simile a Python compilato in C.
- **PyO3/maturin**: binding Rust per Python.
- **NumPy C API**: utile per estensioni numeriche.

## Errori comuni

- Scrivere estensioni native prima di fare profiling.
- Ottimizzare codice non critico.
- Esporre API native troppo grandi invece di un confine piccolo.
- Ignorare gestione errori e reference counting.
- Non testare su piu sistemi operativi e versioni Python.
- Sottovalutare packaging, wheel e compilatori.
- Non documentare ownership e durata degli oggetti.

## Checklist

- Il collo di bottiglia e stato misurato?
- Esiste una libreria Python gia ottimizzata?
- Il confine Python/native e piccolo?
- La build e riproducibile?
- I test coprono casi normali, errori e input limite?
- La distribuzione su piattaforme target e realistica?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Profiling]]
- [[Memory Management]]
- [[Creazione di Package]]
- [[Cython]]
- [[NumPy]]

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
  - performance
  - c
aliases:
  - C extensions
  - Estensioni C Python
prerequisites: []
related: []
title: C extensions
---

# C extensions

## Sintesi

Una estensione nativa espone un modulo importabile da Python, implementato in C/C++ tramite la C API di CPython. Puo integrare una libreria o ridurre overhead in un punto misurato, ma introduce compilazione, ABI, gestione delle risorse e rischi di corruzione della memoria.

Il codice nativo vive nel processo Python: un puntatore errato puo farlo terminare. Non e una sandbox, e non diventa sicuro solo perche viene chiamato da una funzione Python.

Riferimento: **CPython 3.12.10**, build con GIL. Qui sono forniti sorgenti e procedura completi; **la compilazione e l'esecuzione native richiedono un compilatore C compatibile**, non disponibile nell'ambiente usato per questa revisione. Non considerare il demo certificato su piu piattaforme.

## Quando usarlo

- Esporre una libreria C esistente con un confine ristretto.
- Ottimizzare un kernel misurato dopo aver valutato algoritmo e librerie gia disponibili.
- Gestire buffer e API native con un contratto preciso di ownership.
- Non per una somma banale come quella didattica sotto: il costo della chiamata puo superare il lavoro utile.

Alternative: NumPy, Cython, ctypes/cffi oppure binding Rust. Ognuna ha costi di build e semantica propri.

## Come funziona

Il percorso e: sorgente C, compilatore/linker, modulo `.pyd` su Windows o `.so` su sistemi compatibili, import da CPython. Il modulo non e un eseguibile autonomo.

API sorgente e ABI binaria sono piani differenti. Un wheel nativo normalmente dipende da interprete, versione ABI, sistema e architettura. La Limited API/Stable ABI permette alcuni riusi fra versioni CPython, ma non trasforma un binario Windows in uno Linux. Il progetto sotto **non dichiara abi3**: questa scelta richiederebbe vincoli e test espliciti.

### Riferimenti ed errori

- Un new reference ottenuto da una API diventa responsabilita del chiamante: trasferiscilo secondo contratto o esegui DECREF.
- Un borrowed reference non va decrementato senza averne acquisito una propria referenza; non conservarlo oltre la vita garantita dal proprietario.
- Alcune API rubano una reference: leggi il contratto anche nei percorsi di errore.
- Una funzione che restituisce PyObject\* segnala normalmente l'errore con NULL e un'eccezione impostata.
- Valori sentinella numerici possono essere anche risultati validi: verifica PyErr_Occurred quando previsto.

DECREF puo attivare finalizzatori e altro codice Python. Mantieni le invarianti valide anche prima del rilascio, non solo dopo.

## API / Sintassi

### Contratto del modulo dimostrativo

`_safeadd.add_i32(a, b)` accetta esattamente due int built-in nell'intervallo signed 32-bit. Esclude bool e sottoclassi. La somma e restituita come int Python e **non viene ristretta a 32 bit**.

Questo evita il difetto di sommare direttamente due int C senza controllare overflow. La conversione a long long e controllata; dopo la verifica dell'intervallo, la somma e rappresentabile anche ai limiti.

### native.c

```c
#define PY_SSIZE_T_CLEAN
#include <Python.h>
#include <stdint.h>

static PyObject *add_i32(PyObject *self, PyObject *args) {
    PyObject *left;
    PyObject *right;
    long long a;
    long long b;
    (void)self;

    if (!PyArg_ParseTuple(args, "OO:add_i32", &left, &right))
        return NULL;

    if (!PyLong_CheckExact(left) || !PyLong_CheckExact(right)) {
        PyErr_SetString(PyExc_TypeError, "expected two built-in ints");
        return NULL;
    }

    a = PyLong_AsLongLong(left);
    if (a == -1 && PyErr_Occurred())
        return NULL;
    b = PyLong_AsLongLong(right);
    if (b == -1 && PyErr_Occurred())
        return NULL;

    if (a < INT32_MIN || a > INT32_MAX ||
        b < INT32_MIN || b > INT32_MAX) {
        PyErr_SetString(PyExc_OverflowError, "input outside signed 32-bit range");
        return NULL;
    }

    return PyLong_FromLongLong(a + b);
}

static PyMethodDef methods[] = {
    {"add_i32", add_i32, METH_VARARGS, "Add two signed 32-bit inputs without narrowing."},
    {NULL, NULL, 0, NULL}
};

static PyModuleDef_Slot slots[] = {
    {0, NULL}
};

static struct PyModuleDef module = {
    PyModuleDef_HEAD_INIT,
    "_safeadd",
    "Small checked native boundary.",
    0,
    methods,
    slots,
    NULL,
    NULL,
    NULL
};

PyMODINIT_FUNC PyInit__safeadd(void) {
    return PyModuleDef_Init(&module);
}
```

I due argomenti ottenuti con O sono riferimenti presi in prestito: qui non vengono conservati o decrementati. PyLong_FromLongLong produce il risultato con una nuova reference, oppure propaga un errore di allocazione.

Il nome `PyInit__safeadd` deve corrispondere al modulo `_safeadd`. La definizione usa inizializzazione multifase e non conserva stato Python globale mutabile. Non e una dichiarazione di supporto gia testato per free-threading o subinterpreti.

## Esempio pratico

Crea un progetto separato con questi tre file: native.c, pyproject.toml e setup.py. Non copiare sorgenti generati dentro le note.

### pyproject.toml

```toml
[build-system]
requires = ["setuptools>=74", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "appunti-safeadd-demo"
version = "0.1.0"
requires-python = ">=3.12"
```

### setup.py

```python
from setuptools import Extension, setup

setup(
    py_modules=[],
    ext_modules=[Extension("_safeadd", sources=["native.c"])],
)
```

setup.py qui e configurazione del backend, non un invito a usare i vecchi comandi setup.py install. Su Windows occorrono Build Tools MSVC compatibili con il CPython usato; su altri sistemi toolchain e header Python appropriati. Non basta installare build con pip.

In un ambiente virtuale dedicato, dalla radice del progetto:

```powershell
python -m pip install build
```

```powershell
python -m build --wheel
```

Il backend puo scaricare dipendenze di build in un ambiente isolato. Per riproducibilita registra le versioni risolte e la toolchain; i soli limiti minimi del demo non sono un lock.

Installa il wheel costruito in un secondo ambiente pulito. Il nome preciso contiene i tag della piattaforma; per il solo progetto dimostrativo, e dopo aver verificato che dist contenga un unico wheel:

```powershell
python -m pip install --no-index --find-links dist appunti-safeadd-demo==0.1.0
```

### verify_native.py

Esegui questo file con l'interprete dell'ambiente di installazione, anche fuori dalla cartella dei sorgenti:

```python
import _safeadd

assert _safeadd.add_i32(2, 3) == 5
assert _safeadd.add_i32(-1, 1) == 0
assert _safeadd.add_i32(2**31 - 1, 2**31 - 1) == 2**32 - 2
assert _safeadd.add_i32(-(2**31), -(2**31)) == -(2**32)

for arguments, expected in [
    ((True, 1), TypeError),
    ((1.0, 1), TypeError),
    ((2**31, 0), OverflowError),
    ((2**100, 0), OverflowError),
]:
    try:
        _safeadd.add_i32(*arguments)
    except expected:
        pass
    else:
        raise AssertionError(arguments)
print("native boundary ok")
```

La prova confronta il contratto, non la velocita. Un test Python della formula non sostituisce la compilazione e il caricamento del modulo C.

## Varianti

- **GIL**: codice nativo non significa rilascio automatico. Durante un blocco senza GIL non usare liberamente la C API o oggetti Python; valida, acquisisci buffer e riferimenti prima, poi gestisci errori dopo il rientro. Il demo mantiene il GIL.
- **Buffer**: oltre a pointer e lunghezza, servono formato, stride, contiguita, accesso read-only e rilascio del buffer. Non trattenere puntatori dopo la fine del contratto.
- **ctypes/cffi**: chiamano API C con convenzioni e firme corrette; un tipo o una durata sbagliati possono comunque causare crash.
- **Cython**: genera gran parte dell'interfaccia, senza eliminare limiti dei tipi C.
- **PyO3/maturin**: alternativa Rust con contratto di ownership e distribuzione proprio.

## Errori comuni

- Sommare signed int C oltre il limite, scambiandoli per gli interi arbitrari Python.
- Ignorare un errore di conversione o restituire NULL senza eccezione.
- Usare o liberare male un borrowed reference.
- Esportare simboli con nome diverso da quello richiesto dall'import.
- Distribuire un wheel per piattaforma o architettura errata.
- Dichiarare abi3, thread safety o supporto a subinterpreti senza verificarli.

## Checklist

- Contratto di tipi, intervalli e ownership esplicito?
- Controllati tutti gli esiti NULL e i sentinella numerici?
- Testati limiti, errori e import del wheel in ambiente pulito?
- Toolchain, ABI e piattaforme target registrate?
- Buffer e riferimenti restano validi durante l'uso?
- Il guadagno misurato giustifica codice e build nativi?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Profiling|Profiling]]
- [[Programmazione/Python/Pagine/Memory Management|Memory Management]]
- [[Programmazione/Python/Pagine/Creazione di Package|Creazione di Package]]
- [[Programmazione/Python/Pagine/Cython|Cython]]
- [[Programmazione/Python/Pagine/NumPy|NumPy]]
- [[Programmazione/Python/Pagine/Global Interpreter Lock|Global Interpreter Lock]]

## Fonti

- [CPython 3.12: estendere Python](https://docs.python.org/3.12/extending/extending.html).
- [Parsing degli argomenti](https://docs.python.org/3.12/c-api/arg.html), [conversione degli interi](https://docs.python.org/3.12/c-api/long.html).
- [Moduli e inizializzazione multifase](https://docs.python.org/3.12/c-api/module.html).
- [Stabilita API/ABI](https://docs.python.org/3.12/c-api/stable.html), [GIL e thread state](https://docs.python.org/3.12/c-api/init.html).
- [setuptools: extension modules](https://setuptools.pypa.io/en/latest/userguide/ext_modules.html).

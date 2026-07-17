---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming]
aliases: [Context Managers]
prerequisites: []
related: []
---

# Context Managers in Python

## Sintesi

I context manager gestiscono risorse che devono essere aperte e poi rilasciate in modo affidabile. Si usano con `with` e sono fondamentali per file, lock, connessioni, transazioni e cleanup temporanei.

Il vantaggio principale e che la fase di rilascio viene eseguita anche se nel blocco si verifica un'eccezione.

## Quando usarlo

Usa un context manager quando una risorsa ha un ciclo di vita chiaro:

- apertura e chiusura di file;
- acquisizione e rilascio di lock;
- apertura e chiusura di connessioni;
- inizio e fine di una transazione;
- setup e teardown temporaneo durante test o script.

## Come funziona

La sintassi base e:

```python
with open("data.txt", encoding="utf-8") as file:
    content = file.read()
```

Python chiama:

- `__enter__()` all'ingresso del blocco;
- `__exit__(exc_type, exc_value, traceback)` all'uscita del blocco.

`__exit__()` viene chiamato sia in caso di successo sia in caso di errore.

```python
class ManagedResource:
    def __enter__(self):
        print("acquire")
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        print("release")
```

```python
with ManagedResource() as resource:
    print("use resource")
```

## API / Sintassi

Context manager basato su classe:

```python
class DatabaseConnection:
    def __enter__(self):
        self.connection = connect()
        return self.connection

    def __exit__(self, exc_type, exc_value, traceback):
        self.connection.close()
        return False
```

Context manager basato su `contextlib.contextmanager`:

```python
from contextlib import contextmanager


@contextmanager
def managed_value():
    print("setup")
    try:
        yield "value"
    finally:
        print("cleanup")
```

Se `__exit__()` restituisce `True`, l'eccezione viene soppressa. Se restituisce `False` o `None`, l'eccezione continua a propagarsi.

## Esempio pratico

Un context manager puo misurare la durata di un blocco senza mescolare la logica di timing con la logica applicativa.

```python
from contextlib import contextmanager
from time import perf_counter


@contextmanager
def timer(label):
    start = perf_counter()
    try:
        yield
    finally:
        elapsed = perf_counter() - start
        print(f"{label}: {elapsed:.3f}s")


with timer("import"):
    data = [number * 2 for number in range(1_000_000)]
```

La parte in `finally` viene eseguita anche se il codice dentro `with` fallisce.

## Varianti

- **`with` singolo**: gestisce una risorsa.
- **`with` multiplo**: gestisce piu risorse nello stesso blocco.
- **Classe con `__enter__` e `__exit__`**: utile quando serve stato interno esplicito.
- **`contextlib.contextmanager`**: adatto a context manager semplici.
- **`contextlib.ExitStack`**: utile quando il numero di risorse e dinamico.

```python
with open("input.txt", encoding="utf-8") as source, open("output.txt", "w", encoding="utf-8") as target:
    for line in source:
        target.write(line.upper())
```

## Errori comuni

- Non usare `with` con file, socket o lock.
- Restituire `True` da `__exit__()` senza voler davvero sopprimere l'errore.
- Mettere troppa logica dentro un singolo blocco `with`.
- Confondere il context manager con l'oggetto restituito da `__enter__()`.
- Affidarsi al garbage collector per chiudere risorse esterne.

## Checklist

- La risorsa viene sempre rilasciata?
- Il blocco `with` e abbastanza piccolo da essere leggibile?
- Le eccezioni devono propagarsi o essere soppresse?
- `contextlib.contextmanager` e sufficiente o serve una classe?
- Ci sono piu risorse dinamiche che richiedono `ExitStack`?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Gestione File]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Memory Management]]

---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - python
  - programming
  - decorators
aliases:
  - Decoratori
  - Decorator Python
prerequisites: []
related: []
title: Decoratori in Python
---

# Decoratori in Python

## Sintesi

Un decoratore riceve un oggetto, tipicamente una funzione o una classe, e restituisce l'oggetto da associare al suo nome. Puo aggiungere un wrapper, registrare l'oggetto senza sostituirlo o restituire un altro callable: non deve necessariamente produrre una "copia modificata" della funzione.

Riferimento: Python 3.12; esempi verificati con CPython 3.12.10.

## Quando usarlo

Per comportamento trasversale ripetuto: osservazione delle chiamate, misurazione, caching, registrazione di handler o controlli condivisi. Autorizzazione e retry richiedono un contratto proprio; applicare un decoratore non li rende automaticamente corretti.

Preferisci una chiamata esplicita se il comportamento e specifico di una sola funzione o se nascondere effetti collaterali renderebbe il flusso poco chiaro.

## Come funziona

`@decorate` sopra `def work(...): ...` applica `work = decorate(work)` quando viene eseguita la definizione, spesso durante l'import. Il corpo di un eventuale wrapper viene invece eseguito quando si chiama il nome decorato.

`functools.wraps` copia metadati selezionati e aggiunge `__wrapped__` per risalire all'originale. Non valida i tipi e non cambia da solo la firma di chiamata effettiva del wrapper. `inspect.signature` segue normalmente `__wrapped__`, mostrando la firma originale; `follow_wrapped=False` permette di osservare quella del wrapper.

## API / Sintassi

Un wrapper sincrono che registra solo il nome della funzione, non i valori degli argomenti:

```python
from functools import wraps


def log_call(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        print(f"call: {function.__name__}")
        return function(*args, **kwargs)
    return wrapper


@log_call
def add(left: int, right: int, *, offset: int = 0) -> int:
    """Add two integers and an optional offset."""
    return left + right + offset


print(add(2, 3, offset=1))  # call: add, poi 6
print(add.__name__)        # add
```

Il risultato viene restituito e gli errori della funzione si propagano. `*args` e `**kwargs` inoltrano anche `self` nei normali metodi di istanza. Il log su standard output e didattico: in un'applicazione usa una politica di logging adeguata ed evita credenziali o payload sensibili.

### Decoratore con parametri

La factory valida la configurazione prima di costruire il decoratore. L'esempio ripete deliberatamente ogni chiamata: non e un algoritmo di retry.

```python
from functools import wraps


def repeat(times: int):
    if type(times) is not int:
        raise TypeError("times must be an integer")
    if times < 1:
        raise ValueError("times must be positive")

    def decorate(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            result = None
            for _ in range(times):
                result = function(*args, **kwargs)
            return result
        return wrapper
    return decorate


events = []


@repeat(times=3)
def record(message: str) -> int:
    events.append(message)
    return len(events)


result = record("hello")
print(result, events)  # 3 ['hello', 'hello', 'hello']
```

Ritorna solo l'ultimo risultato. Un errore interrompe le ripetizioni e non annulla gli effetti precedenti. Non usare questo schema per pagamenti, scritture o invii senza decidere esplicitamente idempotenza e gestione dei duplicati.

## Esempio pratico

Misurazione di una funzione sincrona con un clock monotono ad alta risoluzione:

```python
from functools import wraps
from time import perf_counter


def timed(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        started = perf_counter()
        try:
            return function(*args, **kwargs)
        finally:
            elapsed = perf_counter() - started
            print(f"{function.__name__}: {elapsed:.6f}s")
    return wrapper


@timed
def build_report() -> int:
    return sum(number * 2 for number in range(1000))


print(build_report())  # durata variabile, poi 999000
```

Il `finally` registra anche le chiamate che falliscono. Una singola durata non e un benchmark e include il tempo trascorso durante l'invocazione, non solo CPU. Anche la registrazione puo fallire: in quel caso un errore nel cleanup puo sostituire il ritorno o mascherare l'errore originario.

Questo wrapper misura solo l'invocazione di una funzione: con un generatore misura la creazione dell'iteratore, con una coroutine non decorata correttamente misura la creazione dell'oggetto coroutine, non il lavoro successivo.

## Varianti

### Ordine di valutazione e applicazione

Le espressioni dei decoratori vengono valutate dall'alto verso il basso; i decoratori risultanti sono applicati dal basso verso l'alto. Il comportamento delle chiamate dipende poi dai wrapper.

```python
from functools import wraps

events = []


def trace(name):
    events.append(f"factory {name}")

    def decorate(function):
        events.append(f"decorate {name}")

        @wraps(function)
        def wrapper(*args, **kwargs):
            events.append(f"call {name}")
            return function(*args, **kwargs)
        return wrapper
    return decorate


@trace("outer")
@trace("inner")
def work():
    events.append("body")
    return "done"


result = work()
print(events)
# ['factory outer', 'factory inner', 'decorate inner', 'decorate outer',
#  'call outer', 'call inner', 'body']
```

La composizione e `outer(inner(work))`, non l'inverso. In particolare, cambiare l'ordine di cache e controlli di accesso puo cambiare quali controlli vengono eseguiti su un cache hit.

### Wrapper asincrono

Per misurare una coroutine occorre attenderla dentro un wrapper `async def`.

```python
import asyncio
from functools import wraps
from time import perf_counter


def timed_async(function):
    @wraps(function)
    async def wrapper(*args, **kwargs):
        started = perf_counter()
        try:
            return await function(*args, **kwargs)
        finally:
            elapsed = perf_counter() - started
            print(f"{function.__name__}: {elapsed:.6f}s")
    return wrapper


@timed_async
async def load_count() -> int:
    await asyncio.sleep(0)
    return 42


print(asyncio.run(load_count()))  # durata variabile, poi 42
```

Questo decoratore assume una funzione che restituisce un awaitable; non e un adattatore universale per funzioni sincrone o generatori asincroni. La cancellazione passa per il `finally` e poi continua a propagarsi, se il cleanup non solleva un altro errore.

`asyncio.run` e adatto a uno script senza event loop gia attivo. In una cella o un'applicazione gia asincrona si usa `await load_count()` nel contesto appropriato.

### Classi e decoratori standard

`dataclass` lavora sulle classi; `property`, `classmethod` e `staticmethod` modificano anche il modo di accedere agli attributi. Non sono intercambiabili con qualsiasi wrapper per funzioni. Per combinare un normale wrapper come `log_call` con un classmethod, applica il wrapper alla funzione e metti `@classmethod` all'esterno.

Per annotare un wrapper che conserva la firma, `ParamSpec` e `TypeVar` aiutano il type checker; vedi Type Hinting. `wraps` da solo non fornisce questa verifica statica.

## Errori comuni

- Dimenticare di restituire il wrapper o il risultato della funzione originale.
- Fare lavoro pesante o I/O nella factory senza considerare il momento dell'import.
- Chiamare il decoratore al posto di passarlo, o viceversa, confondendo factory e wrapper.
- Presumere che `wraps` preservi automaticamente comportamento async, generazione o validazione.
- Ripetere operazioni con effetti senza gestire duplicati ed errori parziali.
- Impilare decoratori senza verificarne l'ordine osservabile.

## Checklist

- E chiaro cosa avviene alla definizione e cosa alla chiamata?
- Firma descritta, binding, ritorno ed eccezioni restano coerenti?
- Il callable e sincrono, coroutine o generatore?
- L'ordine dei wrapper e coperto da un esempio o un test?
- Logging e cleanup possono introdurre nuovi errori?
- La funzione originale resta ispezionabile tramite `__wrapped__`?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Higher-order Functions|Higher-order Functions]]
- [[Programmazione/Python/Pagine/Argomenti Flessibili|Argomenti flessibili]]
- [[Programmazione/Python/Pagine/Caching|Caching]]
- [[Programmazione/Python/Pagine/Introspezione|Introspezione]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]

## Fonti

- [Python 3.12: definizioni di funzione e decoratori](https://docs.python.org/3.12/reference/compound_stmts.html#function-definitions).
- [functools.wraps](https://docs.python.org/3.12/library/functools.html#functools.wraps).
- [inspect.signature](https://docs.python.org/3.12/library/inspect.html#inspect.signature).
- [Coroutine e task asyncio](https://docs.python.org/3.12/library/asyncio-task.html).

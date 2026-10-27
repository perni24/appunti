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
aliases:
  - Context Managers
prerequisites: []
related: []
title: Context Managers in Python
---

# Context Managers in Python

## Sintesi

Un context manager delimita un ciclo di vita tramite `with`: acquisizione, uso e rilascio. Se l'ingresso riesce, l'uscita viene invocata anche quando il corpo termina con un errore, `return` o `break`. Non e una garanzia contro arresti forzati del processo o errori nel cleanup stesso.

Riferimento: Python 3.12; esempi verificati con CPython 3.12.10.

## Quando usarlo

Per file, lock, risorse di rete, configurazioni temporanee e operazioni con setup/teardown. Una libreria puo usare `with` per una transazione anziche per chiudere una connessione: verifica sempre il contratto specifico.

Non basta che un oggetto abbia `close` per usarlo direttamente con `with`; puo servire `contextlib.closing`. Non ogni oggetto chiamato "connessione" chiude o effettua commit allo stesso modo.

## Come funziona

1. Si valuta l'espressione del manager e si chiama `__enter__`.
2. Il valore restituito viene assegnato all'eventuale variabile dopo `as`.
3. Si esegue il corpo.
4. Si chiama `__exit__(exc_type, exc_value, traceback)`: tre `None` in assenza di eccezione, oppure i dettagli dell'errore.

Se `__enter__` fallisce, **il suo `__exit__` non viene chiamato**. L'acquisizione deve quindi gestire le risorse parziali. Se l'ingresso riesce ma fallisce l'assegnazione dopo `as`, l'uscita viene invece eseguita.

Un ritorno truthy da `__exit__` sopprime l'eccezione del corpo; `False` o `None` la lasciano propagare. Il valore non annulla un `return` ordinario e non e il risultato del blocco. Se `__exit__` solleva un nuovo errore, questo puo sostituire quello precedente, conservandolo nel contesto dell'eccezione.

## API / Sintassi

Il manager seguente registra il protocollo in memoria. Il valore ricevuto con `as` e un dizionario, non il manager stesso.

```python
class ManagedResource:
    def __init__(self, events: list) -> None:
        self.events = events

    def __enter__(self):
        self.events.append("acquire")
        return {"ready": True}

    def __exit__(self, exc_type, exc_value, traceback):
        self.events.append(("release", None if exc_type is None else exc_type.__name__))
        return False


events = []
manager = ManagedResource(events)
try:
    with manager as resource:
        print(resource["ready"])  # True
        raise ValueError("demo")
except ValueError:
    print(events)  # ['acquire', ('release', 'ValueError')]
```

L'eccezione non viene nascosta. L'esempio non apre una vera connessione: serve a mostrare oggetti e ordine delle chiamate. Riutilizzabilita e rientranza dipendono dal manager, non dalla sintassi `with`.

### contextmanager

`@contextmanager` trasforma una funzione generatore in una factory di manager. Il codice prima del singolo `yield` e l'ingresso; il valore emesso arriva ad `as`; alla fine del corpo il generatore riprende. Un errore del corpo viene rilanciato nel punto del `yield`.

## Esempio pratico

Il timer misura un blocco, anche se termina con un errore. Ogni chiamata a `timer(...)` crea un manager nuovo.

```python
from contextlib import contextmanager
from time import perf_counter


@contextmanager
def timer(label: str):
    started = perf_counter()
    try:
        yield
    finally:
        elapsed = perf_counter() - started
        print(f"{label}: {elapsed:.6f}s")


with timer("report"):
    total = sum(number * 2 for number in range(1000))
print(total)  # durata variabile, poi 999000
```

Deve esserci **esattamente un yield raggiunto** per ogni ingresso riuscito: zero o due yield sono errori del protocollo. Se intercetti un'eccezione intorno al `yield` solo per registrarla, usa `raise` per non sopprimerla accidentalmente.

Un'istanza restituita da `timer("report")` e monouso. Riutilizza la factory, non la stessa istanza. Anche il codice nel `finally` puo fallire; il timer non costituisce un benchmark o un sistema di telemetria affidabile sotto ogni guasto.

## Varianti

### Piu risorse e ordine di uscita

I manager entrano da sinistra a destra ed escono in ordine inverso. Se l'ingresso successivo fallisce, quelli gia entrati vengono comunque rilasciati.

Il frammento usa solo una directory temporanea. La modalita `x` crea un output nuovo e rifiuta di sovrascriverne uno esistente.

```python
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory(prefix="appunti-context-copy-") as directory:
    source_path = Path(directory) / "input.txt"
    target_path = Path(directory) / "output.txt"
    source_path.write_text("first\nsecond\n", encoding="utf-8")

    with (
        source_path.open(encoding="utf-8") as source,
        target_path.open("x", encoding="utf-8") as target,
    ):
        for line in source:
            target.write(line.upper())

    copied = target_path.read_text(encoding="utf-8")
    print(copied.splitlines())  # ['FIRST', 'SECOND']
```

Chiusura non significa transazione o scrittura atomica: un errore durante la copia puo lasciare un output parziale. I dettagli su modalita, encoding e durabilita sono nella nota Gestione File.

### ExitStack per un numero dinamico di risorse

```python
from contextlib import ExitStack
from pathlib import Path
from tempfile import TemporaryDirectory


def read_first_lines(paths) -> list[str]:
    with ExitStack() as stack:
        sources = [
            stack.enter_context(open(path, encoding="utf-8"))
            for path in paths
        ]
        return [source.readline().rstrip("\n") for source in sources]


with TemporaryDirectory(prefix="appunti-context-stack-") as directory:
    first = Path(directory) / "first.txt"
    second = Path(directory) / "second.txt"
    first.write_text("one\nrest\n", encoding="utf-8")
    second.write_text("two\n", encoding="utf-8")
    print(read_first_lines([first, second]))  # ['one', 'two']
```

Se il secondo file non si apre, il primo viene chiuso. `ExitStack` registra il cleanup dopo ciascun ingresso riuscito; non sostituisce la gestione interna di un `__enter__` che fallisce a meta acquisizione.

`stack.callback(cleanup, ...)` registra una funzione da chiamare in uscita, ma non le passa l'eccezione e non puo usarne il risultato per sopprimerla. `push` registra invece un'uscita con il contratto di `__exit__`. Lo stack non viene automaticamente chiuso solo perche il garbage collector lo raccoglie: usalo con `with` o chiudilo esplicitamente.

### async with e generatori asincroni

`async with` attende `__aenter__` e `__aexit__`. `asynccontextmanager` usa un singolo `yield` in una funzione generatore asincrona; `aclosing` attende `aclose` quando si esce dal suo blocco.

Questo esempio simula acquisizione e rilascio asincroni in memoria, senza database o servizi esterni.

```python
import asyncio
from contextlib import aclosing, asynccontextmanager


@asynccontextmanager
async def async_resource(events):
    events.append("acquire")
    try:
        yield "resource"
    finally:
        await asyncio.sleep(0)
        events.append("release")


async def async_values(events):
    try:
        yield 1
        yield 2
    finally:
        await asyncio.sleep(0)
        events.append("generator closed")


async def demo():
    events = []
    async with async_resource(events) as resource:
        events.append(resource)
        async with aclosing(async_values(events)) as values:
            async for value in values:
                events.append(value)
                break
    return events


print(asyncio.run(demo()))
# ['acquire', 'resource', 1, 'generator closed', 'release']
```

Anche qui `break` non chiude da solo il generatore: lo fa `aclosing`, nel contesto del consumo. Il cleanup puo contenere `await`; ulteriori cancellazioni o errori possono interromperlo. Non promettere rilascio infallibile solo perche compare `finally`.

`asyncio.run` vale per uno script senza loop gia attivo; dentro codice asincrono usa `await demo()`. `AsyncExitStack` gestisce gruppi dinamici di manager sync e async e va chiuso con `async with` o `await stack.aclose()`.

### Altri strumenti

| Strumento                      | Quando e utile                                                           |
| ------------------------------ | ------------------------------------------------------------------------ |
| `closing(obj)`                 | Chiamare close in uscita su un oggetto che non implementa il protocollo. |
| `aclosing(obj)`                | Attendere aclose in uscita, per esempio su un generatore asincrono.      |
| `nullcontext(value)`           | Unificare un ramo che non deve acquisire o chiudere una risorsa.         |
| `suppress(ExpectedError)`      | Ignorare solo un errore atteso in un blocco piccolo.                     |
| `ExitStack` / `AsyncExitStack` | Coordinare un numero variabile di risorse.                               |

`suppress(Exception)` intorno a una procedura ampia puo nascondere bug. `nullcontext` non trasferisce la proprieta della risorsa e non la chiude: il contratto del chiamante deve restare esplicito.

## Errori comuni

- Dire che `__exit__` viene chiamato anche quando `__enter__` non e riuscito.
- Confondere il manager con il valore restituito da `__enter__`.
- Restituire un valore truthy o intercettare senza `raise` quando l'errore deve propagarsi.
- Riutilizzare un manager generatore monouso.
- Considerare chiusura, commit, rollback e atomicita la stessa operazione.
- Affidarsi al garbage collector o a `break` per il cleanup puntuale.

## Checklist

- Chi possiede la risorsa e quale evento la rilascia?
- Un ingresso parzialmente fallito ripulisce cio che ha acquisito?
- Le eccezioni vengono propagate o soppresse intenzionalmente?
- Il cleanup puo fallire o essere cancellato?
- Servono ordine inverso e acquisizioni dinamiche?
- Il manager e monouso, riutilizzabile o rientrante?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Gestione File|Gestione file]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]
- [[Programmazione/Python/Pagine/Generatori|Generatori]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/Memory Management|Memory Management]]

## Fonti

- [Python 3.12: with](https://docs.python.org/3.12/reference/compound_stmts.html#the-with-statement).
- [Data model: context manager sincroni e asincroni](https://docs.python.org/3.12/reference/datamodel.html#with-statement-context-managers).
- [contextlib: contextmanager, ExitStack e varianti async](https://docs.python.org/3.12/library/contextlib.html).
- [Asyncio: cancellazione e cleanup](https://docs.python.org/3.12/library/asyncio-task.html#task-cancellation).

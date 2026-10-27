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
  - Generatori
prerequisites: []
related: []
title: Generatori in Python
---

# Generatori in Python

## Sintesi

Un generatore e un iteratore che sospende l'esecuzione con `yield` e conserva il proprio stato fino alla richiesta successiva. Produce valori al consumo, senza dover costruire subito una collezione completa.

Riferimento: Python 3.12; esempi verificati con CPython 3.12.10.

## Quando usarlo

- Letture progressive e trasformazioni di flussi.
- Sequenze grandi o potenzialmente infinite, consumate con un limite.
- Pipeline che non richiedono accesso casuale o piu passate sullo stesso oggetto.

Lazy non significa memoria nulla: restano riferimenti, variabili locali e possibili buffer. Una riga enorme o una trasformazione che accumula tutto puo comunque richiedere molta memoria.

## Come funziona

Una funzione `def` che contiene `yield` e una funzione generatore. La chiamata restituisce un oggetto generatore: il corpo parte al primo `next` o `send(None)`. Dopo ogni `yield` riprende dal punto sospeso; `return` o la fine del corpo lo esauriscono.

Anche la validazione nel corpo e rinviata. Se vuoi rifiutare un parametro subito, usa una funzione esterna normale che valida e restituisce un generatore interno.

```python
def count_to(limit: int):
    if type(limit) is not int:
        raise TypeError("limit must be an integer")
    if limit < 0:
        raise ValueError("limit cannot be negative")
    for current in range(1, limit + 1):
        yield current


counter = count_to(3)
print(next(counter))     # 1
print(list(counter))     # [2, 3]
print(list(counter))     # []
print(list(count_to(3))) # [1, 2, 3]
```

Una nuova chiamata crea un nuovo percorso di esecuzione. `iter(counter) is counter`: il generatore non e un contenitore riutilizzabile.

## API / Sintassi

| Operazione          | Effetto                                                                             |
| ------------------- | ----------------------------------------------------------------------------------- |
| `next(g)`           | Riprende e ottiene il prossimo valore; a fine sequenza solleva StopIteration.       |
| `next(g, default)`  | Restituisce il default solo in caso di StopIteration.                               |
| `g.send(value)`     | Fa diventare value il risultato del yield sospeso e riprende il corpo.              |
| `g.throw(error)`    | Solleva l'eccezione nel punto sospeso; puo essere gestita o propagata.              |
| `g.close()`         | Richiede la chiusura tramite GeneratorExit; puo eseguire finally gia raggiunti.     |
| `yield from source` | Delega a un iterabile e, se supportato, inoltra anche il protocollo del generatore. |

Per avviare un generatore, `send` puo ricevere solo `None`. Una chiusura prima dell'avvio non esegue il corpo, compreso un `finally` non ancora raggiunto. Nella baseline 3.12 `close` riuscito restituisce `None`; non usarlo per recuperare un risultato finale.

### Generator expression e momento della valutazione

```python
events = []


def source():
    events.append("source")
    return [2, 4]


factor = 2
scaled = (number * factor for number in source())
print(events)  # ['source']
factor = 3
print(list(scaled))  # [6, 12]
```

L'espressione iterabile del primo `for` viene valutata subito, insieme alla creazione del relativo iteratore. Corpo, filtri e iterazioni successive sono invece lazy. Una variabile libera come `factor` viene quindi letta al consumo.

### Composizione e yield from

```python
from itertools import count, islice


def chain(first, second):
    yield from first
    yield from second


def squares(numbers):
    for number in numbers:
        yield number * number


pipeline = squares(chain([1, 2], [3, 4]))
print(list(pipeline))                 # [1, 4, 9, 16]
print(list(islice(count(1), 3)))       # [1, 2, 3]
```

`count` e infinito, `islice` limita il consumo. Non convertire in lista il flusso infinito completo. Per la semplice concatenazione esiste gia `itertools.chain`: la funzione qui mostra il meccanismo di delega.

`yield from` puo anche ricevere il valore finale di un sottogeneratore: `result = yield from child()` assegna a `result` il valore del suo `return`. Quel valore non e un ulteriore elemento emesso dal figlio.

## Esempio pratico

Il generatore possiede il file e lo tiene aperto mentre e sospeso su `yield`. Il chiamante usa `closing` per chiuderlo anche quando interrompe il ciclo dopo la prima riga utile. Il blocco crea soltanto un file temporaneo.

```python
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory


def non_empty_lines(path):
    with open(path, encoding="utf-8") as source:
        for line in source:
            cleaned = line.strip()
            if cleaned:
                yield cleaned


with TemporaryDirectory(prefix="appunti-generator-") as directory:
    path = Path(directory) / "input.txt"
    path.write_text("\n first \n\nsecond\n", encoding="utf-8")
    with closing(non_empty_lines(path)) as lines:
        for line in lines:
            print(line.upper())  # FIRST
            break
```

La trasformazione rimuove spazi esterni, non soltanto il newline. Lettura, decoding ed eventuali errori avvengono durante il consumo. Un errore dopo alcune righe non annulla quanto il chiamante ha gia fatto.

Un'alternativa e passare al generatore un file gia aperto con `with` dal chiamante: in quel caso il chiamante mantiene la responsabilita della chiusura. Non restituire un generatore che dipende da un file gia chiuso all'uscita di un `with` interno.

## Varianti

### break non e close

```python
from contextlib import closing

events = []


def tracked_values():
    events.append("acquire")
    try:
        yield 1
        yield 2
    finally:
        events.append("release")


values = tracked_values()
with closing(values):
    for value in values:
        break
    print(events)  # ['acquire']
print(events)      # ['acquire', 'release']
```

Il ciclo si interrompe, ma il generatore resta sospeso finche non viene chiuso o ripreso. Qui `closing` rende il rilascio esplicito; non ci si affida al garbage collector. Durante `close` il generatore non deve emettere un altro valore: farlo puo causare `RuntimeError`.

### send e risultato finale

```python
def accumulator():
    total = 0
    while True:
        value = yield total
        if value is None:
            return total
        if type(value) is not int:
            raise TypeError("value must be an integer")
        total += value


stream = accumulator()
print(next(stream))   # 0
print(stream.send(3))  # 3
print(stream.send(4))  # 7

finished = None
try:
    stream.send(None)
except StopIteration as stop:
    finished = stop.value
print(finished)       # 7
```

Il `return total` finisce in `StopIteration.value`, non in un ultimo `yield`. Per terminare una funzione generatore usa `return`: un `StopIteration` sollevato accidentalmente nel corpo e lasciato uscire viene trasformato in `RuntimeError`, secondo PEP 479.

Un `async def` con `yield` crea invece un generatore asincrono, consumato con `async for`. Non e una coroutine ordinaria e non ammette `return` con un valore. Chiusura tramite `aclose` e `aclosing`: vedi Context Managers.

## Errori comuni

- Leggere due volte dallo stesso generatore aspettandosi gli stessi valori.
- Presumere che la chiamata abbia gia eseguito validazione o I/O.
- Confondere valutazione del primo iterabile e valutazione del corpo.
- Uscire con `break` senza decidere chi chiude le risorse.
- Sollevare `StopIteration` nel corpo invece di usare `return`.
- Considerare ogni pipeline automaticamente efficiente o priva di effetti parziali.

## Checklist

- E chiaro dove inizia e termina il consumo?
- Servono piu passate o basta una sola?
- Gli errori sono immediati oppure differiti?
- Chi possiede e chi chiude le risorse?
- La chiusura anticipata e coperta?
- Memoria trattenuta e dimensione degli elementi sono compatibili con il caso d'uso?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]
- [[Programmazione/Python/Pagine/Gestione File|Gestione file]]
- [[Programmazione/Python/Pagine/Context Managers|Context manager e cleanup]]

## Fonti

- [Python 3.12: yield e generatori](https://docs.python.org/3.12/reference/expressions.html#yield-expressions).
- [Metodi del generatore](https://docs.python.org/3.12/reference/expressions.html#generator-iterator-methods).
- [PEP 380: delega con yield from](https://peps.python.org/pep-0380/).
- [PEP 479: StopIteration nei generatori](https://peps.python.org/pep-0479/).
- [contextlib.closing](https://docs.python.org/3.12/library/contextlib.html#contextlib.closing).

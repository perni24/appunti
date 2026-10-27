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
  - Iteratori
prerequisites: []
related: []
title: Iteratori in Python
---

# Iteratori in Python

## Sintesi

Un **iterabile** permette di ottenere un iteratore con `iter(obj)`. Un **iteratore** mantiene la posizione del consumo, fornisce il prossimo elemento con `next` e restituisce se stesso da `__iter__`.

Liste e tuple sono iterabili riutilizzabili; un iteratore di lista o un generatore sono normalmente monouso. Il protocollo non garantisce di per se memoria costante, dati immutabili o assenza di I/O.

Riferimento: Python 3.12; esempi verificati con CPython 3.12.10.

## Quando usarlo

Per attraversare collezioni, file o sequenze calcolate senza richiedere una lista intermedia. Una classe iteratore e utile quando lo stato del consumo e parte dell'API; per una semplice sequenza calcolata, un generatore e spesso piu corto.

## Come funziona

Un `for` ottiene un iteratore e richiede elementi fino a `StopIteration`. Altri errori si propagano. Un iteratore correttamente implementato, dopo aver segnalato esaurimento, continua a segnalarlo; `iter(iterator)` non lo azzera.

```python
numbers = [10, 20, 30]
iterator = iter(numbers)
print(next(iterator))  # 10
print(list(iterator))  # [20, 30]
print(list(iterator))  # []
print(list(numbers))   # [10, 20, 30]
print(iter(iterator) is iterator)  # True
```

Due consumatori dello stesso iteratore condividono la posizione. Un alias non duplica la sequenza. `list`, `sum`, `in`, `any` e molti altri costrutti possono consumare elementi, talvolta solo fino al primo risultato utile.

## API / Sintassi

| API                        | Uso e limite                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `iter(obj)`                | Richiede il protocollo iterabile; alcuni tipi supportano anche il vecchio protocollo per indici. |
| `next(it)`                 | Richiede un iteratore; a fine sequenza solleva StopIteration.                                    |
| `next(it, default)`        | Distingui il default dai valori validi del flusso.                                               |
| `iter(callable, sentinel)` | Chiama senza argomenti finche il risultato e uguale alla sentinella.                             |
| `__iter__`                 | Su un iteratore restituisce self; su un contenitore puo creare un iteratore indipendente.        |
| `__next__`                 | Restituisce un valore oppure solleva StopIteration.                                              |

`next([], default)` resta errato: una lista non e un iteratore. Un default non nasconde eccezioni diverse da `StopIteration`.

### Iteratore e contenitore riutilizzabile

```python
class CountTo:
    def __init__(self, limit: int) -> None:
        if type(limit) is not int:
            raise TypeError("limit must be an integer")
        if limit < 0:
            raise ValueError("limit cannot be negative")
        self._limit = limit
        self._current = 0

    def __iter__(self):
        return self

    def __next__(self) -> int:
        if self._current >= self._limit:
            raise StopIteration
        self._current += 1
        return self._current


class CountRange:
    def __init__(self, limit: int) -> None:
        CountTo(limit)
        self._limit = limit

    def __iter__(self):
        return CountTo(self._limit)


one_shot = CountTo(3)
print(list(one_shot), list(one_shot))  # [1, 2, 3] []
reusable = CountRange(3)
print(list(reusable), list(reusable))  # [1, 2, 3] [1, 2, 3]
```

`CountRange` riusa la validazione di `CountTo` durante la costruzione e crea un iteratore nuovo a ogni passata. Queste classi illustrano il protocollo: per una sequenza intera ordinaria usa `range`.

L'esaurimento resta stabile fintanto che il chiamante rispetta gli attributi interni. Modificare direttamente `_current` o `_limit` viola quel contratto.

## Esempio pratico

Sequenza di ritardi con crescita esponenziale e tetto massimo, in **millisecondi interi**. `attempts` indica quanti ritardi produrre, non il numero totale di richieste di un client.

```python
class RetryDelays:
    def __init__(self, attempts: int, base_ms: int, max_ms: int) -> None:
        for value in (attempts, base_ms, max_ms):
            if type(value) is not int:
                raise TypeError("arguments must be integers")
        if attempts < 0 or base_ms < 1 or max_ms < base_ms:
            raise ValueError("invalid delay configuration")
        self._remaining = attempts
        self._delay = base_ms
        self._maximum = max_ms

    def __iter__(self):
        return self

    def __next__(self) -> int:
        if self._remaining == 0:
            raise StopIteration
        delay = self._delay
        self._remaining -= 1
        self._delay = min(self._delay * 2, self._maximum)
        return delay


delays = RetryDelays(attempts=4, base_ms=500, max_ms=2000)
print(list(delays))  # [500, 1000, 2000, 2000]
print(list(delays))  # []
```

Non effettua richieste e non attende davvero. Un client reale deve scegliere quali errori ritentare, rispettare timeout e budget, evitare duplicati e valutare jitter o istruzioni del server. La progressione da sola non costituisce una politica di retry completa.

## Varianti

### Sentinella e lettura a blocchi

Il file in memoria rende il frammento autonomo; lo stesso schema si applica a un file binario aperto dal chiamante.

```python
from functools import partial
from io import BytesIO

with BytesIO(b"abcdef") as source:
    chunks = list(iter(partial(source.read, 4), b""))

print(chunks)  # [b'abcd', b'ef']
```

La sentinella non viene emessa. Il confronto usa l'uguaglianza, non necessariamente l'identita. Per lettura binaria la sentinella e `b""`; per `readline` in modalita testo e `""`. La dimensione del blocco deve essere positiva: con zero il primo risultato sarebbe gia la sentinella, senza leggere i dati.

### Comporre con itertools

```python
from itertools import batched, chain, count, islice, pairwise

sample = list(islice(count(10, 5), 3))
joined = list(chain([1, 2], [3]))
pairs = list(pairwise([10, 20, 30]))
batches = list(batched(range(5), 2))

print(sample)   # [10, 15, 20]
print(joined)   # [1, 2, 3]
print(pairs)    # [(10, 20), (20, 30)]
print(batches)  # [(0, 1), (2, 3), (4,)]
```

`batched` e disponibile dalla 3.12 e in questa baseline ammette un ultimo gruppo piu corto, senza parametro `strict`. `islice` consuma gli elementi saltati e non offre slicing con indici negativi. `cycle` puo accumulare gli elementi per ripeterli: non ogni funzione lazy usa memoria limitata.

### Raggruppamento e duplicazione del consumo

```python
from itertools import groupby, tee

groups = [(key, list(group)) for key, group in groupby("aaabba")]
print(groups)  # [('a', ['a', 'a', 'a']), ('b', ['b', 'b']), ('a', ['a'])]

source = iter([{"value": 1}, {"value": 2}])
left, right = tee(source)
first = next(left)
first["value"] = 9
print(next(right))  # {'value': 9}
```

`groupby` raggruppa elementi **consecutivi** con la stessa chiave, non tutte le occorrenze sparse. I sottogruppi condividono la sorgente: consumali o materializzali prima di avanzare al gruppo successivo.

`tee` separa le posizioni dei consumatori, non copia profondamente gli elementi. Se un ramo resta indietro, il buffer puo crescere molto; dopo la divisione usa i rami restituiti, non la sorgente originale. Non e una soluzione thread-safe.

## Errori comuni

- Reinizializzare la posizione dentro `__iter__` di un iteratore.
- Ritenere `None` sempre una sentinella adatta, anche quando e un dato valido.
- Usare `break` aspettandosi che chiuda ogni iteratore o risorsa.
- Mutare la collezione sorgente mentre si itera senza un contratto definito.
- Usare `tee` come copia gratuita di un flusso enorme.
- Chiamare "gruppo" un insieme globale quando `groupby` raggruppa soltanto adiacenze.

## Checklist

- Oggetto riutilizzabile o consumo monouso?
- I consumatori condividono la stessa posizione?
- Dopo l'esaurimento continua a essere sollevato StopIteration?
- La sentinella puo confondersi con un elemento valido?
- E chiaro quanto input consuma ogni operazione?
- Chi gestisce chiusura e buffer delle risorse sottostanti?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Generatori|Generatori]]
- [[Programmazione/Python/Pagine/Cicli|Cicli]]
- [[Programmazione/Python/Pagine/Comprehensions|Comprehensions]]
- [[Programmazione/Python/Pagine/Data model|Data model]]
- [[Programmazione/Python/Pagine/Context Managers|Gestione delle risorse]]

## Fonti

- [Python 3.12: protocollo degli iteratori](https://docs.python.org/3.12/library/stdtypes.html#iterator-types).
- [Funzioni iter e next](https://docs.python.org/3.12/library/functions.html#iter).
- [itertools: composizione, raggruppamento e buffering](https://docs.python.org/3.12/library/itertools.html).

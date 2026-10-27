---
date: 2026-06-03
area: Programmazione
topic: Python
type: theory-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - python
  - programming
  - functions
aliases:
  - Higher-order Functions
  - HOF
prerequisites: []
related: []
title: Higher-order Functions in Python
---

# Higher-order Functions in Python

## Sintesi

Una higher-order function riceve un'altra funzione come argomento oppure restituisce una funzione. In Python le funzioni sono oggetti: puoi passarle, conservarle e costruire comportamenti configurati senza introdurre una classe per ogni operazione.

Riferimento: Python 3.12; esempi verificati con CPython 3.12.10.

## Problema che risolve

Separa una procedura stabile dal comportamento che varia: attraversare gli elementi e applicare una trasformazione, ordinare per una chiave, costruire un validatore configurato o aggiungere un wrapper.

Non equivale a rendere tutto funzionale. Le callback possono avere stato, mutare dati o fallire; l'API deve chiarire quando vengono chiamate e cosa si aspetta da loro.

## Concetto chiave

### Passare comportamento

`transform` e la funzione da chiamare, non il risultato di una chiamata anticipata. L'esempio e sincrono, conserva l'ordine e costruisce una lista.

```python
from collections.abc import Callable, Iterable
from typing import TypeVar

T = TypeVar("T")
R = TypeVar("R")


def apply_to_all(items: Iterable[T], transform: Callable[[T], R]) -> list[R]:
    return [transform(item) for item in items]


numbers = [1, 2, 3]
result = apply_to_all(numbers, lambda number: number * 2)
print(result)   # [2, 4, 6]
print(numbers)  # [1, 2, 3]
```

Le annotazioni descrivono il contratto, non verificano automaticamente firma o comportamento della callback. Una funzione che modifica gli elementi ricevuti puo modificare gli oggetti originali: il ciclo non ne crea copie.

Se la callback fallisce, l'eccezione si propaga. Gli elementi gia letti da un iteratore restano consumati e gli effetti gia prodotti non vengono annullati.

### Restituire comportamento

Una closure conserva l'accesso allo scope esterno necessario. Chiamate diverse alla factory creano contesti distinti.

```python
def multiplier(factor: int):
    def multiply(value: int) -> int:
        return value * factor
    return multiply


double = multiplier(2)
triple = multiplier(3)
print(double(10), triple(10))  # 20 30
```

Questo esempio assume numeri interi secondo le annotazioni, senza validazione runtime. La closure non e uno snapshot universale: un oggetto mutabile catturato rimane condiviso se non viene copiato deliberatamente.

## Dettagli importanti

### Valutazione immediata e lazy

`sorted` e una comprehension di lista consumano l'input per costruire il risultato. `map` e `filter` costruiscono iteratori: la callback viene eseguita durante il consumo. Un risultato lazy non e una cache e non riparte dall'inizio.

```python
events = []


def upper(name: str) -> str:
    events.append(name)
    return name.upper()


mapped = map(upper, ["anna", "luca"])
print(events)         # []
first = next(mapped)
print(first, events)  # ANNA ['anna']
rest = list(mapped)
print(rest, events)   # ['LUCA'] ['anna', 'luca']
print(list(mapped))   # []

odd = list(filter(lambda number: number % 2 != 0, [1, 2, 3, 4, 5]))
print(odd)  # [1, 3, 5]
```

Con piu iterabili, `map` nella baseline 3.12 si ferma al piu corto. Non segnala automaticamente lunghezze diverse. `filter(None, values)` scarta tutti i valori falsy, non soltanto `None`.

Una callback `async def` restituisce una coroutine: questi strumenti sincroni non la attendono. Per esempio un `filter` con predicato async non esegue la verifica desiderata. L'asincronia richiede un flusso esplicito.

### Riduzione e valore iniziale

`reduce` combina l'accumulatore con ogni elemento da sinistra a destra. Con un inizializzatore esplicito e definito anche il caso vuoto.

```python
from functools import reduce
from operator import add, mul

numbers = [1, 2, 3, 4]
total = reduce(add, numbers, 0)
product = reduce(mul, numbers, 1)
empty_total = reduce(add, [], 0)

print(total, product, empty_total)  # 10 24 0
print(sum(numbers))                # 10
```

Senza inizializzatore, il primo elemento diventa l'accumulatore e un iterabile vuoto causa `TypeError`. Per somma, prodotto o condizioni aggregate preferisci spesso `sum`, `math.prod`, `any` e `all`: comunicano lo scopo senza una riduzione generica. `any` e `all` possono fermarsi prima di consumare tutto.

## Esempio

### Una regola configurabile

Il validatore controlla la lunghezza minima di un testo. Non e un controllo di robustezza di una password e non normalizza gli spazi.

```python
from collections.abc import Callable


def min_length(length: int) -> Callable[[str], bool]:
    if type(length) is not int:
        raise TypeError("length must be an integer")
    if length < 0:
        raise ValueError("length cannot be negative")

    def validate(value: str) -> bool:
        if not isinstance(value, str):
            raise TypeError("value must be a string")
        return len(value) >= length

    return validate


long_enough = min_length(4)
print(long_enough("cat"), long_enough("notes"))  # False True
print(min_length(0)(""))                       # True
```

La configurazione viene controllata alla creazione della regola; il testo a ogni chiamata. `len(str)` conta code point, non byte o necessariamente caratteri percepiti dall'utente. I booleani non sono ammessi come lunghezza, anche se sono sottoclassi di `int`.

### Configurare argomenti con partial

```python
from functools import partial


def format_message(level: str, message: str, *, prefix: str = "app") -> str:
    return f"{prefix} [{level}] {message}"


info = partial(format_message, "INFO", prefix="worker")
print(info("ready"))                 # worker [INFO] ready
print(info("ready", prefix="api"))   # api [INFO] ready
```

I nuovi argomenti posizionali si aggiungono a quelli fissati; i keyword possono sostituire quelli preconfigurati. `partial` non e un vincolo di sicurezza e non copia profondamente gli oggetti passati. Per il binding di metodi nella definizione di una classe esiste `partialmethod`.

## Limiti

- Higher-order non significa puro, parallelo, asincrono o privo di allocazioni.
- Una pipeline lazy conserva riferimenti e puo rimandare gli errori al consumo.
- Una callback con una firma incompatibile fallisce alla chiamata, anche se `callable` restituisce vero.
- Le closure possono trattenere oggetti grandi o stato modificabile.
- La memoization con `lru_cache` richiede una politica su argomenti, effetti e invalidazione; vedi Caching.

## Errori comuni

- Passare `transform()` quando l'API richiede `transform`.
- Usare callback con effetti nascosti in un ordinamento o in un filtro.
- Cercare una lista completa dopo aver consumato parte di un iteratore.
- Usare una catena di lambda al posto di passaggi con nomi significativi.
- Presumere che un errore ripristini dati, input consumato o stato esterno.
- Presentare un controllo di sola lunghezza come validazione completa.

## Checklist

- La callback e sincrona o deve essere attesa?
- Sono chiari argomenti, risultato e momento di esecuzione?
- Input e risultati sono condivisi, copiati o consumabili?
- Il caso vuoto e definito?
- Una funzione dedicata della standard library sarebbe piu leggibile?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Python/Pagine/Funzioni Lambda|Funzioni Lambda]]
- [[Programmazione/Python/Pagine/Decoratori|Decoratori]]
- [[Programmazione/Python/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Python/Pagine/Caching|Caching]]

## Fonti

- [Python 3.12: functools](https://docs.python.org/3.12/library/functools.html).
- [Built-in: map, filter, any e all](https://docs.python.org/3.12/library/functions.html).
- [FAQ: higher-order functions](https://docs.python.org/3.12/faq/programming.html#how-do-you-make-a-higher-order-function-in-python).
- [Python: funzioni e scope](https://docs.python.org/3.12/tutorial/controlflow.html#defining-functions).

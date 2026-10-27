---
date: 2026-07-30
area: Programmazione
topic: Promemoria Python
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - promemoria
  - funzioni
aliases:
  - Cheatsheet funzioni Python
prerequisites: []
related:
  - "[[Programmazione/Python/Pagine/Funzioni]]"
  - "[[Programmazione/Python/Pagine/Argomenti Flessibili]]"
  - "[[Programmazione/Python/Pagine/Type Hinting]]"
title: Python - Funzioni
---

# Python - Funzioni

## Obiettivo

Ritrovare definizioni, firme e chiamate comuni. Ogni blocco e autonomo; per i dettagli usa i collegamenti alla teoria.

Baseline verificata: **CPython 3.12.10**. Gli snippet non aprono connessioni e non richiedono pacchetti esterni.

## Quando usarlo

Per scegliere parametri, default, valori restituiti e callback. Teoria: [[Programmazione/Python/Pagine/Funzioni|Funzioni]] e [[Programmazione/Python/Pagine/Argomenti Flessibili|Argomenti Flessibili]].

## Procedura

Scegli la firma, sostituisci il corpo e verifica input, risultato ed eventuali mutazioni. Le annotazioni aiutano il checker ma non validano o convertono i dati a runtime.

## Snippet

### Definizione e return

```python
def add(left: int, right: int) -> int:
    return left + right


result = add(2, 3)
print(result)  # 5
```

Senza `return`, o con `return` senza valore, il risultato e `None`. `print` non sostituisce `return`.

### Valore predefinito

```python
def greet(name: str = "Utente") -> str:
    return f"Ciao {name}"


print(greet())       # Ciao Utente
print(greet("Ada"))  # Ciao Ada
```

Il default viene valutato alla definizione, non a ogni chiamata: vale anche per espressioni come `datetime.now()`.

### Default mutabile evitato

```python
def append_value(value, items=None):
    if items is None:
        items = []
    items.append(value)
    return items


print(append_value("a"))  # ['a']
print(append_value("b"))  # ['b']

existing = []
result = append_value("c", existing)
print(existing)           # ['c']
print(result is existing) # True
```

Se passi una lista, questa viene modificata. Non sostituire il controllo con `items = items or []`: perderesti una lista vuota fornita dal chiamante. Non usare `items=[]` come default condiviso.

### Argomenti posizionali variabili

```python
def total(*values: float) -> float:
    return sum(values, 0.0)


print(total(1.5, 2.5))  # 4.0
print(total())        # 0.0
```

Nella definizione `*values` raccoglie una tupla; `float` descrive ogni argomento, non aggiunge controlli runtime.

### Argomenti nominati variabili

```python
def configure(**options):
    return options


settings = configure(timeout=5, retries=2)
print(settings)  # {'timeout': 5, 'retries': 2}
```

Raccoglie un dizionario, senza applicare o validare le opzioni. Per nomi noti preferisci parametri espliciti: un refuso come `timout` sarebbe accettato.

### Solo posizionali e solo keyword

```python
def connection_options(host, /, port=5432, *, timeout=10):
    return {"host": host, "port": port, "timeout": timeout}


options = connection_options("localhost", port=5432, timeout=5)
print(options)  # {'host': 'localhost', 'port': 5432, 'timeout': 5}
```

Il nome e intenzionale: costruisce dati, **non apre una connessione**. `host` prima di `/` e positional-only; `timeout` dopo `*` e keyword-only. `port` accetta entrambe le forme.

### Unpacking nella chiamata

```python
def add(left, right):
    return left + right


def connection_options(host, /, port=5432, *, timeout=10):
    return {"host": host, "port": port, "timeout": timeout}


arguments = [2, 3]
print(add(*arguments))  # 5

options = {"port": 5432, "timeout": 5}
settings = connection_options("localhost", **options)
print(settings["timeout"])  # 5
```

`*` espande un iterabile; `**` un mapping con chiavi stringa. Keyword duplicate causano `TypeError`, diversamente dalla fusione `{**defaults, **overrides}`. Un eventuale iteratore passato a `*` viene consumato.

### Lambda come chiave di ordinamento

```python
users = [{"name": "Grace"}, {"name": "Ada"}]
users.sort(key=lambda user: user["name"])
print([user["name"] for user in users])  # ['Ada', 'Grace']
```

`sort` modifica la lista e restituisce `None`; `sorted(users, key=...)` ne crea una nuova. Lambda contiene una sola espressione. Teoria: [[Programmazione/Python/Pagine/Funzioni Lambda|Funzioni Lambda]].

### Restituire piu valori

Contratto: sequenza non vuota di numeri finiti, per esempio lista o tupla; non un iteratore monouso.

```python
from collections.abc import Sequence


def bounds(values: Sequence[float]) -> tuple[float, float]:
    if not values:
        raise ValueError("expected a non-empty sequence")
    return min(values), max(values)


minimum, maximum = bounds([3.0, 1.0, 4.0])
print(minimum, maximum)  # 1.0 4.0
```

Il risultato e una tupla. Due passate su una sequenza sono possibili; con un generatore, `min` lo esaurirebbe prima di `max`. L'annotazione non controlla il contratto: per iteratori vedi [[Programmazione/Python/Pagine/Iteratori|Iteratori]].

### Funzione come argomento

```python
def apply(value, operation):
    return operation(value)


result = apply(5, lambda value: value * 2)
print(result)  # 10
```

Passa la funzione (`operation`), non il risultato di una chiamata anticipata. Questa versione sincrona non attende coroutine; gli errori della callback si propagano.

## Adattamenti comuni

- Wrapper con `*args` e `**kwargs`: [[Programmazione/Python/Pagine/Argomenti Flessibili|inoltro degli argomenti]].
- Callback, closure e scope: [[Programmazione/Python/Pagine/Higher-order Functions|Higher-order Functions]].
- Firma preservata e async: [[Programmazione/Python/Pagine/Decoratori|Decoratori]].
- Contratti statici: [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]], distinto dalla validazione runtime.

## Debug rapido

- Risultato `None` inatteso: verifica tutti i rami e il `return`.
- Dati di chiamate precedenti: cerca default mutabili condivisi.
- Lista del chiamante modificata: controlla le operazioni in-place.
- `TypeError` nella chiamata: conta argomenti, duplicati e vincoli `/`/`*`.
- Generatore vuoto dopo il primo uso: non trattarlo come una lista riutilizzabile.

## Checklist finale

- Firma e chiamata corrispondono?
- Default valutato nel momento desiderato?
- Mutazioni esplicite e risultato restituito?
- Nessun uso dei type hint come validatore?
- Callback sincrona o asincrona gestita intenzionalmente?

## Collegamenti

- [[Programmazione/Python/Promemoria/Indice Promemoria Python|Indice Promemoria Python]]
- [[Programmazione/Python/Pagine/Funzioni|Funzioni]]
- [[Programmazione/Python/Pagine/Argomenti Flessibili|Argomenti Flessibili]]
- [[Programmazione/Python/Pagine/Funzioni Lambda|Funzioni Lambda]]
- [[Programmazione/Python/Pagine/Higher-order Functions|Higher-order Functions]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/Decoratori|Decoratori]]

## Fonti

- [Python 3.12: definizioni e parametri](https://docs.python.org/3.12/tutorial/controlflow.html#defining-functions).
- [Python 3.12: annotazioni non imposte dal runtime](https://docs.python.org/3.12/library/typing.html).
- [Python 3.12: return](https://docs.python.org/3.12/reference/simple_stmts.html#the-return-statement).
- [Python 3.12: sequenze e ordinamento](https://docs.python.org/3.12/library/stdtypes.html#mutable-sequence-types).

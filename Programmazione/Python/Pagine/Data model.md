---
date: 2026-06-03
area: Programmazione
topic: Python
type: theory-note
status: non revisionato
publish: true
tags:
  - programmazione
  - python
  - internals
aliases: []
prerequisites: []
related: []
title: Data model
---

# Data model

## Sintesi

Il data model definisce come gli oggetti partecipano a operazioni del linguaggio: confronto, accesso agli attributi, operatori, iterazione e gestione delle risorse. Implementare un metodo speciale significa rispettare un protocollo, non soltanto aggiungere un nome con doppio underscore.

Riferimento Python 3.12; esempi autonomi verificati con **CPython 3.12.10 su Windows**. Questa e una mappa concettuale; i singoli protocolli sono approfonditi nelle note collegate.

## Problema che risolve

Permette di progettare classi che si comportano in modo prevedibile con `len`, `for`, `in` e operatori, evitando wrapper con API proprietarie per operazioni gia riconosciute dal linguaggio.

Non implica che ogni classe debba implementare tutti i protocolli. Un contenitore di sola lettura non deve fingere di essere una lista modificabile.

## Concetto chiave

### Identita, tipo, valore

- `is` confronta identita.
- `==` esprime un confronto di valore personalizzabile.
- Mutabilita e hashability sono concetti distinti.
- Un contenitore immutabile puo contenere oggetti mutabili.

```python
first = [1, 2]
second = [1, 2]
container = (first,)

print(first == second, first is second)  # True False
first.append(3)
print(container)  # ([1, 2, 3],)
```

La tupla non ha cambiato i propri riferimenti, ma la lista referenziata e cambiata. Non usare `is` per confrontare numeri o stringhe sulla base di cache osservate in una particolare implementazione.

### I metodi speciali impliciti si cercano sul tipo

```python
class Sized:
    def __len__(self):
        return 3

item = Sized()
item.__len__ = lambda: 99
print(item.__len__())  # 99: normale accesso all'attributo
print(len(item))  # 3: protocollo cercato sul tipo
```

Quindi `len(item)` non e semplicemente una riscrittura testuale di `item.__len__()`. Per molti metodi speciali il lookup implicito evita il dizionario dell'istanza e il suo normale `__getattribute__`.

Per gli attributi ordinari intervengono invece MRO, descriptor, dizionario d'istanza e hook. Vedi [[Programmazione/Python/Pagine/Descriptor protocol|Descriptor protocol]].

## Dettagli importanti

### Contratti essenziali

- **Truthiness:** `__bool__` deve restituire un booleano; in sua assenza si usa `__len__`. Una lunghezza negativa e un errore, non “vuoto”.
- **Iterazione:** `__iter__` restituisce un iteratore; `__next__` segnala esaurimento con `StopIteration`. Un iterabile riutilizzabile non coincide con il suo cursore.
- **Indici:** `__getitem__` definisce cosa significano indice e slice. Per una sequenza finita, un indice fuori intervallo solleva `IndexError`.
- **Confronto:** `__eq__` puo restituire `NotImplemented` per un tipo non supportato. Non e l'eccezione `NotImplementedError`.
- **Hash:** oggetti uguali devono avere lo stesso hash, stabile durante l'uso come chiave. Definire `__eq__` senza `__hash__` rende normalmente la classe non hashable.
- **Risorse:** `__enter__` / `__exit__` permettono `with`, non garantiscono automaticamente transazioni o chiusure corrette.
- **Creazione:** `__new__` crea l'istanza, `__init__` la inizializza e deve restituire `None`.

Per operatori binari puo intervenire il metodo riflesso, come `__radd__`; non simulare il dispatch chiamando sempre direttamente il primo metodo. I dettagli e gli esempi numerici sono in [[Programmazione/Python/Pagine/Metodi Speciali|Metodi Speciali]].

### Protocollo operativo e classificazione non sono identici

```python
from collections.abc import Iterable

class LegacySequence:
    def __getitem__(self, index):
        return ("a", "b")[index]

sequence = LegacySequence()
print(list(sequence))  # ['a', 'b']
print(isinstance(sequence, Iterable))  # False
```

`iter` supporta anche il protocollo di sequenza basato su `__getitem__` a partire da zero. Il controllo dell'ABC `Iterable` non riconosce automaticamente quel fallback. Per sapere se un oggetto puo essere iterato, tenta `iter(obj)` e gestisci `TypeError`; questo non ne certifica correttezza o finitezza.

Un'ABC offre anche mixin e obblighi espliciti, mentre un `typing.Protocol` descrive un contratto soprattutto per il controllo statico. Nessuno dei due verifica da solo tutta la semantica.

## Esempio

### Un piccolo contenitore di sola lettura

`Bag` accetta un iterabile **finito** di stringhe, conserva uno snapshot e crea un iteratore nuovo a ogni chiamata. Una stringa singola non e accettata come input del costruttore.

```python
class Bag:
    def __init__(self, items):
        if isinstance(items, (str, bytes)):
            raise TypeError("Fornire un iterabile di stringhe, non una stringa")
        snapshot = tuple(items)
        if any(not isinstance(item, str) for item in snapshot):
            raise TypeError("Ogni elemento deve essere una stringa")
        self._items = snapshot

    def __len__(self):
        return len(self._items)

    def __iter__(self):
        return iter(self._items)

    def __getitem__(self, index):
        return self._items[index]

    def __contains__(self, value):
        return value in self._items

    def __repr__(self):
        return f"Bag({list(self._items)!r})"

source = ["a", "b"]
bag = Bag(source)
source.append("c")
print(len(bag), list(bag), "a" in bag)  # 2 ['a', 'b'] True
print(bag[-1], bag[:1])  # b ('a',)
left, right = iter(bag), iter(bag)
print(next(left), next(right))  # a a: cursori indipendenti
print(bool(Bag([])))  # False, tramite __len__
```

Il tipo di una slice e una tupla: e una scelta esplicita del demo. I confronti tra `Bag` restano quelli di identita perche non viene definito `__eq__`.

“Sola lettura” riguarda questa API: `_items` e una convenzione, non una protezione contro riassegnazioni intenzionali. Il costruttore consuma l'iterabile e materializza tutti gli elementi; non e una soluzione per stream infiniti.

## Limiti

- La presenza di un dunder non dimostra che restituisca il tipo giusto.
- Il data model non fornisce automaticamente copie profonde, immutabilita, thread safety o validazione.
- Sovrascrivere `__getattribute__` o molti operatori puo rendere difficile prevedere effetti e costi.
- I protocolli async sono distinti: `__aiter__` / `__anext__` e `__aenter__` / `__aexit__` non si ottengono aggiungendo casualmente `async` ai metodi sync.

## Errori comuni

- Personalizzare il metodo dell'istanza aspettandosi di cambiare il lookup implicito.
- Restituire `self` da `__iter__` senza implementare un iteratore corretto.
- Usare campi mutabili nell'hash di una chiave gia inserita in un dizionario.
- Confondere implementazione di un protocollo, ereditarieta e riconoscimento da parte di un'ABC.
- Duplicare tutta l'API di list quando serve soltanto un iterabile.

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Metodi Speciali|Metodi Speciali]]
- [[Programmazione/Python/Pagine/Descriptor protocol|Descriptor protocol]]
- [[Programmazione/Python/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Python/Pagine/Context Managers|Context Managers]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/Metaclassi|Metaclassi]]

## Fonti

- [Python 3.12: data model e lookup dei metodi speciali](https://docs.python.org/3.12/reference/datamodel.html).
- [Python 3.12: confronti di valore e identita](https://docs.python.org/3.12/reference/expressions.html#value-comparisons).
- [Python 3.12: truthiness e tipi built-in](https://docs.python.org/3.12/library/stdtypes.html#truth-value-testing).
- [Python 3.12: collections.abc e limiti dei controlli](https://docs.python.org/3.12/library/collections.abc.html).

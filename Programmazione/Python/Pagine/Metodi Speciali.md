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
  - Metodi Speciali (Dunder Methods)
prerequisites: []
related: []
title: Metodi Speciali (Dunder Methods)
---

# Metodi Speciali (Dunder Methods)

## Sintesi

I metodi speciali collegano un tipo ai protocolli Python: rappresentazione, confronto, operatori, iterazione e gestione delle risorse. Implementarli significa rispettare un contratto del linguaggio, non soltanto scegliere un nome con doppio underscore.

Riferimento Python 3.12; esempi verificati con CPython 3.12.10.

## Quando usarlo

- Una collezione deve funzionare con `len`, `for` e accesso per indice.
- Un value object deve avere confronti e rappresentazione coerenti.
- Un'operazione ha una semantica naturale come operatore.
- Una risorsa deve integrarsi con `with`.

Non implementare un operatore se il suo significato sarebbe sorprendente. Una funzione con nome esplicito puo essere piu chiara.

## Come funziona

Nelle chiamate implicite, molti metodi speciali vengono cercati sul **tipo**, non come normali attributi della singola istanza. Assegnare `obj.__len__` non e il modo corretto per cambiare `len(obj)`.

`NotImplemented` e un valore speciale: segnala al linguaggio che quel metodo non supporta la combinazione di operandi. Non e `NotImplementedError` e non va sollevato come eccezione.

Per operatori binari Python puo provare il metodo riflesso, come `__radd__`. Per uguaglianza, se entrambi gli operandi non implementano il confronto, il fallback e basato sull'identita; per un ordinamento o un'addizione non supportati si arriva normalmente a `TypeError`.

## API / Sintassi

| Protocollo         | Metodi e contratto essenziale                                                   |
| ------------------ | ------------------------------------------------------------------------------- |
| Rappresentazione   | `__repr__` e `__str__` restituiscono stringhe.                                  |
| Verita e lunghezza | `__bool__` restituisce bool; `__len__` un intero non negativo.                  |
| Iterazione         | `__iter__` restituisce un iteratore; `__next__` segnala fine con StopIteration. |
| Indici             | `__getitem__` gestisce indici/slice secondo il contratto del contenitore.       |
| Confronto          | `__eq__`, `__lt__` e altri; casi non supportati: NotImplemented.                |
| Aritmetica         | `__add__` / `__radd__`; `__iadd__` puo mutare o restituire un nuovo oggetto.    |
| Risorse            | `__enter__` / `__exit__` per context manager.                                   |
| Creazione          | `__new__` crea, `__init__` inizializza.                                         |

Se manca `__bool__`, la truthiness puo usare `__len__`; in assenza di entrambi un oggetto e normalmente truthy. Un `__len__` negativo non significa "vuoto": e un errore.

### Rappresentazione, uguaglianza e hash

```python
from types import NotImplementedType


class Money:
    def __init__(self, amount: int) -> None:
        if type(amount) is not int:
            raise TypeError("amount must be an int, excluding bool")
        self.amount = amount

    def __repr__(self) -> str:
        return f"Money({self.amount})"

    def __str__(self) -> str:
        return f"{self.amount} units"

    def __eq__(self, other: object) -> bool | NotImplementedType:
        if type(self) is not Money or type(other) is not Money:
            return NotImplemented
        return self.amount == other.amount

    def __add__(self, other: object) -> "Money | NotImplementedType":
        if type(self) is not Money or type(other) is not Money:
            return NotImplemented
        return Money(self.amount + other.amount)


amount = Money(200)
total = amount + Money(50)
print(repr(total), str(total))
print(amount == Money(200), amount == 200)
print(Money.__hash__ is None)
```

Output: `Money(250) 250 units`, `True False` e `True`. Questo tipo didattico usa unita intere senza valuta: non definisce cambio, tasse o contabilita. Il contratto degli operatori accetta solo `Money` esatto, non sottoclassi con possibili campi aggiuntivi.

Definire `__eq__` senza un hash appropriato rende normalmente la classe non hashable. Qui `amount` e mutabile, quindi evitare l'hash e intenzionale. Oggetti uguali devono avere hash uguale e l'hash di una chiave non deve cambiare mentre e usata in un dizionario/set.

`repr` serve soprattutto alla diagnosi; non deve esporre segreti. Non e obbligatorio che ogni repr sia ricostruibile con `eval`, e non va deserializzato con eval.

## Esempio pratico

Carrello come collezione iterabile. Il costruttore crea una lista nuova, evitando che una modifica strutturale della lista passata dal chiamante cambi il carrello.

```python
class Cart:
    def __init__(self, items: list[str]) -> None:
        if not isinstance(items, list) or any(not isinstance(x, str) for x in items):
            raise TypeError("items must be a list of strings")
        self._items = list(items)

    def __len__(self) -> int:
        return len(self._items)

    def __iter__(self):
        return iter(self._items)

    def __getitem__(self, index: int | slice):
        return self._items[index]


source = ["book", "pen"]
cart = Cart(source)
source.append("pencil")
print(len(cart), list(cart), cart[-1])
print(cart[:1], bool(Cart([])))
print(list(cart), list(cart))
```

Output: `2 ['book', 'pen'] pen`, `['book'] False` e due liste identiche. Il carrello e un **iterabile riutilizzabile**: ogni `iter(cart)` crea un iteratore nuovo. Un iteratore, invece, conserva la posizione e puo esaurirsi.

`cart[:1]` restituisce una lista nuova, non un Cart. Un indice fuori intervallo solleva `IndexError`. La copia e superficiale; qui i valori attesi sono stringhe. Non sono gestite modifiche concorrenti agli interni.

## Varianti

### Ricerca sul tipo

```python
class Sized:
    def __len__(self) -> int:
        return 2


value = Sized()
value.__len__ = lambda: 99
print(value.__len__(), len(value))
```

Output: `99 2`. La chiamata esplicita vede l'attributo di istanza, la sintassi implicita usa il protocollo del tipo. Per classi con slot l'assegnazione dell'esempio potrebbe non essere ammessa.

### Protocolli collegati

Per `with`, un ritorno truthy da `__exit__` puo sopprimere l'eccezione del corpo; `False` o `None` non la sopprimono. L'acquisizione e il rilascio corretti delle risorse richiedono il contratto completo descritto in Context Managers.

`__del__` non e un sostituto di `with`: tempi di finalizzazione e condizioni di shutdown non vanno usati come garanzia di cleanup puntuale. Per iteratori e generatori esistono note dedicate.

## Errori comuni

- Restituire numeri da repr o stringhe da len.
- Restituire False per ogni tipo sconosciuto impedendo il confronto riflesso.
- Confondere NotImplemented con un'eccezione da sollevare.
- Implementare hash su campi mutabili coinvolti nell'uguaglianza.
- Restituire sempre lo stesso iteratore da una collezione che dovrebbe essere riutilizzabile.
- Inventare nuovi nomi dunder pensando che Python li richiami automaticamente.

## Checklist

- Il protocollo scelto ha un significato naturale?
- Tipi di ritorno, fine iterazione ed errori sono corretti?
- I casi non supportati delegano con NotImplemented?
- Uguaglianza e hash sono coerenti?
- Copie e mutazioni sono esplicite?
- Sono usati i costrutti pubblici del protocollo, come len e for?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Data model|Data model]]
- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
- [[Programmazione/Python/Pagine/Iteratori|Iteratori]]
- [[Programmazione/Python/Pagine/Context Managers|Context Managers]]
- [[Programmazione/Python/Pagine/Dataclasses|Dataclasses]]

## Fonti

- [Python 3.12: data model e metodi speciali](https://docs.python.org/3.12/reference/datamodel.html).
- [Python 3.12: costante NotImplemented](https://docs.python.org/3.12/library/constants.html#NotImplemented).
- [Python 3.12: hash e uguaglianza](https://docs.python.org/3.12/glossary.html#term-hashable).
- [Python 3.12: iteratori](https://docs.python.org/3.12/library/stdtypes.html#iterator-types).

---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Metodi Speciali (Dunder Methods)]
prerequisites: []
related: []
---

# Metodi Speciali (Dunder Methods)

## Sintesi

I metodi speciali definiscono come gli oggetti interagiscono con operatori, funzioni built-in e protocolli Python.

## Quando usarlo

Usali quando una classe deve comportarsi come collezione, numero, contesto, iteratore o oggetto confrontabile/stampabile.

## Come funziona

Python chiama implicitamente metodi come `__len__`, `__iter__`, `__str__`, `__eq__`, `__enter__` e `__exit__`.

Non si inventano nuovi dunder: si implementano quelli previsti dal linguaggio.

## API / Sintassi

```python
class Money:
    def __init__(self, amount: int) -> None:
        self.amount = amount

    def __repr__(self) -> str:
        return f"Money({self.amount})"

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Money):
            return NotImplemented
        return self.amount == other.amount
```

## Esempio pratico

```python
class Cart:
    def __init__(self, items: list[str]) -> None:
        self.items = items

    def __len__(self) -> int:
        return len(self.items)

    def __iter__(self):
        return iter(self.items)

cart = Cart(["book", "pen"])
print(len(cart))
for item in cart:
    print(item)
```

## Varianti

- Rappresentazione: `__repr__`, `__str__`.
- Confronto: `__eq__`, `__lt__`.
- Collezioni: `__len__`, `__iter__`, `__getitem__`.
- Operatori: `__add__`, `__sub__`.
- Context manager: `__enter__`, `__exit__`.
- Creazione: `__new__`, `__init__`.

## Errori comuni

- Restituire non-stringhe da `__repr__` o `__str__`.
- Chiamare dunder direttamente senza motivo.
- Non restituire `NotImplemented` per tipi non supportati.
- Implementare `__eq__` senza considerare hashability.
- Inventare dunder personalizzati.

## Checklist

- Il metodo speciale rende la classe piu idiomatica?
- `__repr__` aiuta il debugging?
- I confronti gestiscono tipi diversi?
- Gli operatori hanno semantica chiara?
- La classe resta semplice da usare?

## Collegamenti

- [[Programmazione/Python/Pagine/Data model|Data model]]
- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
- [[Programmazione/Python/Pagine/Iteratori|Iteratori]]

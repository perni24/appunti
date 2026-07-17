---
date: 2026-06-03
area: Programmazione
topic: Python
type: theory-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - python
  - internals
aliases: []
prerequisites: []
related: []
---

# Data model

## Sintesi

Il data model definisce i protocolli che permettono agli oggetti Python di integrarsi con operatori, attributi, iterazione, contesti e funzioni built-in.

## Quando usarlo

Serve quando vuoi scrivere classi idiomatiche, capire metodi speciali, descriptor, iteratori, context manager o comportamento degli operatori.

## Come funziona

Python non controlla solo il tipo nominale: cerca metodi e protocolli. Se un oggetto implementa `__iter__`, puo essere iterato. Se implementa `__enter__` e `__exit__`, puo essere usato con `with`.

## API / Sintassi

```python
class Bag:
    def __init__(self, items: list[str]) -> None:
        self.items = items

    def __len__(self) -> int:
        return len(self.items)

    def __iter__(self):
        return iter(self.items)
```

## Esempio pratico

```python
bag = Bag(["a", "b"])

len(bag)
list(bag)
```

Python chiama internamente `bag.__len__()` e `bag.__iter__()`.

## Varianti

- Protocollo iterabile.
- Protocollo context manager.
- Protocollo descriptor.
- Protocollo numerico.
- Protocollo sequenza.
- Protocollo mapping.

## Errori comuni

- Implementare metodi speciali con firme sbagliate.
- Usare ereditarieta quando basta implementare un protocollo.
- Non rispettare semantica attesa dagli operatori.
- Rendere oggetti troppo magici e difficili da leggere.
- Dimenticare che molte funzioni built-in usano dunder.

## Checklist

- Quale protocollo vuoi supportare?
- I dunder hanno firma corretta?
- Il comportamento e intuitivo?
- La classe funziona con built-in come `len`, `iter`, `str`?
- Serve davvero personalizzare il data model?

## Collegamenti

- [[Programmazione/Python/Pagine/Metodi Speciali|Metodi Speciali]]
- [[Programmazione/Python/Pagine/Descriptor protocol|Descriptor protocol]]
- [[Programmazione/Python/Pagine/Context Managers|Context Managers]]

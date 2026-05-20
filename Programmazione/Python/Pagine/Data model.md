---
date: 2026-05-20
area: Programmazione
topic: Python
type: theory-note
status: "non revisionato"
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

Il **data model** di Python definisce come gli oggetti interagiscono con operatori, funzioni built-in, attributi, contesti e protocolli del linguaggio.

## Concetto chiave

Molti comportamenti speciali sono controllati da metodi dunder, come `__len__`, `__iter__`, `__enter__`, `__eq__` e `__repr__`.

```python
class Cart:
    def __init__(self, items):
        self.items = items

    def __len__(self):
        return len(self.items)

cart = Cart(["book", "pen"])
print(len(cart))
```

## Perche conta

Capire il data model aiuta a scrivere classi idiomatiche, compatibili con funzioni built-in e integrate nei protocolli Python.

## Problema che risolve

Da completare: descrivere il problema concettuale o tecnico che questa nota chiarisce.

## Dettagli importanti

- Da completare: aggiungere dettagli, casi limite e differenze da concetti simili.

## Esempio

```text
Da completare con un esempio minimo.
```

## Limiti

- Da completare: indicare limiti, ambiguita e casi in cui il concetto non basta.

## Errori comuni

Da completare durante revisione.

## Collegamenti
- [[Programmazione/Python/Pagine/Metodi Speciali|Metodi Speciali]]
- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
- [[Programmazione/Python/Pagine/Descriptor protocol|Descriptor protocol]]



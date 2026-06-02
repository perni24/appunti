---
date: 2026-06-02
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

## Quando usarlo

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Come funziona

### Concetto chiave
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
### Perche conta
Capire il data model aiuta a scrivere classi idiomatiche, compatibili con funzioni built-in e integrate nei protocolli Python.

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Metodi Speciali|Metodi Speciali]]
- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
- [[Programmazione/Python/Pagine/Descriptor protocol|Descriptor protocol]]

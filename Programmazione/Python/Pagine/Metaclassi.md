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
  - oop
aliases: []
prerequisites: []
related: []
---

# Metaclassi

## Sintesi

Le **metaclassi** sono classi che creano classi. Permettono di personalizzare la creazione di classi, validare definizioni e registrare automaticamente tipi.

## Quando usarlo

### Quando usarle
- Framework.
- ORM.
- Registrazione automatica.
- Validazione di API di classe.

## Come funziona

### Concetto chiave
In Python anche le classi sono oggetti. La metaclasse predefinita e `type`.

```python
class RegistryMeta(type):
    registry = {}

    def __new__(mcls, name, bases, namespace):
        cls = super().__new__(mcls, name, bases, namespace)
        mcls.registry[name] = cls
        return cls

class Plugin(metaclass=RegistryMeta):
    pass
```

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

### Errore comune
Usare metaclassi dove bastano decoratori di classe, `__init_subclass__` o composizione.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
- [[Programmazione/Python/Pagine/Data model|Data model]]
- [[Programmazione/Python/Pagine/Decoratori|Decoratori]]

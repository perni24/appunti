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
  - oop
aliases: []
prerequisites: []
related: []
---

# Metaclassi

## Sintesi

Le **metaclassi** sono classi che creano classi. Permettono di personalizzare la creazione di classi, validare definizioni e registrare automaticamente tipi.

## Concetto chiave

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

## Quando usarle

- Framework.
- ORM.
- Registrazione automatica.
- Validazione di API di classe.

## Errore comune

Usare metaclassi dove bastano decoratori di classe, `__init_subclass__` o composizione.

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
- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
- [[Programmazione/Python/Pagine/Data model|Data model]]
- [[Programmazione/Python/Pagine/Decoratori|Decoratori]]



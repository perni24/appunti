---
date: 2026-06-03
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

Le metaclassi sono classi che creano classi. Permettono di personalizzare la creazione di classi, ma vanno usate raramente.

## Quando usarlo

Usale in framework, ORM, registrazione automatica, validazione di classi o DSL interne. Per codice applicativo normale spesso bastano decoratori di classe o `__init_subclass__`.

## Come funziona

In Python anche una classe e un oggetto. Di default viene creata da `type`. Una metaclasse personalizzata puo intervenire durante creazione, inizializzazione e configurazione della classe.

## API / Sintassi

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

## Esempio pratico

```python
class CsvPlugin(Plugin):
    pass

print(RegistryMeta.registry["CsvPlugin"])
```

Ogni sottoclasse viene registrata automaticamente.

## Varianti

- Metaclassi con `__new__`.
- Metaclassi con `__init__`.
- `__init_subclass__` come alternativa.
- Decoratori di classe.
- Class factory.
- Registri automatici.

## Errori comuni

- Usare metaclassi dove basta una funzione.
- Introdurre magia difficile da debuggare.
- Creare conflitti di metaclassi con ereditarieta multipla.
- Modificare namespace in modo sorprendente.
- Non documentare il comportamento implicito.

## Checklist

- Hai escluso decoratori e `__init_subclass__`?
- Il beneficio supera la complessita?
- Il comportamento e documentato?
- Esistono test sulle classi create?
- Gli utenti della classe capiscono l'effetto della metaclasse?

## Collegamenti

- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
- [[Programmazione/Python/Pagine/Data model|Data model]]
- [[Programmazione/Python/Pagine/Decoratori|Decoratori]]

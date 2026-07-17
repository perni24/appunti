---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming, runtime]
aliases: [Introspezione]
prerequisites: []
related: []
---

# Introspezione in Python

## Sintesi

L'introspezione e la capacita di un programma di esaminare oggetti, tipi, attributi, firme, classi e moduli a runtime. In Python e molto usata per debugging, framework, decorator, test runner, serializzatori e strumenti di sviluppo.

E potente, ma va usata con misura: se il codice deve indovinare continuamente struttura e tipo degli oggetti, probabilmente l'interfaccia puo essere resa piu esplicita.

## Quando usarlo

Usa l'introspezione quando devi:

- capire tipo e attributi di un oggetto durante debug;
- costruire wrapper o decorator;
- leggere firme di funzioni;
- implementare sistemi plugin o dispatch dinamico;
- creare serializer, validator o strumenti di test;
- analizzare classi e gerarchie a runtime.

## Come funziona

In Python quasi tutto e un oggetto: funzioni, classi, moduli, metodi ed eccezioni. Questo permette di ispezionare struttura e metadati in modo uniforme.

```python
class User:
    def __init__(self, name):
        self.name = name

    def greet(self):
        return f"Ciao {self.name}"


user = User("Luca")

print(type(user))
print(dir(user))
print(hasattr(user, "greet"))
print(getattr(user, "name"))
```

Molti oggetti espongono un dizionario interno con gli attributi d'istanza.

```python
print(user.__dict__)  # {"name": "Luca"}
```

## API / Sintassi

Built-in comuni:

- `type(obj)`: restituisce il tipo esatto;
- `isinstance(obj, cls)`: controlla se un oggetto e istanza di una classe o sottoclasse;
- `id(obj)`: restituisce l'identita dell'oggetto;
- `dir(obj)`: elenca nomi accessibili sull'oggetto;
- `hasattr(obj, name)`: verifica la presenza di un attributo;
- `getattr(obj, name, default)`: recupera un attributo dinamicamente;
- `setattr(obj, name, value)`: imposta un attributo dinamicamente;
- `callable(obj)`: verifica se un oggetto puo essere chiamato.

Modulo `inspect`:

```python
import inspect


def create_user(name, age=18):
    return {"name": name, "age": age}


signature = inspect.signature(create_user)
print(signature)
print(signature.parameters["age"].default)
```

Gerarchie di classi:

```python
class Animal:
    pass


class Dog(Animal):
    pass


print(Dog.__bases__)
print(Dog.__mro__)
```

## Esempio pratico

Un decorator puo usare `inspect.signature()` per validare input o mantenere informazioni sull'interfaccia della funzione decorata.

```python
import inspect
from functools import wraps


def require_keyword(name):
    def decorator(function):
        signature = inspect.signature(function)

        @wraps(function)
        def wrapper(*args, **kwargs):
            bound = signature.bind(*args, **kwargs)
            if name not in bound.arguments:
                raise TypeError(f"Missing required argument: {name}")
            return function(*args, **kwargs)

        return wrapper

    return decorator


@require_keyword("user_id")
def load_user(user_id):
    return {"id": user_id}
```

Questo tipo di introspezione e comune in framework, dependency injection e librerie di validazione.

## Varianti

- **Introspezione leggera**: `type`, `isinstance`, `dir`, `getattr`.
- **Introspezione avanzata**: `inspect.signature`, `inspect.getmembers`, `inspect.isfunction`.
- **Reflection**: osservare e modificare struttura o comportamento a runtime.
- **Metaprogrammazione**: usare introspezione insieme a decorator, descriptor o metaclassi.
- **Introspezione del modulo**: analizzare nomi, funzioni e classi definiti in un modulo.

## Errori comuni

- Usare `type(obj) == SomeClass` invece di `isinstance(obj, SomeClass)` quando le sottoclassi sono valide.
- Affidarsi ad attributi privati o dettagli interni instabili.
- Usare `dir()` come se descrivesse il contratto semantico dell'oggetto.
- Modificare `__dict__`, `__class__` o attributi speciali senza una ragione forte.
- Rendere il codice troppo dinamico e difficile da leggere.
- Usare introspezione per compensare API poco chiare.

## Checklist

- L'introspezione serve davvero o basterebbe un'interfaccia esplicita?
- Sto leggendo attributi pubblici o dettagli interni?
- Il codice resta comprensibile senza conoscere troppe convenzioni implicite?
- `getattr()` ha un default sensato quando l'attributo puo mancare?
- Se uso un decorator, preservo metadata con `functools.wraps`?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Data model]]
- [[Descriptor protocol]]
- [[Metaclassi]]
- [[Decoratori]]
- [[Type Hinting]]

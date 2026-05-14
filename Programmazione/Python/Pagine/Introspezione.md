---
date: 2026-05-14
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Introspezione]
prerequisites: []
related: []
---
# Introspezione in Python

## Sintesi

Nota su Introspezione in Python. Riassume il concetto, la sintassi principale e i punti da ricordare durante studio, sviluppo o debugging.

## Concetto chiave
L'**introspezione** e la capacita di un programma di esaminare se stesso a runtime: tipi, attributi, metodi, firme delle funzioni, gerarchie di classi e metadati.

Python supporta molto bene l'introspezione, ed e uno dei motivi per cui il linguaggio risulta flessibile, dinamico e adatto a debugging, tooling, metaprogrammazione e framework.

> [!INFO] Perche conta davvero
> L'introspezione non serve solo a "guardare dentro" gli oggetti: e alla base di molte feature pratiche come ORM, dependency injection, serializers, test framework, decorator intelligenti e strumenti di debugging.

---

##  Strumenti principali

Python offre molte funzioni built-in e moduli standard per fare introspezione.

### Built-in piu comuni
- `type(obj)`: restituisce il tipo dell'oggetto.
- `isinstance(obj, cls)`: controlla se un oggetto appartiene a una classe o a una sua sottoclasse.
- `id(obj)`: restituisce l'identita dell'oggetto in memoria.
- `dir(obj)`: elenca attributi e metodi disponibili.
- `hasattr(obj, "name")`: verifica l'esistenza di un attributo.
- `getattr(obj, "name")`: recupera dinamicamente un attributo.
- `setattr(obj, "name", value)`: imposta dinamicamente un attributo.
- `callable(obj)`: verifica se un oggetto puo essere chiamato come funzione.

### Moduli utili
- `inspect`: per firme, sorgente, moduli, classi e funzioni.
- `types`: per distinguere tipi speciali.
- `sys`: per informazioni sul runtime.

---

##  Esempi Pratici

### Esplorare un oggetto

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

### Invocare un metodo dinamicamente

```python
method_name = "greet"

if hasattr(user, method_name):
    method = getattr(user, method_name)
    print(method())
```

Questo pattern e molto usato nei framework che risolvono comportamenti in modo dinamico.

### Ispezionare la firma di una funzione

```python
import inspect

def create_user(name, age=18, active=True):
    return {"name": name, "age": age, "active": active}

signature = inspect.signature(create_user)
print(signature)

for parameter_name, parameter in signature.parameters.items():
    print(parameter_name, parameter.default)
```

Questo e utile quando si costruiscono wrapper, decorator o sistemi di validazione automatica.

---

##  Funzionamento Interno (Teoria)

### Tutto e un oggetto
In Python quasi tutto e un oggetto: funzioni, classi, moduli, metodi, eccezioni. Questo rende possibile ispezionare il programma in modo uniforme.

```python
def hello():
    return "ciao"

print(type(hello))
print(callable(hello))
```

### Namespace e attributi
L'introspezione e strettamente legata al concetto di namespace e al modello di attributi degli oggetti.

Molti oggetti mantengono un dizionario interno accessibile con `__dict__`:

```python
class Config:
    def __init__(self):
        self.debug = True

config = Config()
print(config.__dict__)
```

Questo mostra gli attributi di istanza salvati direttamente sull'oggetto.

### Classi e gerarchie
E possibile ispezionare anche la struttura OOP:
- `obj.__class__`
- `Class.__bases__`
- `Class.__mro__`

```python
class Animal:
    pass

class Dog(Animal):
    pass

print(Dog.__bases__)
print(Dog.__mro__)
```

Questa capacita e molto utile quando si lavora con [[Programmazione/Python/Pagine/Metodi Speciali]], ereditarieta e sistemi basati su plugin.

---

##  Il modulo `inspect`

Il modulo `inspect` e lo strumento standard piu potente per l'introspezione avanzata.

### Operazioni comuni
- `inspect.signature(func)`: firma dei parametri.
- `inspect.getsource(obj)`: codice sorgente, se disponibile.
- `inspect.ismodule(obj)`, `inspect.isclass(obj)`, `inspect.isfunction(obj)`: classificazione degli oggetti.
- `inspect.getmembers(obj)`: lista strutturata di attributi e membri.

```python
import inspect

class Service:
    def execute(self, payload):
        return payload

members = inspect.getmembers(Service, predicate=inspect.isfunction)
print(members)
```

> [!WARNING] Il sorgente non e sempre disponibile
> `inspect.getsource()` funziona bene con codice Python disponibile sul filesystem, ma puo fallire con oggetti built-in, moduli compilati o ambienti particolari.

---

##  Introspezione vs Reflection

Spesso i termini vengono usati come sinonimi, ma non sono identici.

- **Introspezione**: osservare struttura e metadati di un oggetto.
- **Reflection**: osservare e anche modificare dinamicamente comportamento o struttura.

In Python il confine e sottile, perche funzioni come `getattr`, `setattr` e `__dict__` permettono sia osservazione sia modifica.

---

##  Best Practices & "Gotchas"

-  **Usa l'introspezione per tooling, debugging e automazione:** e molto potente in questi scenari.
-  **Preferisci `getattr` con default quando opportuno:** evita errori inutili quando un attributo puo mancare.
-  **Usa `inspect.signature` nei decorator avanzati:** aiuta a preservare o analizzare l'interfaccia delle funzioni.
-  **Mantieni chiari i contratti pubblici:** se un sistema usa molta introspezione, nomi e struttura diventano ancora piu importanti.
-  **Non abusare della dinamica:** troppo `getattr` e troppe convenzioni implicite possono rendere il codice difficile da seguire.
-  **Non affidarti solo a `dir()`:** mostra molto, ma non sempre spiega il significato semantico degli attributi.
-  **Attenzione agli attributi speciali:** modificare `__dict__`, `__class__` o altri elementi interni senza cautela puo rompere invarianti del programma.
-  **L'introspezione non sostituisce il design:** se serve continuamente "indovinare" struttura e tipo degli oggetti, forse l'API puo essere resa piu esplicita.

---

---
date: 2026-06-03
area: Programmazione
topic: Python
type: theory-note
status: non revisionato
publish: true
tags:
  - programmazione
  - python
  - internals
  - oop
aliases: []
prerequisites: []
related: []
title: Descriptor protocol
---

# Descriptor protocol

## Sintesi

Un descriptor e un oggetto il cui tipo implementa `__get__`, `__set__` o `__delete__`. Quando viene trovato sulla classe durante l'accesso a un attributo, puo controllarne lettura, assegnazione o cancellazione.

Il meccanismo sostiene `property`, binding dei metodi, `classmethod` e `staticmethod`. Riferimento Python 3.12; esempi indipendenti verificati con **CPython 3.12.10 su Windows**.

## Problema che risolve

Un descriptor permette di riutilizzare una politica di attributo su piu campi o classi: validazione, calcolo o accesso controllato allo stato. Per un solo attributo, una `property` e spesso piu leggibile.

Non e un sistema automatico di privacy o un ORM: gli effetti dipendono dai metodi che implementi.

## Concetto chiave

### Data descriptor e non-data descriptor

- `__get__(self, instance, owner=None)` gestisce la lettura; l'accesso tramite classe passa normalmente `instance=None`.
- La presenza di `__set__` **o** `__delete__` rende il descriptor un **data descriptor**.
- Un descriptor con solo `__get__` e **non-data**.

Con il normale `object.__getattribute__`, la lettura usa in sintesi:

1. il primo attributo trovato nella MRO della classe, se e un data descriptor con getter;
2. il dizionario dell'istanza, se contiene quel nome;
3. il descriptor non-data o l'attributo ordinario trovato sulla classe;
4. in caso di `AttributeError`, l'eventuale `__getattr__` tramite l'accesso ordinario.

Prima conta quale attributo e trovato nella MRO: un attributo della sottoclasse puo nascondere un descriptor della base. Hook personalizzati possono cambiare il comportamento.

### Precedenza osservabile

```python
class NonData:
    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return "from descriptor"

class Example:
    label = NonData()

    @property
    def fixed(self):
        return "from property"

item = Example()
item.__dict__["label"] = "from instance"
item.__dict__["fixed"] = "ignored by property"
print(item.label)  # from instance
print(item.fixed)  # from property
del item.label
print(item.label)  # from descriptor
```

Anche una property senza setter e un data descriptor: `item.fixed = "x"` solleva `AttributeError`, non crea una normale voce sostitutiva nell'istanza.

## Dettagli importanti

### Stato condiviso e stato per istanza

L'oggetto descriptor e memorizzato sulla classe e viene condiviso. I valori dei diversi oggetti vanno conservati separatamente, per esempio nel loro `__dict__`.

`__set_name__(owner, name)` comunica il nome durante la creazione della classe. Non e un getter e puo essere definito anche da oggetti che non sono descriptor. Ereditare il descriptor non richiama automaticamente questo hook.

### Le funzioni diventano metodi tramite descriptor

```python
class Greeter:
    def greet(self, name):
        return f"Ciao {name}"

greeter = Greeter()
function = Greeter.__dict__["greet"]
method = function.__get__(greeter, Greeter)
print(method.__self__ is greeter)  # True
print(method.__func__ is function)  # True
print(method("Luca"))  # Ciao Luca

greeter.direct = lambda name: name.upper()
print(greeter.direct("luca"))  # LUCA: funzione nell'istanza, nessun self aggiunto
```

Il binding normale aggiunge il receiver alla chiamata della funzione. Una funzione salvata direttamente nel dizionario dell'istanza non viene legata nello stesso modo. `staticmethod` evita il binding del receiver; `classmethod` lega la classe.

## Esempio

### Valore positivo con validazione riutilizzabile

Il contratto del demo accetta soltanto `int` e `float` built-in positivi; rifiuta booleani, NaN e infinito. Non e un modello monetario: per prezzi reali servono rappresentazione e regole del dominio, spesso basate su Decimal.

```python
import math

class Positive:
    def __set_name__(self, owner, name):
        self.public_name = name
        self.storage_name = "_" + name

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        try:
            return instance.__dict__[self.storage_name]
        except KeyError:
            raise AttributeError(self.public_name) from None

    def __set__(self, instance, value):
        if type(value) not in (int, float):
            raise TypeError("Atteso int o float, esclusi bool")
        if value <= 0 or (type(value) is float and not math.isfinite(value)):
            raise ValueError("Il valore deve essere positivo e finito")
        instance.__dict__[self.storage_name] = value

    def __delete__(self, instance):
        try:
            del instance.__dict__[self.storage_name]
        except KeyError:
            raise AttributeError(self.public_name) from None

class Product:
    price = Positive()
    weight = Positive()

    def __init__(self, price, weight):
        self.price = price
        self.weight = weight

first = Product(10, 2)
second = Product(20, 4)
first.price = 12.5
print(first.price, second.price, first.weight)  # 12.5 20 2
print(isinstance(Product.price, Positive))  # True
del first.price
print(hasattr(first, "price"))  # False
```

La validazione avviene prima della scrittura: un aggiornamento non valido conserva il valore precedente. I valori mancanti sollevano `AttributeError`, non `KeyError`, rispettando il contratto degli attributi.

Il demo richiede istanze con `__dict__`. Lo storage `_price` e una convenzione, non una protezione: un accesso diretto puo aggirare la validazione. Crea un descriptor distinto per ciascuna dichiarazione; riusare lo stesso `Positive()` per piu nomi sovrascriverebbe i suoi metadati.

### Assegnazione tardiva a una classe

```python
class Named:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return self.name

class Late:
    pass

descriptor = Named()
Late.label = descriptor
descriptor.__set_name__(Late, "label")
print(Late().label)  # label
```

L'assegnazione dopo la creazione della classe non chiama automaticamente `__set_name__`: nel demo lo facciamo esplicitamente.

## Limiti

- Il descriptor non si attiva semplicemente mettendo un suo oggetto dentro `instance.__dict__`.
- Il pattern con `__dict__` non funziona invariato per oggetti con soli slots.
- Un descriptor puo fare I/O, ma nasconderlo dietro una lettura apparentemente economica rende l'API difficile da prevedere.
- Scrivere direttamente nello storage o sostituire l'attributo sulla classe puo aggirare il protocollo: non e una barriera di sicurezza.

## Errori comuni

- Salvare `self.value` nel descriptor e condividere involontariamente il valore fra tutte le istanze.
- Non gestire `instance is None`.
- Usare `setattr(instance, nome_pubblico, value)` dentro il setter, richiamando ricorsivamente se stesso.
- Pensare che un getter senza setter sia sempre non-data.
- Ignorare MRO, nome dello storage e interazione con ereditarieta.

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Proprietà|Proprieta]]
- [[Programmazione/Python/Pagine/Data model|Data model]]
- [[Programmazione/Python/Pagine/Metodi di classe e statici|Metodi di classe e statici]]
- [[Programmazione/Python/Pagine/Introspezione|Introspezione]]
- [[Programmazione/Python/Pagine/Metaclassi|Metaclassi]]

## Fonti

- [Python 3.12: guida ufficiale ai descriptor e precedenza](https://docs.python.org/3.12/howto/descriptor.html).
- [Python 3.12: personalizzazione dell'accesso agli attributi](https://docs.python.org/3.12/reference/datamodel.html#customizing-attribute-access).
- [PEP 487: **set_name** e creazione delle classi](https://peps.python.org/pep-0487/).

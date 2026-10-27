---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - python
  - programming
  - runtime
aliases:
  - Introspezione
prerequisites: []
related: []
title: Introspezione in Python
---

# Introspezione in Python

## Sintesi

L'introspezione esamina tipi, attributi, firme e gerarchie a runtime. E utile per debugging e tooling, ma osservare un oggetto non e sempre un'operazione passiva: leggere una proprieta puo eseguire codice.

Riferimento Python 3.12; esempi indipendenti verificati con **CPython 3.12.10 su Windows**, non indicazione dell'ultima patch disponibile.

## Quando usarlo

- Diagnosticare tipo, attributi e binding di un oggetto.
- Costruire wrapper che comprendono la firma di una funzione.
- Implementare strumenti di documentazione, test runner o plugin con contratti espliciti.

Se il codice applicativo deve continuamente indovinare cosa contiene un oggetto, valuta prima un'interfaccia piu chiara.

## Come funziona

### Tipo, nomi e stato non coincidono

```python
class User:
    def __init__(self, name):
        self.name = name

    def greet(self):
        return f"Ciao {self.name}"

class Admin(User):
    pass

user = Admin("Luca")
print(type(user) is User)  # False: tipo esatto
print(isinstance(user, User))  # True: sottoclasse ammessa
print(vars(user))  # {'name': 'Luca'}
print("greet" in dir(user))  # True
print(getattr(user, "name"))  # Luca
print(Admin.__bases__ == (User,))  # True
print(Admin.__mro__)  # Admin, User, object
```

`vars(user)` espone il dizionario dell'istanza quando esiste, non tutti gli attributi accessibili. Un oggetto con soli `__slots__` puo non averlo. Il dizionario di una classe esposto da `vars(cls)` e invece una vista in sola lettura.

`dir` e un aiuto esplorativo, personalizzabile con `__dir__`, non uno schema completo o un contratto. `id` identifica un oggetto durante la sua vita, non e un ID persistente e puo essere riutilizzato dopo la distruzione.

### Accesso dinamico e ispezione statica

```python
import inspect

class Report:
    def __init__(self):
        self.reads = 0

    @property
    def summary(self):
        self.reads += 1
        return "ready"

report = Report()
raw = inspect.getattr_static(report, "summary")
print(isinstance(raw, property), report.reads)  # True 0
print(hasattr(report, "summary"), report.reads)  # True 1
print(getattr(report, "summary"), report.reads)  # ready 2
```

`hasattr` prova un accesso e restituisce `False` se questo solleva `AttributeError`, anche se l'errore nasce dentro un getter. Altre eccezioni si propagano. Il default di `getattr` non intercetta qualunque guasto.

`getattr_static` evita il normale lookup dinamico, ma puo restituire il descriptor invece del valore e non vede tutti gli attributi sintetizzati. Non trasformarlo in una garanzia di sicurezza per oggetti ostili.

## API / Sintassi

- `type` / `isinstance`: tipo esatto rispetto ad appartenenza a una gerarchia.
- `getattr` / `setattr` / `delattr`: accesso dinamico, con eventuali hook e descriptor.
- `callable`: capacita di chiamata, non compatibilita con una firma specifica o garanzia di successo.
- `inspect.signature`: parametri e firma disponibile; puo fallire su alcuni callable.
- `inspect.getmembers`: recupera membri, anche eseguendo lookup dinamico.
- `inspect.getmembers_static`: variante senza il normale lookup dinamico, disponibile da 3.11.
- `inspect.getsource`: tenta di recuperare sorgente, non sempre disponibile per built-in, REPL o codice generato.

### Binding degli argomenti, non validazione dei tipi

```python
import inspect

def create_user(name: str, /, *, age: int = 18):
    return {"name": name, "age": age}

signature = inspect.signature(create_user)
bound = signature.bind("Luca")
print(dict(bound.arguments))  # {'name': 'Luca'}
bound.apply_defaults()
print(dict(bound.arguments))  # {'name': 'Luca', 'age': 18}
created = create_user(*bound.args, **bound.kwargs)
print(created)
```

`bind` controlla la forma della chiamata senza invocarla: parametri mancanti, duplicati, positional-only e keyword-only. `bind_partial` permette omissioni e non sostituisce una validazione completa.

I default assenti compaiono in `bound.arguments` solo dopo `apply_defaults`. Nessuna di queste operazioni convalida automaticamente i type hint o il dominio di `age`.

## Esempio pratico

### Correggere un wrapper che promette un argomento keyword

Controllare solo `name in bound.arguments` non distingue un argomento posizionale da uno nominato. Questo decorator richiede invece che uno specifico parametro sia **fornito esplicitamente per keyword**.

```python
from functools import wraps
import inspect

def require_keyword(name):
    def decorate(function):
        signature = inspect.signature(function)
        parameter = signature.parameters.get(name)
        allowed = {
            inspect.Parameter.POSITIONAL_OR_KEYWORD,
            inspect.Parameter.KEYWORD_ONLY,
        }
        if parameter is None or parameter.kind not in allowed:
            raise ValueError("Il parametro deve accettare una keyword esplicita")

        @wraps(function)
        def wrapper(*args, **kwargs):
            signature.bind(*args, **kwargs)
            if name not in kwargs:
                raise TypeError(f"{name} deve essere fornito per keyword")
            return function(*args, **kwargs)

        return wrapper
    return decorate

@require_keyword("user_id")
def load_user(user_id):
    return {"id": user_id}

print(load_user(user_id=7))  # {'id': 7}
```

`load_user(7)` viene rifiutato; non si tratta di un validatore dell'ID o di una query a database. `wraps` conserva metadati e `__wrapped__`, non riscrive la firma per rappresentare la nuova restrizione. `inspect.signature` segue normalmente `__wrapped__`: la firma ispezionata puo quindi descrivere la funzione originaria, non ogni vincolo del wrapper.

Per una **nuova API** basta `def load_user(*, user_id): ...`: e piu chiaro del decorator. Il wrapper e un esercizio per capire binding e adattamento di funzioni esistenti.

## Varianti

- `inspect.signature(function, follow_wrapped=False)` osserva la firma del wrapper.
- `inspect.unwrap` segue la catena `__wrapped__`.
- `inspect.isfunction` e `inspect.ismethod` distinguono funzione e metodo associato.
- Le annotazioni sono metadati: risolverle con `typing.get_type_hints` puo valutare riferimenti/espressioni. Non eseguire annotazioni non fidate come se fossero semplici stringhe.
- Frame e traceback possono trattenere grandi grafi di oggetti: evita cache indefinite dei risultati dell'introspezione.

## Errori comuni

- Usare `hasattr` aspettandosi assenza di effetti collaterali.
- Scambiare `dir` o `vars` per uno schema di serializzazione.
- Confondere binding degli argomenti e verifica dei valori.
- Credere che `callable` garantisca una chiamata riuscita.
- Modificare attributi speciali per compensare un'interfaccia poco chiara.

## Checklist

- Serve introspezione o basta un contratto esplicito?
- L'accesso agli attributi puo eseguire codice?
- La firma disponibile rappresenta davvero il wrapper?
- Errori di lookup distinti da attributi assenti?
- Tipi e valori validati separatamente, senza valutare dati non fidati?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Data model|Data model]]
- [[Programmazione/Python/Pagine/Descriptor protocol|Descriptor protocol]]
- [[Programmazione/Python/Pagine/Metaclassi|Metaclassi]]
- [[Programmazione/Python/Pagine/Decoratori|Decoratori]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/Memory Management|Memory Management]]

## Fonti

- [Python 3.12: inspect, firme e introspezione passiva](https://docs.python.org/3.12/library/inspect.html).
- [Python 3.12: built-in per tipi e attributi](https://docs.python.org/3.12/library/functions.html).
- [Python 3.12: wraps e **wrapped**](https://docs.python.org/3.12/library/functools.html#functools.wraps).
- [Python 3.12: typing e get_type_hints](https://docs.python.org/3.12/library/typing.html#typing.get_type_hints).

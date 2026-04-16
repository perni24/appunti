---
date: 2026-04-16
tags:
  - programmazione
  - python
  - type-hinting
  - qualita
type: #permanent-note
status: budding
---

# Type Hinting in Python

## 💡 Concetto Chiave
Il **Type Hinting** e il sistema di annotazioni dei tipi introdotto in Python per rendere il codice piu leggibile, piu analizzabile e meno soggetto a errori. Le annotazioni non cambiano da sole il comportamento runtime del programma, ma permettono a IDE, linters e type checker statici di verificare incoerenze prima dell'esecuzione.

In pratica, il type hinting aggiunge un contratto esplicito al codice:
- chiarisce che tipo di valori una funzione si aspetta;
- documenta cosa restituisce;
- rende piu semplice refactoring e manutenzione.

> [!INFO] Statico, non rigido
> Python resta un linguaggio dinamico. I type hints non trasformano Python in un linguaggio staticamente tipizzato in senso forte: servono come supporto al tooling e alla chiarezza del codice.

---

## 📝 Sintassi di base

### Annotare parametri e valore di ritorno

```python
def greet(name: str) -> str:
    return f"Ciao {name}"
```

Qui:
- `name: str` indica che il parametro atteso e una stringa;
- `-> str` indica che la funzione restituisce una stringa.

### Annotare variabili

```python
user_count: int = 0
names: list[str] = ["Luca", "Marco"]
```

### Funzione che non restituisce nulla

```python
def log_message(message: str) -> None:
    print(message)
```

---

## 💻 Esempi Pratici

### Liste, dizionari e tuple

```python
def average(values: list[float]) -> float:
    return sum(values) / len(values)

config: dict[str, str] = {"host": "localhost", "port": "8000"}
point: tuple[int, int] = (10, 20)
```

### Parametri opzionali

```python
from typing import Optional

def find_user(user_id: int) -> Optional[str]:
    if user_id == 1:
        return "Luca"
    return None
```

`Optional[str]` significa in pratica `str | None`.

### Union moderna

```python
def normalize(value: int | float) -> float:
    return float(value)
```

Nelle versioni moderne di Python, `int | float` e spesso preferibile a `Union[int, float]`.

---

## ⚙️ Funzionamento Interno (Teoria)

### Le annotazioni sono metadati
Python memorizza i type hints nell'attributo `__annotations__`.

```python
def add(a: int, b: int) -> int:
    return a + b

print(add.__annotations__)
```

Questo mostra che i type hints esistono come metadati accessibili a runtime.

### Nessun controllo automatico runtime
Se scrivi:

```python
def square(x: int) -> int:
    return x * x
```

Python non impedisce da solo:

```python
square("ciao")
```

Il type hinting diventa utile quando entra in gioco il tooling:
- IDE;
- analizzatori statici;
- linter;
- type checker come `mypy` o `pyright`.

### Relazione con il design del codice
Il type hinting funziona meglio quando funzioni, classi e moduli hanno responsabilita chiare. Se il codice e troppo ambiguo o eccessivamente dinamico, i tipi diventano rumorosi o poco affidabili.

---

## 🧠 Tipi utili da conoscere

### `Any`

```python
from typing import Any

def debug(value: Any) -> None:
    print(value)
```

`Any` disattiva di fatto molti controlli statici. Utile in casi particolari, ma da usare con moderazione.

### `Optional` e `Union`

```python
from typing import Optional

name: Optional[str] = None
```

oppure in sintassi moderna:

```python
name: str | None = None
```

### `Callable`

```python
from collections.abc import Callable

def process(callback: Callable[[int], str]) -> str:
    return callback(10)
```

### `TypedDict`

```python
from typing import TypedDict

class UserData(TypedDict):
    name: str
    age: int
```

Utile quando lavori con dizionari che devono rispettare una struttura precisa.

### `Protocol`

```python
from typing import Protocol

class SupportsClose(Protocol):
    def close(self) -> None:
        ...
```

`Protocol` permette di descrivere comportamenti attesi senza dipendere da una classe concreta.

---

## 📦 Type Hinting e tooling

Il valore reale del type hinting emerge quando il codice viene controllato con strumenti esterni.

### Tool comuni
- `mypy`: type checker statico molto diffuso;
- `pyright`: checker rapido e molto usato negli editor moderni;
- IDE come VS Code o PyCharm: sfruttano i type hints per autocomplete e analisi.

Esempio:

```bash
mypy app.py
```

Questi strumenti possono segnalare:
- ritorni incoerenti;
- parametri del tipo sbagliato;
- `None` non gestito;
- accessi a membri inesistenti.

---

## 🔄 Type Hinting nelle funzioni e nelle classi

Le annotazioni sono particolarmente utili in:
- [[Funzioni]];
- metodi di classi;
- API pubbliche di librerie e package;
- modelli dati;
- codice condiviso in team.

Esempio con classe:

```python
class User:
    def __init__(self, name: str, age: int) -> None:
        self.name = name
        self.age = age

    def is_adult(self) -> bool:
        return self.age >= 18
```

Questo rende esplicita l'interfaccia della classe gia a colpo d'occhio.

---

## ⚠️ Best Practices & "Gotchas"

- ✅ **Annota prima le API pubbliche:** funzioni, metodi e moduli usati da altri.
- ✅ **Usa tipi concreti ma leggibili:** l'obiettivo e chiarezza, non esibire complessita.
- ✅ **Preferisci la sintassi moderna quando disponibile:** `list[str]`, `dict[str, int]`, `str | None`.
- ✅ **Usa `TypedDict`, `Protocol` e `Callable` quando servono davvero:** migliorano il contratto del codice.
- ✅ **Integra un type checker nel workflow:** senza tooling, il beneficio e solo parziale.
- ❌ **Non riempire tutto di `Any`:** annulla gran parte del valore del type hinting.
- ❌ **Non usare tipi troppo sofisticati senza necessità:** se il tipo e piu difficile del codice, stai perdendo leggibilita.
- 💣 **Attenzione a `None`:** molti bug nascono da valori opzionali non gestiti correttamente.
- 💣 **Attenzione ai nomi shadowing:** variabili o file con nomi come `typing.py` possono rompere import e tooling.

---

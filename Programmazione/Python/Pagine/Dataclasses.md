---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - python
  - dataclasses
  - oop
  - standard-library
aliases:
  - dataclass
  - Dataclasses Python
prerequisites:
  - "[[Programmazione/Python/Pagine/Classi e Istanze]]"
related:
  - "[[Programmazione/Python/Pagine/Classi e Istanze]]"
  - "[[Programmazione/Python/Pagine/Type Hinting]]"
  - "[[Programmazione/Python/Pagine/Enum]]"
title: Dataclasses
---

# Dataclasses

## Sintesi

`@dataclass` genera metodi ripetitivi per classi che rappresentano dati: inizializzazione, rappresentazione e uguaglianza. Non e un parser, un validatore runtime o una garanzia di immutabilita profonda.

Riferimento Python 3.12; esempi sulla baseline CPython 3.12.10. `slots` e `kw_only` sono disponibili da 3.10; `weakref_slot` da 3.11.

## Quando usarlo

- DTO, risultati intermedi, configurazioni e value object.
- Record con pochi metodi e un contratto semplice.
- Classi in cui i campi sono piu importanti di un complesso ciclo di vita.

Una dataclass puo contenere controlli espliciti. Per dati esterni annidati e conversioni articolate, valuta un parser o validatore dedicato.

## Come funziona

Il decoratore individua i campi tramite annotazioni e genera normalmente `__init__`, `__repr__` e `__eq__`. `ClassVar` indica un attributo di classe escluso dai campi; `InitVar` un parametro di inizializzazione passato a `__post_init__`, non un campo persistente.

Se scrivi un tuo `__init__`, il decoratore non lo sostituisce e non chiama automaticamente `__post_init__`. I default seguono le regole dei parametri: campi obbligatori dopo campi con default possono causare errori anche attraverso l'ereditarieta.

## API / Sintassi

### Default per istanza e ClassVar

```python
from dataclasses import dataclass, field, fields
from typing import ClassVar


@dataclass
class User:
    category: ClassVar[str] = "person"
    id: int
    name: str
    tags: list[str] = field(default_factory=list)


first = User(1, "Ada")
second = User(2, "Lin")
first.tags.append("python")
print(first.tags, second.tags)
print([item.name for item in fields(User)])
```

Output: `['python'] []` e `['id', 'name', 'tags']`. `default_factory=list` viene chiamata per creare il default; passare esplicitamente la stessa lista a due istanze crea comunque condivisione.

Le annotazioni non impongono tipi: `User("bad-id", 42)` puo essere costruito senza controlli aggiuntivi. In Python 3.12 il decoratore rifiuta default non hashable come euristica contro default mutabili: non riconosce ogni possibile oggetto mutabile.

### Uguaglianza, ordinamento e hash

```python
from dataclasses import dataclass


@dataclass(frozen=True, order=True)
class Point:
    x: int
    y: int


points = [Point(2, 0), Point(1, 9), Point(1, 2)]
print(sorted(points))
print(Point(1, 2) == Point(1, 2))
print(len({Point(1, 2), Point(1, 2)}))
```

L'ordinamento e lessicografico sui campi dichiarati, non una distanza geometrica. Uguaglianza e ordinamento generati richiedono lo stesso tipo concreto. `order=True` richiede `eq=True`.

Con configurazione ordinaria:

- `eq=True, frozen=False`: hash disabilitato.
- `eq=True, frozen=True`: hash generato, ma calcolarlo puo fallire se un campo non e hashable.
- `eq=False`: la gestione dell'hash resta quella ereditata.
- `unsafe_hash=True` non congela i dati; mutare un campo coinvolto nell'hash puo compromettere l'uso in set e dizionari.

## Esempio pratico

Riga d'ordine didattica: quantita intera positiva e prezzo in centesimi interi non negativi. I controlli rifiutano anche `bool`. Non e un modello completo di tasse, valute o arrotondamenti.

```python
from dataclasses import asdict, dataclass, replace


@dataclass(frozen=True, slots=True, kw_only=True)
class OrderLine:
    sku: str
    quantity: int
    unit_price_cents: int

    def __post_init__(self) -> None:
        if not isinstance(self.sku, str):
            raise TypeError("sku must be a string")
        if not self.sku or self.sku != self.sku.strip():
            raise ValueError("sku must be nonempty without outer whitespace")
        if type(self.quantity) is not int or type(self.unit_price_cents) is not int:
            raise TypeError("quantity and price must be int, excluding bool")
        if self.quantity <= 0 or self.unit_price_cents < 0:
            raise ValueError("quantity or price out of range")

    @property
    def total_cents(self) -> int:
        return self.quantity * self.unit_price_cents


line = OrderLine(sku="BOOK-1", quantity=2, unit_price_cents=1250)
changed = replace(line, quantity=3)
print(line.total_cents, changed.total_cents)
print(asdict(line))
```

Output: `2500 3750` e il dizionario dei tre campi; `total_cents` non e un campo e non compare. `replace` costruisce una nuova istanza tramite inizializzazione, quindi riesegue i controlli. Non e una copia profonda automatica.

`asdict` attraversa dataclass e contenitori e applica copie profonde agli altri oggetti. Non garantisce JSON valido, riservatezza, basso costo o gestione di qualsiasi grafo ciclico. `field(repr=False)` nasconde un campo dal repr, non da `asdict`: proietta esplicitamente i campi pubblici quando esporti dati.

## Varianti

### Validazione iniziale e modifiche successive

```python
from dataclasses import dataclass


@dataclass(slots=True, kw_only=True)
class RetryPolicy:
    attempts: int = 3

    def __post_init__(self) -> None:
        if type(self.attempts) is not int:
            raise TypeError("attempts must be an int, excluding bool")
        if self.attempts < 1:
            raise ValueError("attempts must be positive")


policy = RetryPolicy(attempts=5)
policy.attempts = 0
print(policy.attempts)
```

Output: `0`. `__post_init__` non viene richiamato a ogni assegnazione. Per mantenere l'invariante valuta una classe con setter, oppure un record frozen e nuove istanze validate.

### Frozen non significa profondo

```python
from dataclasses import dataclass, field


@dataclass(frozen=True)
class LabelGroup:
    labels: list[str] = field(default_factory=list)


group = LabelGroup()
group.labels.append("python")
print(group.labels)
```

Il campo non si puo riassegnare normalmente, ma la lista resta mutabile e `hash(group)` fallisce. Campi immutabili aiutano, senza trasformare `frozen` in una protezione di sicurezza.

`slots=True` crea una nuova classe e, senza un `__dict__` ereditato, limita l'aggiunta di attributi. Non valida i campi. In Python 3.12 l'uso di `super()` senza argomenti nei metodi di una dataclass con slot ha una limitazione documentata: quando necessario usa la forma esplicita indicata dalla documentazione e testa la gerarchia.

L'`__init__` generato non chiama automaticamente l'`__init__` di una base non dataclass; l'inizializzazione di quella base richiede una scelta esplicita.

## Errori comuni

- Confondere annotazione e validazione.
- Assumere che default_factory copi un valore passato dal chiamante.
- Usare frozen con liste e dichiarare il record profondamente immutabile.
- Esportare `asdict` senza selezionare i campi pubblici.
- Forzare l'hash su dati mutabili.
- Credere che post-init sia un controllo continuo dello stato.

## Checklist

- I default sono per-istanza quando devono esserlo?
- Le invarianti vengono controllate dove entrano i dati?
- Sono definite uguaglianza, ordinamento e hash?
- I campi interni restano mutabili dopo la costruzione?
- La serializzazione espone solo cio che deve esporre?
- Slots, ereditarieta e versione Python sono compatibili?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/Enum|Enum]]
- [[Programmazione/Python/Pagine/Proprietà|Proprietà]]
- [[Programmazione/Python/Pagine/Metodi Speciali|Metodi Speciali]]

## Fonti

- [Python 3.12: dataclasses, opzioni e limiti](https://docs.python.org/3.12/library/dataclasses.html).
- [PEP 557: modello delle dataclass e helper](https://peps.python.org/pep-0557/).
- [Python 3.12: copie superficiali e profonde](https://docs.python.org/3.12/library/copy.html).

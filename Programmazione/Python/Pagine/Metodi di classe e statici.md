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
aliases:
  - Metodi di Classe e Metodi Statici
prerequisites: []
related: []
title: Metodi di Classe e Metodi Statici in Python
---

# Metodi di Classe e Metodi Statici in Python

## Sintesi

Un metodo di istanza riceve l'oggetto su cui lavora; un `classmethod` riceve la classe effettiva; uno `staticmethod` non riceve argomenti impliciti. La scelta dipende dallo stato e dal comportamento necessari, non da una preferenza stilistica.

Riferimento: Python 3.12; esempi verificati con CPython 3.12.10. L'annotazione `typing.Self` e disponibile dalla 3.11 e non impone controlli runtime.

## Quando usarlo

- Metodo di istanza: leggere o modificare lo stato di un oggetto.
- `classmethod`: factory che costruisce istanze anche delle sottoclassi, oppure comportamento dipendente dalla classe.
- `staticmethod`: funzione strettamente legata al concetto della classe ma indipendente da istanza e classe.

Se una funzione e utile in piu contesti, una normale funzione di modulo e spesso piu semplice. Non occorre una classe contenitore per ogni utility.

## Come funziona

Il binding viene eseguito quando si accede al metodo tramite classe o istanza.

| Definizione                               | Chiamata tipica      | Argomento implicito           |
| ----------------------------------------- | -------------------- | ----------------------------- |
| `def method(self, value)`                 | `obj.method(value)`  | `obj`                         |
| `@classmethod` + `def method(cls, value)` | `Type.method(value)` | La classe usata per l'accesso |
| `@staticmethod` + `def method(value)`     | `Type.method(value)` | Nessuno                       |

Accedere a un normale metodo tramite la classe, per esempio `Type.method(obj, value)`, richiede di passare esplicitamente l'istanza. `self` e `cls` sono nomi convenzionali, non parole chiave.

Classmethod e staticmethod possono essere chiamati anche da un'istanza. Non e un errore di Python, ma la chiamata tramite classe rende piu evidente che non dipendono dallo stato specifico dell'oggetto.

## API / Sintassi

Il primo esempio isola il binding:

```python
class Inspector:
    def instance_type(self) -> str:
        return type(self).__name__

    @classmethod
    def class_type(cls) -> str:
        return cls.__name__

    @staticmethod
    def join(left: str, right: str) -> str:
        return f"{left}:{right}"


class DetailedInspector(Inspector):
    pass


item = DetailedInspector()
print(item.instance_type())         # DetailedInspector
print(Inspector.instance_type(item))  # DetailedInspector
print(DetailedInspector.class_type())  # DetailedInspector
print(item.class_type())            # DetailedInspector
print(Inspector.join("a", "b"))     # a:b
```

Il metodo di classe ereditato riceve `DetailedInspector`, non necessariamente la classe in cui e stato definito. Lo staticmethod non riceve nessuna delle due.

## Esempio pratico

Una factory converte un dizionario esterno in un'etichetta. La validazione del testo resta nel percorso di costruzione comune; il dizionario originale non viene modificato.

```python
from typing import Self


class Label:
    def __init__(self, text: str) -> None:
        self.text = self.normalize_text(text)

    @staticmethod
    def normalize_text(text: str) -> str:
        if not isinstance(text, str):
            raise TypeError("text must be a string")
        cleaned = text.strip()
        if not cleaned:
            raise ValueError("text cannot be empty")
        return cleaned

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> Self:
        if not isinstance(data, dict):
            raise TypeError("data must be a dictionary")
        if "text" not in data:
            raise ValueError("missing text")
        text = data["text"]
        if not isinstance(text, str):
            raise TypeError("text must be a string")
        return cls(text)


class ImportantLabel(Label):
    pass


raw = {"text": " Release "}
label = ImportantLabel.from_dict(raw)
print(type(label).__name__, label.text)  # ImportantLabel Release
print(raw)                              # {'text': ' Release '}
```

`return cls(text)` conserva la classe chiamante. Scrivere `return Label(text)` produrrebbe sempre un `Label`, anche quando si chiama la factory da `ImportantLabel`.

`Self` descrive al type checker il tipo relativo alla classe chiamante; non valida i dati e non garantisce che ogni futuro costruttore di sottoclasse sia compatibile con `cls(text)`. Una sottoclasse con parametri obbligatori aggiuntivi deve adattare anche la factory o rispettarne il contratto.

Il controllo in `from_dict` consente di verificare il valore di tipo `object` prima di passarlo al costruttore. `normalize_text` rimane utile anche per la costruzione diretta. Le chiavi aggiuntive sono ignorate intenzionalmente; non e una validazione generale di uno schema JSON.

Il testo viene solo ripulito dagli spazi esterni: normalizzazione, validazione e codifica per HTML/SQL sono problemi distinti. Non applicare automaticamente `lower()` a ogni tipo di dato, per esempio a un intero indirizzo email.

## Varianti

### Stato di classe ed ereditarieta

Un metodo di classe puo modificare attributi della classe. Non confondere un contatore per sottoclasse con un contatore globale condiviso.

```python
class Counter:
    count = 0

    @classmethod
    def increment(cls) -> None:
        cls.count += 1


class LocalCounter(Counter):
    pass


LocalCounter.increment()
LocalCounter.increment()
print(Counter.count, LocalCounter.count)  # 0 2
print("count" in LocalCounter.__dict__)   # True
```

Alla prima chiamata, `LocalCounter` legge il valore ereditato e poi assegna un nuovo intero al proprio attributo, oscurando quello della base. Questo non crea automaticamente uno zero indipendente per ogni sottoclasse: se la base avesse gia un valore diverso prima della prima assegnazione, verrebbe letto quel valore.

Con una lista ereditata, invece, `cls.items.append(...)` muterebbe la stessa lista finche non viene sostituita. Stato di classe mutabile richiede una decisione esplicita su condivisione e sincronizzazione; `classmethod` non aggiunge protezione dai thread.

### Altre factory

`from_text`, `from_path` e `from_config` possono rendere esplicita la provenienza dei dati. Evita di trasformare il costruttore in una collezione di combinazioni ambigue di argomenti facoltativi. Le factory possono anche essere funzioni esterne quando non devono conoscere la classe chiamante.

## Errori comuni

- Usare `staticmethod` per una factory che deve rispettare le sottoclassi.
- Restituire la classe base concreta da un metodo annotato `Self`.
- Dimenticare che un costruttore di sottoclasse incompatibile puo rompere la factory ereditata.
- Validare soltanto nella factory lasciando la costruzione diretta incoerente.
- Mutare il dizionario ricevuto senza dichiararlo nel contratto.
- Confondere assegnazione di un attributo di classe con mutazione di un contenitore condiviso.

## Checklist

- L'operazione richiede un oggetto, una classe o nessuno dei due?
- Una factory usa `cls` quando promette supporto alle sottoclassi?
- Le annotazioni descrivono il comportamento senza sostituire la validazione?
- Costruzione diretta e alternativa rispettano le stesse invarianti?
- L'input resta invariato, se non e dichiarato diversamente?
- Una funzione di modulo sarebbe piu riusabile?

## Collegamenti

- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e istanze]]
- [[Programmazione/Python/Pagine/Ereditarietà|Ereditarieta]]
- [[Programmazione/Python/Pagine/Descriptor protocol|Descriptor protocol]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/Dataclasses|Dataclasses]]
- [[Programmazione/Python/Indice Python|Indice Python]]

## Fonti

- [classmethod](https://docs.python.org/3.12/library/functions.html#classmethod).
- [staticmethod](https://docs.python.org/3.12/library/functions.html#staticmethod).
- [Descriptor HOWTO: funzioni e metodi](https://docs.python.org/3.12/howto/descriptor.html#functions-and-methods).
- [typing.Self](https://docs.python.org/3.12/library/typing.html#typing.Self).

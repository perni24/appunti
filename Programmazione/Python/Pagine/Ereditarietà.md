---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [python, programming]
aliases: [Ereditarietà]
prerequisites: []
related: []
---

# Ereditarietà in Python

## Sintesi

L'ereditarieta permette a una classe figlia di riusare e specializzare attributi e metodi di una classe padre.

## Quando usarlo

Usala quando esiste una relazione reale "is-a" e vuoi condividere comportamento comune tra tipi compatibili.

## Come funziona

Una sottoclasse eredita metodi e attributi dalla superclasse. Con `super()` puoi chiamare implementazioni della classe padre. Python supporta ereditarieta multipla e risolve i metodi con MRO, cioe Method Resolution Order.

## API / Sintassi

```python
class Animal:
    def __init__(self, name: str) -> None:
        self.name = name

    def speak(self) -> str:
        return "..."


class Dog(Animal):
    def speak(self) -> str:
        return "bau"
```

`super()`:

```python
class Dog(Animal):
    def __init__(self, name: str, breed: str) -> None:
        super().__init__(name)
        self.breed = breed
```

## Esempio pratico

```python
class Notification:
    def send(self, message: str) -> None:
        raise NotImplementedError


class EmailNotification(Notification):
    def send(self, message: str) -> None:
        print(f"email: {message}")
```

## Varianti

- Ereditarieta singola.
- Ereditarieta multipla.
- Override di metodi.
- Classi astratte.
- Mixins.
- Composizione come alternativa.

## Errori comuni

- Usare ereditarieta quando serve composizione.
- Creare gerarchie troppo profonde.
- Dimenticare `super().__init__()`.
- Usare ereditarieta multipla senza capire MRO.
- Rompere il contratto della classe base.

## Checklist

- La relazione e davvero "is-a"?
- La sottoclasse rispetta il comportamento atteso?
- `super()` viene usato correttamente?
- La gerarchia resta semplice?
- Un protocollo o composizione sarebbe piu adatto?

## Collegamenti

- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
- [[Programmazione/Python/Pagine/Metodi Speciali|Metodi Speciali]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]

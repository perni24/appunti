---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming]
aliases: [Classi e Istanze]
prerequisites: []
related: []
---

# Classi e Istanze in Python

## Sintesi

Una classe definisce struttura e comportamento di un tipo di oggetto. Un'istanza e un oggetto concreto creato da quella classe.

## Quando usarlo

Usa classi quando dati e comportamenti appartengono allo stesso concetto: utenti, ordini, connessioni, servizi, parser o componenti con stato.

## Come funziona

`class` crea un nuovo tipo. `__init__` inizializza l'istanza. `self` e il riferimento all'oggetto corrente e permette di leggere o modificare attributi.

Gli attributi di istanza appartengono al singolo oggetto. Gli attributi di classe sono condivisi dalla classe e dalle istanze, salvo shadowing.

## API / Sintassi

```python
class User:
    role = "user"

    def __init__(self, email: str) -> None:
        self.email = email
        self.active = True

    def deactivate(self) -> None:
        self.active = False
```

Creazione:

```python
user = User("ada@example.com")
user.deactivate()
```

## Esempio pratico

```python
class BankAccount:
    def __init__(self, owner: str, balance: float = 0) -> None:
        self.owner = owner
        self.balance = balance

    def deposit(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("amount must be positive")
        self.balance += amount

    def withdraw(self, amount: float) -> None:
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount
```

## Varianti

- Classi semplici.
- Dataclasses per contenitori dati.
- Classi con ereditarieta.
- Classi con metodi speciali.
- Classi con attributi di classe.
- Classi con proprieta.

## Errori comuni

- Dimenticare `self` nei metodi.
- Usare attributi di classe mutabili per stato di istanza.
- Creare classi per semplici dati dove basta una dataclass o dict.
- Inizializzare attributi fuori da `__init__` senza motivo.
- Fare classi troppo grandi.

## Checklist

- La classe rappresenta un concetto chiaro?
- Gli attributi di istanza sono definiti in `__init__`?
- Gli attributi di classe sono davvero condivisi?
- I metodi hanno responsabilita piccole?
- Serve una dataclass invece di una classe manuale?

## Collegamenti

- [[Programmazione/Python/Pagine/Dataclasses|Dataclasses]]
- [[Programmazione/Python/Pagine/Ereditarietà|Ereditarietà]]
- [[Programmazione/Python/Pagine/Metodi Speciali|Metodi Speciali]]

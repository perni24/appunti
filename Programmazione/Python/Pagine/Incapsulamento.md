---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming]
aliases: [Incapsulamento]
prerequisites: []
related: []
---

# Incapsulamento in Python

## Sintesi

L'incapsulamento separa interfaccia pubblica e dettagli interni di una classe. In Python si basa soprattutto su convenzioni, non su blocchi rigidi di accesso.

## Quando usarlo

Usalo quando vuoi proteggere invarianti, chiarire quali attributi sono pubblici e nascondere dettagli che possono cambiare.

## Come funziona

Gli attributi senza underscore sono pubblici. Un underscore iniziale indica uso interno per convenzione. Due underscore attivano name mangling, utile per evitare conflitti in ereditarieta.

## API / Sintassi

```python
class Account:
    def __init__(self, balance: float) -> None:
        self._balance = balance

    def deposit(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("amount must be positive")
        self._balance += amount
```

Name mangling:

```python
class Example:
    def __init__(self) -> None:
        self.__internal = 1
```

## Esempio pratico

```python
class Temperature:
    def __init__(self, celsius: float) -> None:
        self._celsius = celsius

    @property
    def celsius(self) -> float:
        return self._celsius
```

L'attributo interno resta modificabile dalla classe, mentre l'interfaccia pubblica e controllata.

## Varianti

- Attributi pubblici.
- Attributi protetti per convenzione: `_name`.
- Name mangling: `__name`.
- Proprietà con `@property`.
- Metodi pubblici e helper interni.

## Errori comuni

- Pensare che `__name` sia sicurezza reale.
- Usare getter/setter manuali invece di `@property` quando serve.
- Esporre troppi dettagli interni.
- Usare dunder personalizzati non previsti dal linguaggio.
- Rompere l'interfaccia pubblica senza necessita.

## Checklist

- L'interfaccia pubblica e chiara?
- Gli attributi interni hanno `_`?
- Le invarianti sono protette da metodi/proprieta?
- Il doppio underscore e davvero necessario?
- I dettagli interni possono cambiare senza rompere utenti della classe?

## Collegamenti

- [[Programmazione/Python/Pagine/Proprietà|Proprietà]]
- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
- [[Programmazione/Python/Pagine/Descriptor protocol|Descriptor protocol]]

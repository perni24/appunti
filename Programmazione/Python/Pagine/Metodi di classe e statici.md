---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [python, programming]
aliases: [Metodi di Classe e Metodi Statici]
prerequisites: []
related: []
---

# Metodi di Classe e Metodi Statici in Python

## Sintesi

I metodi di classe ricevono `cls` e lavorano con la classe. I metodi statici non ricevono ne `self` ne `cls` e sono funzioni raggruppate nel namespace della classe.

## Quando usarlo

Usa `@classmethod` per costruttori alternativi o logica che deve rispettare sottoclassi. Usa `@staticmethod` per utility correlate alla classe ma indipendenti dallo stato.

## Come funziona

Un metodo di istanza riceve `self`. Un classmethod riceve la classe effettiva, anche se chiamato da una sottoclasse. Uno staticmethod non ha binding automatico.

## API / Sintassi

```python
class User:
    def __init__(self, email: str) -> None:
        self.email = email

    @classmethod
    def from_dict(cls, data: dict[str, str]) -> "User":
        return cls(data["email"])

    @staticmethod
    def normalize_email(email: str) -> str:
        return email.strip().lower()
```

## Esempio pratico

```python
raw = {"email": " Ada@Example.com "}
raw["email"] = User.normalize_email(raw["email"])
user = User.from_dict(raw)
```

## Varianti

- Metodo di istanza.
- `@classmethod`.
- `@staticmethod`.
- Factory methods.
- Utility methods.
- Costruttori alternativi nelle dataclass.

## Errori comuni

- Usare `staticmethod` quando serve accesso a `cls`.
- Dimenticare `cls` in un classmethod.
- Mettere troppe utility dentro una classe.
- Usare classmethod per mutare stato globale senza controllo.
- Chiamare da istanza metodi che sono concettualmente di classe.

## Checklist

- Serve `self`, `cls` o nessuno dei due?
- Il metodo crea istanze alternative? Usa `@classmethod`.
- La funzione e davvero legata alla classe?
- Le sottoclassi devono ereditare correttamente il comportamento?
- Il nome del metodo comunica lo scopo?

## Collegamenti

- [[Programmazione/Python/Pagine/Classi e Istanze|Classi e Istanze]]
- [[Programmazione/Python/Pagine/Ereditarietà|Ereditarietà]]
- [[Programmazione/Python/Pagine/Descriptor protocol|Descriptor protocol]]

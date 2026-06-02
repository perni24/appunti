---
date: 2026-06-02
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - python
  - validazione
  - typing
aliases: []
prerequisites: []
related: []
---

# Pydantic

## Sintesi

**Pydantic** valida e serializza dati usando type hints Python. E molto usato in API, configurazione e parsing di payload esterni.

## Quando usarlo

- Validazione input API.
- Configurazioni.
- Parsing JSON.
- DTO tra layer applicativi.

## Come funziona

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

### Esempio
```python
from pydantic import BaseModel, EmailStr

class User(BaseModel):
    email: EmailStr
    age: int

user = User(email="a@example.com", age="42")
```

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

- Confondere type hints statici con validazione runtime.
- Validare troppo tardi nel flusso.
- Usare modelli Pydantic come modello di dominio ovunque.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/FastAPI|FastAPI]]
- [[Programmazione/Python/Pagine/Configurazione e Variabili d Ambiente|Configurazione e Variabili d Ambiente]]

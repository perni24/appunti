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
  - web
  - api
aliases: []
prerequisites: []
related: []
---

# FastAPI

## Sintesi

**FastAPI** e un framework web Python per costruire API usando type hints, validazione automatica e documentazione OpenAPI.

## Quando usarlo

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Come funziona

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

### Esempio
```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class UserIn(BaseModel):
    email: str

@app.post("/users")
async def create_user(user: UserIn):
    return user
```

## Varianti

### Punti forti
- Validazione con [[Programmazione/Python/Pagine/Pydantic|Pydantic]].
- Supporto async.
- OpenAPI automatico.
- Dependency injection.

## Errori comuni

- Usare async con librerie bloccanti.
- Mettere logica di dominio direttamente negli endpoint.
- Ignorare gestione errori e versionamento API.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Starlette|Starlette]]
- [[Programmazione/Python/Pagine/Pydantic|Pydantic]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]

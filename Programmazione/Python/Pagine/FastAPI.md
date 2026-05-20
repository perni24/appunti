---
date: 2026-05-20
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

## Esempio

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

## Punti forti

- Validazione con [[Programmazione/Python/Pagine/Pydantic|Pydantic]].
- Supporto async.
- OpenAPI automatico.
- Dependency injection.

## Errori comuni

- Usare async con librerie bloccanti.
- Mettere logica di dominio direttamente negli endpoint.
- Ignorare gestione errori e versionamento API.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Python/Pagine/Starlette|Starlette]]
- [[Programmazione/Python/Pagine/Pydantic|Pydantic]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]



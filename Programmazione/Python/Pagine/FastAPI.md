---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [programmazione, python, web, api]
aliases: [FastAPI]
prerequisites: []
related: []
---

# FastAPI

## Sintesi

FastAPI e un framework web Python per costruire API HTTP usando type hints, validazione automatica, dependency injection e documentazione OpenAPI. Si basa su Starlette per il layer ASGI e usa Pydantic per validazione e serializzazione.

## Quando usarlo

Usa FastAPI quando:

- devi costruire API JSON moderne;
- vuoi documentazione OpenAPI automatica;
- vuoi validazione forte dei payload;
- vuoi supporto async;
- ti serve dependency injection semplice;
- stai costruendo microservizi o backend API-first.

Per applicazioni web full-stack tradizionali con admin integrato, Django puo essere piu adatto.

## Come funziona

Endpoint base:

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/health")
async def health():
    return {"status": "ok"}
```

Modello di input:

```python
from pydantic import BaseModel, EmailStr


class UserIn(BaseModel):
    email: EmailStr
```

## API / Sintassi

Endpoint POST:

```python
@app.post("/users")
async def create_user(user: UserIn):
    return {"email": user.email}
```

Path parameter:

```python
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    return {"id": user_id}
```

Dependency:

```python
from fastapi import Depends


def get_current_user():
    return {"id": 1}


@app.get("/me")
async def me(user=Depends(get_current_user)):
    return user
```

## Esempio pratico

Separare endpoint e logica applicativa:

```python
class UserService:
    def create(self, email):
        return {"id": 1, "email": email}


def get_user_service():
    return UserService()


@app.post("/users")
async def create_user(
    user: UserIn,
    service: UserService = Depends(get_user_service),
):
    return service.create(user.email)
```

## Varianti

- **Endpoint sync**: `def`, utile con librerie bloccanti.
- **Endpoint async**: `async def`, utile con librerie async reali.
- **Router**: organizza endpoint per area.
- **Dependency injection**: gestisce configurazione, sessioni e servizi.
- **Middleware**: logica trasversale.
- **Background tasks**: lavoro leggero dopo la risposta.

## Errori comuni

- Usare `async def` ma chiamare librerie bloccanti dentro.
- Mettere logica di dominio direttamente negli endpoint.
- Non gestire errori e codici HTTP in modo coerente.
- Usare modelli Pydantic come unico modello di dominio ovunque.
- Aprire connessioni database senza lifecycle chiaro.
- Ignorare versionamento API e contratti pubblici.

## Checklist

- Gli endpoint sono sottili?
- I payload sono validati con Pydantic?
- Le dipendenze hanno ciclo di vita chiaro?
- Il codice async usa librerie async?
- Errori e status code sono espliciti?
- La documentazione OpenAPI rappresenta davvero il contratto?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Starlette]]
- [[Pydantic]]
- [[Asyncio]]
- [[HTTPX e requests]]
- [[SQLAlchemy]]

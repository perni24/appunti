---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [programmazione, python, validazione, typing]
aliases: [Pydantic]
prerequisites: []
related: []
---

# Pydantic

## Sintesi

Pydantic valida, converte e serializza dati usando type hints Python. E molto usato per payload API, configurazioni, DTO e confini tra sistemi esterni e codice applicativo.

I type hints da soli aiutano strumenti statici; Pydantic aggiunge validazione runtime.

## Quando usarlo

Usa Pydantic quando:

- ricevi JSON da API o messaggi esterni;
- devi validare input utente;
- vuoi DTO espliciti tra layer;
- devi serializzare risposte;
- vuoi configurazioni tipizzate;
- usi FastAPI.

Evita di usarlo come sostituto automatico del modello di dominio in ogni punto del progetto.

## Come funziona

Modello base:

```python
from pydantic import BaseModel, EmailStr


class User(BaseModel):
    email: EmailStr
    age: int


user = User(email="a@example.com", age="42")
print(user.age)  # 42 come int
```

Pydantic valida e, quando possibile, converte i tipi.

## API / Sintassi

Validazione:

```python
from pydantic import ValidationError

try:
    User(email="invalid", age="x")
except ValidationError as error:
    print(error)
```

Serializzazione:

```python
data = user.model_dump()
json_text = user.model_dump_json()
```

Valori di default:

```python
class Settings(BaseModel):
    debug: bool = False
    port: int = 8000
```

## Esempio pratico

DTO per una API:

```python
from pydantic import BaseModel, EmailStr, Field


class CreateUserRequest(BaseModel):
    email: EmailStr
    display_name: str = Field(min_length=1, max_length=100)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    display_name: str
```

Questo separa input e output, evitando di esporre campi interni per errore.

## Varianti

- **Input model**: valida payload in ingresso.
- **Output model**: controlla cosa viene serializzato.
- **Settings model**: valida configurazione.
- **Nested models**: rappresentano strutture JSON annidate.
- **Custom validators**: regole specifiche di dominio.
- **Pydantic con FastAPI**: validazione e OpenAPI automatici.

## Errori comuni

- Confondere type hints statici con validazione runtime.
- Validare troppo tardi nel flusso.
- Usare modelli Pydantic come modello di dominio ovunque.
- Esporre lo stesso modello per input, output e persistenza.
- Accettare conversioni implicite senza chiedersi se siano desiderate.
- Nascondere regole di business complesse dentro validator troppo pesanti.

## Checklist

- Il modello rappresenta input, output, config o dominio?
- Input e output sono separati?
- Le conversioni automatiche sono desiderate?
- Gli errori di validazione vengono mostrati in modo utile?
- I validator restano semplici?
- I modelli non espongono campi sensibili?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Type Hinting]]
- [[FastAPI]]
- [[Configurazione e Variabili d Ambiente]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]

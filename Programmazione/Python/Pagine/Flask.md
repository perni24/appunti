---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [programmazione, python, web, flask]
aliases: [Flask]
prerequisites: []
related: []
---

# Flask

## Sintesi

Flask e un micro-framework web Python. Offre routing, request/response, template e integrazione con estensioni, lasciando molte scelte architetturali allo sviluppatore.

E semplice da iniziare, ma nei progetti grandi richiede convenzioni esplicite.

## Quando usarlo

Usa Flask per:

- API piccole;
- prototipi;
- applicazioni web semplici;
- servizi interni;
- progetti dove vuoi scegliere manualmente ORM, validazione e struttura.

Per API moderne con validazione automatica, FastAPI puo essere piu produttivo. Per applicazioni full-stack grandi, valuta Django.

## Come funziona

App minima:

```python
from flask import Flask

app = Flask(__name__)


@app.get("/")
def home():
    return {"status": "ok"}
```

Flask associa route a funzioni view. La funzione ritorna risposta, dizionario JSON, template o oggetti response.

## API / Sintassi

Path parameter:

```python
@app.get("/users/<int:user_id>")
def get_user(user_id):
    return {"id": user_id}
```

Leggere JSON:

```python
from flask import request


@app.post("/users")
def create_user():
    payload = request.get_json()
    return {"email": payload["email"]}, 201
```

Blueprint:

```python
from flask import Blueprint

users = Blueprint("users", __name__, url_prefix="/users")
```

## Esempio pratico

Separare creazione app e configurazione:

```python
from flask import Flask


def create_app():
    app = Flask(__name__)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app
```

Questo pattern semplifica test e configurazioni diverse.

## Varianti

- **App singola minima**: utile per prototipi.
- **Application factory**: `create_app()` per progetti strutturati.
- **Blueprint**: divide route per modulo.
- **Jinja templates**: rendering HTML.
- **Estensioni**: database, login, migrations, forms.
- **API JSON**: comune, ma validazione va progettata o aggiunta.

## Errori comuni

- Lasciare tutta la logica nelle route.
- Non definire struttura progetto nei progetti grandi.
- Non validare input JSON.
- Gestire configurazione con valori hardcoded.
- Non separare app factory, servizi e accesso dati.
- Installare molte estensioni senza una convenzione chiara.

## Checklist

- Le route sono sottili?
- La configurazione e esterna al codice?
- Gli input sono validati?
- Il progetto usa blueprint quando cresce?
- Esiste una strategia per database e migrazioni?
- I test possono creare app isolate?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[FastAPI]]
- [[Django]]
- [[HTTPX e requests]]
- [[Configurazione e Variabili d Ambiente]]
- [[SQLAlchemy]]

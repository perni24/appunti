---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - programmazione
  - python
  - web
  - flask
aliases:
  - Flask
prerequisites: []
related: []
title: Flask
---

# Flask

## Sintesi

Flask e un framework web **WSGI**: collega URL e metodi HTTP a funzioni Python, costruisce risposte e integra template Jinja. Non sceglie automaticamente ORM, autenticazione o schema dei payload.

Baseline degli esempi: **CPython 3.12.10, Flask 3.1.3 e Werkzeug 3.1.9**, Windows. Il demo normalizza una stringa e legge un record fittizio; non crea utenti e non salva dati.

## Quando usarlo

- Servizi HTTP o pagine server-rendered con dipendenze scelte esplicitamente.
- Applicazioni in cui factory, blueprint, servizi e repository possono restare semplici.
- Prototipi da far evolvere con test e convenzioni, non solo un file di route.

Flask non e limitato alle app piccole. La scelta rispetto a Django o FastAPI dipende anche da librerie, deployment e convenzioni richieste, non da una classifica di velocita.

## Come funziona

Il server WSGI invoca l'app. Flask apre i contesti applicativo e di richiesta, risolve la route, esegue la view e costruisce la response.

- `request` contiene dati della richiesta; `current_app` e un proxy dell'app corrente.
- `g` e adatto a risorse legate al contesto, non a conservare dati tra richieste.
- Un dizionario restituito da una view viene serializzato in JSON; una stringa e normalmente HTML.
- `return payload, status` imposta lo status. Dichiarare un error handler non basta a cambiare il codice della risposta.
- Un blueprint raccoglie route da **registrare** su un'app: non e un server o un'app indipendente.

Non leggere request all'import del modulo. Una factory consente app con configurazioni diverse nello stesso processo; non isola automaticamente database esterni o variabili globali mutabili.

## API / Sintassi

| Operazione                              | Contratto                                                         |
| --------------------------------------- | ----------------------------------------------------------------- |
| `app.get("/users/<int:user_id>")`       | Il converter seleziona la route; non verifica che l'utente esista |
| `request.args`                          | Parametri query: stringhe, anche ripetute                         |
| `request.get_json()`                    | Parsing JSON, non validazione dello schema                        |
| `abort(404)`                            | Interrompe il percorso con un errore HTTP                         |
| `url_for("api.user_detail", user_id=1)` | Costruisce URL a partire dal nome dell'endpoint                   |
| `app.test_client()`                     | Esegue richieste in-process, senza aprire un server               |

Nella baseline un Content-Type non JSON produce **415**; JSON sintatticamente errato produce **400**. Un array o null sono JSON validi ma possono non rispettare il tuo contratto. Non usare force/silent per nascondere questi casi.

## Esempio pratico

In una directory dimostrativa separata, con un virtualenv attivo:

```powershell
python -m pip install "Flask==3.1.3" "Werkzeug==3.1.9"
```

### flask_app.py

```python
from flask import Blueprint, Flask, abort, request
from werkzeug.exceptions import HTTPException


def normalize_label(payload):
    if not isinstance(payload, dict) or set(payload) != {"label"}:
        raise ValueError("expected only the label field")
    label = payload["label"]
    if not isinstance(label, str):
        raise ValueError("label must be a string")
    label = label.strip()
    if not 1 <= len(label) <= 80:
        raise ValueError("label length must be between 1 and 80")
    return label


def create_app(config=None):
    app = Flask(__name__)
    app.config.from_mapping(MAX_CONTENT_LENGTH=4096)
    if config is not None:
        app.config.update(config)

    api = Blueprint("api", __name__, url_prefix="/api")

    @api.get("/health")
    def health():
        return {"status": "ok"}

    @api.get("/users/<int:user_id>")
    def user_detail(user_id):
        if user_id != 1:
            abort(404)
        return {"id": 1, "display_name": "Demo"}

    @api.post("/normalize")
    def normalize():
        payload = request.get_json()
        try:
            label = normalize_label(payload)
        except ValueError:
            abort(400)
        return {"label": label}

    @app.errorhandler(HTTPException)
    def http_error(error):
        response = error.get_response()
        response.set_data(app.json.dumps({"error": error.name}))
        response.content_type = "application/json"
        return response

    app.register_blueprint(api)
    return app
```

Non si usa un POST di creazione con ID fisso: `/normalize` e una trasformazione senza persistenza e risponde 200. La funzione di validazione e separata dalla view e puo essere provata senza un contesto Flask.

L'handler conserva status e header dell'errore, compreso Allow nei 405; non trasforma eccezioni applicative inattese in successi. La risposta non espone dettagli interni. MAX_CONTENT_LENGTH limita il corpo quando Flask lo legge: non sostituisce limiti e timeout del server/proxy.

### verify_flask.py

```python
from flask_app import create_app

app = create_app({"TESTING": True})
with app.test_client() as client:
    response = client.post("/api/normalize", json={"label": "  Appunti  "})
    assert response.status_code == 200
    assert response.json == {"label": "Appunti"}
    assert client.post("/api/normalize", json={"label": ""}).status_code == 400
    assert client.post("/api/normalize", json=[]).status_code == 400
    assert client.post("/api/normalize", data="x").status_code == 415
    assert client.get("/api/users/2").status_code == 404
    response = client.post("/api/health")
    assert response.status_code == 405
    assert "GET" in response.headers["Allow"]
print("Flask demo ok")
```

```powershell
python verify_flask.py
```

Avvio **solo locale di sviluppo**, dalla stessa directory:

```powershell
python -m flask --app flask_app:create_app run --host 127.0.0.1 --port 5000
```

Se la porta e occupata cambiala; non fermare servizi estranei. Il server integrato e il debugger non sono una configurazione di produzione.

## Varianti

- **HTML**: render_template carica template Jinja; mantieni l'escaping e non marcare input non fidati come safe.
- **Estensioni**: inizializzale nella factory, per esempio tramite init_app quando previsto, senza associare prematuramente un'unica app globale.
- **Risorse**: acquisizione e rilascio devono seguire il loro ciclo di vita; teardown chiude risorse ma non implica commit.
- **Async**: con l'extra flask[async] puoi usare view asincrone, ma una richiesta continua a occupare un worker WSGI. Non usare create_task dentro la view come coda di lavoro persistente.
- **Sessioni**: quelle predefinite sono cookie firmati, non cifrati; non inserirvi segreti. Firma, autenticazione, autorizzazione e CSRF sono problemi distinti.

## Errori comuni

- Accedere a payload["email"] senza controllare forma, campi e tipi.
- Confondere conversione del path con esistenza o autorizzazione.
- Restituire testo utente come HTML senza escaping.
- Creare un blueprint senza registrarlo.
- Catturare qualsiasi Exception e restituire 200 o 400, nascondendo bug del server.
- Condividere un dizionario globale come database: worker distinti non condividono quel dato.
- Esporre il debugger o trattare CORS come autenticazione.

## Checklist

- Factory e configurazione sono testabili senza effetti all'import?
- JSON invalido, Content-Type, dimensioni e schema hanno esiti distinti?
- Ogni risorsa persistente ha transazione e chiusura esplicite?
- Sono provati successo, 404, 405 ed errori inattesi?
- Autorizzazione, sessioni/CSRF e server di produzione sono progettati separatamente?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/FastAPI|FastAPI]]
- [[Programmazione/Python/Pagine/Django|Django]]
- [[Programmazione/Python/Pagine/HTTPX e requests|HTTPX e requests]]
- [[Programmazione/Python/Pagine/Configurazione e Variabili d Ambiente|Configurazione e Variabili d Ambiente]]
- [[Programmazione/Python/Pagine/SQLAlchemy|SQLAlchemy]]
- [[Programmazione/Python/Pagine/Testing|Testing]]

## Fonti

- [Flask 3.1: routing, risposte, template e sessioni](https://flask.palletsprojects.com/en/stable/quickstart/).
- [Application factories](https://flask.palletsprojects.com/en/stable/patterns/appfactories/).
- [Request e parsing JSON](https://flask.palletsprojects.com/en/stable/api/).
- [Gestione degli errori](https://flask.palletsprojects.com/en/stable/errorhandling/).
- [Test client](https://flask.palletsprojects.com/en/stable/testing/).
- [Limiti dell'async in Flask](https://flask.palletsprojects.com/en/stable/async-await/).

---
date: 2026-07-28
area: Programmazione
topic: Strutture di Progetto
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [python, backend, api, struttura-progetto, architettura-a-livelli]
aliases: [Struttura backend Python, Python layered backend]
prerequisites:
  - "[[Programmazione/Python/Pagine/Creazione di Package]]"
  - "[[Programmazione/Clean Code/Pagine/Separazione delle responsabilita]]"
related:
  - "[[Programmazione/Python/Pagine/Configurazione e Variabili d Ambiente]]"
  - "[[Programmazione/Python/Pagine/Pydantic]]"
  - "[[Programmazione/Python/Pagine/FastAPI]]"
  - "[[Programmazione/Clean Code/Pagine/Controller sottili]]"
  - "[[Programmazione/Clean Code/Pagine/Service layer]]"
  - "[[Programmazione/Clean Code/Pagine/Repository pattern]]"
  - "[[Programmazione/Clean Code/Pagine/Validazione input API]]"
  - "[[Programmazione/Clean Code/Pagine/Test di integrazione]]"
---

# Python - Backend API a livelli

## Sintesi

Questa struttura organizza un backend Python in livelli con responsabilita distinte:

- `routes` gestisce il protocollo HTTP;
- `validators` controlla la forma dei dati ricevuti;
- `services` contiene i casi d'uso e le regole applicative;
- `db/repositories` esegue le operazioni di persistenza;
- `db/db.py` gestisce le connessioni al database;
- `config.py` legge e valida la configurazione;
- `main.py` compone e avvia l'applicazione.

La separazione evita che una route debba validare i dati, applicare le regole di business ed eseguire direttamente query SQL.

La struttura e adatta a un backend API piccolo o medio. Non dipende necessariamente da uno specifico framework, anche se gli esempi di routing possono essere implementati con FastAPI o Flask.

## Quando usarla

- API CRUD con database relazionale.
- Backend per un'applicazione web o mobile.
- Servizio con regole applicative che non devono risiedere nelle route.
- Progetto nel quale si vogliono sostituire o provare separatamente database, servizi e trasporto HTTP.
- Applicazione destinata a crescere oltre pochi endpoint.

Per uno script con uno o due endpoint questa suddivisione puo essere eccessiva. Per un sistema molto grande puo invece essere necessario organizzare i file per funzionalita o dominio, non soltanto per livello tecnico.

## Struttura delle directory

```text
backend/
|-- db/
|   |-- repositories/
|   |   |-- __init__.py
|   |   `-- entity_repo.py
|   |-- __init__.py
|   `-- db.py
|-- routes/
|   |-- __init__.py
|   |-- api.py
|   `-- entity_routes.py
|-- services/
|   |-- __init__.py
|   `-- entity_service.py
|-- validators/
|   |-- __init__.py
|   `-- request_validator.py
|-- locales/
|   |-- it.json
|   `-- en.json
|-- test/
|   `-- entity.http
|-- config.py
|-- main.py
|-- schema.sql
|-- build_portable.py
`-- requirements.txt
```

Il nome corretto dei file di inizializzazione e `__init__.py`, con due caratteri underscore prima e dopo `init`. La grafia con `init` in grassetto deriva dalla formattazione Markdown e non rappresenta un nome file Python valido.

## Flusso di una richiesta

```text
Client HTTP
    |
    v
main.py
    |
    v
routes/api.py
    |
    v
routes/entity_routes.py
    |
    +--> validators/request_validator.py
    |
    v
services/entity_service.py
    |
    v
db/repositories/entity_repo.py
    |
    v
db/db.py
    |
    v
Database
```

Il risultato percorre il flusso inverso:

1. Il repository converte il risultato del database in un dato applicativo.
2. Il service applica eventuali regole e restituisce il risultato.
3. La route lo converte in una risposta HTTP.
4. Il framework serializza la risposta, per esempio in JSON.

## Responsabilita dei file

### `main.py`

E il composition root dell'applicazione. Deve:

- creare l'istanza del framework web;
- caricare la configurazione;
- inizializzare le dipendenze condivise;
- registrare router e middleware;
- configurare gestione degli errori e ciclo di vita;
- avviare l'applicazione solo quando eseguito direttamente.

Non deve contenere query SQL o regole di business.

Esempio concettuale con FastAPI:

```python
from fastapi import FastAPI

from routes.api import api_router


def create_app() -> FastAPI:
    app = FastAPI(title="Backend API")
    app.include_router(api_router, prefix="/api")
    return app


app = create_app()
```

La funzione `create_app()` facilita i test perche consente di costruire una nuova istanza dell'applicazione senza avviare un server.

### `config.py`

Centralizza la configurazione proveniente dall'ambiente:

- URL o percorso del database;
- modalita di esecuzione;
- livello di logging;
- lingua predefinita;
- chiavi e indirizzi di servizi esterni.

```python
from dataclasses import dataclass
from os import getenv


@dataclass(frozen=True)
class Settings:
    database_url: str
    default_locale: str


def load_settings() -> Settings:
    database_url = getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required")

    return Settings(
        database_url=database_url,
        default_locale=getenv("DEFAULT_LOCALE", "it"),
    )
```

Le credenziali reali non devono essere scritte nel file. Un eventuale `.env` locale deve essere escluso da Git, mentre `.env.example` puo documentare le variabili richieste.

### `db/db.py`

Gestisce l'infrastruttura di connessione:

- apertura e chiusura delle connessioni;
- transazioni;
- commit e rollback;
- configurazione del driver;
- eventuale pool di connessioni.

Il modulo non deve contenere query relative a una specifica entita: quelle appartengono ai repository.

Una funzione che restituisce sempre la stessa connessione globale e rischiosa, soprattutto con richieste concorrenti. E preferibile ottenere una connessione per richiesta o usare il pool fornito dal driver.

### `db/repositories/entity_repo.py`

Contiene le operazioni di persistenza relative all'entita:

- ricerca per identificatore;
- elenco con filtri e paginazione;
- inserimento;
- aggiornamento;
- eliminazione.

```python
class EntityRepository:
    def __init__(self, connection) -> None:
        self._connection = connection

    def find_by_id(self, entity_id: int):
        cursor = self._connection.execute(
            "SELECT id, name FROM entities WHERE id = ?",
            (entity_id,),
        )
        return cursor.fetchone()

    def create(self, name: str) -> int:
        cursor = self._connection.execute(
            "INSERT INTO entities (name) VALUES (?)",
            (name,),
        )
        return int(cursor.lastrowid)
```

I placeholder SQL dipendono dal driver. L'esempio usa la sintassi `?`, comune in `sqlite3`; non deve essere copiato senza verificare il driver scelto.

Il repository deve ricevere la connessione dall'esterno. In questo modo il service o il test puo controllare la transazione e non dipende da stato globale nascosto.

### `services/entity_service.py`

Implementa i casi d'uso dell'applicazione:

- verifica regole di business;
- coordina uno o piu repository;
- delimita operazioni atomiche;
- traduce errori infrastrutturali in errori applicativi;
- restituisce dati indipendenti dal protocollo HTTP.

```python
class EntityNotFoundError(Exception):
    pass


class EntityService:
    def __init__(self, repository) -> None:
        self._repository = repository

    def get_entity(self, entity_id: int):
        entity = self._repository.find_by_id(entity_id)
        if entity is None:
            raise EntityNotFoundError(entity_id)
        return entity

    def create_entity(self, name: str) -> int:
        normalized_name = name.strip()
        if len(normalized_name) < 3:
            raise ValueError("name must contain at least 3 characters")
        return self._repository.create(normalized_name)
```

Il service non deve restituire oggetti specifici del framework, codici HTTP o risposte JSON. La conversione degli errori applicativi in `404`, `409` o `422` appartiene al livello HTTP.

### `validators/request_validator.py`

Valida i dati al confine dell'applicazione:

- campi obbligatori;
- tipo e formato;
- lunghezze ammesse;
- valori enumerati;
- struttura del payload.

La validazione della richiesta non sostituisce le regole di business. Per esempio:

- "il campo `name` deve essere una stringa" e validazione dell'input;
- "non puo esistere una seconda entita con questo nome" e una regola applicativa.

Con FastAPI il modulo puo contenere modelli Pydantic:

```python
from pydantic import BaseModel, Field


class CreateEntityRequest(BaseModel):
    name: str = Field(min_length=3, max_length=100)
```

Per progetti piccoli i modelli possono stare accanto alla funzionalita. Una cartella `validators` separata diventa utile quando le stesse regole vengono condivise o quando la validazione e articolata.

### `routes/entity_routes.py`

Definisce gli endpoint relativi a una risorsa. Una route deve limitarsi a:

1. leggere parametri e corpo della richiesta;
2. invocare il service;
3. convertire il risultato in una risposta HTTP;
4. tradurre gli errori applicativi previsti.

```python
from fastapi import APIRouter, HTTPException

from services.entity_service import EntityNotFoundError
from validators.request_validator import CreateEntityRequest


router = APIRouter(prefix="/entities", tags=["entities"])


@router.get("/{entity_id}")
def get_entity(entity_id: int):
    try:
        return entity_service.get_entity(entity_id)
    except EntityNotFoundError as error:
        raise HTTPException(status_code=404, detail="Entity not found") from error


@router.post("", status_code=201)
def create_entity(request: CreateEntityRequest):
    entity_id = entity_service.create_entity(request.name)
    return {"id": entity_id}
```

`entity_service` nell'esempio rappresenta una dipendenza gia costruita. Nell'implementazione reale deve essere fornita esplicitamente tramite factory, dependency injection del framework o composition root. Una variabile globale creata all'importazione rende piu difficili configurazione e test.

### `routes/api.py`

Aggrega i router dell'API senza implementare i singoli casi d'uso:

```python
from fastapi import APIRouter

from routes.entity_routes import router as entity_router


api_router = APIRouter()
api_router.include_router(entity_router)
```

Questa separazione permette a `main.py` di registrare un solo router principale.

### `__init__.py`

Segnala esplicitamente che la directory e un package Python e puo controllarne l'interfaccia pubblica.

Non e necessario importare automaticamente ogni classe nei file `__init__.py`. File vuoti sono sufficienti quando non serve esporre un'API di package.

### `locales/`

Contiene i cataloghi di traduzione:

```json
{
  "entity.not_found": "Entita non trovata",
  "entity.created": "Entita creata"
}
```

I file JSON devono usare le stesse chiavi in tutte le lingue. Il codice dovrebbe:

- validare la lingua richiesta;
- usare una lingua di fallback;
- caricare i cataloghi una sola volta o tramite cache;
- separare i messaggi destinati all'utente dai dettagli tecnici dei log.

Se la localizzazione viene realmente usata, serve anche un modulo responsabile del caricamento, per esempio `locales/translator.py` oppure `services/translation_service.py`.

### `test/entity.http`

Un file `.http` contiene richieste eseguibili da strumenti come REST Client o dagli IDE compatibili:

```http
### Elenca le entita
GET http://localhost:8000/api/entities
Accept: application/json

### Crea un'entita
POST http://localhost:8000/api/entities
Content-Type: application/json

{
  "name": "Example"
}
```

Questo e utile per esplorazione e verifiche manuali, ma non sostituisce una suite automatica. La directory `test` puo quindi essere rinominata `http/` o `requests/` per evitare ambiguita.

I test automatici dovrebbero essere aggiunti separatamente:

```text
tests/
|-- unit/
|   `-- test_entity_service.py
|-- integration/
|   `-- test_entity_repository.py
`-- api/
    `-- test_entity_routes.py
```

- I test unitari verificano il service usando repository finti.
- I test di integrazione verificano query, transazioni e schema.
- I test API verificano routing, validazione e codici HTTP.

### `schema.sql`

Descrive lo schema iniziale del database:

```sql
CREATE TABLE entities (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
```

E sufficiente per un database semplice o un prototipo. Quando lo schema evolve nel tempo, un unico file non registra in modo affidabile gli aggiornamenti gia applicati: in quel caso sono preferibili migrazioni versionate.

Per rendere piu chiara la responsabilita, il file puo essere spostato in `db/schema.sql`.

### `build_portable.py`

E uno script di distribuzione specifico del progetto. Puo:

- creare un archivio;
- includere file statici e schema;
- escludere cache, test e segreti;
- generare una cartella pronta per la distribuzione;
- richiamare uno strumento di packaging.

Lo script non dovrebbe contenere credenziali o modificare i sorgenti. Il risultato generato deve essere escluso da Git.

Se il progetto non richiede una distribuzione portabile, il file puo essere rimosso.

### `requirements.txt`

Elenca le dipendenze installabili:

```text
fastapi
uvicorn
pydantic
```

Per un'applicazione distribuita, le versioni devono essere controllate e aggiornate intenzionalmente. Le dipendenze usate soltanto per test, lint e sviluppo possono essere separate da quelle necessarie in produzione.

Un progetto moderno puo usare `pyproject.toml` come fonte principale dei metadati e delle dipendenze. `requirements.txt` rimane comunque valido quando il flusso di installazione scelto lo prevede.

## Regole delle dipendenze

Le dipendenze devono procedere dall'esterno verso il caso d'uso e poi verso l'infrastruttura:

```text
routes -> validators
routes -> services
services -> repositories
repositories -> db
main -> tutti i componenti necessari alla composizione
```

Da evitare:

```text
repositories -> routes
services -> FastAPI response objects
db -> services
validators -> repositories
```

Una dipendenza circolare indica spesso che le responsabilita non sono state separate correttamente.

## Gestione delle transazioni

Quando un caso d'uso esegue piu scritture, il commit non dovrebbe avvenire autonomamente dentro ogni metodo del repository. Il livello che coordina l'intera operazione deve poter:

1. aprire una transazione;
2. eseguire tutte le operazioni;
3. eseguire il commit soltanto al termine;
4. effettuare il rollback in caso di errore.

Questo evita stati parziali quando una delle operazioni fallisce.

## Gestione degli errori

Conviene distinguere:

- errori di validazione dell'input;
- errori applicativi previsti, come risorsa assente o conflitto;
- errori infrastrutturali, come database non raggiungibile;
- errori inattesi di programmazione.

Le route traducono soltanto gli errori previsti in risposte HTTP. Gli errori inattesi devono essere registrati lato server senza esporre stack trace, query o credenziali al client.

## Sicurezza minima

- Validare tutti i dati provenienti dal client.
- Usare query parametrizzate.
- Non salvare segreti nel repository Git.
- Limitare dimensione e tipo dei payload.
- Non restituire dettagli interni negli errori HTTP.
- Configurare CORS in base ai client realmente autorizzati.
- Applicare autenticazione e autorizzazione prima delle operazioni protette.
- Registrare eventi utili senza includere password, token o dati sensibili.

## Evoluzione consigliata

La struttura originale e una base valida. Con la crescita del progetto possono diventare utili:

```text
backend/
|-- models/          # Oggetti del dominio o modelli persistenti
|-- schemas/         # Contratti di richiesta e risposta
|-- middleware/      # Comportamenti trasversali HTTP
|-- migrations/      # Evoluzione versionata del database
|-- tests/           # Test automatici
|-- pyproject.toml   # Metadati e configurazione degli strumenti
`-- .env.example     # Variabili richieste senza valori segreti
```

Non devono essere aggiunte directory vuote in previsione di necessita future. Ogni cartella dovrebbe esistere soltanto quando possiede una responsabilita concreta.

Se il numero di entita cresce molto, la suddivisione per livello:

```text
routes/
services/
repositories/
```

puo disperdere i file relativi alla stessa funzionalita. Una possibile evoluzione e l'organizzazione per feature:

```text
features/
|-- entities/
|   |-- routes.py
|   |-- schemas.py
|   |-- service.py
|   `-- repository.py
`-- users/
    |-- routes.py
    |-- schemas.py
    |-- service.py
    `-- repository.py
```

## Errori comuni

- Scrivere query SQL direttamente nelle route.
- Restituire risposte HTTP dal service.
- Usare una connessione globale condivisa tra richieste concorrenti.
- Eseguire `commit` in ogni metodo del repository.
- Mescolare validazione sintattica e regole di business.
- Catturare ogni eccezione con `except Exception` senza log o distinzione.
- Considerare i file `.http` come test automatici.
- Caricare i file di localizzazione a ogni richiesta.
- Versionare `.env`, database locali, log o artefatti generati.
- Creare repository e service che si limitano a inoltrare ogni chiamata senza aggiungere una responsabilita reale.

## Checklist

- [ ] `main.py` si occupa solo della composizione e dell'avvio.
- [ ] Le route non contengono query o regole di business.
- [ ] I service non dipendono da oggetti HTTP.
- [ ] I repository usano query parametrizzate.
- [ ] Connessioni e transazioni vengono sempre chiuse correttamente.
- [ ] La configurazione obbligatoria viene validata all'avvio.
- [ ] I segreti arrivano dall'ambiente e non da file versionati.
- [ ] I cataloghi di localizzazione hanno chiavi coerenti.
- [ ] I file `.http` sono distinti dai test automatici.
- [ ] Sono presenti test unitari, di integrazione e API proporzionati al rischio.
- [ ] Le dipendenze sono controllate e riproducibili.
- [ ] Cache, log, database locali e build sono esclusi da Git.

## Collegamenti

- [[Programmazione/Strutture di Progetto/Pagine/PHP - Applicazione web tradizionale]]
- [[Programmazione/Python/Pagine/Creazione di Package]]
- [[Programmazione/Python/Pagine/Configurazione e Variabili d Ambiente]]
- [[Programmazione/Python/Pagine/Pydantic]]
- [[Programmazione/Python/Pagine/FastAPI]]
- [[Programmazione/Clean Code/Pagine/Controller sottili]]
- [[Programmazione/Clean Code/Pagine/Service layer]]
- [[Programmazione/Clean Code/Pagine/Repository pattern]]
- [[Programmazione/Clean Code/Pagine/Validazione input API]]
- [[Programmazione/Clean Code/Pagine/Test di integrazione]]

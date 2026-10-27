---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - python
  - web
  - api
aliases:
  - FastAPI
prerequisites: []
related: []
title: FastAPI
---

# FastAPI

## Sintesi

FastAPI costruisce API **ASGI** usando Starlette per il livello web e Pydantic per validazione/serializzazione. Le dichiarazioni degli endpoint producono anche uno schema OpenAPI.

Baseline: **CPython 3.12.10, FastAPI 0.162.0, Pydantic 2.14.1, Starlette 1.10.0**. Il demo calcola un preventivo da un listino fittizio: non effettua ordini, pagamenti, autenticazione o scritture su database.

## Quando usarlo

- API JSON con contratti di input/output espliciti.
- Servizi con dipendenze sostituibili nei test.
- Integrazioni I/O asincrone, quando anche le librerie chiamate sono async.

Per admin, form e applicazioni server-rendered integrate valuta Django. Per servizi WSGI o controllo piu manuale valuta Flask/Starlette. Type hints e OpenAPI non certificano da soli il dominio o la sicurezza.

## Come funziona

FastAPI individua path, query, header, body e dipendenze dalle dichiarazioni dell'endpoint. Prima della chiamata valida i dati dichiarati; dopo la chiamata applica il modello di risposta, quando configurato.

- **Input**: i type hints diventano regole runtime tramite il framework; una normale funzione Python annotata non fa lo stesso.
- **Conversione**: Pydantic puo convertire valori. Strict mode e vincoli devono essere scelti, non presunti.
- **Output**: response_model valida/serializza e filtra i campi; non sostituisce autorizzazione o selezione dei dati nel database.
- **Errori**: input invalido produce normalmente 422; un output incompatibile con il contratto e invece un bug del server, non un errore del client.
- **Documentazione**: OpenAPI descrive cio che dichiari. Non prova che ogni errore, effetto collaterale o comportamento reale sia rappresentato.

Restituire direttamente una Response evita la normale conversione/validazione del suo contenuto tramite response_model. Non usarlo come scorciatoia inconsapevole.

## API / Sintassi

| Dichiarazione                                | Significato                                    |
| -------------------------------------------- | ---------------------------------------------- |
| `APIRouter(prefix="/api")`                   | Gruppo di route da includere nell'app          |
| `Path(...)` / `Query(...)`                   | Origine e vincoli del parametro                |
| `BaseModel` come parametro                   | Modello del corpo della richiesta              |
| `Annotated[Service, Depends(get_service)]`   | Dipendenza risolta dal framework               |
| `HTTPException(status_code=404, detail=...)` | Esito HTTP previsto, da sollevare              |
| `response_model=QuoteOut`                    | Contratto della risposta di successo           |
| `app.dependency_overrides`                   | Sostituzioni per test; ripristinale dopo l'uso |

`Depends` non autentica l'utente per il solo fatto di esistere. Una dependency che restituisce sempre {"id": 1} e una fixture, non una verifica di credenziali.

## Esempio pratico

Directory dedicata, virtualenv attivo:

```powershell
python -m pip install "fastapi==0.162.0" "pydantic==2.14.1" "starlette==1.10.0" "uvicorn==0.54.0" "httpx2==2.16.0"
```

Il client di test della baseline Starlette usa httpx2. Non confonderlo con il pacchetto httpx delle applicazioni precedenti.

### fastapi_app.py

```python
from typing import Annotated

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Path
from pydantic import BaseModel, ConfigDict, Field

SKU_PATTERN = r"^[A-Z0-9-]+$"


class QuoteIn(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    sku: str = Field(min_length=1, max_length=32, pattern=SKU_PATTERN)
    quantity: int = Field(ge=1, le=100)


class QuoteOut(BaseModel):
    sku: str
    quantity: int
    total_cents: int


class PriceOut(BaseModel):
    sku: str
    unit_cents: int


class QuoteService:
    def unit_price(self, sku):
        if sku != "A-1":
            raise KeyError(sku)
        return 1250

    def quote(self, sku, quantity):
        return {
            "sku": sku,
            "quantity": quantity,
            "total_cents": self.unit_price(sku) * quantity,
            "internal_note": "demo-only",
        }


def get_service():
    return QuoteService()


Service = Annotated[QuoteService, Depends(get_service)]
router = APIRouter(prefix="/api")


@router.get("/prices/{sku}", response_model=PriceOut)
def price(
    sku: Annotated[str, Path(min_length=1, max_length=32, pattern=SKU_PATTERN)],
    service: Service,
):
    try:
        value = service.unit_price(sku)
    except KeyError:
        raise HTTPException(404, "unknown sku") from None
    return {"sku": sku, "unit_cents": value}


@router.post("/quotes", response_model=QuoteOut, status_code=200)
def quote(payload: QuoteIn, service: Service):
    try:
        return service.quote(payload.sku, payload.quantity)
    except KeyError:
        raise HTTPException(404, "unknown sku") from None


def create_app():
    app = FastAPI(title="Quote demo")
    app.include_router(router)
    return app


app = create_app()
```

Il valore e in centesimi interi e il listino e fisso. Non e un modello monetario completo: valuta, arrotondamenti, sconti e tasse richiedono regole dedicate.

Strict mode rifiuta quantity come stringa o bool; extra="forbid" rifiuta campi non dichiarati. Questo non impone un limite al corpo HTTP prima del parsing: serve anche una politica di dimensioni/timeout nel server o middleware.

Il POST risponde 200 perche calcola un risultato senza creare una risorsa. Se un'API crea davvero una risorsa, progetta persistenza, transazione, identificatore e 201/Location. Il campo internal_note dimostra il filtro dell'output, non una strategia generale per proteggere segreti.

### verify_fastapi.py

```python
from fastapi.testclient import TestClient
from fastapi_app import create_app, get_service

app = create_app()
with TestClient(app) as client:
    response = client.post("/api/quotes", json={"sku": "A-1", "quantity": 2})
    assert response.status_code == 200
    assert response.json() == {"sku": "A-1", "quantity": 2, "total_cents": 2500}
    assert client.post(
        "/api/quotes", json={"sku": "A-1", "quantity": True}
    ).status_code == 422
    assert client.get("/api/prices/UNKNOWN").status_code == 404
    assert "/api/quotes" in client.get("/openapi.json").json()["paths"]

    class FixedService:
        def quote(self, sku, quantity):
            return {"sku": sku, "quantity": quantity, "total_cents": 7}

    app.dependency_overrides[get_service] = FixedService
    try:
        assert client.post(
            "/api/quotes", json={"sku": "A-1", "quantity": 2}
        ).json()["total_cents"] == 7
    finally:
        app.dependency_overrides.clear()
print("FastAPI demo ok")
```

```powershell
python verify_fastapi.py
```

Avvio locale, scegliendo una porta libera:

```powershell
python -m uvicorn fastapi_app:app --host 127.0.0.1 --port 8001
```

Lo schema e disponibile su /openapi.json; /docs usa una UI che puo caricare asset esterni. I test dello schema non equivalgono a una verifica della UI offline.

## Varianti

### Sync, async e risorse

FastAPI esegue endpoint e dependency sync nel thread pool. Le normali funzioni chiamate dal tuo codice non vengono spostate automaticamente: requests o una query bloccante dentro async def bloccano comunque il loop.

Usa async def con client realmente awaitable. Il lavoro CPU-bound richiede una strategia diversa, non soltanto aggiungere async.

Per un client condiviso dal worker usa lifespan; per una sessione legata alla richiesta una dependency con yield puo garantirne il rilascio. La chiusura non equivale al commit della transazione.

Nella versione indicata una dependency con yield ha normalmente scope request e termina dopo l'invio della risposta; scope="function" la chiude dopo la funzione endpoint e prima dell'invio. Lo streaming puo aver bisogno della risorsa piu a lungo. Non sopprimere errori nel cleanup e non rimandare un commit fallibile a dopo una risposta di successo.

### Contratti e organizzazione

- APIRouter organizza route, non introduce isolamento dei dati.
- Input model, output model e ORM possono avere responsabilita diverse.
- EmailStr richiede la dipendenza opzionale email-validator; non e inclusa nel demo.
- BackgroundTasks usa lavoro in-process, non una coda durabile.
- CORS, autenticazione, autorizzazione sugli oggetti e rate limit sono strati separati.
- I dettagli predefiniti degli errori possono contenere input: valuta redazione e logging prima di trattare credenziali o dati sensibili.

## Errori comuni

- Registrare due volte lo stesso metodo/percorso credendo che il secondo esempio sostituisca il primo.
- Presentare un utente fisso come dependency di autenticazione.
- Assumere che int rifiuti ogni stringa o che i campi extra siano vietati per default.
- Restituire direttamente JSONResponse e aspettarsi il filtro del modello.
- Condividere una Session ORM tra richieste o task.
- Restituire successo prima di conoscere l'esito del commit.
- Usare 422 per nascondere errori interni di programmazione.

## Checklist

- Input, output e status descrivono effetti reali?
- Tipi strict, limiti ed extra sono scelti esplicitamente?
- I test coprono payload invalidi e risposte incompatibili?
- Le dependency sostituite vengono ripristinate?
- Sync/async e ciclo di vita delle risorse sono coerenti?
- Sono progettati sicurezza, transazioni e deployment oltre al demo?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Starlette|Starlette]]
- [[Programmazione/Python/Pagine/Pydantic|Pydantic]]
- [[Programmazione/Python/Pagine/Asyncio|Asyncio]]
- [[Programmazione/Python/Pagine/HTTPX e requests|HTTPX e requests]]
- [[Programmazione/Python/Pagine/SQLAlchemy|SQLAlchemy]]
- [[Programmazione/Python/Pagine/Testing|Testing]]

## Fonti

- [FastAPI: body e modelli](https://fastapi.tiangolo.com/tutorial/body/).
- [Contratto e filtro delle risposte](https://fastapi.tiangolo.com/tutorial/response-model/).
- [Sync/async e dependency](https://fastapi.tiangolo.com/async/).
- [Dependency con yield e scope](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-with-yield/).
- [Override nei test](https://fastapi.tiangolo.com/advanced/testing-dependencies/).
- [APIRouter e organizzazione in moduli](https://fastapi.tiangolo.com/tutorial/bigger-applications/).
- [Pydantic: strict mode](https://docs.pydantic.dev/latest/concepts/strict_mode/).
- [Starlette: TestClient](https://starlette.dev/testclient/), [Uvicorn](https://uvicorn.dev/settings/).

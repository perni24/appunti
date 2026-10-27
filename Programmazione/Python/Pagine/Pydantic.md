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
  - validazione
  - typing
aliases:
  - Pydantic
prerequisites: []
related: []
title: Pydantic
---

# Pydantic

## Sintesi

Pydantic costruisce dati validati a partire da input esterni usando annotazioni Python. I type hints descrivono un contratto; Pydantic lo controlla **a runtime**, con conversioni configurabili e errori strutturati.

Baseline: CPython 3.12.10, Pydantic **2.14.1**, email-validator **2.3.0**. Gli esempi usano le API v2, non `parse_obj` e `dict` del vecchio stile v1.

## Quando usarlo

- Payload API, messaggi, file di configurazione e DTO ai confini del sistema.
- Risposte con uno schema pubblico distinto da input e persistenza.
- Dati annidati che richiedono errori con un percorso preciso.

Non e un sostituto di autorizzazione, vincoli SQL, verifica dell'identita o type checker. Un'email formalmente valida non dimostra che esista o che appartenga all'utente.

## Come funziona

### Parsing, conversione e rigidita

In modalita predefinita molti tipi ammettono conversioni: una stringa numerica puo diventare un intero. Per un contratto rigoroso usa `strict=True` sul modello, sul campo o nella chiamata di validazione.

Strict non significa «stesso comportamento per qualunque sorgente»: JSON non ha oggetti `date` o UUID nativi. Alcuni tipi ammettono la loro rappresentazione testuale in JSON anche in strict mode, ma non in un dizionario Python strict.

### strict_demo.py

```python
from datetime import date
from pydantic import BaseModel, TypeAdapter, ValidationError


class LooseUser(BaseModel):
    age: int


assert LooseUser(age="42").age == 42
try:
    LooseUser.model_validate({"age": "42"}, strict=True)
except ValidationError:
    pass
else:
    raise AssertionError("Conversione inattesa in strict mode")

adapter = TypeAdapter(date)
assert adapter.validate_json('"2026-01-02"', strict=True) == date(2026, 1, 2)
try:
    adapter.validate_python("2026-01-02", strict=True)
except ValidationError:
    pass
else:
    raise AssertionError("Atteso un oggetto date")
print("Conversioni Python/JSON verificate")
```

Il modello, non il solo `json.loads`, controlla il significato dei campi.

## API / Sintassi

| API v2                            | Uso                                                      |
| --------------------------------- | -------------------------------------------------------- |
| `Model.model_validate(value)`     | Valida un oggetto Python                                 |
| `Model.model_validate_json(text)` | Parsing JSON e validazione                               |
| `model_dump()`                    | Dizionario; puo contenere oggetti Python non JSON        |
| `model_dump(mode="json")`         | Struttura con rappresentazioni compatibili con JSON      |
| `model_dump_json()`               | Stringa JSON, non dizionario                             |
| `model_json_schema()`             | Schema del contratto; non contiene ogni regola custom    |
| `TypeAdapter(list[Model])`        | Valida una struttura senza creare un modello contenitore |

I campi extra sono ignorati per default: `extra="forbid"` rende visibili errori di battitura e campi inattesi. I default non sono normalmente validati: abilita `validate_default=True` quando devono attraversare gli stessi controlli.

`str | None` accetta `None`, ma **non rende il campo omissibile** senza un default. Per un campo opzionale anche nella presenza usa `str | None = None`.

## Esempio pratico

Installa l'extra richiesto da `EmailStr` in un ambiente virtuale:

```bash
python -m pip install "pydantic[email]==2.14.1" "email-validator==2.3.0"
```

### user_models.py

Modello di input separato dall'output pubblico. Il demo non crea account, non invia email e non fa query DNS per verificarne la consegna.

```python
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class Address(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    city: str = Field(min_length=1, max_length=80)


class CreateUserRequest(BaseModel):
    model_config = ConfigDict(
        strict=True,
        extra="forbid",
        validate_default=True,
        validate_assignment=True,
    )

    email: EmailStr
    display_name: str = Field(min_length=1, max_length=100)
    age: int = Field(ge=0, le=130)
    address: Address | None = None
    labels: list[str] = Field(default_factory=list)

    @field_validator("display_name", mode="before")
    @classmethod
    def trim_name(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value


class UserResponse(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")

    id: int = Field(gt=0)
    display_name: str


def public_user(user_id: int, user: CreateUserRequest) -> UserResponse:
    return UserResponse(id=user_id, display_name=user.display_name)
```

Il validator `before` prepara il valore grezzo; i vincoli del campo si applicano dopo, quindi una stringa di soli spazi viene rifiutata. Non convertiamo numeri in nomi con `str(value)`. I validator `after` ricevono invece il valore gia validato del campo.

Per una regola fra piu campi usa `model_validator` e restituisci il modello; solleva `ValueError` per un errore di input. Evita controlli con `assert` nei validator: Python ottimizzato puo rimuoverli. Query, chiamate HTTP e controlli di autorizzazione restano nel servizio applicativo.

### verify_models.py

```python
from pydantic import TypeAdapter, ValidationError
from user_models import CreateUserRequest, UserResponse, public_user

payload = {
    "email": "alice@example.com",
    "display_name": "  Alice  ",
    "age": 42,
    "address": {"city": "Roma"},
}
user = CreateUserRequest.model_validate(payload)
assert user.display_name == "Alice"
assert user.address.city == "Roma"

output = public_user(1, user)
assert output.model_dump() == {"id": 1, "display_name": "Alice"}
assert "email" not in output.model_dump()
assert UserResponse.model_validate_json(output.model_dump_json()) == output

for change in [
    {"age": "42"},
    {"age": True},
    {"age": -1},
    {"display_name": "   "},
    {"email": "non-email"},
    {"admin": True},
    {"address": {"city": 123}},
]:
    try:
        CreateUserRequest.model_validate(payload | change)
    except ValidationError as error:
        safe_errors = [
            {"loc": item["loc"], "type": item["type"]}
            for item in error.errors(include_input=False, include_context=False)
        ]
        assert safe_errors
    else:
        raise AssertionError("Payload non valido accettato")

users = TypeAdapter(list[CreateUserRequest]).validate_python([payload])
assert len(users) == 1
print("Input, output e casi negativi verificati")
```

```bash
python verify_models.py
```

```bash
python strict_demo.py
```

Il filtro dell'output e qui **esplicito**: costruiamo solo i campi pubblici. Un `model_dump()` sull'input non sa quali informazioni il servizio dovrebbe tenere private.

### defaults_demo.py

```python
from pydantic import BaseModel, ConfigDict, Field, ValidationError


class Settings(BaseModel):
    model_config = ConfigDict(validate_default=True)

    debug: bool = False
    port: int = Field(default=8000, ge=1, le=65535)


class InvalidSettings(Settings):
    port: int = Field(default=0, ge=1, le=65535)


assert Settings().port == 8000
try:
    InvalidSettings()
except ValidationError:
    pass
else:
    raise AssertionError("Default non valido accettato")
print("Default verificati")
```

```bash
python defaults_demo.py
```

Questa classe `Settings` e un semplice `BaseModel`: **non legge automaticamente ambiente o .env**. Per quel comportamento il pacchetto separato e `pydantic-settings`; la nota sulla configurazione spiega priorita delle fonti e segreti.

## Varianti

### Mutazioni e oggetti gia costruiti

`validate_assignment=True` controlla le assegnazioni agli attributi, non tutte le mutazioni interne: `user.labels.append(123)` puo introdurre un elemento non valido senza passare dai validator. `frozen=True` impedisce assegnazioni al modello, ma non rende profondamente immutabile una lista al suo interno.

`model_validate` puo riusare istanze gia esistenti senza rivalidarle, secondo `revalidate_instances`. `model_construct` salta la validazione; `model_copy(update=...)` non valida gli aggiornamenti. Non usarli per «accelerare» l'acquisizione di input non fidato.

### Persistenza e serializzazione

- `from_attributes=True` permette di leggere attributi di oggetti, anche ORM. Questo puo attivare query lazy: prepara i dati mentre la sessione e valida e controlla le query.
- Per date, UUID e altri tipi, scegli consapevolmente output Python o JSON.
- `exclude_unset=True` distingue i campi forniti da quelli lasciati al default; non sostituisce la semantica di un PATCH e non equivale a `exclude_none=True`.
- `SecretStr` riduce esposizioni accidentali in rappresentazioni e JSON, ma non cifra il segreto ne lo elimina dalla memoria.
- Le regole custom fra campi non sono tutte esprimibili in JSON Schema: client e documentazione non sostituiscono la validazione server.

## Errori comuni

- `EmailStr` senza extra email: installazione incompleta.
- Accettare coercizioni senza un contratto esplicito: prova stringhe, booleani e numeri ai limiti.
- Stampare `str(error)` o tutto `errors()` nei log: puo includere input e contesto sensibili. Il demo espone solo posizione e tipo.
- Confondere validazione e sanificazione HTML/SQL: usa escaping e query parametrizzate nei rispettivi livelli.
- Riutilizzare il modello persistente come risposta pubblica: rischi esposizioni di campi interni.
- Presumere che un modello resti valido dopo qualsiasi mutazione.

## Checklist

- Input, output e configurazione sono distinti?
- Strict, campi extra, default e valori null hanno una policy?
- Errori annidati e dati sensibili sono gestiti?
- I test comprendono input negativi e mutazioni?
- Vincoli persistenti e autorizzazione sono verificati separatamente?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Type Hinting|Type Hinting]]
- [[Programmazione/Python/Pagine/FastAPI|FastAPI]]
- [[Programmazione/Python/Pagine/SQLAlchemy|SQLAlchemy]]
- [[Programmazione/Python/Pagine/Configurazione e Variabili d Ambiente|Configurazione e Variabili d Ambiente]]
- [[Programmazione/Python/Pagine/Error Handling|Error Handling]]

## Fonti

- [Pydantic: modelli e istanze](https://docs.pydantic.dev/latest/concepts/models/).
- [Strict mode e differenze Python/JSON](https://docs.pydantic.dev/latest/concepts/strict_mode/).
- [Campi e validazione dei default](https://docs.pydantic.dev/latest/concepts/fields/).
- [Validator](https://docs.pydantic.dev/latest/concepts/validators/).
- [Serializzazione](https://docs.pydantic.dev/latest/concepts/serialization/).
- [EmailStr](https://docs.pydantic.dev/latest/api/networks/#pydantic.networks.EmailStr).
- [Gestione degli errori](https://docs.pydantic.dev/latest/errors/errors/).
- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/).

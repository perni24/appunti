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
  - database
  - orm
aliases:
  - SQLAlchemy
prerequisites: []
related: []
title: SQLAlchemy
---

# SQLAlchemy

## Sintesi

SQLAlchemy offre **Core**, per espressioni SQL e connessioni, e **ORM**, per associare oggetti Python a tabelle e gestirne le modifiche. L'ORM non elimina SQL, vincoli o transazioni: organizza il lavoro applicativo sopra questi meccanismi.

Baseline degli esempi: CPython 3.12.10, SQLAlchemy **2.0.55**, SQLite locale; variante async con aiosqlite **0.22.1**. Sono versioni di verifica, non una dichiarazione dell'ultima release. Le API mostrate sono nello stile 2.0.

## Quando usarlo

- Applicazioni con query, relazioni e transazioni piu articolate di un piccolo script.
- Separazione tra servizio applicativo e accesso ai dati.
- Progetti che richiedono un driver SQL diverso mantenendo parte delle API Python.

Per pochi comandi su SQLite puo bastare la standard library. Cambiare URL non rende automaticamente portabili tipi, SQL, isolamento e migrazioni.

## Come funziona

### Engine, sessione e transazione

L'engine gestisce dialect, driver e pool: normalmente vive quanto l'applicazione. La sessione ORM tiene traccia degli oggetti e delle modifiche di un'unita di lavoro; non e un pool e non va condivisa contemporaneamente fra thread o task.

| Operazione                             | Effetto                                                              |
| -------------------------------------- | -------------------------------------------------------------------- |
| `Session(engine)` come context manager | Chiude la sessione in uscita; **non** fa commit automatico           |
| `session.begin()` come context manager | Commit se il blocco riesce, rollback se un'eccezione ne esce         |
| `add()`                                | Registra un oggetto; non garantisce che l'INSERT sia gia partito     |
| `flush()`                              | Invia le modifiche nella transazione; non le rende ancora confermate |
| `commit()`                             | Esegue anche il flush e conferma la transazione                      |
| `rollback()`                           | Annulla la transazione corrente, non un commit precedente            |

Una query puo avviare una transazione implicitamente (**autobegin**) e provocare autoflush. Apri quindi il blocco `begin()` prima della query, non dopo. Dopo un flush fallito, una sessione gestita manualmente richiede rollback prima del riuso; con il blocco transazionale lascia propagare l'errore fuori dal blocco e gestiscilo all'esterno.

### Oggetti e risultati

`select(User)` costruisce una query, `session.scalars(...)` la esegue e restituisce oggetti del modello. `scalar_one_or_none()` richiede zero o una riga: non nasconde duplicati come farebbe `first()`. Per una chiave primaria usa `session.get(User, id)`.

L'identity map riusa l'istanza associata a una chiave primaria nella stessa sessione: non e una cache universale delle query. Dopo commit gli attributi sono normalmente scaduti; dopo chiusura quelli non caricati o scaduti non possono fare lazy loading. Crea DTO o valori semplici prima di chiudere la sessione.

## API / Sintassi

In un ambiente virtuale dedicato:

```bash
python -m pip install "SQLAlchemy[asyncio]==2.0.55" "aiosqlite==0.22.1"
```

Il modello dichiara i vincoli persistenti; non sostituisce la validazione del payload. `String(254)` non e un validatore di email e SQLite non impone la lunghezza come alcuni altri database.

### db_demo.py

Script completo, con database **in memoria** distinto a ogni esecuzione. Non modifica file o database esistenti.

```python
from sqlalchemy import String, create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)


class UserRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return self.session.execute(statement).scalar_one_or_none()

    def create(self, email: str) -> User:
        user = User(email=email)
        self.session.add(user)
        return user


def create_user(engine, email: str) -> dict:
    with Session(engine) as session:
        with session.begin():
            user = UserRepository(session).create(email)
            session.flush()
            result = {"id": user.id, "email": user.email}
        return result  # Il commit e gia riuscito.


def list_users(engine) -> list[dict]:
    with Session(engine) as session:
        users = session.scalars(select(User).order_by(User.id)).all()
        return [{"id": user.id, "email": user.email} for user in users]


def main():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    try:
        Base.metadata.create_all(engine)
        first = create_user(engine, "alice@example.com")
        assert first["id"] == 1
        try:
            create_user(engine, "alice@example.com")
        except IntegrityError:
            print("Email duplicata: inserimento annullato")
        else:
            raise AssertionError("Il vincolo UNIQUE non e stato applicato")
        assert list_users(engine) == [first]
        print(list_users(engine))
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
```

Il repository non chiama commit: il servizio puo raggruppare piu modifiche nella stessa transazione. Il demo tratta il duplicato noto; in un'applicazione **non classificare ogni IntegrityError come email duplicata**: puo indicare altri vincoli e va interpretato secondo il driver.

## Esempio pratico

Esegui il file precedente:

```bash
python db_demo.py
```

Il risultato contiene un solo utente, anche dopo l'inserimento duplicato. Non c'e una chiamata a un server esterno.

### verify_transactions.py

Nella stessa directory di `db_demo.py`:

```python
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from db_demo import Base, User, list_users

engine = create_engine("sqlite+pysqlite:///:memory:")
try:
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        try:
            with session.begin():
                session.add(User(email="rollback@example.com"))
                session.flush()
                assert session.scalar(select(User.id)) == 1
                raise RuntimeError("Fallimento del servizio dopo il flush")
        except RuntimeError:
            pass
    assert list_users(engine) == []

    with engine.begin() as connection:
        connection.execute(
            User.__table__.insert(),
            {"email": "core@example.com"},
        )
    assert list_users(engine)[0]["email"] == "core@example.com"
    print("Rollback ORM e commit Core verificati")
finally:
    engine.dispose()
```

```bash
python verify_transactions.py
```

L'inserimento Core usa parametri, non interpolazione di input dentro SQL. Un rollback non annulla email inviate, file scritti o chiamate HTTP eseguite nel blocco: per coordinare effetti esterni serve una strategia applicativa separata.

## Varianti

### db_async.py

Riusa i modelli di `db_demo.py`. Ogni task concorrente deve avere una propria `AsyncSession`; non passare la stessa sessione a piu operazioni in `gather()`.

```python
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from db_demo import Base, User


async def main():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
        async with sessions.begin() as session:
            user = User(email="async@example.com")
            session.add(user)
        async with sessions() as session:
            emails = list(await session.scalars(select(User.email)))
            assert emails == ["async@example.com"]
            print(emails)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
```

```bash
python db_async.py
```

`expire_on_commit=False` evita la scadenza automatica, non mantiene i dati aggiornati rispetto ad altri processi. L'accesso a relazioni lazy puo richiedere I/O non compatibile con un semplice accesso ad attributo in async: pianifica eager loading o API esplicitamente awaitable.

### Relazioni, portabilita e migrazioni

- Il problema **N+1** nasce quando una query sui genitori ne provoca una per ogni relazione acceduta. `selectinload(User.addresses)` e un esempio di loader **solo se addresses e una relazione dichiarata**; non e presente nel demo. Carica in anticipo cio che serve e misura le query reali.
- `joinedload` su collezioni puo richiedere `unique()` sul risultato ORM. Una JOIN esplicita per filtrare e una strategia di caricamento non sono la stessa operazione.
- `create_all()` crea le tabelle mancanti: **non aggiorna una tabella esistente** alla nuova definizione. Per evoluzione dello schema usa Alembic.
- PostgreSQL richiede driver e configurazione propri. Testa sul database target vincoli, isolamento, concorrenza e piano delle query; i test SQLite non li sostituiscono.

## Errori comuni

- Sessione globale o passata a task concorrenti: crea una sessione per unita di lavoro.
- Eccezione assorbita dentro `begin()`: il blocco potrebbe confermare altre modifiche; gestisci fuori dal confine transazionale.
- Risposta HTTP di successo inviata prima del commit: un errore tardivo lascia il client con un esito falso.
- Oggetti ORM restituiti dopo chiusura, poi serializzati tramite lazy loading: prepara l'output mentre la sessione e valida.
- `all()` su milioni di righe: usa paginazione o strategie di lettura adatte al driver.
- SQL costruito con f-string da input: usa espressioni o parametri bind.

## Checklist

- Sessione, transazione ed engine hanno durate distinte?
- I vincoli sono verificati nel database oltre che nell'input?
- Il commit avviene prima di comunicare successo?
- Le query, comprese quelle implicite, sono misurate?
- Migrazioni e test usano anche il database di produzione?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/Alembic|Alembic]]
- [[Programmazione/Python/Pagine/SQLite con sqlite3|SQLite con sqlite3]]
- [[Programmazione/Python/Pagine/Pydantic|Pydantic]]
- [[Programmazione/PostgreSQL/Pagine/ORM|ORM]]
- [[Programmazione/PostgreSQL/Indice PostgreSQL|PostgreSQL]]

## Fonti

- [SQLAlchemy 2.0: Session basics](https://docs.sqlalchemy.org/en/20/orm/session_basics.html).
- [Query ORM e risultati](https://docs.sqlalchemy.org/en/20/orm/queryguide/select.html).
- [Transazioni Core e parametri](https://docs.sqlalchemy.org/en/20/tutorial/dbapi_transactions.html).
- [Relationship loading](https://docs.sqlalchemy.org/en/20/orm/queryguide/relationships.html).
- [Estensione asyncio](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html).
- [MetaData.create_all](https://docs.sqlalchemy.org/en/20/core/metadata.html#sqlalchemy.schema.MetaData.create_all).

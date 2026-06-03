---
date: 2026-06-03
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [programmazione, python, database, orm]
aliases: [SQLAlchemy]
prerequisites: []
related: []
---

# SQLAlchemy

## Sintesi

SQLAlchemy e una libreria Python per lavorare con database SQL. Offre due livelli principali: SQL Expression Language per costruire query esplicite e ORM per mappare classi Python a tabelle.

E utile quando vuoi usare database relazionali mantenendo controllo su query, transazioni, sessioni e relazioni.

## Quando usarlo

Usa SQLAlchemy quando:

- un'applicazione Python usa database SQL;
- vuoi separare logica applicativa e accesso dati;
- ti serve un ORM maturo;
- vuoi supportare PostgreSQL, SQLite o altri database con una API comune;
- devi gestire sessioni e transazioni in modo esplicito.

Per script piccoli, `sqlite3` o query dirette possono bastare.

## Come funziona

Modello ORM:

```python
from sqlalchemy import String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True)
```

Query:

```python
engine = create_engine("sqlite:///app.db")

with Session(engine) as session:
    statement = select(User).where(User.email == "a@example.com")
    user = session.scalars(statement).first()
```

## API / Sintassi

Creare tabelle:

```python
Base.metadata.create_all(engine)
```

Inserire dati:

```python
with Session(engine) as session:
    user = User(email="a@example.com")
    session.add(user)
    session.commit()
```

Transazione con context manager:

```python
with Session(engine) as session:
    with session.begin():
        session.add(User(email="b@example.com"))
```

Query con `select()`:

```python
statement = select(User).where(User.email.endswith("@example.com"))
users = session.scalars(statement).all()
```

## Esempio pratico

Repository minimale:

```python
class UserRepository:
    def __init__(self, session):
        self.session = session

    def get_by_email(self, email):
        statement = select(User).where(User.email == email)
        return self.session.scalars(statement).first()

    def create(self, email):
        user = User(email=email)
        self.session.add(user)
        return user
```

Uso:

```python
with Session(engine) as session:
    with session.begin():
        repository = UserRepository(session)
        repository.create("luca@example.com")
```

## Varianti

- **SQLAlchemy Core**: query esplicite e tabelle senza ORM completo.
- **SQLAlchemy ORM**: classi, relazioni, sessioni e unit of work.
- **Sync engine**: uso tradizionale sincrono.
- **Async engine**: per applicazioni async con driver compatibili.
- **Alembic**: migrazioni schema, spesso usato insieme a SQLAlchemy.

## Errori comuni

- Tenere sessioni aperte troppo a lungo.
- Confondere oggetti ORM e righe database.
- Fare query dentro loop senza accorgersi del problema N+1.
- Usare `create_all()` come sostituto delle migrazioni in produzione.
- Non gestire transazioni e rollback.
- Nascondere query costose dietro accessi ORM apparentemente innocui.
- Non separare modello di dominio, DTO e modello persistente quando il progetto cresce.

## Checklist

- Le sessioni hanno ciclo di vita chiaro?
- Le transazioni sono esplicite?
- Le query critiche sono controllate?
- Esiste una strategia di migrazione con Alembic?
- Le relazioni evitano N+1?
- Il database target e testato, non solo SQLite locale?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[Alembic]]
- [[SQLite con sqlite3]]
- [[Programmazione/Postgres/Pagine/ORM|ORM]]
- [[Programmazione/Postgres/Indice postgres|Postgres]]

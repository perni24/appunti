---
date: 2026-06-03
area: Programmazione
topic: Python
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - python
  - database
  - migrazioni
aliases:
  - Alembic
  - Migrazioni Alembic
prerequisites: []
related: []
title: Alembic
---

# Alembic

## Obiettivo

Versionare l'evoluzione dello schema SQL insieme al codice: revisioni con dipendenze, applicazione controllata e verifica dello stato. Un downgrade e un'altra migrazione, **non un ripristino automatico dei dati persi**.

Baseline: CPython 3.12.10, Alembic **1.20.1**, SQLAlchemy **2.0.55**, SQLite. La procedura crea soltanto `demo.db` nella directory di laboratorio: non usarla direttamente su un database reale.

## Quando usarlo

- Schema SQLAlchemy che cambia dopo la prima creazione.
- Ambienti e sviluppatori che devono applicare la stessa sequenza di modifiche.
- Deploy che richiedono compatibilita tra vecchio codice, nuovo codice e dati esistenti.

Alembic confronta metadata e database e registra revisioni in `alembic_version`. Non esegue backup, non verifica tutte le regole di business e non rende reversibile qualsiasi operazione.

## Procedura

### 1. Preparare un laboratorio vuoto

Crea una directory dedicata, entra al suo interno e attiva un ambiente virtuale. Esegui tutti i comandi da questa directory, non dalla radice di un'applicazione esistente.

```bash
python -m pip install "SQLAlchemy==2.0.55" "alembic==1.20.1"
```

```bash
python -m alembic init migrations
```

Il comando genera `alembic.ini`, `migrations/env.py`, il template delle revisioni e `migrations/versions/`. Questi file si versionano; database, credenziali e virtualenv no.

### 2. Collegare modelli e configurazione

#### models.py

```python
from sqlalchemy import MetaData, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention={
        "pk": "pk_%(table_name)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
    })


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
```

#### alembic.ini

Nel laboratorio sostituisci il contenuto generato con questa configurazione minima. Il percorso relativo del database dipende dalla directory corrente: controllala prima di ogni comando.

```ini
[alembic]
script_location = %(here)s/migrations
prepend_sys_path = .
path_separator = os
sqlalchemy.url = sqlite:///demo.db
```

Non inserire password reali nel file versionato. Un ambiente reale puo costruire l'URL da configurazione esterna in `env.py`; attenzione all'escaping di `%` in ConfigParser.

#### migrations/env.py

Sostituzione completa del file generato. Non usa `fileConfig` perche l'INI minimo non contiene sezioni di logging. Importa tutti i moduli dei modelli prima di leggere i metadata: una tabella non importata puo apparire erroneamente da eliminare.

```python
from alembic import context
from sqlalchemy import engine_from_config, pool
from models import Base

config = context.config
target_metadata = Base.metadata


def run_migrations_offline():
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    engine = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    try:
        with engine.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                compare_type=True,
                render_as_batch=True,
            )
            with context.begin_transaction():
                context.run_migrations()
    finally:
        engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

`render_as_batch` aiuta l'autogenerazione per SQLite: alcune alterazioni richiedono ricreare una tabella e copiarne i dati. Non e una garanzia di equivalenza su trigger, vincoli o operazioni offline.

### 3. Creare e applicare la prima revisione

Qui la prima revisione e manuale, cosi il suo contenuto e interamente visibile. **Non eseguire create_all prima**: vogliamo che lo schema nasca dalla storia delle migrazioni.

```bash
python -m alembic revision --rev-id 0001 -m "create users"
```

#### migrations/versions/0001_create_users.py

Sostituisci il contenuto del file appena generato:

```python
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(254), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )


def downgrade():
    op.drop_table("users")
```

`revision` identifica il nodo; `down_revision` il predecessore. L'ordine non dipende dal nome del file o dalla sua data.

Prima ispeziona la storia:

```bash
python -m alembic history --verbose
```

Poi applica:

```bash
python -m alembic upgrade head
```

Verifica la revisione del database:

```bash
python -m alembic current
```

Controlla se autogenerate rileva differenze:

```bash
python -m alembic check
```

`check` non prova che i dati siano corretti o che tutte le differenze possibili siano rilevate.

### 4. Evolvere lo schema con autogenerate

Inserisci alcuni dati di prova prima della modifica.

#### seed.py

Script da eseguire **una sola volta**, dopo `upgrade head`. Un secondo avvio incontra intenzionalmente il vincolo UNIQUE.

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from models import User

engine = create_engine("sqlite:///demo.db")
try:
    with Session(engine) as session, session.begin():
        session.add(User(email="alice@example.com"))
finally:
    engine.dispose()
```

```bash
python seed.py
```

Aggiungi questa colonna **dentro la classe User** di `models.py`; il resto del file resta invariato:

```python
    display_name: Mapped[str | None] = mapped_column(String(100))
```

L'annotazione opzionale rende la nuova colonna nullable. Non promettiamo che tutti i record esistenti abbiano gia un nome.

```bash
python -m alembic revision --autogenerate --rev-id 0002 -m "add display name"
```

Prima di applicare, apri la revisione generata e verifica:

- `down_revision = "0001"`.
- `upgrade` aggiunge soltanto `display_name` nullable.
- `downgrade` elimina soltanto quella colonna.
- Nessun drop/recreate inatteso di altre tabelle o vincoli.

```bash
python -m alembic upgrade head
```

```bash
python -m alembic check
```

#### verify_schema.py

```python
from sqlalchemy import create_engine, inspect, select
from sqlalchemy.orm import Session
from models import User

engine = create_engine("sqlite:///demo.db")
try:
    columns = {c["name"]: c for c in inspect(engine).get_columns("users")}
    assert columns["display_name"]["nullable"]
    with Session(engine) as session:
        user = session.scalars(select(User)).one()
        assert user.email == "alice@example.com"
        assert user.display_name is None
    print("Nuova colonna presente; record preesistente conservato")
finally:
    engine.dispose()
```

```bash
python verify_schema.py
```

## Snippet

### Ispezionare senza cambiare lo schema

```bash
python -m alembic heads
```

```bash
python -m alembic history
```

Generare SQL per la sola prima revisione del laboratorio:

```bash
python -m alembic upgrade 0001 --sql
```

`--sql` non applica le operazioni. Revisioni con introspezione, dati letti dal DB o batch con reflection possono richiedere adattamenti per funzionare offline.

### Provare un ritorno indietro

**Solo sulla copia di laboratorio o dopo un piano di ripristino verificato.** Partendo da 0002, il comando seguente elimina `display_name` e tutti i valori salvati in quella colonna:

```bash
python -m alembic downgrade 0001
```

Una successiva `upgrade head` ricrea la colonna, non recupera i valori cancellati. `downgrade base` eseguirebbe anche il drop di `users`: non e una procedura di backup.

Durante il downgrade i modelli Python possono gia aspettarsi lo schema nuovo: non avviare l'applicazione con una combinazione incompatibile.

## Adattamenti comuni

- **Autogenerate** produce una proposta. Rename di tabelle/colonne possono apparire come drop/add; correggili esplicitamente per conservare i dati. Non rileva tutte le modifiche a vincoli, funzioni o trigger.
- **Colonna obbligatoria su tabella popolata**: valuta expand/contract, colonna inizialmente nullable, backfill verificabile, aggiornamento dei lettori/scrittori e solo dopo NOT NULL. Un `default` Python non equivale a un `server_default` SQL e non aggiorna automaticamente i record esistenti.
- **Piu heads**: derivano da revisioni divergenti. Una merge revision puo ricongiungere il grafo, ma non risolve da sola due modifiche incompatibili allo schema.
- **Database esistente**: `stamp` aggiorna il marcatore di revisione senza eseguire DDL. Usalo solo dopo aver provato che lo schema corrisponde; non come rimedio a una migrazione fallita.
- **Migrazioni dati**: usa definizioni stabili o SQL locale alla revisione, non il modello applicativo corrente che cambiera in futuro. Per grandi backfill valuta esecuzioni a lotti e ripresa.
- **Produzione**: un solo esecutore delle migrazioni, backup e restore provati, budget di lock, prova sul DB target. La transazionalita del DDL dipende dal database e dal driver; non presumere un rollback completo su ogni piattaforma.

## Debug rapido

| Sintomo                              | Controllo                                                      |
| ------------------------------------ | -------------------------------------------------------------- |
| Revisione vuota                      | URL corretto, modelli importati, target_metadata valorizzato   |
| Proposta di eliminare tabelle attese | Metadata incompleti o filtri/schema errati; non applicare      |
| Target database is not up to date    | Controlla current/history prima di generare altre revisioni    |
| Multiple heads                       | Esamina il grafo e decidi la strategia di merge                |
| NOT NULL fallisce                    | Cerca NULL preesistenti e pianifica il backfill                |
| Schema inatteso dopo errore          | Ispeziona schema reale e marcatore; non usare stamp alla cieca |

## Checklist finale

- Database target identificato e backup ripristinabile?
- File di migrazione revisionato, senza drop involontari?
- Test da database vuoto e da copia della versione precedente con dati?
- Limiti del downgrade dichiarati?
- Codice prima e dopo il deploy compatibile con lo schema intermedio?
- Lock, durata e vincoli verificati sul database target?

## Collegamenti

- [[Programmazione/Python/Indice Python|Indice Python]]
- [[Programmazione/Python/Pagine/SQLAlchemy|SQLAlchemy]]
- [[Programmazione/Python/Pagine/SQLite con sqlite3|SQLite con sqlite3]]
- [[Programmazione/PostgreSQL/Pagine/Migrazioni schema|Migrazioni schema]]
- [[Programmazione/PostgreSQL/Pagine/Versionamento database|Versionamento database]]

## Fonti

- [Alembic: tutorial e revisioni](https://alembic.sqlalchemy.org/en/latest/tutorial.html).
- [Autogenerate e suoi limiti](https://alembic.sqlalchemy.org/en/latest/autogenerate.html).
- [Batch migrations per SQLite](https://alembic.sqlalchemy.org/en/latest/batch.html).
- [Branch e merge](https://alembic.sqlalchemy.org/en/latest/branches.html).
- [Comandi, check e stamp](https://alembic.sqlalchemy.org/en/latest/api/commands.html).
- [Cookbook: migrazioni dati](https://alembic.sqlalchemy.org/en/latest/cookbook.html#data-migrations-general-techniques).

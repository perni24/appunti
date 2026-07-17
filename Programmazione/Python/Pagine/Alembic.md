---
date: 2026-06-03
area: Programmazione
topic: Python
type: operational-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [programmazione, python, database, migrazioni]
aliases: [Alembic, Migrazioni Alembic]
prerequisites: []
related: []
---

# Alembic

## Sintesi

Alembic e lo strumento di migrazione schema usato spesso con SQLAlchemy. Versiona modifiche al database tramite revisioni ordinate e permette di applicarle o annullarle in modo controllato.

Serve a evitare modifiche manuali non tracciate allo schema.

## Quando usarlo

Usa Alembic quando:

- il progetto usa SQLAlchemy;
- lo schema cambia nel tempo;
- piu ambienti devono restare allineati;
- vuoi versionare tabelle, colonne, indici e vincoli;
- deploy e rollback devono essere riproducibili.

Per prototipi minimi puo bastare creare schema direttamente, ma in produzione le migrazioni diventano essenziali.

## Come funziona

Inizializzazione:

```bash
alembic init migrations
```

Creare una revisione:

```bash
alembic revision -m "add users table"
```

Applicare migrazioni:

```bash
alembic upgrade head
```

Tornare indietro:

```bash
alembic downgrade -1
```

Ogni revisione contiene normalmente una funzione `upgrade()` e una funzione `downgrade()`.

## API / Sintassi

Esempio di revisione:

```python
from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
    )


def downgrade():
    op.drop_table("users")
```

Autogenerate:

```bash
alembic revision --autogenerate -m "update users"
```

`--autogenerate` confronta metadata SQLAlchemy e database, ma il risultato va sempre revisionato.

## Esempio pratico

Workflow tipico:

```bash
alembic revision --autogenerate -m "add user status"
```

Poi:

1. apri il file generato;
2. controlla operazioni, tipi, vincoli e default;
3. sistema manualmente eventuali parti mancanti;
4. testa su database locale;
5. applica con `alembic upgrade head`.

## Varianti

- **Migrazione manuale**: scrivi `op.create_table`, `op.add_column`, `op.create_index`.
- **Autogenerate**: utile, ma da revisionare.
- **Upgrade**: porta lo schema avanti.
- **Downgrade**: torna a una revisione precedente.
- **Branch di migrazioni**: possibile in team, ma da gestire con attenzione.
- **Migrazioni dati**: modificano contenuti, non solo schema.

## Errori comuni

- Fidarsi ciecamente di `--autogenerate`.
- Non testare migrazioni su dati realistici.
- Usare `create_all()` al posto delle migrazioni in produzione.
- Scrivere downgrade impossibili o inutili senza dichiararlo.
- Modificare vecchie revisioni gia applicate in altri ambienti.
- Non considerare lock, durata e impatto su tabelle grandi.
- Mescolare cambi schema e cambi dati complessi senza piano.

## Checklist

- La migrazione e stata revisionata manualmente?
- Upgrade e downgrade sono coerenti?
- La migrazione e testata su un database simile al reale?
- I dati esistenti rispettano i nuovi vincoli?
- La durata della migrazione e accettabile?
- Il deploy applicativo e compatibile con lo schema prima e dopo?

## Collegamenti

- [[Programmazione/Python/Indice python|Indice Python]]
- [[SQLAlchemy]]
- [[SQLite con sqlite3]]
- [[Programmazione/Postgres/Pagine/Migrazioni schema|Migrazioni schema]]
- [[Programmazione/Postgres/Pagine/Versionamento database|Versionamento database]]

---
date: 2026-06-02
area: Programmazione
topic: Python
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - python
  - database
  - orm
aliases: []
prerequisites: []
related: []
---

# SQLAlchemy

## Sintesi

**SQLAlchemy** e una libreria Python per lavorare con database SQL. Offre sia un SQL Expression Language sia un ORM.

## Quando usarlo

- Applicazioni che usano database relazionali.
- Progetti che richiedono controllo sulle query.
- ORM con sessioni, relazioni e transazioni.

## Come funziona

### Concetto chiave
SQLAlchemy puo essere usato a diversi livelli: query esplicite simili a SQL oppure mapping tra classi Python e tabelle.

```python
from sqlalchemy import select

stmt = select(User).where(User.email == "a@example.com")
```

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/Alembic|Alembic]]
- [[Programmazione/Postgres/Pagine/ORM|ORM]]
- [[Programmazione/Postgres/Indice postgres|Postgres]]

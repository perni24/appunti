---
date: 2026-05-20
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

## Concetto chiave

SQLAlchemy puo essere usato a diversi livelli: query esplicite simili a SQL oppure mapping tra classi Python e tabelle.

```python
from sqlalchemy import select

stmt = select(User).where(User.email == "a@example.com")
```

## Quando usarlo

- Applicazioni che usano database relazionali.
- Progetti che richiedono controllo sulle query.
- ORM con sessioni, relazioni e transazioni.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Python/Pagine/Alembic|Alembic]]
- [[Programmazione/Postgres/Pagine/ORM|ORM]]
- [[Programmazione/Postgres/Indice postgres|Postgres]]



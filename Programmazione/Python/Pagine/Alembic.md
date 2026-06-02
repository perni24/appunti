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
  - migrazioni
aliases: []
prerequisites: []
related: []
---

# Alembic

## Sintesi

**Alembic** e lo strumento di migrazione schema usato spesso con SQLAlchemy.

## Quando usarlo

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Come funziona

### Concetto chiave
Alembic versiona modifiche al database tramite revisioni ordinate.

```powershell
alembic revision -m "add users table"
alembic upgrade head
```
### Cosa gestisce
- Creazione e modifica tabelle.
- Indici.
- Vincoli.
- Migrazioni forward e downgrade.

## API / Sintassi

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Esempio pratico

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Varianti

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Errori comuni

- Fidarsi ciecamente dell'autogenerate.
- Non revisionare SQL prodotto.
- Non testare migrazioni su dati realistici.

## Checklist

Contenuto da sviluppare: nella nota originale questa sezione non era presente o era solo una traccia.

## Collegamenti

- [[Programmazione/Python/Pagine/SQLAlchemy|SQLAlchemy]]
- [[Programmazione/Postgres/Pagine/Migrazioni schema|Migrazioni schema]]
- [[Programmazione/Postgres/Pagine/Versionamento database|Versionamento database]]

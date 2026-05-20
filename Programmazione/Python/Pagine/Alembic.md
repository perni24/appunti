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
  - migrazioni
aliases: []
prerequisites: []
related: []
---

# Alembic

## Sintesi

**Alembic** e lo strumento di migrazione schema usato spesso con SQLAlchemy.

## Concetto chiave

Alembic versiona modifiche al database tramite revisioni ordinate.

```powershell
alembic revision -m "add users table"
alembic upgrade head
```

## Cosa gestisce

- Creazione e modifica tabelle.
- Indici.
- Vincoli.
- Migrazioni forward e downgrade.

## Errori comuni

- Fidarsi ciecamente dell'autogenerate.
- Non revisionare SQL prodotto.
- Non testare migrazioni su dati realistici.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

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

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Python/Pagine/SQLAlchemy|SQLAlchemy]]
- [[Programmazione/Postgres/Pagine/Migrazioni schema|Migrazioni schema]]
- [[Programmazione/Postgres/Pagine/Versionamento database|Versionamento database]]



---
date: 2026-05-20
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - sql
  - dml
aliases: []
prerequisites: []
related: []
---

# SELECT, INSERT, UPDATE e DELETE

## Sintesi

`SELECT`, `INSERT`, `UPDATE` e `DELETE` sono i comandi DML fondamentali per leggere e modificare dati in PostgreSQL.

## Concetto chiave

Questi comandi lavorano sulle righe delle tabelle. `SELECT` legge, `INSERT` crea, `UPDATE` modifica e `DELETE` elimina.

```sql
SELECT id, email FROM users WHERE active = true;

INSERT INTO users (email, active)
VALUES ('a@example.com', true);

UPDATE users
SET active = false
WHERE id = 10;

DELETE FROM users
WHERE id = 10;
```

## Errori comuni

- Eseguire `UPDATE` o `DELETE` senza `WHERE`.
- Usare `SELECT *` in query applicative stabili.
- Non controllare il numero di righe modificate.

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
- [[Programmazione/Postgres/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli]]
- [[Programmazione/Postgres/Pagine/RETURNING|RETURNING]]



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

# RETURNING

## Sintesi

`RETURNING` restituisce colonne dalle righe modificate da `INSERT`, `UPDATE`, `DELETE` o `MERGE`.

## Esempio

```sql
INSERT INTO users (email)
VALUES ('a@example.com')
RETURNING id, created_at;
```

## Perche e utile

- Recuperare ID generati.
- Ottenere valori default.
- Evitare una seconda query.
- Verificare cosa e stato modificato.

## Esempio con UPDATE

```sql
UPDATE orders
SET status = 'paid'
WHERE id = 42
RETURNING id, status, updated_at;
```

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

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Postgres/Pagine/SELECT INSERT UPDATE e DELETE|SELECT, INSERT, UPDATE e DELETE]]
- [[Programmazione/Postgres/Pagine/UPSERT con ON CONFLICT|UPSERT con ON CONFLICT]]
- [[Programmazione/Postgres/Pagine/Funzioni e Store Procedures|Funzioni e Store Procedures]]



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
  - subquery
aliases: []
prerequisites: []
related: []
---

# Subquery

## Sintesi

Una **subquery** e una query annidata dentro un'altra query. Puo comparire in `SELECT`, `FROM`, `WHERE` o `HAVING`.

## Esempio

```sql
SELECT email
FROM users
WHERE id IN (
  SELECT user_id
  FROM orders
  WHERE total > 100
);
```

## Forme comuni

- Subquery scalare: restituisce un singolo valore.
- Subquery tabellare: usata come tabella derivata.
- Subquery correlata: dipende dalla riga esterna.

## Errori comuni

- Usare subquery correlate costose senza controllare il piano.
- Usare `IN` con risultati molto grandi senza verificare performance.
- Scrivere subquery dove una `JOIN` sarebbe piu leggibile.

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
- [[Programmazione/Postgres/Pagine/Common Table Expressions e Recursive Queries|CTE]]
- [[Programmazione/Postgres/Pagine/JOIN|JOIN]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]



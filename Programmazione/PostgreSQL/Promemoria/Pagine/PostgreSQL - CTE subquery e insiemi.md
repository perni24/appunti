---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - postgresql
  - promemoria
  - cte
  - subquery
aliases:
  - Cheatsheet CTE PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Common Table Expressions e Recursive Queries]]"
  - "[[Programmazione/PostgreSQL/Pagine/Subquery]]"
title: PostgreSQL - CTE, subquery e insiemi
---

# PostgreSQL - CTE, subquery e insiemi

Usa `WITH` per nominare un risultato dentro **una sola istruzione**; `EXISTS` risponde a una domanda di presenza. Ogni blocco è indipendente.

## Una o più CTE

```sql
WITH orders(user_id, amount) AS (VALUES (1, 20), (1, 30), (2, 10)),
totals AS (SELECT user_id, sum(amount) AS total FROM orders GROUP BY user_id)
SELECT user_id, total FROM totals WHERE total >= 40 ORDER BY user_id;
```

Solo l'utente 1 supera la soglia (50). La CTE `totals` non crea una tabella per il comando successivo.

## Subquery scalare o EXISTS

```sql
WITH users(id) AS (VALUES (1), (2)), orders(user_id) AS (VALUES (1), (1))
SELECT u.id,
       (SELECT count(*) FROM orders o WHERE o.user_id = u.id) AS n,
       EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id) AS has_orders
FROM users u ORDER BY u.id;
```

Risultato: `1, 2, true` e `2, 0, false`. Una subquery scalare ordinaria dà NULL con zero righe ed errore con più di una; qui `count(*)` senza raggruppamento dà sempre una riga.

## Ricorsione su una gerarchia

```sql
WITH RECURSIVE nodes(id, parent_id) AS (VALUES (1, NULL::int), (2, 1), (3, 2)),
tree(id, depth) AS (
    SELECT id, 0 FROM nodes WHERE parent_id IS NULL
    UNION ALL
    SELECT n.id, t.depth + 1 FROM nodes n JOIN tree t ON n.parent_id = t.id
)
SELECT id, depth FROM tree ORDER BY depth, id;
```

Profondità: 0, 1, 2. Questo esempio assume un albero senza cicli; per attraversare un grafo vedi [[Programmazione/PostgreSQL/Pagine/Common Table Expressions e Recursive Queries|ricorsione e rilevamento dei cicli]].

## Operazioni tra insiemi

```sql
WITH a(id) AS (VALUES (1), (1), (2)), b(id) AS (VALUES (2), (3))
SELECT id FROM a UNION SELECT id FROM b ORDER BY id;
```

Sostituisci solo l'operatore: serve lo stesso numero di colonne con tipi compatibili per posizione.

| Operatore | Risultato nell'esempio |
|---|---|
| `UNION` | 1, 2, 3 |
| `UNION ALL` | 1, 1, 2, 2, 3 |
| `INTERSECT` | 2 |
| `EXCEPT` | 1 (a sinistra ma non a destra) |

## Contare le righe eliminate

```sql
BEGIN;
CREATE TEMP TABLE lab_sessions (id int, expired boolean);
INSERT INTO lab_sessions VALUES (1, true), (2, false);
WITH removed AS (
    DELETE FROM pg_temp.lab_sessions WHERE expired RETURNING id
)
SELECT count(*) AS removed_count FROM removed;
ROLLBACK;
```

Il DELETE viene **eseguito**, non simulato dalla SELECT. Qui elimina una riga temporanea; il rollback annulla la prova.

## Approfondimento

- [PostgreSQL 18: WITH e query ricorsive](https://www.postgresql.org/docs/18/queries-with.html)
- [[Programmazione/PostgreSQL/Pagine/Common Table Expressions e Recursive Queries|Common Table Expressions e Recursive Queries]]
- [[Programmazione/PostgreSQL/Pagine/Subquery|Subquery]]
- [[Programmazione/PostgreSQL/Pagine/JOIN|JOIN]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]

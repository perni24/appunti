---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - postgresql
  - promemoria
  - join
aliases:
  - Cheatsheet JOIN PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/JOIN]]"
  - "[[Programmazione/PostgreSQL/Pagine/LATERAL JOIN]]"
title: PostgreSQL - JOIN
---

# PostgreSQL - JOIN

Scegli il join in base alle righe che devono rimanere. Dati di prova per i blocchi della pagina (stessa sessione):

```sql
CREATE TEMP TABLE lab_users (id int PRIMARY KEY, name text, manager_id int);
CREATE TEMP TABLE lab_orders (id int PRIMARY KEY, user_id int, day date, status text);
INSERT INTO lab_users VALUES (1, 'Ada', NULL), (2, 'Teo', 1), (3, 'Lia', 1);
INSERT INTO lab_orders VALUES (10, 1, '2026-01-01', 'open'),
    (11, 1, '2026-01-01', 'open'), (12, 2, '2026-01-02', 'closed');
```

## Solo corrispondenze oppure tutti gli utenti

```sql
SELECT u.name, o.id FROM lab_users u JOIN lab_orders o ON o.user_id = u.id
ORDER BY u.id, o.id;
```

```sql
SELECT u.name, count(o.id) AS open_orders
FROM lab_users u LEFT JOIN lab_orders o ON o.user_id = u.id AND o.status = 'open'
GROUP BY u.id, u.name ORDER BY u.id;
```

Il primo restituisce tre ordini. Il secondo conta Ada 2, Teo 0, Lia 0. Spostando il filtro sullo stato in `WHERE` perdi entrambi gli zeri; con `count(*)` conteresti anche la riga senza ordine.

## Nessun ordine oppure solo l'ultimo

```sql
SELECT u.name FROM lab_users u
WHERE NOT EXISTS (SELECT 1 FROM lab_orders o WHERE o.user_id = u.id);
```

```sql
SELECT u.name, last_order.id FROM lab_users u
LEFT JOIN LATERAL (
    SELECT o.id FROM lab_orders o WHERE o.user_id = u.id
    ORDER BY o.day DESC NULLS LAST, o.id DESC LIMIT 1
) AS last_order ON true
ORDER BY u.id;
```

Il primo trova solo Lia. Nel secondo Ada ha l'ordine 11 (stesso giorno del 10), Teo il 12, Lia resta con ID nullo.

## Gli altri join a colpo d'occhio

| Obiettivo | Forma |
|---|---|
| Tenere tutta la destra | `a RIGHT JOIN b ON a.id = b.id` (equivale a `b LEFT JOIN a` con la stessa condizione e proiezione) |
| Tenere anche le righe senza corrispondenza di entrambi i lati | `a FULL JOIN b ON a.id = b.id` |
| Generare tutte le coppie | `a CROSS JOIN b`: con 3 e 2 righe dà 6 coppie |
| Risalire al responsabile nella stessa tabella | Self join con due alias, come sotto |

```sql
SELECT e.name, m.name AS manager FROM lab_users e
LEFT JOIN lab_users m ON m.id = e.manager_id ORDER BY e.id;
```

## Approfondimento

- [PostgreSQL 18: JOIN e LATERAL](https://www.postgresql.org/docs/18/queries-table-expressions.html)
- [[Programmazione/PostgreSQL/Pagine/JOIN|JOIN]]
- [[Programmazione/PostgreSQL/Pagine/LATERAL JOIN|LATERAL JOIN]]
- [[Programmazione/PostgreSQL/Pagine/Relazioni 1 a 1 1 a N e N a N|Relazioni 1 a 1 1 a N e N a N]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]

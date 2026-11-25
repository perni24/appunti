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
  - aggregazioni
  - group-by
aliases:
  - Cheatsheet aggregazioni PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Aggregazioni e GROUP BY]]"
title: PostgreSQL - Aggregazioni
---

# PostgreSQL - Aggregazioni

Usa un aggregato per ottenere una riga per gruppo. Per provare i comandi nella stessa sessione:

```sql
CREATE TEMP TABLE lab_sales (id int PRIMARY KEY, shop text, status text, amount int);
INSERT INTO lab_sales VALUES (1, 'A', 'paid', 20), (2, 'A', 'open', NULL),
    (3, 'A', 'paid', 10), (4, 'B', 'open', NULL);
```

## Contare righe, valori e gruppi distinti

```sql
SELECT count(*) AS rows, count(amount) AS known, count(DISTINCT shop) AS shops,
       sum(amount), avg(amount), min(amount), max(amount)
FROM lab_sales;
```

4 righe, 2 importi noti, 2 negozi; somma 30, media 15, estremi 10 e 20. Su input vuoto senza `GROUP BY`, `count(*)` vale 0 ma `sum(amount)` è NULL.

## WHERE, GROUP BY, FILTER, HAVING

```sql
SELECT shop, count(*) AS orders, count(*) FILTER (WHERE status = 'paid') AS paid
FROM lab_sales WHERE id > 0 GROUP BY shop
HAVING count(*) >= 2 ORDER BY orders DESC, shop;
```

`WHERE` sceglie le righe iniziali; `FILTER` conta solo quelle pagate senza escluderle dagli altri aggregati; `HAVING` conserva i gruppi con almeno due righe. Risultato: `A, 3, 2`.

## Liste e JSON in ordine

```sql
SELECT shop, string_agg(status, ', ' ORDER BY id) AS states,
       array_agg(id ORDER BY id) AS ids,
       jsonb_agg(jsonb_build_object('id', id, 'amount', amount) ORDER BY id) AS items
FROM lab_sales GROUP BY shop ORDER BY shop;
```

Il negozio A produce gli ID `{1,2,3}`. Metti l'ordine **dentro** l'aggregato: l'ultimo `ORDER BY shop` ordina soltanto le righe dei negozi.

## Subtotali e totale generale

```sql
SELECT shop, status, grouping(shop, status) AS level, sum(amount) AS total
FROM lab_sales GROUP BY GROUPING SETS ((shop, status), (shop), ())
ORDER BY level, shop, status;
```

`level` distingue dettaglio (0), subtotale del negozio (1) e totale generale (3), anche se i dati contengono NULL. Per B il subtotale è NULL, non zero.

## Approfondimento

- [PostgreSQL 18: Funzioni aggregate](https://www.postgresql.org/docs/18/functions-aggregate.html)
- [[Programmazione/PostgreSQL/Pagine/Aggregazioni e GROUP BY|Aggregazioni e GROUP BY]]
- [[Programmazione/PostgreSQL/Pagine/Window Functions|Window Functions]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]

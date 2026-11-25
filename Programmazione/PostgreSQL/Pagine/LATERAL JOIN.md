---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - sql
  - join
aliases: []
prerequisites: []
related: []
title: LATERAL JOIN
---

# LATERAL JOIN

## Sintesi

`LATERAL` permette a una voce nel `FROM` di usare le colonne delle voci alla sua sinistra. È utile quando vuoi **fino a N risultati per ogni riga esterna**, non N risultati in totale. Se basta unire due tabelle per chiave senza scegliere o calcolare righe per ciascuna, un normale join è più semplice.

## Ultimo ordine di ciascun cliente, anche di chi non ha ordinato

```sql
WITH customers(id) AS (VALUES (1), (2)),
orders(id, customer_id, placed_on) AS (
  VALUES (10, 1, DATE '2026-06-01'), (11, 1, DATE '2026-06-01')
)
SELECT c.id, latest.id AS order_id
FROM customers AS c
LEFT JOIN LATERAL (
  SELECT o.id FROM orders AS o WHERE o.customer_id = c.id
  ORDER BY o.placed_on DESC, o.id DESC LIMIT 1
) AS latest ON true
ORDER BY c.id;
```

Restituisce `(1,11)` e `(2,NULL)`. Il filtro su `c.id` fa dipendere la ricerca dal cliente corrente; a parità di data abbiamo scelto l'ID maggiore. `LIMIT 1` va **dentro** la subquery. `ON true` non introduce altri filtri; con `CROSS JOIN LATERAL` al posto del left join e senza `ON true`, il cliente 2 sparirebbe. Anche un filtro esterno che richieda un valore non nullo di `latest` lo eliminerebbe.

## Espandere un array per riga

```sql
WITH products(id, tags) AS (
  VALUES (1, ARRAY['sql','db']), (2, ARRAY[]::text[])
)
SELECT p.id, t.tag, t.pos
FROM products AS p
LEFT JOIN LATERAL unnest(p.tags) WITH ORDINALITY AS t(tag, pos) ON true
ORDER BY p.id, t.pos;
```

Il prodotto 1 genera due righe, con posizioni 1 e 2. Il prodotto 2 rimane con tag e posizione nulli: l'array vuoto **non** ha prodotto un elemento nullo, è il left join che conserva la riga di sinistra. Le funzioni nel `FROM` possono riferirsi alle colonne precedenti anche senza la parola `LATERAL`; esplicitarla aiuta a leggere la dipendenza. Lo stesso principio vale per `jsonb_array_elements`.

## Scelta del piano

Con pochi clienti e molti ordini, un indice B-tree su `(customer_id, placed_on DESC, id DESC)` può trovare subito la prima riga per ciascun cliente. Se stai già leggendo tutti gli ordini, confronta il piano con `row_number() OVER (PARTITION BY ...)`. La sintassi laterale indica una dipendenza logica, non garantisce che una strategia sia più veloce.

**Fonte:** [PostgreSQL 18: subquery LATERAL](https://www.postgresql.org/docs/18/queries-table-expressions.html#QUERIES-LATERAL).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/JOIN|JOIN]]
- [[Programmazione/PostgreSQL/Pagine/Subquery|Subquery]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]

---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - postgresql
  - database
aliases:
  - Window Functions
prerequisites: []
related: []
title: Window Functions in PostgreSQL
---

# Window Functions in PostgreSQL

## Sintesi

Una **window function** aggiunge un calcolo a ogni riga che arriva alla `SELECT`. Diversamente da `GROUP BY`, la finestra da sola non fonde le righe. Definisci separatamente **partizione** (con chi confronto la riga), **ordinamento** (chi viene prima) e **frame** (quale porzione legge il calcolo).

## Un cumulativo per giorno o per movimento?

Due movimenti nello stesso giorno non sono necessariamente intercambiabili. Nell'esempio, `daily` usa il frame predefinito con `ORDER BY`: comprende anche tutte le righe a pari data. `per_row` usa un ordine totale e avanza di una riga alla volta. `OVER ()`, senza ordinamento, prende l'intero insieme.

```sql
WITH sales(id, day, amount) AS (VALUES (1, 10, 5), (2, 10, 7), (3, 11, 8))
SELECT id,
       sum(amount) OVER (ORDER BY day) AS daily,
       sum(amount) OVER (ORDER BY day, id ROWS UNBOUNDED PRECEDING) AS per_row,
       round(100.0 * amount / nullif(sum(amount) OVER (), 0), 1) AS pct,
       lag(amount) OVER (ORDER BY day, id) AS previous
FROM sales ORDER BY day, id;
```

Per gli ID 1, 2 e 3, `daily` vale **12, 12, 20**; `per_row` vale **5, 12, 20**. Il primo `lag` è nullo perché non c'è un movimento precedente; `lead` guarda nella direzione opposta. Per ripetere i calcoli per reparto, aggiungi `PARTITION BY reparto` alle rispettive finestre. Il loro `ORDER BY` non garantisce l'ordine di presentazione: serve quello finale.

## Classifiche e pareggi

```sql
WITH scores(id, points) AS (VALUES (1, 90), (2, 90), (3, 80)),
ranked AS (
  SELECT id, rank() OVER w AS place, dense_rank() OVER w AS dense_place,
         row_number() OVER (ORDER BY points DESC, id) AS seq
  FROM scores WINDOW w AS (ORDER BY points DESC)
)
SELECT id, place, dense_place, seq FROM ranked ORDER BY seq;
```

`rank` assegna **1, 1, 3**; `dense_rank` assegna **1, 1, 2**. `row_number` sceglie un ordine distinto (**1, 2, 3**) e usa l'ID per sciogliere la parità. Non aggiungere l'ID alla finestra `w` se i due punteggi devono restare a pari merito. Per una sola riga, filtra `WHERE seq = 1` nella query **esterna**; per tutti i primi a pari merito, filtra `WHERE place = 1`. Lo stesso schema con `PARTITION BY email ORDER BY updated_at DESC, id DESC` seleziona una versione per email se quel criterio risolve univocamente i pareggi.

## L'ultimo valore di quale insieme?

```sql
WITH events(id, value) AS (VALUES (1, 'A'), (2, 'B'), (3, 'C'))
SELECT id, last_value(value) OVER (ORDER BY id) AS last_so_far,
       last_value(value) OVER (ORDER BY id ROWS BETWEEN UNBOUNDED PRECEDING
                                                   AND UNBOUNDED FOLLOWING) AS last_any
FROM events ORDER BY id;
```

La prima colonna calcolata dà A, B, C; la seconda C, C, C. `first_value` e `last_value` leggono il **frame**, non necessariamente tutta la partizione. `lag` e `lead` invece cercano la riga precedente o successiva nella **partizione**. `ROWS` conta posizioni fisiche nell'ordinamento; solo con un criterio di spareggio il cumulativo riga per riga è ripetibile fra pari. Su dati grandi controlla il costo degli ordinamenti nel piano.

**Fonti PostgreSQL 18:** [funzioni di finestra](https://www.postgresql.org/docs/18/functions-window.html), [sintassi e frame](https://www.postgresql.org/docs/18/sql-expressions.html#SYNTAX-WINDOW-FUNCTIONS).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Aggregazioni e GROUP BY|Aggregazioni e GROUP BY]]
- [[Programmazione/PostgreSQL/Pagine/Common Table Expressions e Recursive Queries|Common Table Expressions e Recursive Queries]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]

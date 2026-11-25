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
  - window-functions
aliases:
  - Cheatsheet window functions PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Window Functions]]"
title: PostgreSQL - Window functions
---

# PostgreSQL - Window functions

Una finestra calcola un valore per ogni riga senza accorpare il risultato. Dati per i blocchi successivi, nella stessa sessione:

```sql
CREATE TEMP TABLE lab_moves (id int PRIMARY KEY, account text, day date, amount int);
INSERT INTO lab_moves VALUES (1, 'A', '2026-01-01', 10), (2, 'A', '2026-01-01', 10),
    (3, 'A', '2026-01-02', 5), (4, 'B', '2026-01-01', 7);
```

## Numerare o assegnare lo stesso rango ai pari merito

```sql
SELECT id, row_number() OVER (ORDER BY amount DESC, id) AS position,
       rank() OVER (ORDER BY amount DESC) AS rank,
       dense_rank() OVER (ORDER BY amount DESC) AS dense_rank
FROM lab_moves ORDER BY position;
```

I due importi da 10 hanno posizioni 1 e 2 ma rango 1 per entrambi. Per l'importo 7, `rank` vale 3 e `dense_rank` vale 2. Non aggiungere l'ID all'ordine del rango se vuoi conservare il pari merito.

## Totale del conto o progressivo per movimento

```sql
SELECT id, sum(amount) OVER (PARTITION BY account) AS total,
       sum(amount) OVER (PARTITION BY account ORDER BY day, id
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running
FROM lab_moves ORDER BY account, day, id;
```

Per A: totale 25 su tutte e tre le righe, progressivo 10, 20, 25. Il frame `ROWS` avanza di una riga; l'ID decide l'ordine dei movimenti dello stesso giorno.

## Precedente, successivo, primo e ultimo

```sql
SELECT id, lag(amount) OVER w AS prev, lead(amount) OVER w AS next,
       first_value(amount) OVER w AS first, last_value(amount) OVER w AS last
FROM lab_moves
WINDOW w AS (PARTITION BY account ORDER BY day, id
             ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
ORDER BY account, day, id;
```

Per la prima riga di A: precedente NULL, successivo 10, primo 10, ultimo 5. Il frame completo serve a `last_value`: col frame predefinito ordinato l'ultima riga del frame può non essere l'ultima del conto.

## Ultima riga di ogni gruppo

```sql
WITH ranked AS (
    SELECT account, id, row_number() OVER (
        PARTITION BY account ORDER BY day DESC NULLS LAST, id DESC
    ) AS pos FROM lab_moves
)
SELECT account, id FROM ranked WHERE pos = 1 ORDER BY account;
```

Risultato: A → 3, B → 4. Filtra **nella query esterna**; l'ordine della finestra non sostituisce l'ordine di presentazione finale.

## Approfondimento

- [PostgreSQL 18: Funzioni finestra](https://www.postgresql.org/docs/18/functions-window.html)
- [[Programmazione/PostgreSQL/Pagine/Window Functions|Window Functions]]
- [[Programmazione/PostgreSQL/Pagine/Aggregazioni e GROUP BY|Aggregazioni e GROUP BY]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]

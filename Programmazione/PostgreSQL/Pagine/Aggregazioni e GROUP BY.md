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
  - aggregazioni
aliases: []
prerequisites: []
related: []
title: Aggregazioni e GROUP BY
---

# Aggregazioni e GROUP BY

## Sintesi

Prima di scrivere una somma, completa la frase «voglio una riga per …». `GROUP BY customer_id` produce una riga per cliente **presente nei dati di ingresso**. Non inventa clienti mancanti. Se vuoi mantenere ogni ordine e aggiungere il totale del suo cliente, usa invece una [[Programmazione/PostgreSQL/Pagine/Window Functions|window function]].

## WHERE, FILTER e HAVING

`WHERE` rimuove righe prima del raggruppamento; `FILTER` limita l'ingresso di **un solo aggregato**; `HAVING` decide quali gruppi restituire. Questa query è autonoma:

```sql
WITH orders(customer_id, status, amount) AS (
    VALUES (1,'paid',20), (1,'paid',NULL), (1,'cancelled',7),
           (2,'paid',5), (3,'draft',40)
)
SELECT customer_id, count(*) AS ordini,
       count(*) FILTER (WHERE status = 'paid') AS pagati,
       count(amount) FILTER (WHERE status = 'paid') AS importi_noti,
       sum(amount) FILTER (WHERE status = 'paid') AS ricavo
FROM orders
WHERE status <> 'draft'
GROUP BY customer_id
HAVING count(*) >= 2
ORDER BY customer_id;
```

Solo il cliente `1` supera `HAVING`: ha **3 ordini, 2 pagati, 1 importo pagato noto, ricavo noto 20**. `count(*)` conta righe; `count(amount)` e `sum(amount)` ignorano gli importi nulli. Questo non dimostra che il secondo pagamento valga zero.

## Nessun ordine: zero oppure NULL?

```sql
WITH clients(id) AS (VALUES (1), (2)),
     orders(id, client_id, amount) AS (VALUES (11, 1, 20))
SELECT c.id, count(*) AS righe_join, count(o.id) AS ordini,
       sum(o.amount) AS somma, coalesce(sum(o.amount), 0) AS mostrato
FROM clients AS c
LEFT JOIN orders AS o ON o.client_id = c.id
GROUP BY c.id
ORDER BY c.id;
```

Per il cliente `2` la left join fornisce una riga segnaposto: `righe_join = 1`, `ordini = 0`, `somma = NULL` e `mostrato = 0`. Usa `coalesce` solo se zero è la convenzione del report. Senza `GROUP BY`, sul vuoto un aggregato come `count(*)` restituisce una riga con zero; con gruppi e nessuna riga in ingresso, non c'è nessun gruppo da restituire.

## Altri report

```sql
WITH users(email) AS (
    VALUES ('ada@example.org'), ('ada@example.org'), ('teo@example.org'), (NULL)
)
SELECT email, count(*) AS occorrenze
FROM users
WHERE email IS NOT NULL
GROUP BY email
HAVING count(*) > 1;
```

Qui l'unico duplicato è `ada@example.org` (2). `avg`, `min` e `max` operano sui valori non nulli; per ottenere elenchi ripetibili con `array_agg` o `json_agg` specifica `ORDER BY` **dentro** l'aggregato. Per report temporali definisci il fuso del giorno prima di raggruppare; per subtotali esistono `ROLLUP`, `CUBE` e `GROUPING SETS`.

## Errori da distinguere

- In una query raggruppata le colonne libere devono essere coerenti con la chiave del gruppo. PostgreSQL ammette, ad esempio, altre colonne della **stessa tabella di base** quando raggruppi per l'intera sua chiave primaria. Non assume ogni dipendenza che appare ovvia nei dati.
- Una seconda join 1:N può duplicare gli importi prima di `sum`. `count(DISTINCT order_id)` può correggere il conteggio degli ordini, ma `sum(DISTINCT amount)` eliminerebbe anche importi uguali di ordini diversi.

**Fonti:** [funzioni aggregate](https://www.postgresql.org/docs/18/functions-aggregate.html) e [GROUP BY e HAVING](https://www.postgresql.org/docs/18/queries-table-expressions.html#QUERIES-GROUP).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/JOIN|JOIN]]
- [[Programmazione/PostgreSQL/Pagine/Window Functions|Window Functions]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]

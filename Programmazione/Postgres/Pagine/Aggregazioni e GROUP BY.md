---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - sql
  - aggregazioni
aliases: []
prerequisites: []
related: []
---

# Aggregazioni e GROUP BY

## Sintesi

Le aggregazioni riassumono gruppi di righe usando funzioni come `count`, `sum`, `avg`, `min` e `max`.

## Quando usarlo

Usa le aggregazioni quando devi trasformare molte righe in misure riassuntive:

- conteggio di ordini, utenti, eventi o errori;
- somma di importi o quantita;
- media, minimo e massimo di valori numerici o temporali;
- report raggruppati per cliente, giorno, stato, categoria o area geografica;
- controlli di qualita sui dati, per esempio trovare duplicati.

`GROUP BY` e adatto quando il risultato deve avere una riga per gruppo. Se invece vuoi mantenere tutte le righe originali e aggiungere un calcolo aggregato, spesso sono piu adatte le [[Programmazione/Postgres/Pagine/Window Functions|Window Functions]].

## Come funziona

### Concetto chiave
`GROUP BY` definisce il livello di dettaglio del risultato.

```sql
SELECT customer_id, count(*) AS total_orders
FROM orders
GROUP BY customer_id;
```
### HAVING
`WHERE` filtra le righe prima dell'aggregazione. `HAVING` filtra i gruppi dopo l'aggregazione.

```sql
SELECT customer_id, count(*) AS total_orders
FROM orders
GROUP BY customer_id
HAVING count(*) > 5;
```

## API / Sintassi

```sql
SELECT group_column, aggregate_function(column_name)
FROM table_name
WHERE row_filter
GROUP BY group_column
HAVING group_filter
ORDER BY aggregate_function(column_name) DESC;
```

Funzioni comuni:

```sql
count(*)
count(column_name)
sum(amount)
avg(amount)
min(created_at)
max(created_at)
json_agg(row_value)
array_agg(value)
```

`WHERE` filtra le righe prima del raggruppamento. `HAVING` filtra i gruppi dopo il calcolo delle aggregazioni.

## Esempio pratico

Report degli ordini pagati per cliente:

```sql
SELECT
  customer_id,
  count(*) AS orders_count,
  sum(total_amount) AS total_revenue,
  avg(total_amount) AS average_order_value
FROM orders
WHERE status = 'paid'
GROUP BY customer_id
HAVING count(*) >= 3
ORDER BY total_revenue DESC;
```

Ricerca di email duplicate:

```sql
SELECT email, count(*) AS occurrences
FROM users
GROUP BY email
HAVING count(*) > 1;
```

## Varianti

- `GROUP BY date_trunc('day', created_at)`: raggruppa per intervallo temporale.
- `GROUP BY ROLLUP (...)`: produce totali gerarchici.
- `GROUP BY CUBE (...)`: produce combinazioni multidimensionali.
- `GROUPING SETS`: definisce esplicitamente piu livelli di aggregazione.
- `FILTER (WHERE ...)`: calcola aggregazioni condizionali nella stessa query.

Esempio con `FILTER`:

```sql
SELECT
  customer_id,
  count(*) FILTER (WHERE status = 'paid') AS paid_orders,
  count(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders
FROM orders
GROUP BY customer_id;
```

## Errori comuni

- Selezionare colonne non aggregate e non presenti nel `GROUP BY`.
- Usare `HAVING` quando basta `WHERE`.
- Aggregare dati duplicati a causa di join sbagliate.

## Checklist

- Ogni colonna nel `SELECT` deve essere aggregata o presente nel `GROUP BY`.
- Usare `WHERE` per ridurre le righe prima dell'aggregazione.
- Usare `HAVING` solo per condizioni basate sul risultato aggregato.
- Controllare che eventuali join non moltiplichino le righe prima del conteggio.
- Valutare `count(distinct ...)` quando esistono duplicati dovuti a join.
- Per report frequenti su tabelle grandi, controllare piano query e indici.

## Collegamenti

- [[Programmazione/Postgres/Pagine/JOIN|JOIN]]
- [[Programmazione/Postgres/Pagine/Window Functions|Window Functions]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]

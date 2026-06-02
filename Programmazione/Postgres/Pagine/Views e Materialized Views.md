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
  - views
aliases: []
prerequisites: []
related: []
---

# Views e Materialized Views

## Sintesi

Una view e una query salvata. Una materialized view salva fisicamente il risultato e deve essere aggiornata con `REFRESH MATERIALIZED VIEW`.

## Quando usarlo

Usa view per semplificare query, creare astrazioni, limitare colonne esposte o stabilizzare interfacce SQL. Usa materialized view per report costosi da precomputare.

## Come funziona

La view normale non contiene dati: ogni accesso riesegue la query. La materialized view contiene dati e puo essere indicizzata, ma puo diventare stale.

## API / Sintassi

```sql
CREATE VIEW active_users AS
SELECT id, email
FROM users
WHERE active = true;
```

Materialized view:

```sql
CREATE MATERIALIZED VIEW monthly_sales AS
SELECT date_trunc('month', created_at) AS month, sum(total_amount) AS total
FROM orders
GROUP BY date_trunc('month', created_at);
```

Refresh:

```sql
REFRESH MATERIALIZED VIEW monthly_sales;
```

## Esempio pratico

Refresh concorrente:

```sql
CREATE UNIQUE INDEX monthly_sales_month_idx ON monthly_sales (month);
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;
```

Serve un indice unico per il refresh concorrente.

## Varianti

- View semplice.
- View updatable.
- View con `security_barrier`.
- Materialized view.
- Refresh concorrente.
- Indici su materialized view.

## Errori comuni

- Pensare che una view migliori automaticamente performance.
- Dimenticare refresh delle materialized view.
- Usare materialized view per dati che devono essere sempre freschi.
- Non indicizzare materialized view.
- Esporre piu colonne del necessario.

## Checklist

- Serve astrazione o caching?
- La freschezza dei dati e accettabile?
- Esiste una procedura di refresh?
- La materialized view ha indici adeguati?
- I permessi sono assegnati alla view, non alle tabelle se serve?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Common Table Expressions e Recursive Queries|Common Table Expressions e Recursive Queries]]
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]

---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [postgresql, database]
aliases: [Common Table Expressions (CTE) e Recursive Queries]
prerequisites: []
related: []
---

# Common Table Expressions e Recursive Queries

## Sintesi

Le **Common Table Expressions** o CTE sono query temporanee definite con `WITH` e utilizzabili dalla query principale. In PostgreSQL servono per rendere piu leggibili query complesse, riusare risultati intermedi e costruire query ricorsive con `WITH RECURSIVE`.

## Quando usarlo

Usa una CTE quando vuoi dare un nome a un passaggio intermedio:

- scomporre query lunghe in blocchi leggibili;
- riusare lo stesso risultato nella query principale;
- concatenare operazioni DML con `RETURNING`;
- costruire gerarchie, alberi o grafi con `WITH RECURSIVE`;
- rendere esplicita una trasformazione prima di aggregare o filtrare.

Se la CTE contiene logica riusata in molte query, valuta una view o una materialized view.

## Come funziona

Una CTE esiste solo durante l'esecuzione della singola istruzione SQL. Non crea una tabella permanente.

```sql
WITH customer_totals AS (
  SELECT customer_id, sum(total_amount) AS total_revenue
  FROM orders
  GROUP BY customer_id
)
SELECT customer_id, total_revenue
FROM customer_totals
WHERE total_revenue > 1000;
```

Con `WITH RECURSIVE`, la CTE e composta da:

- termine non ricorsivo, cioe il punto di partenza;
- `UNION` o `UNION ALL`;
- termine ricorsivo, che fa riferimento alla CTE stessa;
- condizione naturale di terminazione, di solito l'assenza di nuovi figli.

PostgreSQL esegue il termine iniziale, poi ripete il termine ricorsivo usando una tabella di lavoro finche non vengono prodotte nuove righe.

Dal punto di vista delle performance, nelle versioni moderne PostgreSQL puo fare inline di una CTE non ricorsiva. Puoi influenzare il comportamento con `MATERIALIZED` o `NOT MATERIALIZED`.

## API / Sintassi

```sql
WITH cte_name AS (
  SELECT ...
)
SELECT ...
FROM cte_name;
```

CTE ricorsiva:

```sql
WITH RECURSIVE cte_name AS (
  SELECT ... -- termine iniziale

  UNION ALL

  SELECT ... -- termine ricorsivo
  FROM cte_name
  JOIN ...
)
SELECT *
FROM cte_name;
```

Controllo di materializzazione:

```sql
WITH expensive_step AS MATERIALIZED (
  SELECT ...
)
SELECT ...
FROM expensive_step;
```

## Esempio pratico

Gerarchia di categorie:

```sql
WITH RECURSIVE category_tree AS (
  SELECT
    id,
    name,
    parent_id,
    1 AS depth
  FROM categories
  WHERE parent_id IS NULL

  UNION ALL

  SELECT
    c.id,
    c.name,
    c.parent_id,
    ct.depth + 1
  FROM categories AS c
  JOIN category_tree AS ct
    ON c.parent_id = ct.id
)
SELECT *
FROM category_tree
ORDER BY depth, name;
```

La prima `SELECT` trova le radici. La seconda scende di livello unendo ogni categoria ai figli della working table.

## Varianti

- CTE non ricorsiva: migliora la leggibilita di query complesse.
- CTE ricorsiva: percorre strutture gerarchiche.
- CTE con `INSERT`, `UPDATE` o `DELETE`: usa `RETURNING` come input di una query successiva.
- `MATERIALIZED`: forza il calcolo separato della CTE.
- `NOT MATERIALIZED`: suggerisce all'ottimizzatore di fare inline quando possibile.

## Errori comuni

- Usare CTE solo per estetica quando una subquery semplice sarebbe piu chiara.
- Creare ricorsioni senza una condizione di terminazione reale.
- Usare `UNION` invece di `UNION ALL` senza motivo, introducendo deduplicazione costosa.
- Pensare che una CTE sia sempre materializzata.
- Non limitare profondita o dimensione in gerarchie potenzialmente cicliche.

## Checklist

- Dare nomi chiari alle CTE.
- Verificare se la CTE semplifica davvero la query.
- Usare `EXPLAIN` quando la CTE contiene molti dati.
- Nelle ricorsive, controllare il caso di cicli o profondita inattesa.
- Preferire `UNION ALL` quando non serve deduplicare.
- Valutare view o materialized view se la logica e riusata spesso.

## Collegamenti

- [[Programmazione/Postgres/Pagine/Subquery|Subquery]]
- [[Programmazione/Postgres/Pagine/RETURNING|RETURNING]]
- [[Programmazione/Postgres/Pagine/Views e Materialized Views|Views e Materialized Views]]

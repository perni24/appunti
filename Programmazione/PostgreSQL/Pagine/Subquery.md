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
  - subquery
aliases: []
prerequisites: []
related: []
title: Subquery
---

# Subquery

## Sintesi

Una subquery è una query dentro un'altra query. Scegli la forma dal risultato richiesto: **un valore** per un confronto, **una tabella** in `FROM` oppure **sì/no** per verificare l'esistenza di righe. Una subquery è *correlata* quando usa valori della query esterna; non significa necessariamente che il motore esegua una scansione completa per ogni riga.

## Un valore: zero, una o più righe

```sql
WITH orders(id, amount) AS (VALUES (11, 10), (12, 30))
SELECT id, amount
FROM orders
WHERE amount > (SELECT avg(amount) FROM orders);
```

La media è 20: torna solo l'ordine 12. Una subquery scalare richiede **una colonna e al massimo una riga**. Zero righe diventano `NULL`, più righe causano un errore di cardinalità. `LIMIT 1` senza un criterio di scelta non risolve dati ambigui.

## Presenza e assenza: EXISTS o IN?

```sql
WITH clients(id) AS (VALUES (1), (2)),
     orders(client_id) AS (VALUES (1), (1), (NULL::integer))
SELECT c.id,
       EXISTS (SELECT 1 FROM orders AS o WHERE o.client_id = c.id) AS ha_ordini,
       c.id NOT IN (SELECT client_id FROM orders) AS non_in_elenco,
       NOT EXISTS (SELECT 1 FROM orders AS o WHERE o.client_id = c.id) AS senza_ordini
FROM clients AS c
ORDER BY c.id;
```

Per il cliente `1` ottieni `true, false, false`: due ordini non producono due clienti. Per il cliente `2` ottieni `false, NULL, true`. Con `NOT IN` nessun valore è uguale a 2, ma l'elenco contiene un valore ignoto: non si può affermare che **tutti** siano diversi. In `WHERE` quel `NULL` verrebbe scartato come `false`. Per cercare clienti senza ordini, con un ID cliente non nullo, usa `NOT EXISTS` con il confronto esplicito. `IN` è utile quando interessa l'appartenenza a un insieme; non elimina questa logica a tre valori.

## Una tabella derivata

```sql
SELECT totals.customer_id, totals.revenue
FROM (
    SELECT customer_id, sum(amount) AS revenue
    FROM (VALUES (1, 600), (1, 500), (2, 800)) AS orders(customer_id, amount)
    GROUP BY customer_id
) AS totals
WHERE totals.revenue > 1000;
```

L'interno produce una riga per cliente; l'esterno conserva solo `1, 1100`. In questo caso basta anche `HAVING sum(amount) > 1000`. Una tabella derivata non crea una tabella persistente; una [[Programmazione/PostgreSQL/Pagine/Common Table Expressions e Recursive Queries|CTE]] può dare un nome al passaggio se rende più leggibile una query lunga.

## Errori comuni

Una join restituisce coppie, `EXISTS` verifica una condizione: non sono sostituti automatici quando ci sono duplicati. Qualifica i nomi con alias nelle subquery correlate, soprattutto quando le tabelle hanno colonne omonime. Valuta i costi con `EXPLAIN` sul caso reale: né `IN` né `EXISTS` è sempre più veloce.

**Fonti:** [espressioni con subquery](https://www.postgresql.org/docs/18/functions-subquery.html) e [subquery scalari](https://www.postgresql.org/docs/18/sql-expressions.html#SQL-SYNTAX-SCALAR-SUBQUERIES).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Common Table Expressions e Recursive Queries|CTE]]
- [[Programmazione/PostgreSQL/Pagine/JOIN|JOIN]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]

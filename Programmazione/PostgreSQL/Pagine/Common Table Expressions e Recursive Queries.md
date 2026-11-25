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
  - Common Table Expressions (CTE) e Recursive Queries
prerequisites: []
related: []
title: Common Table Expressions e Recursive Queries
---

# Common Table Expressions e Recursive Queries

## Sintesi

Una **common table expression** (CTE) dà un nome a un risultato intermedio per la durata di **una sola istruzione**. Usa `WITH` per rendere leggibile un passaggio; usa `WITH RECURSIVE` quando le righe trovate in un passo servono a trovare le successive, per esempio i discendenti di una categoria.

## Separare due domande

Quali clienti superano 100 di spesa complessiva? Prima calcola il totale per cliente, poi filtra quel totale. Il blocco è autonomo:

```sql
WITH orders(customer_id, amount) AS (VALUES (1, 60), (1, 50), (2, 90)),
totals AS (
  SELECT customer_id, sum(amount) AS spent FROM orders GROUP BY customer_id
)
SELECT customer_id, spent FROM totals WHERE spent > 100 ORDER BY customer_id;
```

Risultato: cliente `1`, totale `110`. Qui basterebbe anche `HAVING`: la CTE vale la pena quando il nome del passaggio o il suo riuso aiutano a leggere la query. Per riutilizzare la stessa definizione tra istruzioni diverse, valuta una vista.

## Ricorsione: visitare una gerarchia che contiene un ciclo

Ogni arco va da un padre a un figlio. Parti da 1: puoi raggiungere 2 e 3, ma da 2 puoi anche tornare a 1. La parte prima di `UNION ALL` crea la riga iniziale; ad ogni iterazione la parte successiva espande soltanto le righe del passo precedente.

```sql
WITH RECURSIVE edges(parent_id, child_id) AS (VALUES (1, 2), (1, 3), (2, 1)),
walk(id, depth) AS (
  SELECT 1, 0
  UNION ALL
  SELECT e.child_id, w.depth + 1
  FROM walk AS w JOIN edges AS e ON e.parent_id = w.id
) CYCLE id SET is_cycle USING visit_path
SELECT id, depth, is_cycle FROM walk ORDER BY depth, id;
```

Ottieni `(1,0,false)`, `(2,1,false)`, `(3,1,false)`, `(1,2,true)`. `CYCLE` segnala la riga che chiude il ciclo e **non prosegue da quella riga**. Aggiungi `WHERE NOT is_cycle` nella SELECT finale se non vuoi mostrarla. Il controllo è per percorso: due percorsi validi possono raggiungere lo stesso nodo. In un albero con più radici, il termine iniziale può invece selezionare tutte le categorie senza padre.

## Decisioni ed errori comuni

- `UNION` scarta righe interamente duplicate. Se proietti anche la profondità, lo stesso nodo a profondità diversa **non** è un duplicato. Un `LIMIT` esterno non sostituisce una condizione di arresto; un ordinamento potrebbe richiedere l'intero risultato.
- In PostgreSQL 18 una CTE `SELECT` non ricorsiva, senza effetti collaterali e referenziata una sola volta viene normalmente integrata nella query esterna. `MATERIALIZED` impone un calcolo separato; `NOT MATERIALIZED` può far arrivare prima i filtri ma anche ripetere lavoro. Verifica con `EXPLAIN`, non dedurre il piano dalla sola presenza di `WITH`.
- In una CTE di modifica, il risultato da passare alla query esterna è quello di `RETURNING`. Non contare sull'ordine testuale fra modifiche sorelle per osservare gli aggiornamenti.

**Fonte:** [PostgreSQL 18: WITH, ricorsione e materializzazione](https://www.postgresql.org/docs/18/queries-with.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Subquery|Subquery]]
- [[Programmazione/PostgreSQL/Pagine/RETURNING|RETURNING]]
- [[Programmazione/PostgreSQL/Pagine/Views e Materialized Views|Views e Materialized Views]]

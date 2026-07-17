---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [postgresql, database]
aliases: [Regole]
prerequisites: []
related: []
---

# Regole

## Sintesi

Le regole PostgreSQL (`CREATE RULE`) riscrivono query prima dell'esecuzione. Sono storicamente usate per view e comportamenti speciali, ma spesso i trigger sono piu chiari e sicuri.

## Quando usarlo

Usale raramente, quando serve capire codice legacy, view riscrivibili o meccanismi di rewrite. Per nuova logica applicativa preferisci trigger, vincoli o funzioni.

## Come funziona

Il rule system intercetta una query e la riscrive in una o piu query alternative. Questo avviene prima dell'esecuzione, quindi il comportamento puo essere meno intuitivo dei trigger.

## API / Sintassi

```sql
CREATE RULE ignore_deletes AS
ON DELETE TO protected_table
DO INSTEAD NOTHING;
```

Rimozione:

```sql
DROP RULE ignore_deletes ON protected_table;
```

## Esempio pratico

Una regola puo impedire delete:

```sql
CREATE RULE no_delete_orders AS
ON DELETE TO orders
DO INSTEAD
  UPDATE orders SET deleted_at = now()
  WHERE id = OLD.id;
```

In pratica, per soft delete e spesso piu leggibile usare una funzione o gestire esplicitamente il comando applicativo.

## Varianti

- `DO INSTEAD`.
- `DO ALSO`.
- Regole su view.
- Regole su `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- Rewrite automatico delle view.

## Errori comuni

- Usare regole dove un trigger sarebbe piu prevedibile.
- Non capire che la query viene riscritta, non eseguita riga per riga.
- Creare comportamenti sorprendenti per chi legge SQL.
- Nascondere effetti collaterali.
- Usare regole per business logic complessa.

## Checklist

- Esiste un'alternativa con trigger o vincoli?
- Il comportamento e documentato?
- La regola e testata su query multi-riga?
- Chi usa la tabella conosce la riscrittura?
- La regola e davvero necessaria?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Trigger e Event Trigger|Trigger e Event Trigger]]
- [[Programmazione/Postgres/Pagine/Views e Materialized Views|Views e Materialized Views]]
- [[Programmazione/Postgres/Pagine/Funzioni e Store Procedures|Funzioni e Store Procedures]]

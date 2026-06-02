---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Funzioni e Store Procedures]
prerequisites: []
related: []
---

# Funzioni e Store Procedures in PostgreSQL

## Sintesi

Funzioni e stored procedure incapsulano logica nel database. Le funzioni restituiscono valori e possono essere usate nelle query; le procedure si invocano con `CALL` e possono gestire flussi operativi piu procedurali.

## Quando usarlo

Usale quando:

- una logica deve stare vicino ai dati;
- vuoi ridurre round trip tra app e database;
- devi esporre operazioni controllate con `GRANT EXECUTE`;
- vuoi riusare calcoli in piu query;
- devi implementare trigger o validazioni complesse;
- vuoi nascondere dettagli dello schema all'applicazione.

Evita di spostare nel database logica applicativa troppo ampia, difficile da versionare o testare.

## Come funziona

Una funzione ha input, tipo di ritorno, linguaggio e volatilita. Puo essere scritta in SQL, PL/pgSQL o altri linguaggi disponibili.

Una procedura viene chiamata con `CALL`. Rispetto alle funzioni, e pensata per operazioni procedurali e puo gestire transazioni in scenari specifici.

Il planner usa la volatilita:

- `IMMUTABLE`: stesso output per stessi input;
- `STABLE`: stabile durante una query;
- `VOLATILE`: puo cambiare a ogni chiamata o avere effetti collaterali.

## API / Sintassi

Funzione SQL:

```sql
CREATE FUNCTION discount_price(price numeric, discount numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT price - (price * discount / 100);
$$;
```

Funzione PL/pgSQL:

```sql
CREATE FUNCTION get_order_total(order_id bigint)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  total numeric;
BEGIN
  SELECT sum(quantity * unit_price)
  INTO total
  FROM order_items
  WHERE order_items.order_id = get_order_total.order_id;

  RETURN coalesce(total, 0);
END;
$$;
```

Procedura:

```sql
CREATE PROCEDURE refresh_reporting_tables()
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW reporting_sales;
END;
$$;

CALL refresh_reporting_tables();
```

## Esempio pratico

Funzione controllata per cancellare un ordine:

```sql
CREATE FUNCTION cancel_order(p_order_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE orders
  SET status = 'cancelled'
  WHERE id = p_order_id
    AND status = 'pending';
END;
$$;

REVOKE ALL ON FUNCTION cancel_order(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_order(bigint) TO app_runtime;
```

## Varianti

- Funzioni `LANGUAGE sql`.
- Funzioni `LANGUAGE plpgsql`.
- Funzioni set-returning con `RETURNS TABLE`.
- Procedure invocate con `CALL`.
- Funzioni `SECURITY DEFINER`.
- Funzioni trigger.
- Funzioni `IMMUTABLE`, `STABLE`, `VOLATILE`.

## Errori comuni

- Dichiarare `IMMUTABLE` una funzione che legge tabelle o usa tempo corrente.
- Usare `SECURITY DEFINER` senza fissare `search_path`.
- Mettere troppa logica applicativa nel database.
- Non revocare `EXECUTE` da `PUBLIC` su funzioni sensibili.
- Non testare funzioni con ruoli reali.
- Dimenticare gestione di `NULL`.

## Checklist

- Il linguaggio scelto e il piu semplice possibile?
- La volatilita dichiarata e corretta?
- La funzione richiede `SECURITY DEFINER`?
- `search_path` e fissato nelle funzioni sensibili?
- I permessi `EXECUTE` sono espliciti?
- La logica e versionata e testata?

## Collegamenti

- [[Programmazione/Postgres/Pagine/PL-pgSQL|PL/pgSQL]]
- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/Postgres/Pagine/Trigger e Event Trigger|Trigger e Event Trigger]]

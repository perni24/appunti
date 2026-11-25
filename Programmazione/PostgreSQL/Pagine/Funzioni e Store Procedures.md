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
  - Funzioni e Store Procedures
prerequisites: []
related: []
title: Funzioni e stored procedure in PostgreSQL
---

# Funzioni e stored procedure in PostgreSQL

## Sintesi

Una **funzione** si usa in un'espressione, ad esempio in `SELECT`, e dichiara un risultato: un valore, un insieme di righe o `void`. Una **stored procedure** si invoca con `CALL` per eseguire un'operazione; può restituire parametri `OUT` o `INOUT`, ma non si usa nel `FROM`. Entrambe possono scrivere dati: la distinzione non è «lettura contro scrittura».

## Esempio: calcolare un prezzo o cancellare un ordine

Esegui i due blocchi in ordine nella stessa sessione. Il primo definisce una funzione SQL per un calcolo e una procedura PL/pgSQL che cambia soltanto un ordine ancora in attesa. `OUT` comunica se la procedura ha effettivamente cambiato una riga.

```sql
BEGIN;
CREATE TEMP TABLE lab_orders (id integer PRIMARY KEY, state text NOT NULL);
INSERT INTO lab_orders VALUES (1, 'pending');
CREATE FUNCTION pg_temp.discount_price(p_price numeric, p_pct numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE STRICT AS $$
  SELECT round(p_price * (1 - p_pct / 100), 2);
$$;
CREATE PROCEDURE pg_temp.cancel_order(IN p_id integer, OUT changed boolean)
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE pg_temp.lab_orders SET state = 'cancelled'
  WHERE id = p_id AND state = 'pending';
  changed := FOUND;
END;
$$;
```

```sql
SELECT pg_temp.discount_price(80, 25), pg_temp.discount_price(NULL, 25);
CALL pg_temp.cancel_order(1, NULL);
CALL pg_temp.cancel_order(1, NULL);
SELECT id, state FROM lab_orders;
ROLLBACK;
```

Il calcolo restituisce `60.00` e `NULL`: `STRICT` evita la chiamata quando un argomento è nullo, non convalida che la percentuale sia tra 0 e 100. In SQL si passa `NULL` come segnaposto per il parametro `OUT` di `CALL`. Le due chiamate danno prima vero, poi falso; lo stato resta `cancelled`. Per un semplice totale per ordine può bastare una funzione SQL con `sum`; usa `RETURNS TABLE` quando il chiamante deve leggere più colonne e righe.

## Volatilità: una promessa fatta al planner

- `IMMUTABLE`: a parità di argomenti il risultato non cambia nel tempo. È adatto al calcolo puro del prezzo, non a una funzione che legge un listino modificabile.
- `STABLE`: a parità di argomenti il risultato è stabile dentro una singola istruzione; può cambiare nell'istruzione successiva. È una scelta possibile per una funzione di sola lettura che consulta una tabella.
- `VOLATILE`: è il default; serve per funzioni con effetti collaterali o il cui risultato può cambiare fra chiamate nella stessa istruzione. Dichiarare una funzione più stabile del vero può produrre risultati errati, non solo un piano diverso.

## Transazioni e privilegi

- Una funzione non può eseguire `COMMIT` o `ROLLBACK`. Una procedura può farlo solo in un contesto ammesso: per esempio `CALL` al livello principale, **fuori da un blocco di transazione esplicito**. La procedura qui non chiude transazioni, quindi funziona dentro `BEGIN` e il chiamante può annullarla. Una procedura `SECURITY DEFINER` o con clausola `SET` non può controllare le transazioni.
- Di norma lascia `SECURITY INVOKER`: il chiamante usa i propri privilegi. `GRANT EXECUTE` abilita la chiamata, non autorizza automaticamente l'accesso alle tabelle sottostanti.
- Se una routine deve operare con i privilegi del proprietario (`SECURITY DEFINER`), usa un proprietario con i soli privilegi necessari e riferimenti qualificati. Fissa il `search_path` a schemi fidati, con `pg_temp` in fondo; non assumere che `public` sia uno schema fidato. Revoca l'esecuzione a `PUBLIC` e concedila solo ai ruoli previsti nella stessa transazione di creazione. Verifica l'effetto con un ruolo applicativo, non soltanto come proprietario.

**Fonti PostgreSQL 18:** [funzioni e privilegi](https://www.postgresql.org/docs/18/sql-createfunction.html), [volatilità](https://www.postgresql.org/docs/18/xfunc-volatility.html), [controllo delle transazioni](https://www.postgresql.org/docs/18/plpgsql-transactions.html), [CREATE PROCEDURE](https://www.postgresql.org/docs/18/sql-createprocedure.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/PL-pgSQL|PL/pgSQL]]
- [[Programmazione/PostgreSQL/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/PostgreSQL/Pagine/Trigger e Event Trigger|Trigger e Event Trigger]]

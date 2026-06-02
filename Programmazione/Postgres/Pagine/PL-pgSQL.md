---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [PL/pgSQL]
prerequisites: []
related: []
---

# PL/pgSQL in PostgreSQL

## Sintesi

**PL/pgSQL** e il linguaggio procedurale principale di PostgreSQL. Aggiunge variabili, blocchi, condizioni, cicli, eccezioni e query dinamiche al normale SQL.

## Quando usarlo

Usalo quando SQL dichiarativo non basta:

- funzioni con piu passaggi;
- trigger complessi;
- validazioni procedurali;
- operazioni amministrative ripetibili;
- trasformazioni vicine ai dati;
- gestione controllata di errori e condizioni.

Preferisci SQL puro quando una singola query e sufficiente: e spesso piu leggibile e ottimizzabile.

## Come funziona

Un blocco PL/pgSQL contiene una sezione opzionale `DECLARE`, un corpo `BEGIN ... END` e una eventuale sezione `EXCEPTION`.

Le query possono assegnare valori con `SELECT ... INTO`. I cicli permettono di iterare su risultati. Le eccezioni permettono di gestire errori specifici, ma hanno costo e non vanno usate come controllo di flusso ordinario.

## API / Sintassi

Blocco anonimo:

```sql
DO $$
DECLARE
  counter integer := 0;
BEGIN
  counter := counter + 1;
  RAISE NOTICE 'counter = %', counter;
END;
$$;
```

Funzione:

```sql
CREATE FUNCTION mark_order_paid(p_order_id bigint)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orders
  SET status = 'paid',
      paid_at = now()
  WHERE id = p_order_id;
END;
$$;
```

Gestione eccezioni:

```sql
BEGIN
  INSERT INTO users (email) VALUES (p_email);
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Email gia registrata: %', p_email;
END;
```

## Esempio pratico

Funzione con controllo esplicito:

```sql
CREATE FUNCTION reserve_stock(p_product_id bigint, p_quantity integer)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE products
  SET stock = stock - p_quantity
  WHERE id = p_product_id
    AND stock >= p_quantity;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN updated_count = 1;
END;
$$;
```

La funzione usa una singola `UPDATE` atomica e controlla quante righe sono state modificate.

## Varianti

- `DO $$ ... $$`: blocchi anonimi.
- Funzioni PL/pgSQL.
- Trigger functions.
- Query dinamiche con `EXECUTE`.
- Cicli `FOR`, `WHILE`, `LOOP`.
- `RAISE NOTICE`, `RAISE EXCEPTION`.
- `GET DIAGNOSTICS`.

## Errori comuni

- Scrivere codice riga-per-riga quando una query set-based sarebbe migliore.
- Usare query dinamiche senza `format()` e quoting sicuro.
- Catturare eccezioni generiche nascondendo errori reali.
- Dimenticare che funzioni lunghe tengono transazioni e lock.
- Usare `SELECT INTO` aspettandosi sempre una sola riga senza controlli.
- Non testare con dati concorrenti.

## Checklist

- La logica richiede davvero PL/pgSQL?
- Esiste una soluzione SQL set-based piu semplice?
- Gli errori sono gestiti senza nasconderli?
- Le query dinamiche sono quotate correttamente?
- La funzione e breve e testabile?
- I permessi sono coerenti con il ruolo che la esegue?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Funzioni e Store Procedures|Funzioni e Store Procedures]]
- [[Programmazione/Postgres/Pagine/Trigger e Event Trigger|Trigger e Event Trigger]]
- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]

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
  - PL/pgSQL
prerequisites: []
related: []
title: PL/pgSQL in PostgreSQL
---

# PL/pgSQL in PostgreSQL

## Sintesi

PL/pgSQL unisce SQL a variabili, condizioni, cicli ed eccezioni. Usalo per **coordinare** più passi dentro il database. Se devi solo cambiare un insieme di righe, lascia che lo faccia una singola istruzione SQL: leggere un valore, decidere nell'applicazione e scriverlo più tardi non dà la stessa garanzia.

## Prenotare scorte senza leggere e poi riscrivere il saldo

Esegui i due blocchi nella stessa sessione. La quantità richiesta deve essere positiva: senza questo controllo, sottrarre una quantità negativa **aumenterebbe** le scorte. Il vincolo sulla tabella resta necessario anche per chi la modifica senza passare dalla funzione.

```sql
BEGIN;
CREATE TEMP TABLE lab_stock (
  product_id integer PRIMARY KEY, available integer NOT NULL CHECK (available >= 0)
);
INSERT INTO lab_stock VALUES (1, 5);
CREATE FUNCTION pg_temp.reserve(p_id integer, p_qty integer)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
  changed bigint;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'La quantita deve essere positiva' USING ERRCODE = '22023';
  END IF;
  UPDATE pg_temp.lab_stock SET available = available - p_qty
  WHERE product_id = p_id AND available >= p_qty;
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END;
$$;
```

```sql
SELECT pg_temp.reserve(1, 3);
SELECT pg_temp.reserve(1, 3);
SELECT pg_temp.reserve(99, 1);
SELECT available FROM lab_stock WHERE product_id = 1;
ROLLBACK;
```

Risultati: **vero, falso, falso, 2**. Il test di disponibilità e la sottrazione sono nello stesso `UPDATE`; la PK impedisce di toccare più di un prodotto. «Non prenotato» include sia prodotto assente sia disponibilità insufficiente. Un errore sugli argomenti è un caso diverso. In caso di scritture concorrenti l'operazione può attendere un lock; con isolamento più forte l'applicazione deve gestire anche un errore di serializzazione.

## Ottenere esattamente una riga

Il seguente blocco anonimo è indipendente. `DECLARE` introduce variabili; `BEGIN ... END` delimita il codice, **non** avvia o chiude una transazione. `SELECT ... INTO STRICT` esige una riga: zero produce `no_data_found`, due o più `too_many_rows`.

```sql
DO $$
DECLARE
  picked integer;
BEGIN
  SELECT v INTO STRICT picked FROM (VALUES (4), (5)) AS t(v) WHERE v > 3;
  RAISE NOTICE 'Valore: %', picked;
EXCEPTION WHEN too_many_rows THEN
  RAISE NOTICE 'Selezione ambigua';
END;
$$;
```

Il risultato è il messaggio `Selezione ambigua`. Senza `STRICT`, a zero righe la variabile diventa nulla; con più righe viene scelta la prima, che senza `ORDER BY` non è deterministica. Per distinguere una riga con valore nullo da nessuna riga, controlla subito `FOUND`. `ROW_COUNT` misura invece quante righe ha elaborato il comando precedente.

## Limiti pratici

- Gestisci solo le eccezioni attese. All'ingresso nel gestore, le scritture effettuate nel blocco protetto sono state annullate, ma le variabili locali mantengono il valore raggiunto. Un blocco con `EXCEPTION` ha un costo: non sostituisce un semplice `IF`.
- `FOR ... IN SELECT` serve se ogni riga richiede un'azione diversa; per una trasformazione uniforme preferisci SQL su insiemi. Usa `PERFORM` per una chiamata di cui vuoi scartare il risultato.
- Se il nome di una tabella deve essere dinamico, ammetti solo i nomi previsti e usa `format('%I', ...)` per gli identificatori; in `EXECUTE ... USING` passa i valori separatamente. Il quoting di un identificatore non verifica che il chiamante sia autorizzato a sceglierlo.

**Fonti PostgreSQL 18:** [istruzioni e diagnostica](https://www.postgresql.org/docs/18/plpgsql-statements.html), [controllo di flusso ed eccezioni](https://www.postgresql.org/docs/18/plpgsql-control-structures.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Funzioni e Store Procedures|Funzioni e stored procedure]]
- [[Programmazione/PostgreSQL/Pagine/Trigger e Event Trigger|Trigger e Event Trigger]]
- [[Programmazione/PostgreSQL/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]

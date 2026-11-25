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
  - Trigger e Event Trigger
prerequisites: []
related: []
title: Trigger e Event Trigger
---

# Trigger e Event Trigger

## Sintesi

Un trigger di tabella risponde a una scrittura sui **dati**; un event trigger risponde a eventi del **database**, per esempio la creazione di una tabella. Scegli prima la regola da garantire: per valori obbligatori, unicità e riferimenti usa normalmente `NOT NULL`, `UNIQUE` e foreign key. Un trigger serve quando occorre un'azione, ad esempio registrare la transizione da aperto a chiuso.

## Quando e quante volte

| Forma | Cosa osserva | Conseguenza pratica |
| --- | --- | --- |
| `BEFORE ... FOR EACH ROW` | La riga prima della scrittura | Per insert/update puoi correggere `NEW` e restituirla, ad esempio per valorizzare `updated_at`. Restituire `NULL` salta l'operazione su quella riga |
| `AFTER ... FOR EACH ROW` | La riga dopo l'operazione | Adatto all'audit. Il valore restituito dalla funzione è ignorato |
| `FOR EACH STATEMENT` | L'istruzione | Scatta una volta anche se un `UPDATE` non trova righe. `TRUNCATE` ammette solo trigger per istruzione |
| `INSTEAD OF ... FOR EACH ROW` | Una scrittura su una vista | La funzione implementa l'azione sulla tabella sottostante |

`OLD` esiste per aggiornamenti e cancellazioni, `NEW` per inserimenti e aggiornamenti. Un trigger non costituisce una transazione autonoma: se l'operazione viene annullata, vengono annullate anche le sue scritture di audit.

## Laboratorio: registrare solo i cambi di stato

Esegui i due blocchi nella stessa sessione. Al trigger interessa la variazione effettiva, non la semplice presenza di `state` nel `SET`. `IS DISTINCT FROM` tratta correttamente anche il primo passaggio da `NULL` a un valore.

```sql
BEGIN;
CREATE TEMP TABLE lab_tickets (id integer PRIMARY KEY, state text);
CREATE TEMP TABLE lab_changes (ticket_id integer, previous text, current_state text);
CREATE FUNCTION pg_temp.log_state() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO pg_temp.lab_changes VALUES (NEW.id, OLD.state, NEW.state);
  RETURN NULL;
END;
$$;
CREATE TRIGGER ticket_state_change AFTER UPDATE ON lab_tickets
FOR EACH ROW WHEN (OLD.state IS DISTINCT FROM NEW.state)
EXECUTE FUNCTION pg_temp.log_state();
INSERT INTO lab_tickets VALUES (1, NULL), (2, 'closed');
```

```sql
UPDATE lab_tickets SET state = 'closed' RETURNING id;
UPDATE lab_tickets SET state = 'open' WHERE id = 99;
SELECT ticket_id, previous, current_state FROM lab_changes ORDER BY ticket_id;
ROLLBACK;
```

Il primo aggiornamento restituisce entrambi gli ID, **senza ordine garantito**. Il registro contiene solo `(1,NULL,closed)`: il ticket 2 era già chiuso, e il secondo comando non ha toccato righe. Per cambiare la riga in un trigger `BEFORE` modifica `NEW` direttamente: rilanciare un altro `UPDATE` sulla stessa tabella può richiamare il trigger.

## Laboratorio separato: osservare un comando DDL

Solo su un **database di prova**, con un superuser PostgreSQL e lo schema `lab_ddl_demo` e il nome di event trigger liberi. L'event trigger appartiene al database, non alla tabella: qui filtra il tag `CREATE TABLE` e registra soltanto oggetti dello schema di prova. La transazione finale annulla anche l'installazione del trigger.

```sql
BEGIN;
CREATE SCHEMA lab_ddl_demo;
CREATE TABLE lab_ddl_demo.events (tag text, object_name text);
CREATE FUNCTION lab_ddl_demo.log_create() RETURNS event_trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO lab_ddl_demo.events
  SELECT command_tag, object_identity FROM pg_event_trigger_ddl_commands()
  WHERE schema_name = 'lab_ddl_demo' AND object_type = 'table';
END;
$$;
CREATE EVENT TRIGGER lab_ddl_watch ON ddl_command_end
WHEN TAG IN ('CREATE TABLE') EXECUTE FUNCTION lab_ddl_demo.log_create();
CREATE TABLE lab_ddl_demo.example (id integer);
INSERT INTO lab_ddl_demo.example VALUES (1);
SELECT tag, object_name FROM lab_ddl_demo.events;
ROLLBACK;
```

Una sola riga: `CREATE TABLE` e `lab_ddl_demo.example`. L'`INSERT` non è DDL. `ddl_command_end` significa fine del comando, **non commit**. Un errore nella funzione può far fallire il DDL originale; non installare questo laboratorio in un database condiviso.

**Fonti PostgreSQL 18:** [trigger sulle tabelle](https://www.postgresql.org/docs/18/trigger-definition.html), [event trigger](https://www.postgresql.org/docs/18/event-trigger-definition.html), [privilegi di creazione](https://www.postgresql.org/docs/18/sql-createeventtrigger.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/PL-pgSQL|PL/pgSQL]]
- [[Programmazione/PostgreSQL/Pagine/Funzioni e Store Procedures|Funzioni e stored procedure]]
- [[Programmazione/PostgreSQL/Pagine/Audit logging|Audit logging]]

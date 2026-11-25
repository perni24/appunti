---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: operational-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - sicurezza
  - audit
aliases: []
prerequisites: []
related: []
title: Audit logging
---

# Audit logging

## Sintesi

Prima di attivare un audit, scegli la domanda a cui dovrà rispondere: «quale ordine ha cambiato stato ed è stato confermato?» non è la stessa domanda di «chi ha tentato di leggere questa tabella?». Un trigger e un log del server non osservano gli stessi eventi.

| Meccanismo | Cosa osserva | Cosa non dimostra |
| --- | --- | --- |
| Evento applicativo | Utente finale, richiesta e contesto di business | Operazioni effettuate fuori dall'applicazione |
| Trigger di riga | Valori rilevanti prima e dopo una modifica | `SELECT`, tentativi falliti o modifiche annullate |
| Log server / pgAudit | Connessioni, errori e classi di statement secondo configurazione | Il solo testo dello statement non certifica il commit né quali righe siano cambiate |

## Laboratorio: registrare transizioni confermate

Database di prova vuoto, come amministratore. Il codice crea un owner non-login e una funzione trigger che registra solo identificativo, stato vecchio e nuovo, login del database e istante dell'evento. In produzione l'owner dell'audit deve restare distinto dal ruolo applicativo.

```sql
CREATE ROLE lab_audit_owner NOLOGIN;
CREATE SCHEMA lab_audit AUTHORIZATION lab_audit_owner;
BEGIN;
SET LOCAL ROLE lab_audit_owner;
CREATE TABLE lab_audit.orders (id integer PRIMARY KEY, status text NOT NULL);
CREATE TABLE lab_audit.events (
  order_id integer NOT NULL, old_status text NOT NULL, new_status text NOT NULL,
  db_login name NOT NULL, recorded_at timestamptz NOT NULL
);
CREATE FUNCTION lab_audit.record_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  INSERT INTO lab_audit.events VALUES
    (NEW.id, OLD.status, NEW.status, session_user, clock_timestamp());
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION lab_audit.record_status() FROM PUBLIC;
CREATE TRIGGER status_changed AFTER UPDATE OF status ON lab_audit.orders
FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION lab_audit.record_status();
INSERT INTO lab_audit.orders VALUES (1, 'aperto');
COMMIT;
```

```sql
UPDATE lab_audit.orders SET status = 'pagato' WHERE id = 1;
BEGIN;
UPDATE lab_audit.orders SET status = 'annullato' WHERE id = 1;
ROLLBACK;
SELECT order_id, old_status, new_status, db_login
FROM lab_audit.events ORDER BY recorded_at;
```

Con `psql` in autocommit si ottiene un solo evento: `1, aperto, pagato` con il login della sessione. L'aggiornamento annullato e il suo evento sono nella stessa transazione. `NEW` e `OLD` esistono qui **dentro la funzione trigger**, non nel normale SQL del client. Il runtime non deve poter alterare il trigger o scrivere nella tabella degli eventi.

## Verificare copertura e conservazione

`session_user` indica normalmente il login della connessione, non la persona dietro un pool applicativo. `current_user` dentro questa funzione indicherebbe il suo proprietario. Per attribuire la richiesta a una persona serve un identificativo verificato dall'app, correlabile al log del database.

Per le letture o i tentativi falliti valuta i log del server e, dove disponibile, pgAudit. `log_statement=mod` comprende DDL e statement che modificano dati, non i normali `SELECT`; non è un audit completo. Il logical decoding può alimentare un flusso di modifiche confermate, non un registro di accessi in lettura. Prima di aumentare la verbosità, prova volume e presenza di dati personali o segreti. Per rilevare manomissioni da amministratori del database occorrono anche raccolta esterna, accessi separati e retention verificata: una tabella nello stesso database non è immutabile.

## Fonti

[PostgreSQL 18: trigger](https://www.postgresql.org/docs/18/trigger-definition.html) · [Configurazione dei log](https://www.postgresql.org/docs/18/runtime-config-logging.html) · [pgAudit: ambito e compatibilità](https://github.com/pgaudit/pgaudit)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Trigger e Event Trigger|Trigger e Event Trigger]]
- [[Programmazione/PostgreSQL/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/PostgreSQL/Pagine/Logical decoding|Logical decoding]]

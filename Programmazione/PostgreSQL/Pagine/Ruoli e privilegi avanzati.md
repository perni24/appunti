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
  - sicurezza
  - ruoli
aliases: []
prerequisites: []
related: []
title: Ruoli e privilegi avanzati
---

# Ruoli e privilegi avanzati

## Sintesi

Autenticarsi, ricevere un permesso e possedere una tabella sono cose diverse. Un ruolo `LOGIN` identifica una connessione; un ruolo `NOLOGIN` può possedere gli oggetti o raccogliere permessi comuni. L'applicazione non dovrebbe poter diventare owner solo perché deve leggere ordini.

## Progettare le autorizzazioni

| Domanda | Meccanismo | Limite |
| --- | --- | --- |
| Chi modifica lo schema? | Owner tecnico; l'operatore di migrazione assume quel ruolo | L'owner può alterare o eliminare i propri oggetti |
| Chi legge? | `USAGE` sullo schema e `SELECT` sulle tabelle necessarie | `USAGE` non concede accesso ai dati |
| Chi può annullare ordini? | `EXECUTE` su una funzione con operazione circoscritta | Non concedere anche l'`UPDATE` generico se vuoi imporre quel passaggio |

In PostgreSQL 18 una membership può permettere di ereditare i privilegi (`INHERIT`), assumere esplicitamente il ruolo (`SET`) o amministrarne la membership (`ADMIN`): sono scelte distinte. Non rendere il login applicativo membro del ruolo proprietario.

## Laboratorio: leggere una tabella, esporre una sola modifica

Database di prova vuoto; eseguire i blocchi in ordine nella stessa sessione amministrativa. La transazione finale viene annullata. `lab_runtime` è un ruolo di permessi che in produzione assegneresti a un login dedicato.

```sql
BEGIN;
CREATE ROLE lab_owner NOLOGIN;
CREATE ROLE lab_runtime NOLOGIN;
CREATE SCHEMA lab_acl AUTHORIZATION lab_owner;
SET ROLE lab_owner;
GRANT USAGE ON SCHEMA lab_acl TO lab_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA lab_acl
  GRANT SELECT ON TABLES TO lab_runtime;
CREATE TABLE lab_acl.orders (id integer PRIMARY KEY, status text NOT NULL);
INSERT INTO lab_acl.orders VALUES (1, 'pending');
```

I permessi predefiniti valgono per le **nuove** tabelle create da `lab_owner` nello schema, non per quelle preesistenti o create da un altro ruolo. Per le prime serve un `GRANT` sugli oggetti esistenti; per sequenze usate direttamente occorrono privilegi separati.

```sql
CREATE FUNCTION lab_acl.cancel_order(p_id integer) RETURNS integer
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, pg_temp
AS $$
  UPDATE lab_acl.orders SET status = 'cancelled'
  WHERE id = p_id AND status = 'pending' RETURNING id;
$$;
REVOKE ALL ON FUNCTION lab_acl.cancel_order(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lab_acl.cancel_order(integer) TO lab_runtime;
RESET ROLE;
SET ROLE lab_runtime;
```

La funzione opera come il proprietario, qui un ruolo senza privilegi amministrativi. Usa nomi qualificati, uno `search_path` controllato e pubblica la funzione e i suoi grant nella stessa transazione. Il contratto consente al chiamante di annullare **qualsiasi** ordine pendente di questo laboratorio: in un servizio multiutente servirebbe anche un controllo su quali ordini può gestire.

```sql
SELECT has_table_privilege(current_user, 'lab_acl.orders', 'UPDATE') AS update_diretto;
SELECT lab_acl.cancel_order(1) AS annullato;
SELECT status FROM lab_acl.orders WHERE id = 1;
ROLLBACK;
```

Attesi `false`, `1`, `cancelled`. Il controllo determinante è il privilegio **effettivo** del ruolo, che può arrivare anche da membership o da `PUBLIC`: revocare un singolo grant non annulla gli altri. Controlla anche chi può creare oggetti negli schemi usati dalle funzioni privilegiate.

## Fonti

[PostgreSQL 18: membership dei ruoli](https://www.postgresql.org/docs/18/role-membership.html) · [Privilegi predefiniti](https://www.postgresql.org/docs/18/sql-alterdefaultprivileges.html) · [Sicurezza delle funzioni](https://www.postgresql.org/docs/18/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
- [[Programmazione/PostgreSQL/Pagine/Row Level Security|Row Level Security]]
- [[Programmazione/PostgreSQL/Pagine/Audit logging|Audit logging]]

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
  - Gestione Utenti e Ruoli
prerequisites: []
related: []
title: Gestione Utenti e Ruoli in PostgreSQL
---

# Gestione Utenti e Ruoli in PostgreSQL

## Sintesi

I ruoli sono globali al cluster. `LOGIN` permette di presentarsi all'autenticazione; per lavorare servono anche accesso al database e privilegi sui singoli oggetti. Un ruolo `NOLOGIN` può essere un proprietario tecnico o un gruppo di permessi: non è un account che deve avere una password.

## Separare i compiti

| Identità | Compito |
|---|---|
| Proprietario delle migrazioni | Crea e modifica lo schema. Non è l'identità runtime. |
| Gruppo `NOLOGIN` | Raccoglie i privilegi di lettura o scrittura richiesti; si assegna agli utenti tramite membership. |
| Ruolo `LOGIN` | Identifica l'utente o il servizio. Non assegnargli `SUPERUSER`, `CREATEROLE`, `CREATEDB` o `REPLICATION` per risolvere un normale errore SQL. |

## Esempio: lettore di tabelle esistenti e future

Nel **database di prova**, esegui i tre blocchi in ordine, nella stessa sessione amministrativa, con i nomi `lab_*` liberi. La transazione finale viene annullata: nessun account o schema dell'esempio resta nel cluster.

```sql
BEGIN;
CREATE ROLE lab_owner NOLOGIN;
CREATE ROLE lab_read NOLOGIN;
CREATE ROLE lab_analyst LOGIN;
GRANT lab_read TO lab_analyst;
CREATE SCHEMA lab_reports AUTHORIZATION lab_owner;
SET LOCAL ROLE lab_owner;
CREATE TABLE lab_reports.today (id integer);
GRANT USAGE ON SCHEMA lab_reports TO lab_read;
GRANT SELECT ON ALL TABLES IN SCHEMA lab_reports TO lab_read;
```

Il `GRANT … ON ALL TABLES` copre solo le tabelle **già esistenti**. Per quelle future imposta i default del ruolo che effettivamente creerà gli oggetti, nel database e nello schema corretti:

```sql
ALTER DEFAULT PRIVILEGES FOR ROLE lab_owner IN SCHEMA lab_reports
    GRANT SELECT ON TABLES TO lab_read;
CREATE TABLE lab_reports.tomorrow (id integer);
RESET ROLE;
```

Verifica il risultato dal punto di vista dell'utente. Attesi: `true` per le prime tre colonne, `false` per l'ultima.

```sql
SELECT has_schema_privilege('lab_analyst', 'lab_reports', 'USAGE') AS entra,
       has_table_privilege('lab_analyst', 'lab_reports.today', 'SELECT') AS legge_oggi,
       has_table_privilege('lab_analyst', 'lab_reports.tomorrow', 'SELECT') AS legge_domani,
       has_table_privilege('lab_analyst', 'lab_reports.today', 'INSERT') AS scrive;
ROLLBACK;
```

La prova verifica l'autorizzazione, **non** un login. Per un account persistente con autenticazione password, imposta il segreto con `\password nome_ruolo` in `psql` o con il sistema di gestione segreti; non copiarlo in un `CREATE ROLE … PASSWORD '…'` in cronologia o negli appunti.

## Adattare a un'applicazione

- `USAGE` sullo schema consente di risolvere i nomi, non di leggere tabelle. `CREATE` permette di creare oggetti nello schema: al runtime di solito non serve.
- Per un ruolo di scrittura concedi solo le operazioni richieste sulle tabelle. Se un default usa `nextval` su una sequenza (ad esempio `serial`), verifica anche `USAGE` sulla sequenza: i grant sulle tabelle non lo includono.
- I default sono del **creatore**: se le migrazioni creano oggetti come un altro ruolo, quelli di `lab_owner` non si applicano. Per revocare un accesso considera anche membership, proprietà e privilegi concessi a `PUBLIC` (tutti i ruoli).

**Fonti:** [ruoli e appartenenza](https://www.postgresql.org/docs/18/role-membership.html), [privilegi sugli oggetti](https://www.postgresql.org/docs/18/ddl-priv.html) e [ALTER DEFAULT PRIVILEGES](https://www.postgresql.org/docs/18/sql-alterdefaultprivileges.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/PostgreSQL/Pagine/Row Level Security|Row Level Security]]
- [[Programmazione/PostgreSQL/Pagine/Secret management|Secret management]]

---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - postgresql
  - promemoria
  - ruoli
  - privilegi
  - rls
aliases:
  - Cheatsheet sicurezza PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Gestione Utenti e Ruoli]]"
  - "[[Programmazione/PostgreSQL/Pagine/Row Level Security]]"
title: PostgreSQL - Ruoli, privilegi e RLS
---

# PostgreSQL - Ruoli, privilegi e RLS

`GRANT` decide **quali operazioni** può fare un ruolo; RLS decide **su quali righe**. Esegui i blocchi in ordine, nella stessa connessione amministrativa a un cluster di prova. I ruoli sono globali al cluster: servono nomi liberi. Il `ROLLBACK` finale annulla tutto.

## Separare proprietario, gruppo e identità

```sql
BEGIN;
CREATE ROLE memo_doc_owner NOLOGIN;
CREATE ROLE memo_doc_editor NOLOGIN;
CREATE ROLE memo_doc_ada NOLOGIN;
CREATE ROLE memo_doc_teo NOLOGIN;
GRANT memo_doc_editor TO memo_doc_ada, memo_doc_teo;
CREATE SCHEMA memo_docs AUTHORIZATION memo_doc_owner;
SET LOCAL ROLE memo_doc_owner;
```

Il proprietario crea gli oggetti; Ada e Teo ereditano i privilegi del gruppo, non la proprietà. Sono `NOLOGIN` perché il laboratorio simula le identità con `SET LOCAL ROLE`. Per connessioni reali servono un ruolo `LOGIN`, autenticazione configurata e `CONNECT` al database: il solo `CONNECT` non concede accesso alle tabelle. Non salvare password negli script.

## Concedere soltanto il necessario

```sql
CREATE TABLE memo_docs.documents (
    id serial PRIMARY KEY, author name NOT NULL DEFAULT current_user, title text NOT NULL
);
INSERT INTO memo_docs.documents (author, title)
VALUES ('memo_doc_ada', 'Alfa'), ('memo_doc_teo', 'Beta');
GRANT USAGE ON SCHEMA memo_docs TO memo_doc_editor;
GRANT SELECT, INSERT, UPDATE ON memo_docs.documents TO memo_doc_editor;
GRANT USAGE ON SEQUENCE memo_docs.documents_id_seq TO memo_doc_editor;
```

`USAGE` sullo schema permette di raggiungere la tabella. Per questo `serial` serve anche `USAGE` sulla sequenza durante gli inserimenti. Non abbiamo concesso `DELETE`.

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA memo_docs GRANT SELECT ON TABLES TO memo_doc_editor;
CREATE TABLE memo_docs.notices (title text);
```

Il default vale per le **future tabelle create da questo proprietario** nello schema; non modifica quelle esistenti né abilita RLS. Usalo soltanto se ogni nuova tabella deve essere leggibile dal gruppo. Per una sola tabella usa `GRANT ... ON nome_tabella`; `ON ALL TABLES IN SCHEMA` riguarda invece quelle già presenti. Le sequenze hanno grant e default separati.

## Filtrare righe esistenti e controllare quelle nuove

```sql
ALTER TABLE memo_docs.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_docs ON memo_docs.documents TO memo_doc_editor
    USING (author = current_user) WITH CHECK (author = current_user);
RESET ROLE;
SET LOCAL ROLE memo_doc_ada;
```

Qui ogni persona ha un ruolo distinto. Con un unico login applicativo `current_user` non distingue gli utenti finali. Il modello con contesto per richiesta è nella [[Programmazione/PostgreSQL/Pagine/Row Level Security|nota RLS]]: un parametro scelto dal client non prova l'identità.

```sql
SELECT title FROM memo_docs.documents ORDER BY id;
INSERT INTO memo_docs.documents (title) VALUES ('Bozza') RETURNING author, title;
UPDATE memo_docs.documents SET title = 'Nuovo titolo' WHERE title = 'Beta' RETURNING id;
```

Ada legge solo `Alfa` e inserisce `Bozza` a proprio nome. L'UPDATE su `Beta` restituisce **zero righe**, non un errore (`USING`). Un INSERT che attribuisse la riga a Teo fallirebbe invece con `42501` (`WITH CHECK`).

## Verificare con la seconda identità e revocare

```sql
RESET ROLE;
SET LOCAL ROLE memo_doc_teo;
SELECT current_user, title FROM memo_docs.documents ORDER BY id;
SELECT has_table_privilege(current_user, 'memo_docs.notices', 'SELECT') AS future_read,
       has_table_privilege(current_user, 'memo_docs.documents', 'DELETE') AS can_delete;
```

Attesi `memo_doc_teo, Beta` e poi `true, false`. Un test fatto come superuser o proprietario non dimostra l'isolamento del runtime. `FORCE ROW LEVEL SECURITY` può assoggettare il proprietario alle policy; non limita superuser o ruoli `BYPASSRLS`.

```sql
RESET ROLE;
SET LOCAL ROLE memo_doc_owner;
REVOKE UPDATE ON memo_docs.documents FROM memo_doc_editor;
SELECT has_table_privilege('memo_doc_ada', 'memo_docs.documents', 'UPDATE') AS can_update;
ROLLBACK;
```

Qui `can_update` è falso. Una revoca da un gruppo non annulla privilegi ricevuti anche da altre appartenenze o da `PUBLIC`. Per i grant espliciti consulta `information_schema.role_table_grants`; per il permesso effettivo usa `has_table_privilege`, che **non** indica quali righe ammette RLS.

## Approfondimento

- PostgreSQL 18: [privilegi predefiniti](https://www.postgresql.org/docs/18/sql-alterdefaultprivileges.html) e [policy sulle righe](https://www.postgresql.org/docs/18/ddl-rowsecurity.html).

- [[Programmazione/PostgreSQL/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
- [[Programmazione/PostgreSQL/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/PostgreSQL/Pagine/Row Level Security|Row Level Security]]
- [[Programmazione/PostgreSQL/Pagine/Schemi e Search Path|Schemi e Search Path]]
- [[Programmazione/PostgreSQL/Pagine/Secret management|Secret management]]
- [[Programmazione/PostgreSQL/Pagine/SSL e TLS|SSL e TLS]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]

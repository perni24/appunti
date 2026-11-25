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
  - fdw
aliases: []
prerequisites: []
related: []
title: FDW
---

# FDW

## Sintesi

Un *foreign data wrapper* permette di interrogare dati esterni attraverso una tabella locale. Con `postgres_fdw` i dati restano nell'altro database: non vengono importati né replicati. Se il server remoto è lento o non è raggiungibile, anche la query locale può rallentare o fallire.

## I quattro oggetti da distinguere

| Oggetto | Domanda a cui risponde |
| --- | --- |
| Estensione `postgres_fdw` | Quale wrapper si usa per parlare con PostgreSQL? |
| `SERVER` | A quale database remoto si apre la connessione? |
| `USER MAPPING` | Con quale identità remota agisce uno specifico ruolo locale? |
| `FOREIGN TABLE` | Quali colonne, tipi e oggetto remoto vede il client locale? |

## Laboratorio: due database, accesso in sola lettura

Occorrono due database di prova distinti. Nel **remoto** esiste il login ordinario `lab_fdw_reader`, autenticato con SCRAM. Nel **locale** esiste il ruolo `lab_fdw_client`. L'amministratore ha predisposto per il processo server locale un servizio libpq `lab_fdw_source` che indica host, porta e database remoto. In produzione configura TLS con verifica del server; non salvare password in URI, file SQL versionati o log.

**Sul remoto**, come proprietario, crea i dati e assegna solo accesso in lettura:

```sql
CREATE SCHEMA lab_source;
CREATE TABLE lab_source.orders (id integer PRIMARY KEY, amount integer NOT NULL);
INSERT INTO lab_source.orders VALUES (1, 5), (2, 25), (3, 40);
GRANT USAGE ON SCHEMA lab_source TO lab_fdw_reader;
GRANT SELECT ON lab_source.orders TO lab_fdw_reader;
```

**Sul locale**, come amministratore, con nomi liberi ed estensione disponibile ma non installata:

```sql
CREATE EXTENSION postgres_fdw;
CREATE SERVER lab_orders_server FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (service 'lab_fdw_source');
CREATE SCHEMA lab_foreign;
CREATE FOREIGN TABLE lab_foreign.orders (id integer, amount integer)
  SERVER lab_orders_server OPTIONS (schema_name 'lab_source', table_name 'orders');
GRANT USAGE ON FOREIGN SERVER lab_orders_server TO lab_fdw_client;
GRANT USAGE ON SCHEMA lab_foreign TO lab_fdw_client;
GRANT SELECT ON lab_foreign.orders TO lab_fdw_client;
```

Predisponi il mapping sul locale con il processo autorizzato di distribuzione delle credenziali. Il seguente è uno script **psql**: `remote_password` deve essere fornita come variabile da un canale protetto; non è un placeholder SQL del server. `:'remote_password'` quota il valore come letterale, **non** lo nasconde dal logging. Proteggi anche cataloghi, backup e accesso amministrativo.

```psql
CREATE USER MAPPING FOR lab_fdw_client SERVER lab_orders_server
  OPTIONS (user 'lab_fdw_reader', password :'remote_password');
```

**Sul locale**, come `lab_fdw_client`, osserva prima le righe poi il piano stimato:

```sql
SELECT id, amount FROM lab_foreign.orders WHERE amount >= 20 ORDER BY id;
```

```sql
EXPLAIN (VERBOSE, COSTS OFF)
SELECT id, amount FROM lab_foreign.orders WHERE amount >= 20 ORDER BY id;
```

Attesi `2, 25` e `3, 40`. Nel piano cerca `Foreign Scan` e il campo `Remote SQL`: il confronto sugli interi può essere inviato al remoto (*pushdown*). La sola presenza di `Foreign Scan` non prova che tutti i filtri o join siano stati trasferiti. Tipi o collazioni incoerenti e funzioni non trasferibili possono cambiare il piano o i risultati.

## Quando preferire altro

- Un `GRANT` locale non dà automaticamente accesso sul remoto e viceversa. Non risolvere un errore di mapping elevando il ruolo applicativo a superuser. Verifica quale ruolo effettivo sta interrogando la foreign table.
- `IMPORT FOREIGN SCHEMA` crea definizioni locali, non copie dei dati né un aggiornamento automatico se lo schema remoto cambia. Altri wrapper, per esempio `file_fdw`, hanno capacità e opzioni diverse.
- Alcune foreign table possono anche accettare scritture se permessi e opzioni lo consentono. Non presumere un commit atomico distribuito tra sistemi indipendenti. Se il servizio deve leggere anche con il remoto indisponibile, valuta replica o import periodico invece di una query federata.

## Fonte

[PostgreSQL 18: postgres_fdw, mapping, pushdown e transazioni](https://www.postgresql.org/docs/18/postgres-fdw.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Gestione delle Estensioni|Gestione delle Estensioni]]
- [[Programmazione/PostgreSQL/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]

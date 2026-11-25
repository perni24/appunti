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
  - migrazioni
  - versionamento
aliases: []
prerequisites: []
related: []
title: Versionamento database
---

# Versionamento database

## Sintesi

Git dice **quali migrazioni sono previste**; il registro del database dice **quali sono state applicate a quel database**. Nessuno dei due, da solo, prova che lo schema reale corrisponda al previsto: una modifica manuale può introdurre una divergenza (*drift*) senza cambiare il registro.

## Che cosa tenere nel repository

Conserva script ordinati e identificati in modo univoco, compresi vincoli, grant, funzioni, trigger e viste necessari all'app. Dopo l'applicazione in un ambiente condiviso considera immutabile una migrazione versionata: una correzione è un nuovo file. Uno snapshot dello schema aiuta a confrontare ambienti, ma non descrive come trasformare i dati esistenti.

Flyway, Liquibase, Alembic e i runner degli ORM hanno convenzioni diverse. Verifica nel tuo strumento ordinamento, controllo dei checksum, esclusione di due deploy simultanei e gestione delle operazioni non transazionali. Non costruire un secondo registro manuale accanto a quello del runner.

## Laboratorio: rendere atomici schema e registro

Database di prova vuoto, un solo esecutore, ruolo autorizzato a creare tabelle, `psql` in autocommit. La tabella qui sotto illustra il principio: non implementa un runner di produzione, checksum o coordinamento dei deploy.

```sql
CREATE TABLE lab_schema_history (
  version integer PRIMARY KEY, description text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE lab_accounts (id integer PRIMARY KEY);
```

Questo blocco rappresenta una migrazione transazionale, ad esempio `V001__account_timezone.sql`. Un vero runner deve fermarsi al primo errore.

```sql
BEGIN;
ALTER TABLE lab_accounts ADD COLUMN timezone text;
INSERT INTO lab_schema_history (version, description) VALUES (1, 'account timezone');
COMMIT;
```

```sql
SELECT h.version, h.description, c.column_name
FROM lab_schema_history AS h
JOIN information_schema.columns AS c
  ON c.table_schema = current_schema() AND c.table_name = 'lab_accounts'
 AND c.column_name = 'timezone'
WHERE h.version = 1;
```

Atteso `1, account timezone, timezone`. Se l'inserimento nel registro fallisce **prima del commit**, viene annullata anche l'aggiunta della colonna. Per verificare questo comportamento su un database usa e getta, parti dalla versione 1 e prova una nuova colonna insieme a una registrazione che riutilizza la chiave 1: dopo il rollback la nuova colonna deve essere assente. Un file già applicato non va rilanciato alla cieca.

## Decidere dopo un errore

| Situazione | Decisione |
| --- | --- |
| Migrazione transazionale fallita | Verifica rollback, schema e versione applicata; risolvi la causa prima di riprovare |
| Passo non transazionale interrotto | Confronta il catalogo con lo stato atteso, per esempio la validità di un indice concorrente; non segnare «eseguito» sulla fiducia |
| Migrazione riuscita ma app incompatibile | Se lo schema è ancora compatibile, ripristina la versione applicativa; altrimenti pianifica una migrazione correttiva in avanti |
| Script già applicato e poi modificato in Git | Confronta contenuto o checksum con il rilascio originale e distribuisci una nuova versione; non riscrivere la cronologia per far passare il controllo |

In CI prova due percorsi: ricreazione da zero e upgrade dalla versione precedente con dati rappresentativi. Verifica comportamento e vincoli, non solo il numero della versione. Una migrazione inversa può rimuovere una colonna ma non ricostruisce automaticamente i dati eliminati; un restore può invece perdere le scritture successive al backup.

## Fonte

[PostgreSQL 18: atomicità delle transazioni](https://www.postgresql.org/docs/18/tutorial-transactions.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Migrazioni schema|Migrazioni schema]]
- [[Programmazione/PostgreSQL/Pagine/Strategie zero-downtime|Strategie zero-downtime]]
- [[Programmazione/PostgreSQL/Pagine/Backup e Ripristino|Backup e Ripristino]]

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
  - wal
  - replicazione
aliases: []
prerequisites: []
related: []
title: Logical decoding
---

# Logical decoding

## Sintesi

Il *logical decoding* trasforma i record del WAL in modifiche logiche interpretabili da un consumer. Un **output plugin** decide il formato; uno **slot logico** tiene traccia del punto di lettura per un database. Non ottieni lo storico precedente alla creazione dello slot né gli accessi in lettura: non è un audit completo.

## Laboratorio: osservare senza consumare

Su un primario PostgreSQL 18 di prova servono `wal_level=logical`, uno slot libero, il modulo server `test_decoding` e un ruolo autorizzato alla replica e alla creazione della tabella. `test_decoding` è un output plugin: non serve `CREATE EXTENSION test_decoding`. Esegui i blocchi nella **stessa connessione**, con autocommit e nomi riservati al laboratorio. Usiamo una tabella ordinaria: le modifiche a tabelle temporanee non sono l'esempio giusto per il WAL.

```sql
CREATE TABLE public.lab_cdc (id integer PRIMARY KEY, status text NOT NULL);
```

```sql
SELECT slot_name FROM pg_create_logical_replication_slot(
  'lab_cdc_demo', 'test_decoding', true
);
```

Il terzo argomento crea uno slot **temporaneo**: deve essere usato prima che la sessione termini. Ora separa un commit da una transazione annullata:

```sql
INSERT INTO public.lab_cdc VALUES (1, 'confermato');
BEGIN;
INSERT INTO public.lab_cdc VALUES (2, 'annullato');
ROLLBACK;
```

```sql
SELECT data FROM pg_logical_slot_peek_changes(
  'lab_cdc_demo', NULL, NULL, 'skip-empty-xacts', '1'
) WHERE data LIKE 'table public.lab_cdc:%';
```

Ripeti questa lettura: ritrovi l'inserimento di `id=1`, non quello annullato. `peek` lascia il flusso disponibile; il filtro mostra soltanto le righe di interesse e nasconde i delimitatori di transazione del plugin.

```sql
SELECT data FROM pg_logical_slot_get_changes(
  'lab_cdc_demo', NULL, NULL, 'skip-empty-xacts', '1'
) WHERE data LIKE 'table public.lab_cdc:%';
```

`get_changes` **consuma** le modifiche lette. Senza altre scritture, una seconda chiamata non mostra più quella riga. Il `WHERE` filtra l'output SQL, non ciò che viene consumato dallo slot: non usarlo per «conservare gli altri eventi» di uno slot in uso da un servizio.

## Controllare lo slot e chiudere la prova

```sql
SELECT slot_name, plugin, temporary, restart_lsn, confirmed_flush_lsn
FROM pg_replication_slots WHERE slot_name = 'lab_cdc_demo';
```

`confirmed_flush_lsn` indica fin dove il consumer ha confermato il flusso; `restart_lsn` delimita il WAL più vecchio che può ancora servire. Non sono la stessa posizione. Chiudi la connessione per liberare lo slot temporaneo; la tabella ordinaria resta nel database di prova. Non eliminare né consumare manualmente uno slot di produzione per vedere «cosa contiene».

## Dal laboratorio alla CDC

La replica logica nativa usa `pgoutput` con publication/subscription; un connettore CDC come Debezium deve supportare il protocollo e il formato scelti. Per un caricamento completo coordina uno snapshot iniziale con il punto di partenza del flusso. Per UPDATE/DELETE verifica la replica identity: non viene garantita una copia integrale della vecchia riga in ogni caso.

Uno slot persistente può trattenere WAL anche quando il consumer è disconnesso; limiti di retention o invalidazione possono impedirne la ripresa. Monitora spazio e avanzamento. Se il consumer cade dopo aver applicato un evento ma prima della conferma, può riceverlo di nuovo: coordina checkpoint e scrittura sul destinatario o rendi l'elaborazione idempotente. Evita anche l'errore opposto, confermare prima che il dato sia durevole.

## Fonti

[PostgreSQL 18: concetti del logical decoding](https://www.postgresql.org/docs/18/logicaldecoding-explanation.html) · [Funzioni per leggere gli slot](https://www.postgresql.org/docs/18/functions-admin.html) · [Plugin test_decoding](https://www.postgresql.org/docs/18/test-decoding.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
- [[Programmazione/PostgreSQL/Pagine/Replicazione Logica|Replicazione Logica]]
- [[Programmazione/PostgreSQL/Pagine/Pattern outbox|Pattern outbox]]

---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - postgres
  - wal
  - replicazione
aliases: []
prerequisites: []
related: []
---

# Logical decoding

## Sintesi

Il **logical decoding** trasforma modifiche registrate nel WAL in un flusso logico di eventi, consumabile da replica logica, Change Data Capture e sistemi esterni.

## Quando usarlo

Usalo quando ti serve osservare o trasmettere cambiamenti:

- Change Data Capture;
- integrazione con Kafka o sistemi di streaming;
- audit avanzato;
- sincronizzazione verso altri database;
- replication slot logici;
- debug della replicazione logica.

## Come funziona

PostgreSQL scrive modifiche nel WAL. Con `wal_level = logical`, un output plugin puo decodificare quei record in eventi leggibili.

Un logical replication slot mantiene la posizione del consumer. Finche il consumer non avanza, PostgreSQL trattiene WAL necessario. Questo evita perdita eventi, ma puo riempire disco se il consumer si ferma.

## API / Sintassi

Creare uno slot logico:

```sql
SELECT * FROM pg_create_logical_replication_slot('cdc_slot', 'test_decoding');
```

Leggere cambiamenti:

```sql
SELECT * FROM pg_logical_slot_get_changes('cdc_slot', NULL, NULL);
```

Controllare slot:

```sql
SELECT
  slot_name,
  plugin,
  slot_type,
  active,
  restart_lsn,
  confirmed_flush_lsn
FROM pg_replication_slots;
```

## Esempio pratico

Flusso minimo:

```sql
SELECT * FROM pg_create_logical_replication_slot('events_slot', 'test_decoding');

INSERT INTO events (type, payload)
VALUES ('user.created', '{"id": 1}'::jsonb);

SELECT * FROM pg_logical_slot_get_changes('events_slot', NULL, NULL);
```

In produzione si usano spesso plugin e connector dedicati, per esempio Debezium.

## Varianti

- `test_decoding`: plugin utile per test.
- `pgoutput`: plugin usato dalla replicazione logica nativa.
- Plugin CDC esterni.
- Slot logici temporanei.
- Slot logici persistenti.
- Decoding integrato in pipeline di streaming.

## Errori comuni

- Dimenticare che slot non consumati trattengono WAL.
- Non monitorare lag.
- Trattare eventi come se fossero exactly-once senza progettazione.
- Usare logical decoding senza spazio disco adeguato.
- Non gestire riconnessioni del consumer.
- Confondere logical decoding con audit completo a livello applicativo.

## Checklist

- `wal_level` e impostato a `logical`?
- Gli slot logici sono monitorati?
- Esiste alert sulla crescita WAL?
- Il consumer salva la propria posizione?
- Gli eventi sono idempotenti lato consumer?
- E chiaro cosa succede se il consumer resta fermo?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
- [[Programmazione/Postgres/Pagine/Replicazione Logica|Replicazione Logica]]
- [[Programmazione/Postgres/Pagine/Pattern outbox|Pattern outbox]]

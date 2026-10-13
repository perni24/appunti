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
  - timeseries
aliases: []
prerequisites: []
related: []
title: TimescaleDB
---

# TimescaleDB

## Sintesi

TimescaleDB e un'estensione PostgreSQL orientata a dati time-series. Aggiunge hypertable, compressione, continuous aggregates e funzioni utili per metriche/eventi temporali.

## Quando usarlo

Usala per metriche, IoT, eventi temporali, osservabilita, prezzi storici o dati append-only con query per intervallo di tempo.

## Come funziona

Una hypertable divide automaticamente i dati in chunk temporali. Le query restano SQL, ma TimescaleDB gestisce partizionamento temporale e ottimizzazioni.

## API / Sintassi

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;

SELECT create_hypertable('metrics', 'time');
```

Tabella:

```sql
CREATE TABLE metrics (
  time timestamptz NOT NULL,
  device_id text NOT NULL,
  value double precision NOT NULL
);
```

## Esempio pratico

Aggregazione temporale:

```sql
SELECT time_bucket('1 hour', time) AS bucket, avg(value)
FROM metrics
WHERE time >= now() - interval '7 days'
GROUP BY bucket
ORDER BY bucket;
```

## Varianti

- Hypertable.
- Chunk temporali.
- Compressione.
- Retention policy.
- Continuous aggregates.
- Time bucket.

## Errori comuni

- Usarlo per dati non temporali.
- Non definire bene chunk interval.
- Ignorare retention e compressione.
- Trattarlo come sostituto di ogni partizionamento.
- Non verificare supporto nel provider usato.

## Checklist

- I dati sono davvero time-series?
- Le query filtrano per tempo?
- Retention e compressione sono definite?
- Il provider supporta TimescaleDB?
- Gli indici includono tempo e dimensioni principali?

## Collegamenti

- [[Programmazione/PostgreSQL/Pagine/Partitioning|Partitioning]]
- [[Programmazione/PostgreSQL/Pagine/Gestione delle Estensioni|Gestione delle Estensioni]]
- [[Programmazione/PostgreSQL/Pagine/Metriche e alerting|Metriche e alerting]]


## Navigazione

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]

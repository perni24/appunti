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

TimescaleDB mantiene una sola tabella logica per l'applicazione, ma organizza le righe in **chunk** sulla dimensione temporale. È utile quando si inseriscono misure nel tempo e le letture, le aggregazioni o la retention riguardano intervalli temporali. Un chunk è un'unità fisica di archiviazione; un *bucket* è un gruppo calcolato da una query: le due ampiezze non devono coincidere.

## Laboratorio: chunk giornalieri, medie orarie

Esempio per PostgreSQL 18 e TimescaleDB **2.23.1**, con l'estensione disponibile sul server, correttamente precaricata e già abilitata nel database di prova. La sintassi `CREATE TABLE ... WITH (tsdb.hypertable, ...)` è disponibile da TimescaleDB 2.20. Per le versioni con la precedente API `create_hypertable` occorre prima creare la tabella da convertire; non combinare entrambe le procedure. Esegui i blocchi in ordine nella stessa sessione, con schema `public` scrivibile e nome libero.

```sql
BEGIN;
SET LOCAL TIME ZONE 'UTC';
CREATE TABLE public.lab_misure (
  istante timestamptz NOT NULL,
  sensore text NOT NULL,
  valore numeric NOT NULL,
  PRIMARY KEY (sensore, istante)
) WITH (tsdb.hypertable, tsdb.partition_column = 'istante',
        tsdb.chunk_interval = '1 day');
INSERT INTO public.lab_misure VALUES
  ('2026-01-01 23:10+00', 'A', 10), ('2026-01-01 23:50+00', 'A', 20),
  ('2026-01-02 00:05+00', 'A', 30), ('2026-01-02 00:05+00', 'B', 80);
```

La chiave univoca include la colonna di partizionamento. Ometterla da una PK o da un indice unico non garantirebbe l'unicità tra chunk. Le due misure alla stessa ora sono ammesse perché appartengono a sensori diversi.

```sql
SELECT time_bucket(INTERVAL '1 hour', istante) AS ora,
       count(*) AS campioni, round(avg(valore), 1) AS media
FROM public.lab_misure
WHERE sensore = 'A'
  AND istante >= TIMESTAMPTZ '2026-01-01 23:00+00'
  AND istante <  TIMESTAMPTZ '2026-01-02 01:00+00'
GROUP BY ora ORDER BY ora;
```

Attesi due gruppi UTC: alle 23 due campioni con media **15**, alle 00 un campione con media **30**. Il limite finale escluso rende contigui due intervalli senza contare due volte il confine. Le ore senza campioni non producono righe; «nessun campione» non significa «misura zero».

```sql
SELECT count(*) AS chunk
FROM timescaledb_information.chunks
WHERE hypertable_schema = 'public' AND hypertable_name = 'lab_misure';
ROLLBACK;
```

Attesi **due chunk**, uno per giorno toccato. Il rollback elimina il laboratorio, non l'estensione. Scegli il vero intervallo di chunk in base al volume inserito, agli indici attivi e alle finestre di lettura, non in base al `GROUP BY` dell'esempio.

## Scelte operative

- **Hypertable o partizioni native?** Se bastano poche partizioni con intervalli prevedibili, valuta prima il partizionamento PostgreSQL. TimescaleDB aggiunge gestione dei chunk e funzionalità time-series da verificare sul provider.
- **Aggregati continui:** materializzano riepiloghi e li aggiornano secondo una politica. Definisci la finestra di refresh pensando anche a dati tardivi; non presumere che il risultato sia sempre aggiornato all'ultimo inserimento.
- **Columnstore/compressione e retention:** ridurre lo spazio di dati storici non significa cancellarli. Una retention policy, invece, elimina chunk scaduti: confronta la finestra con backup, aggregati e necessità di rilettura prima di abilitarla.

## Fonti

[TimescaleDB: creazione delle hypertable](https://www.tigerdata.com/docs/reference/timescaledb/hypertables/create_table) · [time_bucket](https://www.tigerdata.com/docs/reference/timescaledb/hyperfunctions/time-series-utilities/time_bucket) · [Release 2.23.1](https://github.com/timescale/timescaledb/releases/tag/2.23.1)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Partitioning|Partitioning]]
- [[Programmazione/PostgreSQL/Pagine/Gestione delle Estensioni|Gestione delle Estensioni]]
- [[Programmazione/PostgreSQL/Pagine/Metriche e alerting|Metriche e alerting]]

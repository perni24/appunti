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
  - views
aliases: []
prerequisites: []
related: []
title: Views e Materialized Views
---

# Views e Materialized Views

## Sintesi

Una **vista** conserva la definizione di una query e legge i dati visibili alla query corrente. Una **vista materializzata** conserva invece **le righe** prodotte al momento della creazione o dell'ultimo refresh. La domanda decisiva non è solo «quanto costa il report?», ma anche «quanto possono essere vecchi i dati quando lo leggo?».

## Esperimento: lo stesso totale prima e dopo il refresh

Usa un database di prova su cui puoi creare uno schema. I due blocchi vanno eseguiti nella stessa sessione, iniziando con lo schema `lab_view_demo` **inesistente**. I nomi sono qualificati; `ROLLBACK` annulla anche la creazione dello schema. Se un passaggio fallisce, esegui `ROLLBACK` prima di riprovare.

```sql
BEGIN;
CREATE SCHEMA lab_view_demo;
CREATE TABLE lab_view_demo.sales (day date NOT NULL, amount integer NOT NULL);
INSERT INTO lab_view_demo.sales VALUES (DATE '2026-05-01', 10);
CREATE VIEW lab_view_demo.daily AS
  SELECT day, sum(amount) AS total FROM lab_view_demo.sales GROUP BY day;
CREATE MATERIALIZED VIEW lab_view_demo.daily_cache AS
  SELECT day, total FROM lab_view_demo.daily;
CREATE UNIQUE INDEX daily_cache_day ON lab_view_demo.daily_cache (day);
```

```sql
INSERT INTO lab_view_demo.sales VALUES (DATE '2026-05-01', 7);
SELECT v.total AS live, m.total AS cached
FROM lab_view_demo.daily AS v JOIN lab_view_demo.daily_cache AS m USING (day);
REFRESH MATERIALIZED VIEW CONCURRENTLY lab_view_demo.daily_cache;
SELECT v.total AS live, m.total AS refreshed
FROM lab_view_demo.daily AS v JOIN lab_view_demo.daily_cache AS m USING (day);
ROLLBACK;
```

Prima del refresh: `17 | 10`. Dopo: `17 | 17`. Il primo inserimento nel secondo blocco **non** invalida automaticamente la copia. Una vista normale non è una cache o una promessa di maggiore velocità; la materializzata può avere indici propri.

## Scegliere il refresh

- `REFRESH MATERIALIZED VIEW` ricalcola la vista e può bloccare le letture concorrenti. `CONCURRENTLY` permette ai lettori di continuare a consultarla durante il refresh; non è un aggiornamento incrementale né una garanzia di minor durata.
- Per la forma concorrente la vista deve essere **già popolata** e avere almeno un indice `UNIQUE` su sole colonne, che copra tutte le righe: un indice parziale o su espressione non basta. Con `WITH NO DATA` la vista non è interrogabile: il primo popolamento richiede un refresh non concorrente. Sulla stessa vista materializzata si esegue un solo refresh alla volta.
- Per un report, stabilisci chi pianifica il refresh, con quali privilegi e quale ritardo è accettabile. Se il dato deve riflettere subito una scrittura, leggi la tabella o la vista ordinaria.

## Scritture e permessi

Una vista ordinaria semplice su una singola tabella può essere automaticamente aggiornabile; la vista aggregata dell'esempio no. `WITH CHECK OPTION` può impedire scritture che renderebbero una riga invisibile tramite la vista. Pubblicare solo alcune colonne non revoca i permessi già concessi sulla tabella. `security_invoker` riguarda **di chi** si controllano i privilegi sulle relazioni sottostanti; `security_barrier` limita certe riorganizzazioni dei filtri. Non sono opzioni intercambiabili.

**Fonti PostgreSQL 18:** [CREATE VIEW](https://www.postgresql.org/docs/18/sql-createview.html), [REFRESH MATERIALIZED VIEW](https://www.postgresql.org/docs/18/sql-refreshmaterializedview.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Common Table Expressions e Recursive Queries|Common Table Expressions e Recursive Queries]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/PostgreSQL/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]

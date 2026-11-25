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
  - Statistiche e Query Planner
prerequisites: []
related: []
title: Statistiche e Query Planner in PostgreSQL
---

# Statistiche e Query Planner in PostgreSQL

## Sintesi

Il planner non conta tutte le righe prima di scegliere un piano: stima quante supereranno ciascun filtro (**cardinalità**) e usa la stima per confrontare i costi. Una stima errata già nella scansione iniziale può moltiplicare l'errore in un join. Creare un indice aggiunge un percorso di accesso; non insegna automaticamente al planner che due colonne descrivono lo stesso fatto.

## Esperimento: due filtri, una sola informazione

Esegui i blocchi in ordine nella stessa sessione. In questi dati ciascuna regione ha una sola zona con lo stesso codice. Ogni codice compare 100 volte su 10.000 righe. Non ci sono indici: vogliamo cambiare **la stima**, non il metodo di accesso.

```sql
BEGIN;
CREATE TEMP TABLE lab_zones AS
SELECT i % 100 AS region, i % 100 AS zone FROM generate_series(1,10000) AS g(i);
ANALYZE lab_zones;
SELECT attname, null_frac, n_distinct FROM pg_stats
WHERE schemaname = pg_my_temp_schema()::regnamespace::text AND tablename = 'lab_zones'
ORDER BY attname;
```

```sql
EXPLAIN (ANALYZE, TIMING OFF)
SELECT * FROM lab_zones WHERE region = 7 AND zone = 7;
```

Le statistiche di ciascuna colonna sono corrette: 100 valori distinti e nessun nullo. Ma assumendo indipendenza il calcolo sarebbe `10000 × 0,01 × 0,01 = 1`, mentre le righe restituite sono **100**. Controlla `rows` stimato accanto a `actual rows` sul nodo di scansione.

```sql
CREATE STATISTICS pg_temp.lab_zones_dep (dependencies) ON region, zone FROM lab_zones;
ANALYZE lab_zones;
EXPLAIN (ANALYZE, TIMING OFF)
SELECT * FROM lab_zones WHERE region = 7 AND zone = 7;
ROLLBACK;
```

`CREATE STATISTICS` registra cosa osservare; è il successivo `ANALYZE` che raccoglie i dati. Nel campione la stima si avvicina a **100** mentre il risultato resta identico. Anche se la scansione resta sequenziale, la correzione può contare per un join a valle. Le dipendenze statistiche **non** sono vincoli: non impediscono di inserire una regione con un'altra zona.

## Scegliere la statistica giusta

| Segnale | Informazione da consultare | Come interpretarla |
| --- | --- | --- |
| Un singolo valore è molto più frequente degli altri | `most_common_vals` e `most_common_freqs` in `pg_stats` | L'istogramma descrive la distribuzione rimanente; `null_frac` misura i nulli, `avg_width` la larghezza media |
| Il numero di valori distinti cresce con la tabella | `n_distinct` | Positivo: numero stimato. Negativo: frazione del numero di righe, ad esempio `-0.5` indica circa un distinto ogni due righe |
| Due filtri di uguaglianza sulla stessa tabella non sono indipendenti | `dependencies` oppure `mcv` | Le dipendenze aiutano con uguaglianze a costanti o liste compatibili; `mcv` descrive combinazioni frequenti. Non aspettarti che correggano in generale intervalli o join tra tabelle |
| Il planner sbaglia il numero di gruppi multicolonna | `ndistinct` su quelle colonne | Stima il numero di combinazioni distinte; non è un indice per `GROUP BY` |

## Diagnosi prima della configurazione

Dopo import o variazioni importanti controlla `last_analyze` **e** `last_autoanalyze` in `pg_stat_user_tables`. `ANALYZE` può campionare i dati, quindi le stime possono cambiare leggermente tra esecuzioni. Se una sola colonna ha una distribuzione difficile, valuta un target più alto con `ALTER TABLE ... ALTER COLUMN ... SET STATISTICS`, poi riesegui `ANALYZE`: un target alto richiede più raccolta e spazio.

`seq_page_cost` e `random_page_cost` esprimono costi relativi delle pagine; `cpu_tuple_cost` e `cpu_index_tuple_cost` rappresentano lavoro CPU. `effective_cache_size` è una stima per il planner, **non** riserva RAM. Con `LIMIT` può contare più il costo per ottenere le prime righe che il costo per restituirle tutte. Non dedurre un valore di `random_page_cost` dalla sola presenza di un SSD: confronta query rappresentative prima di cambiare un parametro globale.

**Fonti PostgreSQL 18:** [statistiche del planner](https://www.postgresql.org/docs/18/planner-stats.html), [parametri di costo](https://www.postgresql.org/docs/18/runtime-config-query.html#RUNTIME-CONFIG-QUERY-CONSTANTS).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Indici|Tipi di Indici]]
- [[Programmazione/PostgreSQL/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]

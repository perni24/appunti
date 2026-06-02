---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Manutenzione]
prerequisites: []
related: []
---

# Manutenzione in PostgreSQL

## Sintesi

La manutenzione mantiene sane tabelle, indici e statistiche. In PostgreSQL e particolarmente importante perche MVCC crea versioni multiple delle righe, che devono essere ripulite da `VACUUM`.

## Quando usarlo

Usa questa nota quando devi prevenire degrado progressivo o diagnosticare crescita anomala:

- molte `UPDATE` o `DELETE`;
- tabelle e indici crescono troppo;
- query peggiorano per statistiche obsolete;
- autovacuum non riesce a stare al passo;
- serve ricostruire indici;
- dopo import, migrazioni o cancellazioni massive.

## Come funziona

`VACUUM` rimuove tuple morte e rende lo spazio riutilizzabile nella tabella. `ANALYZE` aggiorna le statistiche usate dal planner. `REINDEX` ricostruisce indici gonfi o corrotti.

`VACUUM FULL` riscrive fisicamente la tabella e restituisce spazio al sistema operativo, ma richiede un lock pesante. Va pianificato con cautela.

Autovacuum esegue `VACUUM` e `ANALYZE` in background quando vengono superate soglie di modifiche. Su tabelle molto attive i valori di default possono essere troppo lenti.

## API / Sintassi

```sql
VACUUM table_name;
VACUUM ANALYZE table_name;
ANALYZE table_name;
REINDEX TABLE table_name;
```

Operazioni piu invasive:

```sql
VACUUM FULL table_name;
REINDEX INDEX CONCURRENTLY index_name;
```

Monitoraggio:

```sql
SELECT
  relname,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

## Esempio pratico

Dopo un import massivo:

```sql
ANALYZE orders;
```

Dopo una cancellazione massiva:

```sql
VACUUM ANALYZE orders;
```

Se un indice e molto gonfio:

```sql
REINDEX INDEX CONCURRENTLY orders_customer_id_idx;
```

## Varianti

- `VACUUM`: pulizia ordinaria senza lock esclusivo pesante.
- `VACUUM FULL`: riscrittura completa e recupero spazio su disco.
- `ANALYZE`: aggiornamento statistiche.
- `REINDEX`: ricostruzione indici.
- `CLUSTER`: riscrive la tabella ordinandola secondo un indice.
- `pgstattuple`: estensione per misurare bloat.

## Errori comuni

- Disabilitare autovacuum.
- Usare `VACUUM FULL` in produzione senza finestra di manutenzione.
- Ignorare sessioni lunghe che impediscono la pulizia.
- Non eseguire `ANALYZE` dopo import massivi.
- Confondere spazio riutilizzabile con spazio restituito al sistema operativo.
- Ricostruire indici senza misurare il problema.

## Checklist

- Autovacuum e attivo?
- Le tabelle piu scritte hanno soglie adatte?
- Ci sono molte tuple morte?
- Esistono sessioni `idle in transaction`?
- Le statistiche sono aggiornate dopo grandi modifiche?
- Operazioni invasive sono pianificate fuori dai picchi?

## Collegamenti

- [[Programmazione/Postgres/Pagine/MVCC|MVCC]]
- [[Programmazione/Postgres/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
- [[Programmazione/Postgres/Pagine/Tipi di Indici|Tipi di Indici]]

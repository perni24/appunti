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
  - Manutenzione
prerequisites: []
related: []
title: Manutenzione in PostgreSQL
---

# Manutenzione in PostgreSQL

## Sintesi

Tre sintomi richiedono verifiche diverse: **stime sbagliate** nel piano, **vecchie versioni** da recuperare e **file fisicamente troppo grandi**. `ANALYZE` aggiorna le statistiche; `VACUUM` rende riutilizzabile spazio e mantiene informazioni di visibilità; una riscrittura fisica è un intervento diverso. Non scegliere il comando dalla sola dimensione della tabella.

## VACUUM e ANALYZE

Usa una sessione di prova con **autocommit attivo**, senza racchiudere i blocchi in `BEGIN`. `VACUUM` non può essere eseguito in un blocco di transazione. Le operazioni seguenti toccano solo una tabella temporanea che scompare chiudendo la connessione.

```sql
CREATE TEMP TABLE lab_pages (id integer, payload text);
INSERT INTO lab_pages SELECT i, repeat('x', 160) FROM generate_series(1,10000) AS g(i);
ANALYZE lab_pages;
SELECT count(*) AS live_rows, pg_relation_size('lab_pages') AS heap_bytes FROM lab_pages;
```

```sql
DELETE FROM lab_pages WHERE id % 2 = 0;
VACUUM (ANALYZE, TRUNCATE FALSE) lab_pages;
SELECT count(*) AS live_rows, pg_relation_size('lab_pages') AS heap_bytes FROM lab_pages;
```

La prima lettura conta **10.000** righe, la seconda **5.000**. La dimensione della heap può restare identica: abbiamo cancellato righe distribuite nelle pagine e disabilitato esplicitamente il troncamento della coda del file **per questa prova**. Lo spazio liberato può essere usato da scritture successive. `pg_relation_size` qui misura il file principale della tabella, non il totale con tutti gli indici. Le dimensioni in byte non sono un risultato universale.

- Dopo un grosso caricamento interessa spesso `ANALYZE`: aggiorna le stime di distribuzione ma non recupera le vecchie tuple.
- Dopo molte modifiche, `VACUUM` ordinario recupera le versioni che non servono più agli snapshot, mantiene la *visibility map* e contribuisce al freezing contro il wraparound. Normalmente consente letture e scritture concorrenti; il possibile troncamento delle pagine libere finali ha esigenze di lock diverse.
- `VACUUM (ANALYZE)` combina le due attività. Su tabelle temporanee devi occupartene nella tua sessione: i worker autovacuum non possono accedervi.

## Bloat

Il *bloat* è spazio occupato oltre quello necessario ai dati e alla struttura utile. **Non coincide con `n_dead_tup`**: la statistica è una stima delle tuple morte, non un conteggio dei byte sprecati. Anche con poche tuple morte possono esserci molte pagine parzialmente vuote; un certo margine libero è utile se la tabella ricresce.

Prima di decidere, confronta andamento della heap e degli indici, volume di aggiornamenti, snapshot trattenuti e possibilità di riuso. Se disponibile e autorizzata, l'estensione `pgstattuple` aiuta a misurare la distribuzione dello spazio; una misura completa comporta un costo di lettura.

| Obiettivo | Operazione da valutare | Costo o limite |
| --- | --- | --- |
| Restituire al filesystem spazio della tabella che non servirà più | `VACUUM FULL` | Riscrive la tabella, richiede spazio temporaneo e un lock `ACCESS EXCLUSIVE`; non è manutenzione ordinaria |
| Ricostruire un indice specifico | `REINDEX INDEX`, eventualmente `CONCURRENTLY` su un oggetto supportato | Agisce sull'indice, non compatta la heap. La modalità concorrente richiede più lavoro, spazio e attese e non va eseguita dentro `BEGIN` |
| Riscrivere la tabella nell'ordine di un indice | `CLUSTER` | Richiede un lock esclusivo; l'ordine fisico non viene mantenuto automaticamente dopo nuove scritture |

## Autovacuum

Sulle tabelle ordinarie autovacuum avvia **vacuum e analyze con criteri distinti**. Per capire se sia in ritardo, considera dimensione della tabella, frequenza delle modifiche, durata delle transazioni, soglie e risorse dei worker. Una vecchia transazione o uno slot che trattiene un orizzonte di visibilità può limitare la pulizia anche quando il worker gira.

Query di sola lettura, da eseguire nel database interessato (esclude le tabelle temporanee della sessione):

```sql
SELECT s.schemaname, s.relname, s.n_live_tup, s.n_dead_tup,
       s.last_vacuum, s.last_autovacuum, s.last_analyze, s.last_autoanalyze
FROM pg_stat_user_tables AS s
JOIN pg_class AS c ON c.oid = s.relid
WHERE c.relpersistence <> 't'
ORDER BY s.n_dead_tup DESC, s.relid LIMIT 10;
```

Un timestamp nullo non basta a diagnosticare un guasto: il contatore può essere stato azzerato o una tabella può essere recente. Verifica attività e andamento prima di modificare soglie per tabella. Non disabilitare autovacuum per ottenere un confronto di piani.

**Fonti PostgreSQL 18:** [manutenzione ordinaria e autovacuum](https://www.postgresql.org/docs/18/routine-vacuuming.html), [opzioni di VACUUM](https://www.postgresql.org/docs/18/sql-vacuum.html), [REINDEX](https://www.postgresql.org/docs/18/sql-reindex.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/MVCC|MVCC]]
- [[Programmazione/PostgreSQL/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Indici|Tipi di Indici]]

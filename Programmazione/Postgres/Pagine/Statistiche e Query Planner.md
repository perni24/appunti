---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [postgresql, database]
aliases: [Statistiche e Query Planner]
prerequisites: []
related: []
---

# Statistiche e Query Planner in PostgreSQL

## Sintesi

Il planner confronta percorsi di esecuzione usando un modello di costo, statistiche sui dati, operatori disponibili, indici e struttura della query. Stime imprecise sulle cardinalità possono propagarsi nel piano e portare a join, scansioni o ordinamenti inefficienti.

Il **Query Planner** (o Optimizer) sceglie il percorso con costo stimato minore. Le statistiche sono fondamentali, ma la scelta dipende anche dai cost parameters, dagli access path disponibili, dagli operatori e dalla forma della query.

## Quando usarlo

Usa questa nota quando una query sceglie un piano inatteso o peggiora dopo cambi di dati:

- PostgreSQL usa `Seq Scan` anche se esiste un indice;
- `EXPLAIN ANALYZE` mostra grande differenza tra `rows` stimate e reali;
- dopo import massivi le query diventano lente;
- colonne correlate portano il planner a sottostimare o sovrastimare;
- devi capire se servono `ANALYZE`, statistiche estese o indici diversi.

## Come funziona

### Concetto chiave
PostgreSQL utilizza un **Cost-Based Optimizer (CBO)**. Il Planner stima il "costo" di diverse strategie di esecuzione (es. usare un indice vs scansione sequenziale) e sceglie quella con il costo totale minimo. La qualità di questa scelta dipende direttamente dall'accuratezza delle statistiche.

---
### Come vengono raccolte le Statistiche?
Le statistiche non sono aggiornate in tempo reale a ogni `INSERT` o `UPDATE` (sarebbe troppo costoso). Vengono raccolte dal processo **Autovacuum** o tramite il comando manuale `ANALYZE`.

### Il comando ANALYZE
```sql
ANALYZE nome_tabella;
```
Questo comando campiona casualmente una porzione della tabella e aggiorna la tabella di sistema `pg_statistic` (accessibile in modo più leggibile tramite la vista `pg_stats`).

---
### Cosa analizza il Planner? (pg_stats)
Per ogni colonna di ogni tabella, PostgreSQL memorizza dati cruciali:

1.  **null_frac:** Frazione di righe con valori NULL.
2.  **avg_width:** Larghezza media della colonna in byte.
3.  **n_distinct:** Numero stimato di valori distinti. Se negativo (es. `-1`), indica la frazione di righe (es. `-1` = tutti i valori sono univoci).
4.  **Most Common Values (MCV):** Una lista dei valori più frequenti e le loro frequenze.
5.  **Histogram Bounds:** Per colonne con molti valori, divide i dati in "secchi" (buckets) di uguale dimensione per stimare la distribuzione dei valori non presenti nei MCV.

> [!INFO] Logic Layer: Selettività
> La **Selettività** è la frazione di righe che una condizione (es. `WHERE età > 30`) restituirà. Il Planner moltiplica la selettività per il numero totale di righe per ottenere le `rows` stimate che vediamo in [[Programmazione/Postgres/Pagine/Analisi delle Query|EXPLAIN]].

---
### Il Calcolo del Costo
Il costo è una combinazione di diversi fattori configurabili nel `postgresql.conf`:

- `seq_page_cost` (default `1.0`): Costo per leggere una pagina dal disco sequenzialmente.
- `random_page_cost` (default `4.0`): Costo per un accesso casuale (tipico degli indici).
- `cpu_tuple_cost` (default `0.01`): Costo per processare una singola riga.
- `cpu_index_tuple_cost` (default `0.005`): Costo per processare una riga durante una scansione dell'indice.

> [!TIP] SSD vs HDD
> Se usi un SSD, il valore di `random_page_cost` dovrebbe essere abbassato (es. a `1.1`), poiché la differenza tra accesso sequenziale e casuale è minima rispetto a un disco meccanico.

---
### Problemi Comuni e Correlazioni
Il Planner assume che le colonne siano **indipendenti**. Se hai una query con `WHERE città = 'Roma' AND cap = '00100'`, il Planner moltiplicherà le probabilità di entrambi, ottenendo una stima molto più bassa del reale (perché le due colonne sono correlate).

### Statistiche Estese (Extended Statistics)
Per risolvere questo problema, puoi creare statistiche sulle correlazioni tra colonne:
```sql
CREATE STATISTICS stts_geo (dependencies) ON citta, cap FROM indirizzi;
ANALYZE indirizzi;
```

---
### Debugging delle Statistiche
Se `EXPLAIN ANALYZE` mostra una discrepanza enorme tra le righe stimate e quelle reali:
1.  **Controlla l'ultima analisi:** `SELECT last_analyze FROM pg_stat_user_tables;`
2.  **Aumenta il campionamento:** Se i dati sono molto variegati, aumenta il dettaglio delle statistiche per una colonna:
    ```sql
    ALTER TABLE ordini ALTER COLUMN totale SET STATISTICS 500; -- Default 100
    ANALYZE ordini;
    ```

---

## API / Sintassi

Aggiornare statistiche:

```sql
ANALYZE table_name;
ANALYZE table_name (column_name);
VACUUM ANALYZE table_name;
```

Leggere statistiche:

```sql
SELECT
  attname,
  null_frac,
  n_distinct,
  most_common_vals,
  most_common_freqs
FROM pg_stats
WHERE schemaname = 'public'
  AND tablename = 'orders';
```

Aumentare dettaglio statistico:

```sql
ALTER TABLE orders
ALTER COLUMN status SET STATISTICS 500;

ANALYZE orders;
```

Statistiche estese:

```sql
CREATE STATISTICS orders_customer_status_stats
  (dependencies, ndistinct)
ON customer_id, status
FROM orders;

ANALYZE orders;
```

## Esempio pratico

Diagnosi di stime sbagliate:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM orders
WHERE customer_id = 42
  AND status = 'pending';
```

Se il piano mostra:

```text
rows=10 actual rows=50000
```

il planner sta sottostimando. Possibili azioni:

```sql
ANALYZE orders;

CREATE STATISTICS orders_customer_status_stats
  (dependencies)
ON customer_id, status
FROM orders;

ANALYZE orders;
```

Poi si riesegue `EXPLAIN (ANALYZE, BUFFERS)` e si confrontano stime, tempi e strategia scelta.

## Varianti

- Statistiche standard raccolte da `ANALYZE`.
- Statistiche estese `dependencies` per colonne correlate.
- Statistiche estese `ndistinct` per combinazioni di valori distinti.
- Statistiche estese `mcv` per combinazioni di valori frequenti.
- Parametri di costo come `random_page_cost` e `effective_cache_size`.
- Autovacuum/autanalyze per aggiornamento automatico.

## Errori comuni

- Guardare solo il tempo totale senza confrontare `rows` stimate e reali.
- Creare indici quando il problema sono statistiche obsolete.
- Cambiare parametri globali di costo per risolvere una singola query.
- Dimenticare `ANALYZE` dopo import o migrazioni massicce.
- Non considerare correlazioni tra colonne.
- Aspettarsi che le statistiche siano aggiornate in tempo reale.

## Checklist

- Confrontare `rows` e `actual rows` nel piano.
- Eseguire `ANALYZE` dopo grandi variazioni di dati.
- Controllare `pg_stats` per colonne usate nei filtri.
- Creare statistiche estese se piu colonne sono correlate.
- Verificare che gli indici siano coerenti con filtri e ordinamenti.
- Non modificare parametri globali senza misurazioni ripetibili.

## Collegamenti

- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Tipi di Indici|Tipi di Indici]]
- [[Programmazione/Postgres/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]

## Fonti

- [PostgreSQL - Planner Statistics](https://www.postgresql.org/docs/current/planner-stats.html)
- [PostgreSQL - Planner Cost Constants](https://www.postgresql.org/docs/current/runtime-config-query.html#RUNTIME-CONFIG-QUERY-CONSTANTS)

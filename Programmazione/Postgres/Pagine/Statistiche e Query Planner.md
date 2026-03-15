---
date: 2026-03-15
tags:
  - database
  - postgres
  - performance
  - architecture
type: #permanent-note
status: evergreen
---

# Statistiche e Query Planner in PostgreSQL

Il **Query Planner** (o Optimizer) è il "cervello" di PostgreSQL che decide il percorso più efficiente per eseguire una query. Questa decisione non è casuale, ma si basa interamente sulle **Statistiche** raccolte sui dati.

## 💡 Concetto Chiave
PostgreSQL utilizza un **Cost-Based Optimizer (CBO)**. Il Planner stima il "costo" di diverse strategie di esecuzione (es. usare un indice vs scansione sequenziale) e sceglie quella con il costo totale minimo. La qualità di questa scelta dipende direttamente dall'accuratezza delle statistiche.

---

## 📊 Come vengono raccolte le Statistiche?

Le statistiche non sono aggiornate in tempo reale a ogni `INSERT` o `UPDATE` (sarebbe troppo costoso). Vengono raccolte dal processo **Autovacuum** o tramite il comando manuale `ANALYZE`.

### Il comando ANALYZE
```sql
ANALYZE nome_tabella;
```
Questo comando campiona casualmente una porzione della tabella e aggiorna la tabella di sistema `pg_statistic` (accessibile in modo più leggibile tramite la vista `pg_stats`).

---

## 🔍 Cosa analizza il Planner? (pg_stats)

Per ogni colonna di ogni tabella, PostgreSQL memorizza dati cruciali:

1.  **null_frac:** Frazione di righe con valori NULL.
2.  **avg_width:** Larghezza media della colonna in byte.
3.  **n_distinct:** Numero stimato di valori distinti. Se negativo (es. `-1`), indica la frazione di righe (es. `-1` = tutti i valori sono univoci).
4.  **Most Common Values (MCV):** Una lista dei valori più frequenti e le loro frequenze.
5.  **Histogram Bounds:** Per colonne con molti valori, divide i dati in "secchi" (buckets) di uguale dimensione per stimare la distribuzione dei valori non presenti nei MCV.

> [!INFO] Logic Layer: Selettività
> La **Selettività** è la frazione di righe che una condizione (es. `WHERE età > 30`) restituirà. Il Planner moltiplica la selettività per il numero totale di righe per ottenere le `rows` stimate che vediamo in [[Programmazione/Postgres/Pagine/Analisi delle Query|EXPLAIN]].

---

## ⚙️ Il Calcolo del Costo

Il costo è una combinazione di diversi fattori configurabili nel `postgresql.conf`:

- `seq_page_cost` (default `1.0`): Costo per leggere una pagina dal disco sequenzialmente.
- `random_page_cost` (default `4.0`): Costo per un accesso casuale (tipico degli indici).
- `cpu_tuple_cost` (default `0.01`): Costo per processare una singola riga.
- `cpu_index_tuple_cost` (default `0.005`): Costo per processare una riga durante una scansione dell'indice.

> [!TIP] SSD vs HDD
> Se usi un SSD, il valore di `random_page_cost` dovrebbe essere abbassato (es. a `1.1`), poiché la differenza tra accesso sequenziale e casuale è minima rispetto a un disco meccanico.

---

## 🚧 Problemi Comuni e Correlazioni

Il Planner assume che le colonne siano **indipendenti**. Se hai una query con `WHERE città = 'Roma' AND cap = '00100'`, il Planner moltiplicherà le probabilità di entrambi, ottenendo una stima molto più bassa del reale (perché le due colonne sono correlate).

### Statistiche Estese (Extended Statistics)
Per risolvere questo problema, puoi creare statistiche sulle correlazioni tra colonne:
```sql
CREATE STATISTICS stts_geo (dependencies) ON citta, cap FROM indirizzi;
ANALYZE indirizzi;
```

---

## 🛠️ Debugging delle Statistiche

Se `EXPLAIN ANALYZE` mostra una discrepanza enorme tra le righe stimate e quelle reali:
1.  **Controlla l'ultima analisi:** `SELECT last_analyze FROM pg_stat_user_tables;`
2.  **Aumenta il campionamento:** Se i dati sono molto variegati, aumenta il dettaglio delle statistiche per una colonna:
    ```sql
    ALTER TABLE ordini ALTER COLUMN totale SET STATISTICS 500; -- Default 100
    ANALYZE ordini;
    ```

---
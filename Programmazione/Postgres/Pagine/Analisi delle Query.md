---
date: 2026-05-14
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Analisi delle Query]
prerequisites: []
related: []
---
# Analisi delle Query in PostgreSQL

## Sintesi

Nota su Analisi delle Query in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

L'analisi delle query è il pilastro fondamentale per il **Database Tuning**. In PostgreSQL, questo processo ruota attorno alla comprensione del **Query Planner** e all'utilizzo del comando `EXPLAIN`.

## Concetto chiave
Il Query Planner (o Optimizer) riceve una query SQL e decide la strategia più efficiente per recuperare i dati, generando un **Piano di Esecuzione**. L'analisi consiste nel verificare se la scelta del Planner coincide con la realtà dei dati.

---

##  Lo Strumento: EXPLAIN

Il comando `EXPLAIN` mostra il piano di esecuzione senza eseguire la query (nella forma base).

### EXPLAIN ANALYZE
Per una diagnosi accurata, si usa quasi sempre `EXPLAIN ANALYZE`.
- **Esegue realmente la query.**
- Fornisce i tempi reali di esecuzione e il numero di righe processate.

```sql
-- Analisi completa con statistiche sui buffer di memoria
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) 
SELECT * FROM ordini WHERE cliente_id = 42;
```

> [!WARNING] Effetti Collaterali
> Poiché `EXPLAIN ANALYZE` esegue la query, se stai analizzando una `DELETE` o una `UPDATE`, i dati verranno modificati. Usa sempre un `ROLLBACK` in una transazione se non vuoi rendere permanenti i cambiamenti.

---

##  Anatomia di un Piano (Execution Nodes)

Un piano di esecuzione è un albero di **nodi**. Ogni nodo rappresenta un'operazione specifica.

### Metriche Fondamentali
1. **Cost**: Un'unità di misura arbitraria del planner. Il formato è `costo_avvio..costo_totale`.
2. **Rows**: Numero stimato di righe che il nodo restituirà.
3. **Actual Time**: Tempo reale speso in quel nodo (solo con `ANALYZE`).
4. **Loops**: Quante volte quel nodo è stato ripetuto.

---

##  Metodi di Accesso ai Dati (Scan Types)

PostgreSQL sceglie come leggere le tabelle in base agli indici disponibili e alla selettività della query:

| Metodo | Descrizione | Logic Layer |
| :--- | :--- | :--- |
| **Seq Scan** | Scansione sequenziale | Legge l'intera tabella. Efficiente solo per tabelle piccole o se deve leggere >20% dei dati. |
| **Index Scan** | Scansione tramite Indice | Usa l'indice per trovare i puntatori alle righe, poi legge i dati dalla tabella (Heap). |
| **Index Only Scan** | Solo Indice | Se tutte le colonne richieste sono nell'indice, evita del tutto di leggere la tabella. |
| **Bitmap Scan** | Scansione Ibrida | Crea una mappa di bit in memoria per raggruppare le letture su disco ed evitare accessi casuali eccessivi. |

---

##  Algoritmi di Join

Quando la query coinvolge più tabelle, il planner deve scegliere come unirle:

- **Nested Loop:** Per ogni riga della tabella A, cerca nella tabella B. Ideale se una delle due è piccola e l'altra è indicizzata.
- **Hash Join:** Crea una tabella hash in memoria per una delle tabelle. Molto veloce per join di uguaglianza su grandi volumi.
- **Merge Join:** Ordina entrambe le tabelle e le fonde. Usato se i dati sono già ordinati (es. tramite un [[Programmazione/Postgres/Pagine/Tipi di Indici|Indice B-Tree]]).

---

##  Il Ruolo delle Statistiche

Il Planner decide basandosi sulle statistiche memorizzate in `pg_statistic`.

> [!INFO] L'importanza di ANALYZE
> Se le statistiche sono obsolete (es. dopo un caricamento massivo di dati), il Planner potrebbe scegliere un piano disastroso. Il comando `ANALYZE nome_tabella` aggiorna manualmente questi dati.

### Discrepanze (Estimation Error)
Se noti una grande differenza tra `rows` (stimato) e `actual rows` (reale), significa che le statistiche sono vecchie o che la distribuzione dei dati è complessa (es. colonne correlate).

---

##  Strumenti Avanzati

1. **pg_stat_statements:** Estensione indispensabile per monitorare quali query consumano più risorse nel tempo.
2. **auto_explain:** Modulo per loggare automaticamente i piani delle query che superano una certa soglia di tempo.
3. **PEV (Postgres Explain Visualizer):** Strumenti online per visualizzare graficamente l'albero dei nodi e identificare immediatamente il "collo di bottiglia".

---

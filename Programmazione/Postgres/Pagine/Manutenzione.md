---
date: 2026-05-14
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

Nota su Manutenzione in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

## Concetto chiave
La manutenzione regolare è vitale per PostgreSQL a causa della sua architettura MVCC. Poiché Postgres non sovrascrive mai i dati ma crea nuove versioni delle righe, è necessario un processo di pulizia per recuperare lo spazio occupato dalle "tuple morte" (*bloat*) e aggiornare le statistiche per l'ottimizzatore.

---

##  Operazioni Fondamentali

### 1. VACUUM
Il comando `VACUUM` recupera lo spazio occupato dalle righe eliminate o aggiornate.
- **`VACUUM` (Standard):** Rimuove le tuple morte e rende lo spazio riutilizzabile per nuovi dati nella stessa tabella. Non blocca la tabella.
- **`VACUUM FULL`:** Riscrittura completa della tabella su disco. Recupera fisicamente lo spazio restituendolo al sistema operativo, ma richiede un **lock esclusivo** (tabella inaccessibile).

### 2. ANALYZE
Aggiorna le statistiche interne utilizzate dal **Query Planner** per scegliere il piano di esecuzione più efficiente.
```sql
ANALYZE nome_tabella;
# Manutenzione in PostgreSQL

## Sintesi

Nota su Manutenzione in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
```

### 3. REINDEX
Ricostruisce gli indici da zero. È utile se un indice è diventato inefficiente ("gonfio") o corrotto.
```sql
REINDEX TABLE nome_tabella;
```

---

##  Autovacuum (Il custode silenzioso)
Postgres include un demone chiamato **Autovacuum** che esegue automaticamente `VACUUM` e `ANALYZE` quando viene raggiunta una certa soglia di modifiche nelle tabelle.

> [!IMPORTANT] Tuning Autovacuum
> Per database ad alto traffico, i valori predefiniti potrebbero essere troppo conservativi. È fondamentale monitorare il "bloat" e regolare parametri come `autovacuum_vacuum_scale_factor` se le tabelle crescono troppo velocemente.

---

## Logic layer: Cos'è il Table Bloat?
Il **Bloat** si verifica quando la velocità di generazione delle tuple morte supera la velocità con cui l'Autovacuum riesce a pulirle.
- **Effetto:** Le tabelle e gli indici occupano molto più spazio del necessario.
- **Conseguenza:** Le performance calano drasticamente perché il motore deve leggere molte pagine di dati inutili dal disco (I/O inutile).

---

##  Tool di Monitoraggio
- **`pg_stat_user_tables`**: Per vedere quando è stato eseguito l'ultimo vacuum/analyze.
- **Estensione `pgstattuple`**: Per misurare esattamente la percentuale di bloat in una tabella.

---

##  Best Practices
- **Non disabilitare mai l'Autovacuum**: Farlo porterà quasi certamente alla corruzione delle performance nel tempo.
- **Pianifica VACUUM FULL con cautela**: Usalo solo durante finestre di manutenzione, poiché blocca completamente l'accesso ai dati.
- **Monitora gli indici**: Un `REINDEX` periodico su tabelle soggette a molti aggiornamenti può migliorare notevolmente la velocità delle query.

---

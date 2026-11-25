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
  - Gestione della Memoria
prerequisites: []
related: []
title: Gestione della Memoria in PostgreSQL
---

# Gestione della Memoria in PostgreSQL

## Sintesi

Per stimare la RAM servono tre domande distinte: quanta memoria è condivisa dall'istanza, quali operazioni possono allocare memoria locale e quanta cache il planner **stima** di poter sfruttare. Non tutti i parametri con un valore in MB riservano memoria.

## Come leggere i parametri

| Parametro | Che cosa significa |
|---|---|
| `shared_buffers` | Cache di pagine condivisa dai backend dell'istanza. Si affianca alla cache del sistema operativo; non è tutta la RAM usata da PostgreSQL. |
| `work_mem` | Budget di base per una singola operazione, ad esempio un sort. Non è prenotato per ogni connessione né è un tetto alla memoria della query. |
| `hash_mem_multiplier` | Moltiplica `work_mem` nel calcolo del limite per le operazioni hash. Un hash e un sort non hanno necessariamente lo stesso budget. |
| `maintenance_work_mem` | Budget per operazioni di manutenzione, ad esempio `VACUUM` o `CREATE INDEX`. Non è il budget per ogni `SELECT`. |
| `autovacuum_work_mem` | Budget per **worker** autovacuum; con `-1` usa `maintenance_work_mem`. Più worker possono operare contemporaneamente. |
| `effective_cache_size` | Stima del planner della cache disponibile per una query, inclusa la parte utile della cache del sistema operativo. Non alloca né riserva RAM. |

Per leggere valore e unità, senza modificare la configurazione (ad esempio `shared_buffers` può essere espresso in blocchi):

```sql
SELECT name, setting, unit
FROM pg_settings
WHERE name IN ('shared_buffers', 'work_mem', 'hash_mem_multiplier',
               'maintenance_work_mem', 'autovacuum_work_mem', 'effective_cache_size')
ORDER BY name;
```

## Esempio: osservare un sort che usa disco

Su un database di prova, esegui **tutto il blocco nella stessa sessione**, senza una transazione precedente aperta. I dati sono generati al momento. `EXPLAIN ANALYZE` esegue davvero la query; qui è una lettura limitata a 20.000 righe.

```sql
BEGIN;
SET LOCAL work_mem = '64kB';
EXPLAIN (ANALYZE, BUFFERS)
SELECT n FROM generate_series(1, 20000) AS g(n) ORDER BY n DESC;
ROLLBACK;
```

Cerca il nodo `Sort` e la riga `Sort Method`. `external merge` con `Disk` indica che l'ordinamento ha usato un file temporaneo; `quicksort` con `Memory` indica un sort in memoria. Non attribuire automaticamente ogni blocco temporaneo dell'intero piano al sort: guarda il nodo interessato.

Ripeti il blocco sostituendo **solo** `64kB` con `8MB`. Confronta il metodo, non un singolo tempo di esecuzione. Entrambi i valori sono didattici: `SET LOCAL` cessa alla fine della transazione; non cambia le altre sessioni né il default del server. Metodo e quantità esatte dipendono dal piano e dalla versione.

## Errore comune: moltiplicare per le connessioni sbagliate

Con `work_mem = 8MB`, tre sessioni che eseguono ciascuna due sort contemporanei possono avere **sei** budget di base, circa 48 MB solo per quei nodi. Non è una previsione della RAM residente: non tutti i nodi raggiungono il budget o si sovrappongono, altri piani usano hash e i worker paralleli possono aggiungere allocazioni proprie. Una connessione inattiva non alloca un sort solo perché è aperta.

Prima di cambiare il default, controlla il piano reale e la concorrenza nelle ore di punta; valuta una regolazione mirata per transazione. Aumentare insieme il numero dei backend e il budget per operazione può peggiorare la pressione sulla memoria.

**Fonti:** [risorse e parametri di memoria](https://www.postgresql.org/docs/18/runtime-config-resource.html) e [stima del planner: effective_cache_size](https://www.postgresql.org/docs/18/runtime-config-query.html#GUC-EFFECTIVE-CACHE-SIZE).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/PostgreSQL/Pagine/Connection Pooling|Connection Pooling]]
- [[Programmazione/PostgreSQL/Pagine/Configurazione|Configurazione]]

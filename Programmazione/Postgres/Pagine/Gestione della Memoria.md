---
date: 2026-05-14
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Gestione della Memoria]
prerequisites: []
related: []
---
# Gestione della Memoria in PostgreSQL

## Sintesi

Nota su Gestione della Memoria in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

## Concetto chiave
La gestione della memoria in PostgreSQL è suddivisa in due aree principali: la **Shared Memory** (condivisa tra tutti i processi) e la **Local Memory** (specifica per ogni singolo processo backend). Un corretto bilanciamento di queste aree è il fattore più critico per le performance del database.

---

##  Architettura della Memoria

### 1. Memoria Condivisa (Shared Memory)
Quest'area viene allocata dal Postmaster all'avvio del server ed è accessibile a tutti i processi backend e ausiliari.

| Componente | Parametro Config | Funzione |
| :--- | :--- | :--- |
| **Shared Buffers** | `shared_buffers` | La cache principale del DB. Contiene copie delle pagine di dati lette dal disco. |
| **WAL Buffers** | `wal_buffers` | Buffer temporaneo per i log delle transazioni prima di scriverli nei file WAL. |
| **CLOG** | (Interno) | Commit LOG: traccia lo stato delle transazioni (commit/abort) per l'isolamento (MVCC). |

### 2. Memoria Locale (Process-Local Memory)
Ogni processo backend alloca la propria memoria per eseguire le query. Questa memoria non è condivisa e viene liberata al termine dell'operazione.

| Componente | Parametro Config | Funzione |
| :--- | :--- | :--- |
| **Work Mem** | `work_mem` | Memoria usata per operazioni di **Sort** (ORDER BY) e **Hash** (JOIN). Allocata per ogni operazione di una query. |
| **Maintenance Work Mem** | `maintenance_work_mem` | Memoria usata per operazioni di manutenzione come `VACUUM`, `CREATE INDEX`, `ALTER TABLE`. |
| **Temp Buffers** | `temp_buffers` | Cache per le tabelle temporanee create nella sessione. |

---

## Logic layer: Come funziona il caching?

### Il doppio buffering (Double Buffering)
Postgres non scrive direttamente sul disco in modo sincrono. Quando una query richiede dei dati:
1.  Controlla se la pagina è negli **Shared Buffers**.
2.  Se non c'è, la richiede al **Sistema Operativo (OS)**.
3.  L'OS controlla la propria **OS Page Cache**.
4.  Se non disponibile nell'OS, viene letta dal disco.

> [!TIP] Tuning consigliato
> Per un server dedicato, una regola empirica comune è impostare `shared_buffers` al **25% della RAM totale** del sistema, lasciando il resto alla OS Page Cache per evitare ridondanze eccessive.

---

##  Attenzione al consumo di RAM
Il parametro `work_mem` è pericoloso perché viene allocato **per ogni operazione** di una query. Se una query complessa esegue 4 sort simultanei e ci sono 100 client connessi, il consumo totale sarà `4 * 100 * work_mem`. Un valore troppo alto può portare all'esaurimento della RAM (OOM Killer).

---

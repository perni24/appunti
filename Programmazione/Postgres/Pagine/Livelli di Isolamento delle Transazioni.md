---
date: 2026-05-14
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Livelli di Isolamento delle Transazioni]
prerequisites: []
related: []
---
# Livelli di Isolamento delle Transazioni in PostgreSQL

## Sintesi

Nota su Livelli di Isolamento delle Transazioni in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

L'isolamento è la "I" delle [[Programmazione/Postgres/Pagine/Proprietà ACID|Proprietà ACID]]. Determina come una transazione vede le modifiche apportate da altre transazioni concorrenti. PostgreSQL gestisce questi livelli tramite il meccanismo [[Programmazione/Postgres/Pagine/MVCC|MVCC]].

## Concetto chiave
Lo standard SQL definisce quattro livelli di isolamento, basati sulle anomalie che possono verificarsi durante l'esecuzione di query concorrenti. In PostgreSQL, il livello di default è **Read Committed**.

---

##  Anomalie dei Dati

| Anomalia | Descrizione |
| :--- | :--- |
| **Dirty Read** | Una transazione legge dati non ancora confermati (uncommitted) da un'altra. |
| **Non-repeatable Read** | Rileggendo la stessa riga, i dati sono cambiati perché un'altra transazione ha fatto COMMIT. |
| **Phantom Read** | Rieseguendo una query con filtro (es. `WHERE età > 20`), compaiono nuove righe inserite da altri. |
| **Serialization Anomaly** | Il risultato di un gruppo di transazioni non è coerente con nessuna esecuzione sequenziale. |

---

##  Livelli in PostgreSQL

PostgreSQL implementa i livelli in modo più rigoroso rispetto allo standard (es. non permette mai i Dirty Read).

### 1. Read Uncommitted
In molti DB permette di leggere dati "sporchi". In PostgreSQL **si comporta esattamente come Read Committed**.

### 2. Read Committed (Default)
Una query vede solo i dati confermati prima dell'inizio della query stessa (non della transazione).
- **Previene:** Dirty Read.
- **Caso d'uso:** Adatto alla maggior parte delle applicazioni web.

### 3. Repeatable Read
Tutte le query all'interno della transazione vedono lo stesso snapshot dei dati (quello esistente al momento della prima query della transazione).
- **Previene:** Dirty Read, Non-repeatable Read e (in Postgres) Phantom Read.
- **Errore di Serializzazione:** Se due transazioni tentano di modificare la stessa riga, la seconda fallirà con un errore di "concurrent update", richiedendo un riprovo (retry) dall'applicazione.

### 4. Serializable
Garantisce che il risultato sia identico a quello di un'esecuzione sequenziale delle transazioni.
- **Previene:** Tutte le anomalie, inclusa la *Serialization Anomaly*.
- **Costo:** È il livello più costoso in termini di performance perché richiede un monitoraggio attivo dei lock e delle dipendenze tra transazioni.

---

##  Come impostare il livello

Puoi impostare il livello per l'intera sessione o per una singola transazione:

```sql
-- Per la transazione corrente
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Per la sessione
SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

---

## Logic layer: Quale scegliere?

> [!TIP] Bilanciamento Performance/Rigore
> - **Read Committed:** Massimo throughput. Accetta che i dati possano cambiare tra una SELECT e l'altra nella stessa transazione.
> - **Repeatable Read:** Fondamentale per reportistica o batch processing dove i dati devono rimanere "congelati" per tutta la durata dell'operazione.
> - **Serializable:** Obbligatorio per logiche di business estremamente critiche (es. calcoli finanziari complessi su più tabelle correlate) dove le anomalie di scrittura (write skew) non sono tollerabili.

---

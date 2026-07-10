---
date: 2026-06-02
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

I livelli di isolamento stabiliscono quali cambiamenti concorrenti sono visibili e quali anomalie devono essere impedite. In PostgreSQL `READ UNCOMMITTED` si comporta come `READ COMMITTED`, mentre `REPEATABLE READ` usa uno snapshot stabile e `SERIALIZABLE` aggiunge il rilevamento dei conflitti con retry applicativo.

L'isolamento è la "I" delle [[Programmazione/Postgres/Pagine/Proprietà ACID|Proprietà ACID]]. Determina come una transazione vede le modifiche apportate da altre transazioni concorrenti. PostgreSQL gestisce questi livelli tramite il meccanismo [[Programmazione/Postgres/Pagine/MVCC|MVCC]].

## Quando usarlo

Usa questa nota quando una logica applicativa dipende da letture coerenti in presenza di concorrenza:

- trasferimenti di denaro o aggiornamenti di saldo;
- prenotazioni o assegnazioni di risorse limitate;
- report che devono vedere uno snapshot stabile;
- job concorrenti che modificano gli stessi dati;
- bug intermittenti dovuti a race condition;
- scelta tra throughput e garanzie piu forti.

## Come funziona

### Concetto chiave
Lo standard SQL definisce quattro livelli di isolamento, basati sulle anomalie che possono verificarsi durante l'esecuzione di query concorrenti. In PostgreSQL, il livello di default è **Read Committed**.

---
### Anomalie dei Dati
| Anomalia | Descrizione |
| :--- | :--- |
| **Dirty Read** | Una transazione legge dati non ancora confermati (uncommitted) da un'altra. |
| **Non-repeatable Read** | Rileggendo la stessa riga, i dati sono cambiati perché un'altra transazione ha fatto COMMIT. |
| **Phantom Read** | Rieseguendo una query con filtro (es. `WHERE età > 20`), compaiono nuove righe inserite da altri. |
| **Serialization Anomaly** | Il risultato di un gruppo di transazioni non è coerente con nessuna esecuzione sequenziale. |

---
### Livelli in PostgreSQL
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
### Come impostare il livello
Puoi impostare il livello per l'intera sessione o per una singola transazione:

```sql
-- Per la transazione corrente
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Per la sessione
SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

---
### Logic layer: Quale scegliere?
> [!TIP] Bilanciamento Performance/Rigore
> - **Read Committed:** Massimo throughput. Accetta che i dati possano cambiare tra una SELECT e l'altra nella stessa transazione.
> - **Repeatable Read:** Fondamentale per reportistica o batch processing dove i dati devono rimanere "congelati" per tutta la durata dell'operazione.
> - **Serializable:** Obbligatorio per logiche di business estremamente critiche (es. calcoli finanziari complessi su più tabelle correlate) dove le anomalie di scrittura (write skew) non sono tollerabili.

---

## API / Sintassi

```sql
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

Impostazione per sessione:

```sql
SET SESSION CHARACTERISTICS AS TRANSACTION
ISOLATION LEVEL REPEATABLE READ;
```

Controllo corrente:

```sql
SHOW transaction_isolation;
```

## Esempio pratico

Report coerente con `REPEATABLE READ`:

```sql
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

SELECT count(*) FROM orders WHERE status = 'paid';
SELECT sum(total_amount) FROM orders WHERE status = 'paid';

COMMIT;
```

Le due query leggono lo stesso snapshot, anche se altre transazioni inseriscono nuovi ordini pagati nel frattempo.

Transazione critica con retry applicativo:

```sql
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

UPDATE accounts
SET balance = balance - 100
WHERE id = 1;

UPDATE accounts
SET balance = balance + 100
WHERE id = 2;

COMMIT;
```

Con `SERIALIZABLE`, l'applicazione deve essere pronta a riprovare la transazione se PostgreSQL segnala una serialization failure.

## Varianti

- `READ UNCOMMITTED`: in PostgreSQL equivale a `READ COMMITTED`.
- `READ COMMITTED`: default, snapshot per singola query.
- `REPEATABLE READ`: snapshot stabile per tutta la transazione.
- `SERIALIZABLE`: risultato equivalente a una esecuzione seriale.
- `READ ONLY`: transazione che non modifica dati.
- `DEFERRABLE`: utile con `SERIALIZABLE READ ONLY` per attendere uno snapshot sicuro.

## Errori comuni

- Pensare che `READ COMMITTED` dia uno snapshot stabile per tutta la transazione.
- Usare `SERIALIZABLE` senza implementare retry.
- Tenere transazioni lunghe aperte mentre l'utente interagisce con l'applicazione.
- Confondere isolamento con lock espliciti.
- Risolvere race condition solo con controlli applicativi non protetti da transazione.
- Ignorare errori di serialization failure o deadlock.

## Checklist

- Il flusso richiede snapshot stabile o basta `READ COMMITTED`?
- Le transazioni critiche hanno retry applicativo?
- Le transazioni sono brevi?
- Le modifiche avvengono in ordine coerente per ridurre deadlock?
- Servono lock espliciti come `SELECT ... FOR UPDATE`?
- I test coprono accessi concorrenti?

## Collegamenti

- [[Programmazione/Postgres/Pagine/MVCC|MVCC]]
- [[Programmazione/Postgres/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
- [[Programmazione/Postgres/Pagine/Proprietà ACID|Proprietà ACID]]

## Fonti

- [PostgreSQL - Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL - Serializable Isolation](https://www.postgresql.org/docs/current/transaction-iso.html#XACT-SERIALIZABLE)

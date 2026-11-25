---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - postgresql
  - promemoria
  - transazioni
  - lock
aliases:
  - Cheatsheet transazioni PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/Livelli di Isolamento delle Transazioni]]"
  - "[[Programmazione/PostgreSQL/Pagine/Meccanismi di Locking]]"
title: PostgreSQL - Transazioni e lock
---

# PostgreSQL - Transazioni e lock

`BEGIN` raggruppa le operazioni, `COMMIT` le conferma, `ROLLBACK` le annulla. Un UPDATE che non trova righe **non è un errore**: per un trasferimento verifica sia l'addebito sia l'accredito (vedi [[Programmazione/PostgreSQL/Pagine/Proprietà ACID|esempio con controllo dei due saldi]]).

## Preparare dati visibili a due sessioni

Apri due connessioni **A** e **B** allo stesso database di prova. In A, con autocommit inizialmente attivo, prepara una tabella ordinaria: una TEMP non sarebbe visibile a B. Se lo schema esiste già, fermati.

```sql
BEGIN;
CREATE SCHEMA lab_tx;
CREATE TABLE lab_tx.jobs (id int PRIMARY KEY, status text NOT NULL);
INSERT INTO lab_tx.jobs VALUES (1,'pending'), (2,'pending'), (3,'pending');
COMMIT;
```

## Confermare solo una parte

```sql
BEGIN;
UPDATE lab_tx.jobs SET status = 'done' WHERE id = 3;
SAVEPOINT optional;
UPDATE lab_tx.jobs SET status = 'done' WHERE id = 2;
ROLLBACK TO SAVEPOINT optional;
COMMIT;
SELECT id, status FROM lab_tx.jobs ORDER BY id;
```

Risultato: 1 e 2 ancora `pending`, 3 `done`. Il savepoint annulla solo il lavoro successivo; un `ROLLBACK` completo avrebbe annullato anche il primo UPDATE.

| Isolamento | Promemoria |
|---|---|
| `READ COMMITTED` (predefinito) | Ogni SELECT ordinaria usa un nuovo snapshot |
| `REPEATABLE READ` | Snapshot stabile dalla prima istruzione che ne ha bisogno |
| `SERIALIZABLE` | Se ricevi `40001` ripeti **tutta** la transazione, non solo l'ultima query |

Scegli il livello all'inizio, per esempio `BEGIN ISOLATION LEVEL REPEATABLE READ;` oppure `BEGIN;` seguito da `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;` prima della prima lettura o scrittura.

## Prenotare senza aspettare: A poi B

**A** blocca il primo job. Lascia aperta la transazione:

```sql
BEGIN;
SELECT id FROM lab_tx.jobs WHERE id = 1 FOR UPDATE;
```

**B**, in autocommit, può fallire subito invece di attendere:

```sql
SELECT id FROM lab_tx.jobs WHERE id = 1 FOR UPDATE NOWAIT;
```

Risultato atteso: `55P03`. È una prova intenzionale; non eseguire tutti i blocchi come uno script che si interrompe al primo errore.

**B** sceglie invece un lavoro disponibile e ne salva la prenotazione nella stessa istruzione:

```sql
WITH candidate AS (
    SELECT id FROM lab_tx.jobs WHERE status = 'pending' ORDER BY id
    LIMIT 1 FOR UPDATE SKIP LOCKED
)
UPDATE lab_tx.jobs AS j SET status = 'running' FROM candidate AS c
WHERE j.id = c.id RETURNING j.id;
```

B ottiene 2. Senza UPDATE, il solo lock della SELECT si perderebbe alla fine della transazione. `SKIP LOCKED` serve a una coda, non a produrre un elenco completo.

## Osservare chi aspetta

Facoltativo, **prima di liberare A**: esegui in B la stessa SELECT di `NOWAIT` togliendo `NOWAIT`. B attende. Da una terza connessione allo stesso database, con visibilità sulle sessioni coinvolte:

```sql
SELECT pid, state, wait_event_type, wait_event, pg_blocking_pids(pid) AS blockers
FROM pg_stat_activity
WHERE datname = current_database() AND xact_start IS NOT NULL AND pid <> pg_backend_pid()
ORDER BY pid;
```

```sql
SELECT pid, locktype, mode FROM pg_locks WHERE NOT granted ORDER BY pid;
```

Nella prima query cerca il PID di A fra i bloccanti di B. La seconda elenca richieste non concesse nel cluster: un'attesa su una riga può apparire come lock su `transactionid`, non sulla tupla.

**A** libera il lock (ed eventualmente sblocca B):

```sql
ROLLBACK;
```

Ripetendo ora la prenotazione in B ottieni 1. Per lock di riga meno restrittivi valuta `FOR NO KEY UPDATE`, `FOR SHARE` o `FOR KEY SHARE` secondo quali modifiche devono confliggere.

## Lock di tabella e pulizia

A transazioni precedenti chiuse, questo blocco indipendente prende un lock sull'intera tabella: permette normali SELECT, ma confligge con le scritture. Il rollback lo rilascia.

```sql
BEGIN;
LOCK TABLE lab_tx.jobs IN SHARE MODE;
ROLLBACK;
```

Solo al termine, elimina i dati della prova:

```sql
DROP TABLE lab_tx.jobs;
DROP SCHEMA lab_tx;
```

## Approfondimento

- [PostgreSQL 18: lock espliciti](https://www.postgresql.org/docs/18/explicit-locking.html) e [clausole di lock di SELECT](https://www.postgresql.org/docs/18/sql-select.html#SQL-FOR-UPDATE-SHARE).

- [[Programmazione/PostgreSQL/Pagine/Proprietà ACID|Proprietà ACID]]
- [[Programmazione/PostgreSQL/Pagine/MVCC|MVCC]]
- [[Programmazione/PostgreSQL/Pagine/Livelli di Isolamento delle Transazioni|Livelli di Isolamento delle Transazioni]]
- [[Programmazione/PostgreSQL/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
- [[Programmazione/PostgreSQL/Pagine/Lock monitoring|Lock monitoring]]
- [[Programmazione/PostgreSQL/Pagine/Code e job table|Code e job table]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]

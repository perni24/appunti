---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Meccanismi di Locking]
prerequisites: []
related: []
---

# Meccanismi di Locking in PostgreSQL

## Sintesi

PostgreSQL combina MVCC con lock di tabella, riga, transazione e lock consultivi. Capire compatibilità, durata e ordine di acquisizione dei lock è necessario per diagnosticare attese, prevenire deadlock e costruire code di lavoro concorrenti.

Sebbene il sistema [[Programmazione/Postgres/Pagine/MVCC|MVCC]] permetta a lettori e scrittori di non bloccarsi a vicenda, esistono situazioni in cui PostgreSQL deve utilizzare dei **Lock** (blocchi) per garantire l'integrità dei dati, specialmente quando più transazioni tentano di modificare le stesse risorse contemporaneamente.

## Quando usarlo

Usa questa nota quando devi capire o prevenire blocchi tra transazioni:

- due transazioni modificano le stesse righe;
- una migrazione DDL resta bloccata;
- query applicative finiscono in timeout;
- worker concorrenti devono processare righe diverse;
- compaiono deadlock nei log;
- devi scegliere tra `FOR UPDATE`, `SKIP LOCKED` e advisory lock.

## Come funziona

### Concetto chiave
I lock sono meccanismi di sincronizzazione che impediscono a transazioni concorrenti di interferire tra loro in modi che violerebbero le [[Programmazione/Postgres/Pagine/Proprietà ACID|Proprietà ACID]]. PostgreSQL gestisce i lock in modo granulare, dal livello di singola riga fino all'intera tabella.

---
### Livelli di Locking
### 1. Table-Level Locks (Blocchi a livello di Tabella)
Questi lock controllano l'accesso a un'intera tabella. Non bloccano necessariamente tutte le operazioni, ma regolano la compatibilità tra comandi DDL (es. `ALTER TABLE`) e DML (es. `INSERT`).

| Modo | Innescato da | Compatibilità |
| :--- | :--- | :--- |
| **Access Share** | `SELECT` | Compatibile con tutto tranne `Access Exclusive`. |
| **Row Exclusive** | `INSERT`, `UPDATE`, `DELETE` | Permette letture e altre scritture concorrenti su righe diverse. |
| **Access Exclusive** | `ALTER TABLE`, `DROP TABLE`, `VACUUM FULL` | Blocca **qualsiasi** altro accesso alla tabella (anche letture). |

### 2. Row-Level Locks (Blocchi a livello di Riga)
PostgreSQL non memorizza i lock di riga in memoria (che saturerebbe la RAM), ma li scrive direttamente nella riga stessa (nel file dei dati).

- **FOR UPDATE:** Blocca la riga per una futura modifica. Altre transazioni che tentano di fare `UPDATE`, `DELETE` o `SELECT FOR UPDATE` sulla stessa riga dovranno attendere.
- **FOR SHARE:** Permette ad altre transazioni di leggere la riga, ma impedisce loro di modificarla finché il lock non viene rilasciato.

```sql
-- Esempio: Prenotazione di una riga per evitare race conditions
BEGIN;
SELECT * FROM conti WHERE id = 1 FOR UPDATE;
-- Esegui logica di business...
UPDATE conti SET bilancio = bilancio - 100 WHERE id = 1;
COMMIT;
```

---
### Advisory Locks (Blocchi Consultivi)
Sono lock definiti dall'applicazione. Il database non li impone automaticamente; è lo sviluppatore che decide quando acquisirli.

- **Uso:** Sincronizzare operazioni che non riguardano direttamente una riga di tabella (es. impedire che due processi worker eseguano lo stesso report pesante contemporaneamente).
- **Funzioni:** `pg_advisory_lock(id)`, `pg_try_advisory_lock(id)`.

---
### Deadlocks (Stallo)
Un deadlock si verifica quando due transazioni si bloccano a vicenda aspettando un lock detenuto dall'altra.

> [!INFO] Rilevamento Automatico
> PostgreSQL ha un detector di deadlock interno. Se rileva uno stallo (dopo un timeout definito da `deadlock_timeout`), interrompe forzatamente una delle transazioni coinvolte per permettere all'altra di procedere.

---

## API / Sintassi

Lock di riga:

```sql
SELECT *
FROM accounts
WHERE id = 1
FOR UPDATE;
```

Varianti:

```sql
SELECT * FROM jobs
WHERE status = 'available'
ORDER BY priority DESC
FOR UPDATE SKIP LOCKED
LIMIT 10;

SELECT * FROM accounts
WHERE id = 1
FOR UPDATE NOWAIT;
```

Advisory lock:

```sql
SELECT pg_advisory_lock(12345);
SELECT pg_advisory_unlock(12345);

SELECT pg_try_advisory_lock(12345);
```

Timeout utili:

```sql
SET lock_timeout = '2s';
SET statement_timeout = '30s';
```

## Esempio pratico

Worker concorrenti su una job table:

```sql
BEGIN;

WITH picked AS (
  SELECT id
  FROM jobs
  WHERE status = 'available'
  ORDER BY priority DESC, created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
UPDATE jobs
SET status = 'running',
    started_at = now()
FROM picked
WHERE jobs.id = picked.id
RETURNING jobs.*;

COMMIT;
```

`SKIP LOCKED` permette a piu worker di saltare righe gia prese da altri worker e processare job diversi.

## Varianti

- Table lock impliciti generati da DDL e DML.
- Row lock con `FOR UPDATE`, `FOR NO KEY UPDATE`, `FOR SHARE`, `FOR KEY SHARE`.
- `NOWAIT`: fallisce subito se il lock non e disponibile.
- `SKIP LOCKED`: salta righe gia bloccate.
- Advisory lock a livello sessione.
- Advisory lock a livello transazione con `pg_advisory_xact_lock`.

## Errori comuni

- Tenere lock mentre si attende input utente o una chiamata HTTP esterna.
- Accedere a tabelle e righe in ordine diverso tra flussi concorrenti.
- Usare `LOCK TABLE` quando bastano lock di riga.
- Non impostare `lock_timeout` durante migrazioni rischiose.
- Usare advisory lock senza convenzione chiara sulle chiavi.
- Ignorare le sessioni `idle in transaction`.

## Checklist

### Logic layer: Best Practices
1.  **Ordine Costante:** Accedi sempre alle tabelle (e alle righe) nello stesso ordine logico per minimizzare il rischio di deadlock.
2.  **Transazioni Brevi:** Mantieni i lock per il minor tempo possibile. Non includere chiamate a API esterne o input utente all'interno di una transazione che detiene lock pesanti.
3.  **Usa `SKIP LOCKED`:** In sistemi di code (queues), usa `SELECT ... FOR UPDATE SKIP LOCKED` per permettere a più worker di processare righe diverse senza bloccarsi a vicenda.
- Impostare `lock_timeout` per operazioni DDL in produzione.
- Monitorare sessioni in attesa con `pg_stat_activity` e `pg_locks`.
- Gestire retry applicativo per deadlock e serialization failure.
- Documentare l'ordine di acquisizione lock nei flussi critici.

---

## Collegamenti

- [[Programmazione/Postgres/Pagine/Lock monitoring|Lock monitoring]]
- [[Programmazione/Postgres/Pagine/MVCC|MVCC]]
- [[Programmazione/Postgres/Pagine/Livelli di Isolamento delle Transazioni|Livelli di Isolamento delle Transazioni]]

## Fonti

- [PostgreSQL - Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [PostgreSQL - pg_locks](https://www.postgresql.org/docs/current/view-pg-locks.html)

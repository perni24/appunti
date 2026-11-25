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
  - Meccanismi di Locking
prerequisites: []
related: []
title: Meccanismi di Locking in PostgreSQL
---

# Meccanismi di Locking in PostgreSQL

## Sintesi

Un lock coordina operazioni incompatibili su una risorsa. Prima di sceglierlo, chiediti **che cosa va protetto** (riga, tabella, attività applicativa) e **cosa fare se è occupato** (attendere, fallire o passare oltre). MVCC consente ai lettori ordinari di leggere una versione confermata senza prendere il lock di riga dello scrittore.

| Risorsa | Esempio | Effetto pratico |
| --- | --- | --- |
| Tabella | `ACCESS SHARE` per una SELECT ordinaria; `ROW EXCLUSIVE` per INSERT/UPDATE/DELETE | Sono compatibili tra loro. `ACCESS EXCLUSIVE`, richiesto per esempio da `VACUUM FULL` e da molti ma non tutti gli `ALTER TABLE`, confligge anche con la lettura |
| Riga | `FOR UPDATE` | Blocca modifiche e richieste di lock incompatibili sulla stessa riga, non le SELECT ordinarie. Esistono anche `FOR NO KEY UPDATE`, `FOR SHARE` e `FOR KEY SHARE`, meno restrittivi in casi diversi |
| Chiave applicativa | Advisory lock | Protegge una convenzione: un client che non chiede quel lock può comunque modificare i dati |

## Due worker, due lavori

Servono due connessioni A e B allo stesso database di prova, autocommit inizialmente attivo e nome `lab_lock_jobs` libero. **Preparazione da A**:

```sql
CREATE TABLE lab_lock_jobs (id integer PRIMARY KEY, state text NOT NULL);
INSERT INTO lab_lock_jobs VALUES (1, 'ready'), (2, 'ready');
```

**A:** riserva la riga 1 e lascia aperta la transazione.

```sql
BEGIN;
SELECT id FROM lab_lock_jobs WHERE id = 1 FOR UPDATE;
```

**B:** acquisisci un lavoro pronto con una sola istruzione e rendi persistente il cambio di stato. `ORDER BY id` dà una priorità ripetibile fra le righe disponibili.

```sql
BEGIN;
WITH picked AS (
  SELECT id FROM lab_lock_jobs WHERE state = 'ready'
  ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED
)
UPDATE lab_lock_jobs AS j SET state = 'running'
FROM picked WHERE j.id = picked.id RETURNING j.id;
COMMIT;
```

B ottiene **2**, nonostante 1 sia ancora `ready`: la prima riga è bloccata. **A:** rilascia il lock senza modificare il lavoro.

```sql
ROLLBACK;
```

Ripeti ora il blocco di B: ottieni **1**. `SKIP LOCKED` serve a distribuire lavori fra consumatori, non a fare inventari completi o a garantire l'ordine globale. Non garantisce neppure il completamento del lavoro dopo il commit: serve una politica per i worker che si arrestano. Al termine elimina solo la tabella di prova:

```sql
DROP TABLE lab_lock_jobs;
```

## Attese e deadlock

**Attesa:** B vuole la riga che A trattiene, ma A può concludere e sbloccarla. **Deadlock:** A trattiene la riga 1 e aspetta la 2, mentre B trattiene la 2 e aspetta la 1. Nessuno può avanzare: PostgreSQL rileva il ciclo e interrompe una delle transazioni (`40P01`). Non progettare il codice supponendo quale sarà la vittima.

- Acquisisci le risorse nello stesso ordine in tutti i percorsi, mantieni breve la transazione e non attendere input utente o risposte HTTP mentre detieni lock. In caso di deadlock, annulla e riprova l'intera operazione se è ripetibile.
- `FOR UPDATE NOWAIT` fallisce subito (`55P03`) per un lock di riga incompatibile, mentre `SKIP LOCKED` salta quella riga. Le due opzioni non evitano la necessità di prendere il lock di tabella. `SET LOCAL lock_timeout` limita l'attesa per ogni acquisizione nella transazione; `statement_timeout` limita invece la durata dell'istruzione. `deadlock_timeout` avvia la verifica di un possibile ciclo, non impone la durata massima di ogni attesa.
- Per diagnosticare, parti da `pg_blocking_pids(pid)` e da `pg_stat_activity`; usa `pg_locks` per le risorse coinvolte. I lock di riga sono registrati soprattutto nelle tuple: chi attende può comparire in `pg_locks` come in attesa dell'ID di una transazione, non come elenco di tutte le righe bloccate.

## Advisory lock

Per impedire che due processi cooperanti avviino contemporaneamente lo stesso report, scegli una coppia di chiavi documentata (qui famiglia 8602, report 1). Non serve una tabella. Prova in un database di laboratorio con la coppia libera.

**A:** tieni aperta la transazione. La funzione `try` restituisce `true` se ha acquisito il lock e non aspetta se è occupato.

```sql
BEGIN;
SELECT pg_try_advisory_xact_lock(8602, 1);
```

**B, in autocommit:** mentre A è aperta restituisce `false`. Dopo che A ha eseguito il `ROLLBACK` seguente, ripeti la stessa query in B: restituisce `true` e il lock di B termina con l'istruzione.

```sql
SELECT pg_try_advisory_xact_lock(8602, 1);
```

**A, rilascio:**

```sql
ROLLBACK;
```

Un lock `..._xact_lock` dura fino alla fine della transazione. Un lock di **sessione** (`pg_advisory_lock` o `pg_try_advisory_lock`) invece sopravvive al rollback: va rilasciato con `pg_advisory_unlock` per ogni acquisizione, oppure termina chiudendo la connessione. Con un pool un lock di sessione dimenticato può restare sulla connessione riutilizzata.

**Fonti PostgreSQL 18:** [lock espliciti, deadlock e lock consultivi](https://www.postgresql.org/docs/18/explicit-locking.html), [funzioni di amministrazione](https://www.postgresql.org/docs/18/functions-admin.html), [SELECT e clausole di locking](https://www.postgresql.org/docs/18/sql-select.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Lock monitoring|Lock monitoring]]
- [[Programmazione/PostgreSQL/Pagine/MVCC|MVCC]]
- [[Programmazione/PostgreSQL/Pagine/Livelli di Isolamento delle Transazioni|Livelli di Isolamento delle Transazioni]]

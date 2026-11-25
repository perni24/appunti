---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: operational-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - lock
  - osservabilita
aliases: []
prerequisites: []
related: []
title: Lock monitoring
---

# Lock monitoring

## Sintesi

Una sessione `active` può essere ferma in attesa di un lock, mentre quella che lo trattiene può essere `idle in transaction`. Per diagnosticare il problema servono tre informazioni: **chi aspetta, chi gli impedisce di avanzare e da quando**. Un lock concesso non è di per sé un'anomalia.

## Individuare attesa e bloccante

Da una sessione di monitoraggio sul database interessato, con visibilità sulle sessioni da diagnosticare:

```sql
SELECT w.pid AS pid_in_attesa, w.application_name AS client_in_attesa,
       b.pid_bloccante, h.application_name AS client_bloccante,
       h.state AS stato_bloccante, h.xact_start AS transazione_dal
FROM pg_stat_activity AS w
CROSS JOIN LATERAL unnest(pg_blocking_pids(w.pid)) AS b(pid_bloccante)
LEFT JOIN pg_stat_activity AS h ON h.pid = b.pid_bloccante
WHERE w.datname = current_database() AND w.wait_event_type = 'Lock'
ORDER BY w.pid, b.pid_bloccante;
```

`pg_blocking_pids` considera i lock incompatibili **e** le richieste incompatibili già davanti in coda. Il semplice confronto tra righe di `pg_locks` non ricostruisce questa relazione. Un bloccante può a sua volta essere bloccato: segui la catena. Un PID bloccante pari a zero rappresenta una transazione preparata, non un processo da terminare; il `LEFT JOIN` conserva il caso anche senza una riga di attività.

Per leggere **la durata dell'attesa** (non l'età dell'intera query):

```sql
SELECT w.pid, l.locktype, l.mode, l.waitstart,
       clock_timestamp() - l.waitstart AS attesa
FROM pg_locks AS l JOIN pg_stat_activity AS w USING (pid)
WHERE NOT l.granted AND w.datname = current_database()
ORDER BY l.waitstart NULLS LAST;
```

`waitstart` può essere brevemente nullo all'inizio. `query_start` è l'inizio dello statement; `xact_start` è l'inizio della transazione. Su un bloccante inattivo il testo in `pg_stat_activity.query` è l'ultimo statement, non necessariamente quello che ha acquisito il lock. Le viste cambiano mentre le leggi: controlla più campioni, non interrogazioni in un ciclo serrato.

## Laboratorio con tre connessioni

Database di prova, tre sessioni sullo **stesso database**, chiave advisory riservata all'esercizio. Mantieni aperta A. Non sono necessarie tabelle.

**A, titolare:** acquisisce un lock transazionale e torna al prompt senza chiudere la transazione.

```sql
BEGIN;
SELECT pg_advisory_xact_lock(731, 42);
```

**B, in attesa:** esegue la stessa richiesta. Il timeout locale evita di lasciare B in attesa indefinitamente.

```sql
BEGIN;
SET LOCAL lock_timeout = '60s';
SELECT pg_advisory_xact_lock(731, 42);
```

**C, osservatore:** esegue le due query del paragrafo precedente. Prima del rilascio dovrebbe vedere B in attesa di A e un lock di tipo `advisory` non concesso. **Su A** rilascia il lock:

```sql
ROLLBACK;
```

B ottiene il lock. **Su B** chiudi a tua volta la transazione:

```sql
ROLLBACK;
```

Ora C non dovrebbe vedere la coppia A/B. Se scatta il timeout, B riceve un errore e deve comunque fare rollback. Un'attesa non è un deadlock: un deadlock richiede un ciclo.

## Intervenire senza perdere la causa

Raccogli PID, applicazione, durata e operazione in corso prima di decidere. La soluzione preferibile è fare concludere la transazione dal proprietario e correggere ciò che la lascia aperta. `pg_cancel_backend` cancella lo statement corrente: non è un comando per chiudere una transazione inattiva. `pg_terminate_backend` disconnette il client e comporta il rollback del lavoro non confermato; non usarlo come risposta automatica a una soglia. Per le attese che scompaiono prima del campionamento valuta `log_lock_waits`: la segnalazione dipende da `deadlock_timeout`.

## Fonti

[PostgreSQL 18: pg_blocking_pids](https://www.postgresql.org/docs/18/functions-info.html) · [Vista pg_locks](https://www.postgresql.org/docs/18/view-pg-locks.html) · [Stato delle sessioni e attese](https://www.postgresql.org/docs/18/monitoring-stats.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
- [[Programmazione/PostgreSQL/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
- [[Programmazione/PostgreSQL/Pagine/Livelli di Isolamento delle Transazioni|Livelli di Isolamento delle Transazioni]]

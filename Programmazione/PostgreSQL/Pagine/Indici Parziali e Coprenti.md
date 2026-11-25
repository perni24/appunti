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
  - Indici Parziali e Coprenti
prerequisites: []
related: []
title: Indici Parziali e Coprenti in PostgreSQL
---

# Indici Parziali e Coprenti in PostgreSQL

## Sintesi

**Parziale** risponde a «quali righe entrano nell'indice?»; **coprente** risponde a «questa query trova nell'indice i valori che le servono?». Le due proprietà sono indipendenti. In un B-tree, `INCLUDE` porta un valore nelle foglie senza farne una chiave di ricerca, di ordinamento o di unicità.

## Una coda con pochi lavori pronti

Esegui i blocchi nella stessa sessione, con **autocommit attivo e senza `BEGIN`**: `VACUUM` non può stare in un blocco di transazione. Le tabelle sono temporanee. La coda contiene 10.000 lavori; solo gli ID multipli di 100 sono pronti.

```sql
CREATE TEMP TABLE lab_jobs (id integer, state text NOT NULL, title text NOT NULL);
INSERT INTO lab_jobs
SELECT i, CASE WHEN i % 100 = 0 THEN 'ready' ELSE 'done' END, 'job-' || i
FROM generate_series(1, 10000) AS g(i);
CREATE INDEX lab_ready_cover ON lab_jobs (id) INCLUDE (title) WHERE state = 'ready';
VACUUM (ANALYZE) lab_jobs;
```

```sql
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF)
SELECT id, title FROM lab_jobs WHERE state = 'ready' ORDER BY id LIMIT 2;
```

Il risultato della SELECT è `(100, job-100)` e `(200, job-200)`. Il predicato limita l'indice ai lavori pronti; `id` dà l'ordine e `title` copre l'output. Non occorre conservare `state` nell'indice per rivalutare un filtro già garantito dal suo predicato.

## Perché un Index Only Scan può leggere la tabella

```sql
UPDATE lab_jobs SET title = 'urgente' WHERE id = 100;
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF)
SELECT id, title FROM lab_jobs WHERE state = 'ready' ORDER BY id LIMIT 2;
```

Confronta **`Heap Fetches`**, non solo il nome del nodo. La *visibility map* segnala le pagine le cui tuple sono tutte visibili a tutte le transazioni. Se il bit è impostato, l'indice può bastare; se manca, PostgreSQL consulta la tabella (*heap*) per verificare la visibilità MVCC. Una scrittura può azzerare il bit e `VACUUM` può ripristinarlo quando le condizioni lo permettono. Nel laboratorio la prima lettura può avere zero accessi alla heap e la seconda averne pur mantenendo lo stesso tipo di nodo.

## Predicati e unicità

- Il planner deve poter dedurre al momento della pianificazione che il filtro della query **implica il predicato dell'indice**. Un piano generico per `WHERE state = $1` non sa che il valore sarà sempre `'ready'`. Non significa che ogni query parametrizzata sia esclusa: con un piano specifico il valore può essere noto, oppure il predicato può essere un'altra condizione letterale.
- Per imporre «una sola email attiva, storico libero», usa un indice unico parziale. Questo blocco indipendente ammette due record storici e uno attivo con la stessa email; un **secondo attivo** sarebbe rifiutato. `label` non partecipa all'unicità.

```sql
BEGIN;
CREATE TEMP TABLE lab_contacts (email text NOT NULL, active boolean NOT NULL, label text);
CREATE UNIQUE INDEX lab_one_active ON lab_contacts (lower(email)) INCLUDE (label) WHERE active;
INSERT INTO lab_contacts VALUES
  ('ada@example.org', false, 'v1'), ('ada@example.org', false, 'v2'),
  ('Ada@example.org', true, 'oggi');
SELECT count(*) AS total, count(*) FILTER (WHERE active) AS active FROM lab_contacts;
ROLLBACK;
```

Risultato: **3 righe, 1 attiva**. Una colonna larga in `INCLUDE` aumenta dimensioni e manutenzione: aggiungila per una proiezione frequente, non per coprire ogni possibile `SELECT *`.

**Fonti PostgreSQL 18:** [indici parziali](https://www.postgresql.org/docs/18/indexes-partial.html), [index-only scan e colonne incluse](https://www.postgresql.org/docs/18/indexes-index-only-scans.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Indici|Tipi di Indici]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/PostgreSQL/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]

---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - sql
  - dml
aliases: []
prerequisites: []
related: []
title: RETURNING
---

# RETURNING

## Sintesi

`RETURNING` fa produrre alla scrittura un risultato per ogni riga su cui ha agito. È il modo per ottenere un ID generato, leggere un default o sapere **quali** righe sono cambiate senza cercarle con una seconda query. Non equivale a un `COMMIT`: puoi ricevere una riga e poi annullare la transazione.

| Operazione | Cosa restituisce normalmente una colonna della tabella di destinazione |
| --- | --- |
| `INSERT` | Il valore inserito, inclusi i default calcolati dal database |
| `UPDATE` | Il nuovo valore, anche quando coincide con il precedente |
| `DELETE` | Il valore della riga appena rimossa, non una riga successiva alla cancellazione |
| `MERGE` | Dipende dall'azione; qualifica le colonne se sorgente e destinazione hanno nomi uguali |

## Leggere il prima e il dopo

Esegui i due blocchi nella stessa sessione **PostgreSQL 18**. In questa versione `old` e `new` danno accesso esplicito alle due immagini della riga. Un normale inserimento non ha un'immagine precedente; una normale cancellazione non ha un'immagine successiva.

```sql
BEGIN;
CREATE TEMP TABLE lab_jobs (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  state text NOT NULL DEFAULT 'queued'
);
INSERT INTO lab_jobs DEFAULT VALUES RETURNING id, state;
UPDATE lab_jobs SET state = 'done' WHERE id = 1
RETURNING id, old.state AS before, new.state AS after;
```

```sql
UPDATE lab_jobs SET state = 'done' WHERE id = 99 RETURNING id;
WITH removed AS (
  DELETE FROM lab_jobs WHERE state = 'done' RETURNING id, state
)
SELECT state, count(*) AS removed_count FROM removed GROUP BY state;
ROLLBACK;
```

Il primo blocco restituisce `(1,queued)` e poi `(1,queued,done)`. L'update dell'ID 99 non restituisce **nessuna riga**, non una riga con ID nullo. La CTE legge i dati restituiti dal `DELETE`: il riepilogo è `(done,1)` anche se la riga non è più nella tabella.

## Limiti da gestire nell'applicazione

- Un `UPDATE` o un `DELETE` può restituire zero, una o molte righe. Per un ordine ripetibile su più righe, usa una CTE e una `SELECT ... ORDER BY` esterna. Preferisci le colonne necessarie a `RETURNING *`.
- `ON CONFLICT DO NOTHING` non restituisce la riga esistente; con `DO UPDATE` vengono restituite solo le righe realmente inserite o aggiornate. Nel ramo di aggiornamento l'immagine `old` può esistere anche se l'istruzione comincia con `INSERT`.
- Un default o una modifica della riga operata da un trigger `BEFORE` può influire sul valore restituito. Non assumere invece che un campo `updated_at` cambi da solo: deve cambiarlo la query o un trigger. Per verificare se l'operazione è definitiva attendi anche l'esito del commit.

**Fonti PostgreSQL 18:** [dati restituiti dalle scritture](https://www.postgresql.org/docs/18/dml-returning.html), [MERGE](https://www.postgresql.org/docs/18/sql-merge.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/SELECT INSERT UPDATE e DELETE|SELECT, INSERT, UPDATE e DELETE]]
- [[Programmazione/PostgreSQL/Pagine/UPSERT con ON CONFLICT|UPSERT con ON CONFLICT]]
- [[Programmazione/PostgreSQL/Pagine/Funzioni e Store Procedures|Funzioni e stored procedure]]

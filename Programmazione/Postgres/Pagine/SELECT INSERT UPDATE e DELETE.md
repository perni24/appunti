---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
publish: true
difficulty: 
tags:
  - programmazione
  - postgres
  - sql
  - dml
aliases: []
prerequisites: []
related: []
---

# SELECT, INSERT, UPDATE e DELETE

## Sintesi

`SELECT`, `INSERT`, `UPDATE` e `DELETE` sono i comandi DML fondamentali per leggere e modificare dati in PostgreSQL.

## Quando usarlo

Usa questi comandi in quasi ogni interazione applicativa con PostgreSQL:

- `SELECT` per leggere dati, costruire report, verificare condizioni o alimentare viste applicative.
- `INSERT` per creare nuove righe.
- `UPDATE` per modificare righe esistenti.
- `DELETE` per rimuovere righe quando la cancellazione fisica e davvero necessaria.

In applicazioni reali conviene sempre combinarli con transazioni, vincoli e filtri espliciti. `UPDATE` e `DELETE` sono i piu rischiosi perche, senza una clausola `WHERE` corretta, possono modificare l'intera tabella.

## Come funziona

### Concetto chiave
Questi comandi lavorano sulle righe delle tabelle. `SELECT` legge, `INSERT` crea, `UPDATE` modifica e `DELETE` elimina.

```sql
SELECT id, email FROM users WHERE active = true;

INSERT INTO users (email, active)
VALUES ('a@example.com', true);

UPDATE users
SET active = false
WHERE id = 10;

DELETE FROM users
WHERE id = 10;
```

## API / Sintassi

```sql
SELECT column_list
FROM table_name
WHERE condition
ORDER BY column_name
LIMIT n;

INSERT INTO table_name (column_1, column_2)
VALUES (value_1, value_2)
RETURNING id;

UPDATE table_name
SET column_1 = new_value
WHERE condition
RETURNING *;

DELETE FROM table_name
WHERE condition
RETURNING *;
```

In PostgreSQL `RETURNING` e molto utile per ottenere subito le righe create, modificate o eliminate senza fare una seconda query.

## Esempio pratico

```sql
BEGIN;

INSERT INTO users (email, active)
VALUES ('ada@example.com', true)
RETURNING id;

UPDATE users
SET last_login_at = now()
WHERE email = 'ada@example.com'
RETURNING id, last_login_at;

SELECT id, email, last_login_at
FROM users
WHERE active = true
ORDER BY last_login_at DESC NULLS LAST
LIMIT 20;

COMMIT;
```

Per una cancellazione controllata:

```sql
DELETE FROM sessions
WHERE expires_at < now()
RETURNING id, user_id;
```

La clausola `RETURNING` permette di verificare immediatamente cosa e stato toccato.

## Varianti

- `INSERT ... SELECT`: inserisce righe prodotte da una query.
- `INSERT ... ON CONFLICT`: gestisce l'upsert quando esiste un vincolo unico.
- `UPDATE ... FROM`: aggiorna una tabella usando dati provenienti da un'altra tabella.
- `DELETE ... USING`: elimina righe usando una join logica con altre tabelle.
- `SELECT ... FOR UPDATE`: legge righe bloccandole per modificarle in una transazione.
- `WITH ... INSERT/UPDATE/DELETE`: usa CTE per rendere espliciti passaggi intermedi.

## Errori comuni

- Eseguire `UPDATE` o `DELETE` senza `WHERE`.
- Usare `SELECT *` in query applicative stabili.
- Non controllare il numero di righe modificate.

## Checklist

- Verificare sempre la clausola `WHERE` prima di `UPDATE` e `DELETE`.
- Usare `RETURNING` quando serve confermare le righe modificate.
- Evitare `SELECT *` nelle query applicative stabili.
- Controllare gli indici sulle colonne usate in `WHERE`, `JOIN` e `ORDER BY`.
- Usare transazioni quando piu modifiche devono essere atomiche.
- Testare prima con `SELECT` equivalente quando una modifica e rischiosa.

## Collegamenti

- [[Programmazione/Postgres/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli]]
- [[Programmazione/Postgres/Pagine/RETURNING|RETURNING]]

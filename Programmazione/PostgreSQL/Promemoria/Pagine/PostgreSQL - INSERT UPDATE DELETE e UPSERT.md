---
date: 2026-07-30
area: Programmazione
topic: Promemoria PostgreSQL
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - postgresql
  - promemoria
  - insert
  - update
  - delete
  - upsert
aliases:
  - Cheatsheet modifica dati PostgreSQL
prerequisites: []
related:
  - "[[Programmazione/PostgreSQL/Pagine/SELECT INSERT UPDATE e DELETE]]"
  - "[[Programmazione/PostgreSQL/Pagine/UPSERT con ON CONFLICT]]"
  - "[[Programmazione/PostgreSQL/Pagine/RETURNING]]"
title: PostgreSQL - INSERT, UPDATE, DELETE e UPSERT
---

# PostgreSQL - INSERT, UPDATE, DELETE e UPSERT

Ricette di scrittura con `RETURNING`. Esegui i blocchi **in ordine nella stessa sessione di prova**: i bersagli sono temporanei e il blocco finale annulla tutto. Su tabelle reali, senza `WHERE`, UPDATE e DELETE interessano tutte le righe.

## Preparare e inserire

```sql
BEGIN;
CREATE TEMP TABLE lab_items (id integer PRIMARY KEY, name text NOT NULL);
CREATE TEMP TABLE lab_archive (id integer PRIMARY KEY, name text);
```

```sql
INSERT INTO pg_temp.lab_items (id, name) VALUES (1, 'pen') RETURNING id;
```

```sql
INSERT INTO pg_temp.lab_items (id, name) VALUES (2, 'book'), (3, 'box');
```

## Controllare e aggiornare

```sql
SELECT id, name FROM pg_temp.lab_items WHERE id = 1;
```

```sql
UPDATE pg_temp.lab_items SET name = 'pencil' WHERE id = 1 RETURNING id, name;
```

Anteprima: `1, pen`; scrittura: `1, pencil`. In presenza di altri scrittori l'anteprima non garantisce che i dati restino identici. Per aggiornare solo un valore atteso, includilo nel `WHERE` dell'UPDATE.

```sql
UPDATE pg_temp.lab_items AS i SET name = s.name
FROM (VALUES (2, 'notebook')) AS s(id, name)
WHERE i.id = s.id RETURNING i.id, i.name;
```

Con `UPDATE ... FROM` la sorgente deve dare **al massimo una corrispondenza per bersaglio** se vuoi un risultato deterministico.

## Gestire un conflitto

```sql
INSERT INTO pg_temp.lab_items (id, name) VALUES (2, 'diary')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
RETURNING id, name;
```

```sql
INSERT INTO pg_temp.lab_items (id, name) VALUES (2, 'ignored')
ON CONFLICT (id) DO NOTHING RETURNING id;
```

La chiave primaria arbitra il conflitto: il primo blocco restituisce `2, diary`; il secondo nessuna riga. `EXCLUDED` è la riga proposta. Nell'app lega ID e nome come parametri del driver.

## Archiviare, eliminare e annullare la prova

```sql
INSERT INTO pg_temp.lab_archive (id, name)
SELECT id, name FROM pg_temp.lab_items WHERE id = 3;
```

```sql
DELETE FROM pg_temp.lab_items AS i USING pg_temp.lab_archive AS a
WHERE i.id = a.id RETURNING i.id;
```

```sql
DELETE FROM pg_temp.lab_items WHERE id = 1 RETURNING id;
```

I due DELETE restituiscono rispettivamente 3 e 1. Un DELETE senza corrispondenze non è un errore: `RETURNING` non restituisce righe.

```sql
ROLLBACK;
```

## Approfondimento

- [PostgreSQL 18: INSERT e ON CONFLICT](https://www.postgresql.org/docs/18/sql-insert.html)
- [[Programmazione/PostgreSQL/Pagine/SELECT INSERT UPDATE e DELETE|SELECT INSERT UPDATE e DELETE]]
- [[Programmazione/PostgreSQL/Pagine/UPSERT con ON CONFLICT|UPSERT con ON CONFLICT]]
- [[Programmazione/PostgreSQL/Pagine/RETURNING|RETURNING]]
- [[Programmazione/PostgreSQL/Pagine/Vincoli|Vincoli]]
- [[Programmazione/PostgreSQL/Pagine/Prepared statements|Prepared statements]]


## Navigazione

- [[Programmazione/PostgreSQL/Promemoria/Indice Promemoria PostgreSQL|Indice Promemoria PostgreSQL]]

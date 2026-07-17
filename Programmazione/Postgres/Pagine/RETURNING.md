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

# RETURNING

## Sintesi

`RETURNING` restituisce colonne dalle righe modificate da `INSERT`, `UPDATE`, `DELETE` o `MERGE`.

## Quando usarlo

Usa `RETURNING` quando una modifica deve restituire immediatamente dati utili all'applicazione:

- ID generati da sequenze o identity column;
- valori default calcolati dal database;
- timestamp impostati da trigger o da `DEFAULT now()`;
- righe effettivamente aggiornate o cancellate;
- risultato finale di un upsert.

Evita una seconda query e riduce il rischio di leggere una riga diversa da quella appena modificata.

## Come funziona

### Perche e utile
- Recuperare ID generati.
- Ottenere valori default.
- Evitare una seconda query.
- Verificare cosa e stato modificato.

## API / Sintassi

```sql
INSERT INTO table_name (column_1, column_2)
VALUES (value_1, value_2)
RETURNING column_1, column_2;

UPDATE table_name
SET column_1 = value_1
WHERE condition
RETURNING *;

DELETE FROM table_name
WHERE condition
RETURNING id;
```

`RETURNING *` e comodo durante sviluppo o debugging, ma nelle query applicative e preferibile elencare solo le colonne necessarie.

## Esempio pratico

### Esempio
```sql
INSERT INTO users (email)
VALUES ('a@example.com')
RETURNING id, created_at;
```
### Esempio con UPDATE
```sql
UPDATE orders
SET status = 'paid'
WHERE id = 42
RETURNING id, status, updated_at;
```

## Varianti

- `INSERT ... RETURNING id`: recupera la chiave primaria appena generata.
- `UPDATE ... RETURNING old_value, new_value`: restituisce i campi dopo la modifica.
- `DELETE ... RETURNING *`: utile per audit, log o conferma operativa.
- `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING`: restituisce la riga finale dopo l'upsert.
- `WITH changed AS (...) SELECT ...`: usa una CTE per riusare le righe restituite da una modifica.

Esempio con CTE:

```sql
WITH deleted_sessions AS (
  DELETE FROM sessions
  WHERE expires_at < now()
  RETURNING id, user_id
)
SELECT user_id, count(*) AS deleted_count
FROM deleted_sessions
GROUP BY user_id;
```

## Errori comuni

- Usare `RETURNING *` in produzione quando servono solo poche colonne.
- Aspettarsi una riga singola quando `UPDATE` o `DELETE` possono toccare piu righe.
- Dimenticare che `RETURNING` restituisce i valori dopo la modifica.
- Fare comunque una seconda `SELECT` inutile dopo `INSERT ... RETURNING`.
- Non gestire il caso in cui `RETURNING` non restituisce righe perche il `WHERE` non ha trovato match.

## Checklist

- Elencare solo le colonne necessarie.
- Controllare la cardinalita attesa del risultato.
- Usare `RETURNING` per confermare modifiche rischiose.
- Gestire correttamente il caso di risultato vuoto.
- Valutare CTE quando le righe modificate servono a una query successiva.
- Collegare `RETURNING` a transazioni quando la modifica fa parte di un flusso atomico.

## Collegamenti

- [[Programmazione/Postgres/Pagine/SELECT INSERT UPDATE e DELETE|SELECT, INSERT, UPDATE e DELETE]]
- [[Programmazione/Postgres/Pagine/UPSERT con ON CONFLICT|UPSERT con ON CONFLICT]]
- [[Programmazione/Postgres/Pagine/Funzioni e Store Procedures|Funzioni e Store Procedures]]

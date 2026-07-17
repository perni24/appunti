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
  - upsert
aliases: []
prerequisites: []
related: []
---

# UPSERT con ON CONFLICT

## Sintesi

`ON CONFLICT` implementa l'upsert: inserisce una riga oppure aggiorna quella esistente quando viola un vincolo unico.

## Quando usarlo

Usa `ON CONFLICT` quando una scrittura deve essere idempotente:

- creare un utente se l'email non esiste, altrimenti aggiornare alcuni campi;
- salvare impostazioni applicative con chiave unica;
- importare dati esterni evitando duplicati;
- aggiornare contatori o timestamp in presenza di inserimenti concorrenti;
- implementare sincronizzazioni dove la stessa riga puo arrivare piu volte.

Il punto essenziale e che PostgreSQL puo rilevare il conflitto solo se esiste una primary key, un vincolo `UNIQUE` o un indice unico compatibile.

## Come funziona

### Concetto chiave
Il conflitto deve essere definito da una primary key, unique constraint o unique index. `EXCLUDED` rappresenta la riga che si stava tentando di inserire.

## API / Sintassi

```sql
INSERT INTO table_name (key_column, value_column)
VALUES (key_value, value_value)
ON CONFLICT (key_column)
DO UPDATE SET
  value_column = EXCLUDED.value_column
RETURNING *;
```

Per ignorare i duplicati:

```sql
INSERT INTO table_name (key_column, value_column)
VALUES (key_value, value_value)
ON CONFLICT (key_column)
DO NOTHING;
```

`EXCLUDED` contiene i valori che PostgreSQL stava tentando di inserire ma che hanno generato il conflitto.

## Esempio pratico

### Esempio
```sql
INSERT INTO users (email, name)
VALUES ('a@example.com', 'Ada')
ON CONFLICT (email)
DO UPDATE SET name = EXCLUDED.name;
```

## Varianti

```sql
ON CONFLICT (email) DO NOTHING;
```

Varianti frequenti:

- `ON CONFLICT (column_name)`: usa una colonna coperta da vincolo o indice unico.
- `ON CONFLICT ON CONSTRAINT constraint_name`: punta direttamente a un vincolo nominato.
- `DO NOTHING`: ignora la riga in conflitto.
- `DO UPDATE SET ...`: aggiorna la riga esistente.
- `WHERE` dentro `DO UPDATE`: aggiorna solo se serve davvero.

Esempio con aggiornamento condizionale:

```sql
INSERT INTO users (email, name, updated_at)
VALUES ('a@example.com', 'Ada', now())
ON CONFLICT (email)
DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at
WHERE users.name IS DISTINCT FROM EXCLUDED.name;
```

`IS DISTINCT FROM` gestisce correttamente anche i confronti con `NULL`.

## Errori comuni

- Non avere un vincolo unico su cui rilevare il conflitto.
- Aggiornare sempre anche quando i dati sono identici.
- Non considerare concorrenza e lock sulle righe coinvolte.

## Checklist

- Verificare che esista un vincolo unico o una primary key sul target del conflitto.
- Usare `DO NOTHING` quando non serve aggiornare la riga esistente.
- Usare `DO UPDATE` solo sui campi che devono cambiare davvero.
- Valutare una clausola `WHERE` per evitare update inutili.
- Usare `RETURNING` quando l'applicazione deve conoscere la riga finale.
- Considerare lock e concorrenza se molti processi fanno upsert sulla stessa chiave.

## Collegamenti

- [[Programmazione/Postgres/Pagine/Vincoli|Vincoli]]
- [[Programmazione/Postgres/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]
- [[Programmazione/Postgres/Pagine/RETURNING|RETURNING]]

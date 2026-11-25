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
title: SELECT, INSERT, UPDATE e DELETE
---

# SELECT, INSERT, UPDATE e DELETE

## Sintesi

`SELECT` legge un insieme di righe; `INSERT` aggiunge righe; `UPDATE` modifica quelle selezionate e `DELETE` le elimina. Per le scritture separa due domande: **quali righe ha toccato l'istruzione?** (`RETURNING`) e **le modifiche sono state confermate?** (`COMMIT`). Vedere un risultato non equivale al commit.

## Esempio: seguire una riga

Nel database di prova esegui i blocchi **in ordine, nella stessa sessione**, senza una transazione già aperta. La tabella è temporanea e il rollback finale annulla l'esercizio.

```sql
BEGIN;
CREATE TEMP TABLE lab_users (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email text NOT NULL UNIQUE,
    active boolean NOT NULL DEFAULT true,
    last_login_at timestamptz
);
INSERT INTO lab_users (email) VALUES ('ada@example.org')
RETURNING id, active;
INSERT INTO lab_users (email) VALUES ('teo@example.org');
```

Il primo inserimento restituisce `1, true`. La lettura seguente chiede un ordine preciso: utenti con accessi più recenti per primi, valori mancanti alla fine e `id` per sciogliere le parità. Senza `ORDER BY`, `LIMIT` non identifica stabilmente «il primo».

```sql
UPDATE lab_users
SET last_login_at = timestamptz '2026-06-01 08:00+00'
WHERE email = 'ada@example.org'
RETURNING id, email;
SELECT id, email FROM lab_users
WHERE active
ORDER BY last_login_at DESC NULLS LAST, id
LIMIT 1;
```

Sia `UPDATE` sia `SELECT` restituiscono Ada. Ora elimina **solo** l'utente che non ha mai effettuato l'accesso:

```sql
DELETE FROM lab_users
WHERE last_login_at IS NULL
RETURNING id, email;
SELECT count(*) AS rimasti FROM lab_users;
ROLLBACK;
```

`DELETE` restituisce Teo (id `2`); prima del rollback resta una riga. Se il filtro non corrisponde a nulla, `UPDATE` e `DELETE` modificano zero righe: non è un errore SQL. Controlla il conteggio quando l'applicazione si aspetta esattamente una riga.

## Prima di una scrittura reale

- Senza `WHERE`, `UPDATE` e `DELETE` riguardano tutte le righe della tabella. Una `SELECT` con lo stesso predicato è un'anteprima, non blocca cambiamenti concorrenti. Usa una chiave, una transazione e, quando serve coordinare scrittori, un blocco mirato come `SELECT … FOR UPDATE`.
- Usa colonne esplicite sia in lettura sia in `INSERT`. `RETURNING` restituisce normalmente i valori inseriti o aggiornati, oppure i valori rimossi nel caso di `DELETE`. L'ordine di più righe restituite non è garantito.
- Se più modifiche devono riuscire insieme, conferma con `COMMIT` solo dopo le verifiche. In autocommit un successivo `ROLLBACK` non annulla un'istruzione già confermata.

## Varianti

`INSERT … SELECT` carica dati provenienti da una query; `ON CONFLICT` gestisce un conflitto di unicità previsto. `UPDATE … FROM` e `DELETE … USING` usano altre tabelle per individuare le righe: con `UPDATE … FROM` assicurati che ogni riga bersaglio incontri al massimo una riga sorgente. Una CTE (`WITH`) può dare un nome a un passaggio intermedio, non sostituisce il controllo della cardinalità.

**Fonti:** [modifica dei dati e RETURNING](https://www.postgresql.org/docs/18/dml-returning.html) e [UPDATE … FROM](https://www.postgresql.org/docs/18/sql-update.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Dato|Tipi di Dato]]
- [[Programmazione/PostgreSQL/Pagine/Vincoli|Vincoli]]
- [[Programmazione/PostgreSQL/Pagine/RETURNING|RETURNING]]

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
  - upsert
aliases: []
prerequisites: []
related: []
title: UPSERT con ON CONFLICT
---

# UPSERT con ON CONFLICT

## Sintesi

`INSERT ... ON CONFLICT` fa decidere al database cosa fare se una chiave è già occupata: **saltare la riga** (`DO NOTHING`) oppure **aggiornare quella esistente** (`DO UPDATE`). È una decisione atomica rispetto al conflitto, non una promessa di idempotenza: impostare un valore e incrementare un contatore hanno effetti diversi quando ripeti la richiesta.

## Sincronizzare un'impostazione senza riscriverla inutilmente

Esegui i due blocchi in ordine nella stessa sessione. La PK identifica una sola impostazione; `EXCLUDED` rappresenta la riga proposta, `s` quella già memorizzata. Il confronto `IS DISTINCT FROM` gestisce anche due valori nulli.

```sql
BEGIN;
CREATE TEMP TABLE lab_settings (key text PRIMARY KEY, value text);
INSERT INTO lab_settings AS s VALUES ('theme', NULL)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
WHERE s.value IS DISTINCT FROM EXCLUDED.value
RETURNING key, value;
```

```sql
INSERT INTO lab_settings AS s VALUES ('theme', 'dark')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
WHERE s.value IS DISTINCT FROM EXCLUDED.value
RETURNING key, value;

INSERT INTO lab_settings AS s VALUES ('theme', 'dark')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
WHERE s.value IS DISTINCT FROM EXCLUDED.value
RETURNING key, value;

INSERT INTO lab_settings VALUES ('theme', 'light')
ON CONFLICT (key) DO NOTHING RETURNING key;

SELECT key, value FROM lab_settings;
ROLLBACK;
```

Il primo inserimento restituisce `(theme,NULL)`. Il passaggio a `dark` restituisce `(theme,dark)`; ripeterlo non modifica né restituisce righe. Anche la proposta `light` viene saltata, stavolta da `DO NOTHING`. La lettura finale conferma `dark`. Un risultato vuoto di `RETURNING` non significa che la chiave non esista.

## Come scegliere il conflitto

- Per `DO UPDATE` indica l'arbitro: per esempio `(key)` per inferire un indice univoco compatibile oppure `ON CONSTRAINT nome` per un vincolo idoneo. Un indice ordinario non basta; un indice unico parziale richiede un predicato compatibile. `DO NOTHING` può anche omettere il target.
- Il `WHERE` dopo `DO UPDATE SET` decide se effettuare la modifica **dopo** il conflitto: la riga può comunque essere bloccata. Non equivale al predicato usato per individuare un indice parziale.
- Per un contatore, `SET hits = tabella.hits + 1` può essere corretto con più scrittori, ma una richiesta ripetuta incrementa due volte. Per contare una volta sola serve anche un'identità dell'evento.
- In un unico inserimento multiplo con `DO UPDATE`, due proposte per la stessa chiave non possono aggiornare due volte la stessa riga. Risolvi i duplicati dell'input secondo una regola esplicita. Errori indipendenti, come un `CHECK` violato, non vengono ignorati.

**Fonte:** [PostgreSQL 18: INSERT e ON CONFLICT](https://www.postgresql.org/docs/18/sql-insert.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Vincoli|Vincoli]]
- [[Programmazione/PostgreSQL/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]
- [[Programmazione/PostgreSQL/Pagine/RETURNING|RETURNING]]

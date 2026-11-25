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
  - Regole
prerequisites: []
related: []
title: Regole
---

# Regole

## Sintesi

Una regola (`CREATE RULE`) **riscrive l'istruzione SQL prima della pianificazione**. Non è una funzione chiamata una volta per riga. `DO ALSO` aggiunge un'altra istruzione; `DO INSTEAD` sostituisce l'azione originale. Questa distinzione conta quando leggi uno schema in cui un `DELETE` non elimina nulla e non segnala un errore.

## Laboratorio: una cancellazione trasformata in aggiornamento

Esegui i due blocchi in ordine nella stessa sessione. La regola si applica solo alla tabella temporanea dell'esempio. `OLD.id` collega l'azione sostitutiva alle righe selezionate dal `DELETE`; non è una variabile PL/pgSQL sulla quale stai iterando.

```sql
BEGIN;
CREATE TEMP TABLE lab_orders (id integer PRIMARY KEY, archived boolean NOT NULL DEFAULT false);
INSERT INTO lab_orders (id) VALUES (1), (2), (3);
CREATE RULE archive_instead AS ON DELETE TO lab_orders
DO INSTEAD UPDATE lab_orders AS target SET archived = true WHERE target.id = OLD.id;
```

```sql
DELETE FROM lab_orders WHERE id IN (1, 3);
SELECT id, archived FROM lab_orders ORDER BY id;
DROP RULE archive_instead ON lab_orders;
DELETE FROM lab_orders WHERE id = 3 RETURNING id;
SELECT id FROM lab_orders ORDER BY id;
ROLLBACK;
```

Dopo il primo comando esistono ancora **tre** ordini: 1 e 3 sono archiviati, 2 no. Dopo `DROP RULE`, il secondo `DELETE` elimina davvero il 3 e restano 1 e 2. Il comportamento cambia per tutti i client che scrivono sulla tabella, non solo per il chiamante che conosce la regola.

## Quando preferire un altro strumento

- **Vuoi che una cancellazione sia vietata e visibile al client?** Usa i privilegi oppure un vincolo pertinente. `DO INSTEAD NOTHING` scarta la richiesta senza trasformarla in un errore: non è la stessa garanzia.
- **Vuoi archiviare un ordine?** Un `UPDATE` esplicito o una routine con un nome come `archive_order` rende l'intenzione visibile. Per effetti riga per riga su scritture reali, come un audit, un trigger è di solito più prevedibile.
- **Stai leggendo una vista?** Il sistema di riscrittura espande la sua definizione in lettura. Non serve scrivere una regola `ON SELECT` a mano per creare una vista. Molte viste semplici sono già aggiornabili; per scritture non banali valuta un trigger `INSTEAD OF`.
- **Il client usa `RETURNING`?** La regola del laboratorio non definisce un `RETURNING` sostitutivo. Aggiungere `RETURNING id` al *primo* `DELETE` produce un errore: non assumere che riscrivere un comando ne conservi il contratto. Prova anche operazioni multi-riga e filtri senza corrispondenze.

**Fonte:** [PostgreSQL 18: regole su INSERT, UPDATE e DELETE](https://www.postgresql.org/docs/18/rules-update.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Trigger e Event Trigger|Trigger e Event Trigger]]
- [[Programmazione/PostgreSQL/Pagine/Views e Materialized Views|Views e Materialized Views]]
- [[Programmazione/PostgreSQL/Pagine/Funzioni e Store Procedures|Funzioni e stored procedure]]

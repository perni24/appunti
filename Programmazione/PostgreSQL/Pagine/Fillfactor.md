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
  - storage
  - performance
aliases: []
prerequisites: []
related: []
title: Fillfactor
---

# Fillfactor

## Sintesi

Per una **tabella heap**, `fillfactor` è la percentuale della pagina che gli inserimenti mirano a occupare. Con 70 si lascia indicativamente il 30% per nuove versioni di righe già presenti. Non è un limite alla crescita della tabella e lo spazio lasciato libero di proposito non è, da solo, prova di *bloat*.

Per un **indice B-tree**, il parametro riguarda invece il riempimento delle pagine foglia durante la costruzione e l'estensione sul margine destro dell'indice. Lasciare margine può ridurre alcuni *page split* futuri; non riserva spazio per gli aggiornamenti della heap. I default sono diversi: **100 per la heap, 90 per un B-tree**.

## Quando un aggiornamento può essere HOT

Un aggiornamento *heap-only tuple* (HOT) può riutilizzare i riferimenti negli indici se la nuova versione entra nella **stessa pagina** e non cambiano colonne referenziate da indici non riassuntivi. Contano anche colonne `INCLUDE` e riferimenti in espressioni o predicati. In PostgreSQL 18 gli indici riassuntivi, come BRIN, sono un'eccezione a questa seconda condizione.

Esempio: aggiornare `last_seen_at` senza indicizzarla può beneficiare del margine nella pagina. Se è inclusa in un B-tree, lasciare più spazio nella tabella non rende HOT una modifica del suo valore.

## Laboratorio: spazio iniziale e aggiornamenti

Esegui i tre blocchi nella stessa sessione. Le due heap temporanee hanno le stesse 5000 righe, nello stesso ordine; differisce solo il loro fillfactor. Misuriamo il file principale, non gli indici. L'indice sulla seconda tabella ha una propria impostazione indipendente.

```sql
BEGIN;
CREATE TEMP TABLE lab_dense (id integer, version integer, pad text) WITH (fillfactor = 100);
CREATE TEMP TABLE lab_roomy (LIKE lab_dense) WITH (fillfactor = 60);
INSERT INTO lab_dense SELECT i, 0, repeat('x', 120) FROM generate_series(1,5000) AS g(i);
INSERT INTO lab_roomy SELECT * FROM lab_dense ORDER BY id;
CREATE UNIQUE INDEX lab_roomy_id ON lab_roomy (id) WITH (fillfactor = 80);
SELECT pg_relation_size('lab_dense') AS dense_bytes,
       pg_relation_size('lab_roomy') AS roomy_bytes;
```

```sql
UPDATE lab_roomy SET version = 1 WHERE id % 10 = 0;
SELECT n_tup_upd, n_tup_hot_upd
FROM pg_stat_xact_user_tables WHERE relid = 'lab_roomy'::regclass;
```

La heap a 60 occupa più pagine già dopo il caricamento. Il secondo blocco aggiorna **500** righe senza cambiare `id`: la vista mostra quanti dei 500 aggiornamenti sono stati HOT in questa transazione. Il numero esatto non è una promessa del parametro.

```sql
UPDATE lab_roomy SET id = id + 10000 WHERE id % 10 = 0;
SELECT n_tup_upd, n_tup_hot_upd
FROM pg_stat_xact_user_tables WHERE relid = 'lab_roomy'::regclass;
ROLLBACK;
```

Ora il totale è **1000**, ma il contatore HOT non aumenta rispetto alla lettura precedente: le seconde 500 modifiche cambiano la chiave B-tree. La vista `pg_stat_xact_user_tables` permette il confronto immediato nella stessa transazione. Per una tabella in uso, confronta invece le **differenze** fra due campioni di `pg_stat_user_tables` per lo stesso carico e lo stesso periodo di raccolta.

## Cambiare un oggetto esistente

`ALTER TABLE ... SET (fillfactor = ...)` cambia il parametro, **non riscrive subito le pagine esistenti**. Un `VACUUM` ordinario non ridistribuisce le righe per applicare il nuovo riempimento. Una riscrittura può applicarlo subito, ma richiede spazio e una finestra compatibile con i lock: `VACUUM FULL` non è il passo obbligatorio dopo un `ALTER TABLE`. Analogamente, cambiare il fillfactor di un B-tree non ne ricostruisce automaticamente le foglie già presenti.

Su una tabella quasi solo in append, pagine meno dense possono costare più I/O e cache senza un beneficio sugli aggiornamenti. Prima di cambiare un valore reale, misura dimensione della heap e dell'indice **separatamente**, frazione di aggiornamenti HOT e prestazioni delle letture rappresentative.

**Fonti PostgreSQL 18:** [parametri delle tabelle](https://www.postgresql.org/docs/18/sql-createtable.html#SQL-CREATETABLE-STORAGE-PARAMETERS), [aggiornamenti HOT](https://www.postgresql.org/docs/18/storage-hot.html), [parametri degli indici](https://www.postgresql.org/docs/18/sql-createindex.html#SQL-CREATEINDEX-STORAGE-PARAMETERS).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/MVCC|MVCC]]
- [[Programmazione/PostgreSQL/Pagine/Manutenzione|Manutenzione]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Indici|Tipi di Indici]]

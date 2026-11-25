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
  - Partitioning
prerequisites: []
related: []
title: Partitioning in PostgreSQL
---

# Partitioning in PostgreSQL

## Sintesi

Il partizionamento dichiarativo mantiene una sola tabella logica e instrada ogni riga verso una tabella figlia in base alla chiave di partizione. Non distribuisce da solo il carico su più server. Conviene quando i filtri delle query o il ciclo di vita dei dati coincidono con i confini delle partizioni, non al superamento di una soglia fissa di GB.

## Scegliere la chiave

| Strategia | Quando aiuta | Costo da prevedere |
| --- | --- | --- |
| `RANGE` | Ordini per mese: leggere o archiviare un intervallo | Creare in anticipo l'intervallo successivo |
| `LIST` | Gruppi noti, per esempio paesi | Gestire i valori nuovi, eventualmente con una partizione `DEFAULT` |
| `HASH` | Distribuire chiavi senza confini naturali | Non agevola la retention per data; non elimina gli squilibri dovuti a una singola chiave molto frequente |

Una `PRIMARY KEY` o `UNIQUE` sul padre deve includere tutte le colonne della chiave di partizione, che in questo caso non può contenere espressioni. Nell'esempio la coppia `(id, created_at)` è unica, **non** `id` da solo.

## Laboratorio: dove finisce un ordine?

Eseguire i blocchi in ordine nella stessa sessione. Sono tabelle temporanee: non servono modifiche a dati esistenti.

```sql
CREATE TEMP TABLE lab_orders (
  id integer NOT NULL,
  created_at date NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
CREATE TEMP TABLE lab_jan PARTITION OF lab_orders
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TEMP TABLE lab_feb PARTITION OF lab_orders
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
INSERT INTO lab_orders VALUES (1, '2026-01-31'), (1, '2026-02-01');
```

```sql
SELECT id, created_at, tableoid::regclass AS partizione
FROM lab_orders ORDER BY created_at;
```

Il limite inferiore è incluso, quello superiore escluso: il primo ordine va in `lab_jan`, il secondo in `lab_feb`. Un inserimento al 1° marzo fallirebbe perché manca una partizione adatta.

```sql
EXPLAIN (COSTS OFF)
SELECT id FROM lab_orders
WHERE created_at >= DATE '2026-02-01' AND created_at < DATE '2026-03-01';
```

Nel piano cerca `lab_feb` e l'assenza di `lab_jan`: questo è il *partition pruning*. La scelta fra scansione sequenziale e indice **dentro** febbraio è un'altra decisione.

## Retention senza cancellare le singole righe

```sql
ALTER TABLE lab_orders DETACH PARTITION lab_jan;
SELECT count(*) FROM lab_orders;
SELECT count(*) FROM lab_jan;
```

Entrambe le query restituiscono `1`: gennaio non è più visibile dal padre, ma esiste ancora come tabella. `DROP TABLE` invece eliminerebbe i dati. In produzione pianifica lock, archiviazione e verifica prima della rimozione; `DETACH PARTITION ... CONCURRENTLY` riduce il lock sul padre ma ha restrizioni. Troppe partizioni aumentano il lavoro di pianificazione: controlla piani reali prima di aggiungere un secondo livello.

## Fonte

[PostgreSQL 18: partizionamento dichiarativo, manutenzione e pruning](https://www.postgresql.org/docs/18/ddl-partitioning.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/PostgreSQL/Pagine/Manutenzione|Manutenzione]]
- [[Programmazione/PostgreSQL/Pagine/Write-Ahead Logging|Write-Ahead Logging]]

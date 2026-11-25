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
aliases: []
prerequisites: []
related: []
title: Tablespace
---

# Tablespace

## Sintesi

Un **tablespace** dà un nome SQL a una posizione di storage del server. Serve, per esempio, a collocare un indice su un volume diverso dalla sua tabella. Non è uno schema, non cambia il modo in cui si scrivono le query e non crea un database indipendente. Due percorsi sullo stesso dispositivo non garantiscono più velocità o isolamento dai guasti.

## Leggere la collocazione

Questo blocco è di sola lettura. `pg_default` ospita normalmente gli oggetti dei database; `pg_global` ospita cataloghi condivisi dal cluster. Per i due tablespace incorporati la funzione di posizione restituisce una stringa vuota: non significa che manchi il volume.

```sql
SELECT spcname, pg_tablespace_location(oid) AS server_location
FROM pg_tablespace ORDER BY spcname;
```

Un tablespace utente è visibile a livello di cluster. `pg_tblspc` nella data directory collega il cluster allo storage esterno; i dati dipendono comunque dal resto del cluster e dal WAL. Spostare a mano una directory non è equivalente a spostare un oggetto via SQL.

## Laboratorio: tabella e indice si spostano separatamente

Usa **solo un cluster di prova** in cui puoi amministrare lo storage, e `psql` con autocommit inizialmente attivo. Per `CREATE TABLESPACE` serve un superuser. Chi colloca oggetti in un tablespace esistente deve avere i privilegi appropriati, incluso `CREATE` sul tablespace di destinazione. Preparazione:

1. Fai predisporre **sul server** una directory nuova, vuota, con percorso assoluto, esterna alla data directory e utilizzabile dall'account del servizio PostgreSQL (su Unix, di proprietà di tale account). Non indicare una directory dati esistente. Sui servizi gestiti questa operazione può non essere disponibile.
2. Verifica che i nomi `lab_ts_fast` (cluster) e `lab_ts_demo` (database) siano liberi. Lavora nella stessa connessione fino alla pulizia. Al prompt inserisci il percorso del server, senza virgolette; su Windows puoi usare barre `/`.

```psql
\prompt 'Percorso assoluto della directory vuota sul server: ' ts_dir
```

Crea il tablespace **fuori** da `BEGIN`. `:'ts_dir'` è l'espansione di una variabile di `psql` come stringa SQL, non sintassi da inviare direttamente tramite un driver.

```sql
CREATE TABLESPACE lab_ts_fast LOCATION :'ts_dir';
```

Crea entrambi gli oggetti in `pg_default` e sposta solo la heap. La transazione resta aperta:

```sql
BEGIN;
CREATE SCHEMA lab_ts_demo;
CREATE TABLE lab_ts_demo.orders (id integer, amount integer) TABLESPACE pg_default;
CREATE UNIQUE INDEX lab_orders_idx ON lab_ts_demo.orders (id) TABLESPACE pg_default;
INSERT INTO lab_ts_demo.orders VALUES (1, 90);
ALTER TABLE lab_ts_demo.orders SET TABLESPACE lab_ts_fast;
SELECT c.relname, t.spcname
FROM pg_class AS c
JOIN pg_database AS d ON d.datname = current_database()
JOIN pg_tablespace AS t ON t.oid = coalesce(nullif(c.reltablespace, 0), d.dattablespace)
WHERE c.relnamespace = 'lab_ts_demo'::regnamespace
ORDER BY c.relname;
```

Risultato: `lab_orders_idx → pg_default` e `orders → lab_ts_fast`. Nel catalogo `reltablespace = 0` significa «default del database», non «nessun tablespace». Per spostare anche l'indice occorre una seconda istruzione:

```sql
ALTER INDEX lab_ts_demo.lab_orders_idx SET TABLESPACE lab_ts_fast;
SELECT pg_relation_filepath('lab_ts_demo.orders') AS heap_path,
       pg_relation_filepath('lab_ts_demo.lab_orders_idx') AS index_path;
SELECT id, amount FROM lab_ts_demo.orders;
ROLLBACK;
```

Ora entrambi i percorsi logici iniziano con `pg_tblspc/` e la riga resta `(1,90)`. I nomi dei file non sono stabili. Il rollback elimina gli oggetti del laboratorio, **non** il tablespace creato prima della transazione.

Pulizia: fuori da una transazione, rimuovi **solo il tablespace appena creato**. Deve essere vuoto nell'intero cluster; in caso di errore intermedio chiudi prima la transazione con `ROLLBACK`. Non cancellare a mano file o collegamenti per forzare la rimozione.

```sql
DROP TABLESPACE lab_ts_fast;
```

## Prima di uno spostamento reale

- Spostare un oggetto con dati comporta I/O, spazio libero sul volume di destinazione e lock. Misura l'esigenza e pianifica la finestra: la separazione fisica non sostituisce l'analisi della query.
- In un backup fisico includi tutti i tablespace e predisponi i percorsi o la relativa mappatura al ripristino. Una copia del solo tablespace non è ripristinabile da sola. Verifica la procedura anche sulle repliche e monitora lo spazio di ogni volume.
- Un tablespace non è destinato a supporti rimovibili o effimeri: la perdita del volume può compromettere il cluster anche se la data directory principale è intatta.

**Fonti PostgreSQL 18:** [tablespace](https://www.postgresql.org/docs/18/manage-ag-tablespaces.html), [CREATE TABLESPACE](https://www.postgresql.org/docs/18/sql-createtablespace.html), [ALTER TABLE](https://www.postgresql.org/docs/18/sql-altertable.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/File System Layout e Data Directory|File System Layout e Data Directory]]
- [[Programmazione/PostgreSQL/Pagine/Backup e Ripristino|Backup e Ripristino]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Indici|Tipi di Indici]]

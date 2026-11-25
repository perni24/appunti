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
  - Analisi delle Query
prerequisites: []
related: []
title: Analisi delle Query in PostgreSQL
---

# Analisi delle Query in PostgreSQL

## Sintesi

`EXPLAIN` mostra **come il planner prevede** di ottenere un risultato; `EXPLAIN ANALYZE` esegue il comando e mostra anche **che cosa è successo**. Per decidere un intervento cerca il primo punto in cui la stima o il lavoro svolto non corrispondono alle attese. Il nodo col costo più grande non è necessariamente il problema: spesso include il lavoro dei figli.

## Laboratorio: gli ultimi tre ordini di un cliente

Esegui i tre blocchi nella stessa sessione. La tabella temporanea contiene 25 ordini per ciascuno di 1000 clienti. Prima osserva come il database individua i tre ordini più recenti senza un indice adatto.

```sql
BEGIN;
CREATE TEMP TABLE lab_orders (id integer, customer_id integer, amount integer);
INSERT INTO lab_orders SELECT i, i % 1000, i % 80 FROM generate_series(1,25000) AS g(i);
ANALYZE lab_orders;
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF)
SELECT id, amount FROM lab_orders WHERE customer_id = 42 ORDER BY id DESC LIMIT 3;
```

```sql
CREATE INDEX lab_recent_orders ON lab_orders (customer_id, id DESC);
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF)
SELECT id, amount FROM lab_orders WHERE customer_id = 42 ORDER BY id DESC LIMIT 3;
```

Il risultato non deve cambiare: gli ID sono **24042, 23042, 22042**. Nel primo piano cerca le 25 righe rimaste dopo il filtro, l'ordinamento e il `Limit` che ne restituisce tre. Nel secondo cerca se `customer_id = 42` è diventato un `Index Cond` e se la scansione si ferma a tre righe senza `Sort`. Non c'è una percentuale universale oltre la quale un `Seq Scan` sia giusto o sbagliato: contano anche ordine, `LIMIT`, distribuzione fisica, cache e costi stimati.

**Scritture:** il blocco seguente modifica davvero la tabella temporanea. Un savepoint permette di confrontare il valore prima del rollback e dopo; il rollback finale elimina il laboratorio.

```sql
SAVEPOINT before_measure;
EXPLAIN (ANALYZE, BUFFERS, TIMING OFF)
UPDATE lab_orders SET amount = amount + 1 WHERE id = 42;
SELECT amount FROM lab_orders WHERE id = 42;
ROLLBACK TO before_measure;
SELECT amount FROM lab_orders WHERE id = 42;
ROLLBACK;
```

Vedrai **43, poi 42**. Un rollback non annulla tutto ciò che una routine può fare, per esempio l'avanzamento di una sequenza o una chiamata esterna. Per scritture reali con effetti non noti, parti da `EXPLAIN` senza `ANALYZE` o da una copia dei dati.

## EXPLAIN in produzione

Parti dalla query, dal ruolo e dai parametri che hanno mostrato il problema. Osserva il piano stimato con `EXPLAIN` senza `ANALYZE`: non otterrai tempi reali, ma neppure avvierai l'esecuzione che stai diagnosticando. Prima di passare a `ANALYZE`, chiediti se puoi riprodurre il lavoro su una copia rappresentativa. Anche una lettura può competere per CPU, I/O e lock; una replica con statistiche, cache o carico diversi non è un cronometro del primario.

Se è necessario misurare sul sistema in servizio, concorda la finestra, limita i timeout alla sessione e misura una richiesta alla volta. `TIMING OFF` riduce la strumentazione per nodo, non il costo della query. Per DML o funzioni con effetti collaterali non usare il rollback come garanzia generale di innocuità: vedi il laboratorio precedente. Conserva il piano con il contesto della misura, oscurando dati sensibili.

## Come leggere il piano

- **Costo e cardinalità:** in `cost=inizio..totale` i costi sono unità del modello, non millisecondi. `rows` indica l'output stimato del nodo, non le righe visitate. Con `LIMIT` un nodo può fermarsi presto: una differenza dalle sue righe stimate non implica statistiche errate.
- **Righe e ripetizioni:** `actual rows` e i tempi del nodo, se presenti, sono medie per esecuzione. Con `loops=100` e `actual rows=3` il nodo ha restituito circa 300 righe in tutto. Non sommare i tempi o i buffer dei figli a quelli del genitore. `TIMING OFF` mantiene le cardinalità e riduce il costo della misura per nodo.
- **Accessi:** `Seq Scan` legge la tabella in sequenza; `Index Scan` usa l'indice e consulta la heap; `Index Only Scan` può ancora fare `Heap Fetches`. Un `Bitmap Heap Scan` raggruppa gli accessi per pagina a partire dai candidati dell'indice. `Filter` elimina righe dopo l'accesso; `Index Cond` limita l'accesso stesso.
- **Buffer:** `shared hit` indica una pagina già nei buffer PostgreSQL; `read` non prova da solo un accesso al dispositivo fisico, perché può intervenire la cache del sistema operativo. Per le tabelle temporanee dell'esempio vedrai buffer **local**. `temp read/written` segnala invece file di lavoro, per esempio per un ordinamento su disco.
- **Join:** per un nested loop guarda quante volte viene eseguito il lato interno. Per un hash join controlla la dimensione del lato usato per costruire l'hash e i batch; per un merge join verifica se l'ordine richiesto è già disponibile o va prodotto con un sort.

Per un confronto ripetibile mantieni dati e parametri uguali e cambia una cosa per volta. `FORMAT JSON` facilita il confronto automatico e i visualizzatori come PEV; `VERBOSE` aggiunge dettagli su espressioni e oggetti. Per risalire dal carico reale alle query da studiare, `pg_stat_statements` aggrega le esecuzioni; `auto_explain` può registrare i piani delle query lente. Un piano può rivelare nomi e valori applicativi: controllalo prima di condividerlo.

**Fonti PostgreSQL 18:** [lettura di EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html), [opzioni e semantica del comando](https://www.postgresql.org/docs/18/sql-explain.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Indici|Tipi di Indici]]
- [[Programmazione/PostgreSQL/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]

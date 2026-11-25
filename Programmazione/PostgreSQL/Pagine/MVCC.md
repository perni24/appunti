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
  - MVCC (Multi-Version Concurrency Control)
prerequisites: []
related: []
title: MVCC (Multi-Version Concurrency Control) in PostgreSQL
---

# MVCC (Multi-Version Concurrency Control) in PostgreSQL

## Sintesi

**MVCC** (*Multi-Version Concurrency Control*) separa la riga logica dalle sue versioni fisiche. Un aggiornamento produce una nuova versione; uno **snapshot** stabilisce quali versioni la query può leggere. Per questo due sessioni possono leggere valori diversi della stessa riga senza che nessuna legga dati sporchi.

## Esperimento: quale prezzo vede il lettore?

Apri due connessioni **A** e **B** allo stesso database di prova, con autocommit attivo fuori dai `BEGIN`. Non usare una tabella temporanea: l'altra connessione non la vedrebbe. Usa un database dove il nome `lab_mvcc_price` sia libero. Segui i passi in ordine.

**1. A, preparazione condivisa.** Crea una riga confermata prima dell'esperimento.

```sql
CREATE TABLE lab_mvcc_price (id integer PRIMARY KEY, price integer NOT NULL);
INSERT INTO lab_mvcc_price VALUES (1, 10);
```

**2. A, lettore.** La prima lettura fissa lo snapshot e restituisce `10`.

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SELECT price FROM lab_mvcc_price WHERE id = 1;
```

**3. B, scrittore.** B vede il proprio aggiornamento a `12`. Lascia aperta la transazione.

```sql
BEGIN;
UPDATE lab_mvcc_price SET price = 12 WHERE id = 1 RETURNING price;
```

**4. A.** Non aspetta il commit di B: una normale `SELECT` restituisce ancora `10`.

```sql
SELECT price FROM lab_mvcc_price WHERE id = 1;
```

**5. B.** Rendi definitiva la modifica.

```sql
COMMIT;
```

**6. A.** La prima query vede ancora `10`; dopo il commit di A la nuova query vede `12`. Ripetendo da zero con `READ COMMITTED` al passo 2, anche la prima query di questo passo vede `12`: lo snapshot cambia tra istruzioni.

```sql
SELECT price FROM lab_mvcc_price WHERE id = 1;
COMMIT;
SELECT price FROM lab_mvcc_price WHERE id = 1;
```

**7. Pulizia**, solo sulla tabella di prova e a transazioni concluse. Il comando la elimina.

```sql
DROP TABLE lab_mvcc_price;
```

## Versioni, lock e pulizia

- `xmin` identifica la transazione che ha creato una **versione**. `xmax` può rappresentare una modifica o informazioni di lock: un valore diverso da zero non prova, da solo, che la riga sia stata cancellata. Non usare queste colonne di sistema come chiavi applicative.
- L'aggiornamento non equivale a eseguire due comandi applicativi `DELETE` e `INSERT`. La vecchia versione può ancora servire a snapshot precedenti; se l'aggiornamento viene annullato, non diventa visibile agli altri. Un aggiornamento HOT può evitare nuove voci d'indice in condizioni adatte.
- `VACUUM` recupera spazio **riutilizzabile** dalle versioni non più necessarie e contribuisce a prevenire il wraparound degli ID tramite freezing. Normalmente non riduce il file nella stessa misura. `ANALYZE` aggiorna le statistiche di distribuzione usate dal planner; autovacuum può avviare i due lavori secondo soglie distinte.
- Una transazione che trattiene un vecchio snapshot può ritardare la pulizia anche se in quel momento è inattiva. In `pg_stat_user_tables`, `n_dead_tup` è una **stima**, non l'elenco esatto delle versioni eliminabili. Per decidere cosa fare guarda anche durata delle transazioni e attività di autovacuum.
- Una `SELECT` ordinaria non aspetta il lock di riga dello scrittore. Un altro scrittore o un `SELECT ... FOR UPDATE` può invece attendere; un lock di tabella incompatibile può bloccare anche letture normali.

**Fonti PostgreSQL 18:** [MVCC](https://www.postgresql.org/docs/18/mvcc-intro.html), [colonne di sistema](https://www.postgresql.org/docs/18/ddl-system-columns.html), [vacuum ordinario](https://www.postgresql.org/docs/18/routine-vacuuming.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Livelli di Isolamento delle Transazioni|Livelli di Isolamento delle Transazioni]]
- [[Programmazione/PostgreSQL/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
- [[Programmazione/PostgreSQL/Pagine/Manutenzione|Manutenzione]]

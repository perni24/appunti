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
  - Proprietà ACID
prerequisites: []
related: []
title: Proprietà ACID in PostgreSQL
---

# Proprietà ACID in PostgreSQL

## Sintesi

Una transazione stabilisce **quali modifiche devono riuscire insieme**. Non garantisce che le istruzioni scritte siano quelle giuste: un `UPDATE` che trova zero righe è un successo SQL, non un errore. In un trasferimento occorre verificare sia l'addebito sia l'accredito.

| Proprietà | Garanzia | Limite da ricordare |
| --- | --- | --- |
| Atomicità | Gli effetti transazionali diventano definitivi insieme al commit o vengono annullati | Un'email già inviata non torna indietro con `ROLLBACK` |
| Consistenza | Tipi, vincoli e logica mantengono le invarianti espresse dal sistema | Un `CHECK` sul saldo non garantisce da solo che la somma dei due conti resti invariata |
| Isolamento | Il livello scelto regola ciò che si può osservare in presenza di transazioni concorrenti | Il livello predefinito non rende seriali tutte le decisioni applicative |
| Durabilità | Con le impostazioni durevoli e storage affidabile, un commit confermato sopravvive al crash locale | Durabilità locale, replica e backup non sono la stessa cosa |

## Laboratorio: un trasferimento con due esiti controllati

Esegui i tre blocchi in ordine nella stessa sessione PostgreSQL di prova con autocommit inizialmente attivo. Gli importi sono unità intere; conti e funzione sono temporanei. La PK fa sì che ogni aggiornamento possa toccare **al massimo una** riga.

```sql
CREATE TEMP TABLE lab_accounts (id integer PRIMARY KEY, balance integer NOT NULL CHECK (balance >= 0));
INSERT INTO lab_accounts VALUES (1, 100), (2, 40);
CREATE FUNCTION pg_temp.transfer(p_from integer, p_to integer, p_amount integer)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_from IS NULL OR p_to IS NULL OR p_from = p_to OR p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Argomenti non validi' USING ERRCODE = '22023';
  END IF;
  UPDATE pg_temp.lab_accounts SET balance = balance - p_amount
    WHERE id = p_from AND balance >= p_amount;
  IF NOT FOUND THEN RAISE EXCEPTION 'Addebito non eseguito'; END IF;
  UPDATE pg_temp.lab_accounts SET balance = balance + p_amount WHERE id = p_to;
  IF NOT FOUND THEN RAISE EXCEPTION 'Destinatario assente'; END IF;
END;
$$;
```

```sql
BEGIN;
SELECT pg_temp.transfer(1, 2, 30);
SELECT id, balance FROM lab_accounts ORDER BY id;
COMMIT;
```

I saldi passano da `100, 40` a **70, 70**. Se il destinatario manca, l'errore annulla anche l'addebito già eseguito dalla funzione. Dentro una transazione esplicita un errore non gestito lascia la transazione in stato di errore: esegui `ROLLBACK` oppure torna a un savepoint creato **prima** dell'operazione.

```sql
BEGIN;
SAVEPOINT before_optional;
SELECT pg_temp.transfer(2, 1, 10);
ROLLBACK TO SAVEPOINT before_optional;
SELECT id, balance FROM lab_accounts ORDER BY id;
COMMIT;
```

I saldi sono ancora `70, 70`. Il savepoint permette di scartare una parte della transazione, non rende definitivo il lavoro precedente. Senza `BEGIN` esplicito, in autocommit due istruzioni inviate separatamente sono normalmente due transazioni.

## Che cosa prova un commit

Con le impostazioni durevoli predefinite il server rende persistente il record di commit nel **WAL** prima di confermare al client; non deve aver già scritto ogni pagina dati. Il WAL serve al recupero dopo crash, non a «disfare» fisicamente ogni riga al rollback. Con `synchronous_commit = off` alcuni commit recenti già confermati possono andare persi in caso di crash; disabilitare `fsync` comporta rischi più gravi, inclusa la corruzione.

Se cade la connessione mentre aspetti la risposta a `COMMIT`, il client potrebbe non sapere se il server ha confermato. Non ripetere alla cieca un trasferimento reale: associa all'operazione una chiave univoca persistente e verifica l'esito dopo la riconnessione. Il laboratorio dimostra l'atomicità del saldo, **non** implementa la deduplicazione delle richieste né simula un crash.

**Fonti PostgreSQL 18:** [transazioni e savepoint](https://www.postgresql.org/docs/18/tutorial-transactions.html), [WAL](https://www.postgresql.org/docs/18/wal-intro.html), [commit asincrono](https://www.postgresql.org/docs/18/wal-async-commit.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Livelli di Isolamento delle Transazioni|Livelli di Isolamento delle Transazioni]]
- [[Programmazione/PostgreSQL/Pagine/MVCC|MVCC]]
- [[Programmazione/PostgreSQL/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
- [[Programmazione/PostgreSQL/Pagine/Vincoli|Vincoli]]

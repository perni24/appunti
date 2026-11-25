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
  - Livelli di Isolamento delle Transazioni
prerequisites: []
related: []
title: Livelli di Isolamento delle Transazioni in PostgreSQL
---

# Livelli di Isolamento delle Transazioni in PostgreSQL

## Sintesi

Il livello di isolamento decide **quali cambiamenti altrui puoi osservare** e quali combinazioni di decisioni concorrenti PostgreSQL deve impedire. Uno snapshot stabile rende ripetibile un report; non basta necessariamente a proteggere una regola che coinvolge più righe.

| Livello in PostgreSQL | Cosa vedono due SELECT ordinarie nella stessa transazione | Cosa può ancora succedere |
| --- | --- | --- |
| `READ COMMITTED` (predefinito) | Ognuna usa uno snapshot a inizio istruzione | Una riga cambia fra due letture o cambia l'insieme che soddisfa un filtro. `READ UNCOMMITTED` in PostgreSQL si comporta allo stesso modo |
| `REPEATABLE READ` | Stesso snapshot dalla prima istruzione che ne ha bisogno, oltre alle proprie modifiche | Nessuna lettura sporca, non ripetibile o fantasma; sono possibili anomalie tra scritture su righe diverse |
| `SERIALIZABLE` | Snapshot stabile e controllo delle dipendenze tra transazioni | Per garantire un esito equivalente a un ordine seriale delle transazioni serializzabili confermate, il server può rifiutarne una con `40001` |

## Esperimento: due persone possono lasciare insieme il turno?

Regola: deve restare almeno una persona reperibile. Apri **due sessioni** A e B nello stesso database di prova, con autocommit attivo fuori dai `BEGIN`. Crea da A una tabella nuova con nome libero:

```sql
CREATE TABLE lab_on_call (id integer PRIMARY KEY, available boolean NOT NULL);
INSERT INTO lab_on_call VALUES (1, true), (2, true);
```

**1. A e poi B:** esegui il blocco una volta **in ciascuna** sessione prima di qualsiasi aggiornamento. Entrambe contano due persone.

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT count(*) FROM lab_on_call WHERE available;
```

**2. Solo A:** la persona 1 esce se risulta disponibile un'altra persona. Conferma prima di passare a B.

```sql
UPDATE lab_on_call SET available = false
WHERE id = 1 AND (SELECT count(*) FROM lab_on_call WHERE available) > 1
RETURNING id;
COMMIT;
```

**3. Solo B:** applica la stessa regola alla persona 2 usando ancora il suo snapshot iniziale.

```sql
UPDATE lab_on_call SET available = false
WHERE id = 2 AND (SELECT count(*) FROM lab_on_call WHERE available) > 1
RETURNING id;
COMMIT;
```

**4. Verifica** dopo la fine di entrambe le transazioni:

```sql
SELECT count(*) FROM lab_on_call WHERE available;
```

Con `REPEATABLE READ` il risultato è **0**. Nessuna transazione ha sovrascritto la riga cambiata dall'altra: ciascuna ha preso una decisione su un insieme comune, poi ha scritto su una riga diversa. Questa anomalia si chiama *write skew*.

**Seconda prova:** ripristina i dati in autocommit, poi ripeti i passi 1–4 sostituendo `REPEATABLE READ` con `SERIALIZABLE` **in entrambe le sessioni**.

```sql
UPDATE lab_on_call SET available = true;
```

Con l'ordine indicato, A è già confermata e B riceve `40001` durante la scrittura o al commit. Se la transazione è ancora in errore, chiudila con `ROLLBACK`. Rimane **1** persona. Un nuovo tentativo di B dall'inizio vede una sola persona e non aggiorna nulla. Alla fine, elimina solo la tabella del laboratorio:

```sql
DROP TABLE lab_on_call;
```

## Scegliere e riprovare

- Per leggere più totali coerenti, `REPEATABLE READ READ ONLY` evita che un commit intermedio cambi lo snapshot. `SERIALIZABLE READ ONLY DEFERRABLE` può aspettare all'inizio uno snapshot sicuro. Nessun livello rende una transazione lunga priva di costi.
- Per una scrittura su una sola riga può bastare un `UPDATE` con la condizione nel `WHERE`. In `READ COMMITTED` se un altro scrittore ha modificato la riga, il comando può attendere e rivalutare la condizione sulla versione aggiornata. In `REPEATABLE READ` una modifica concorrente successiva allo snapshot può invece produrre `40001` anche sulla stessa riga.
- Per invarianti tra righe valuta un vincolo dichiarativo, un lock su una risorsa comune usato da **tutti** i percorsi di scrittura, oppure `SERIALIZABLE` con retry. Non esiste una graduatoria di throughput valida per ogni carico.
- Con `40001` ripeti **l'intera transazione**, incluse letture e decisioni, con tentativi limitati. Non ripetere alla cieca effetti esterni già eseguiti. `SHOW transaction_isolation` mostra il livello attivo; `SET SESSION CHARACTERISTICS AS TRANSACTION ...` cambia il default per le transazioni successive della connessione.

**Fonti PostgreSQL 18:** [livelli e anomalie](https://www.postgresql.org/docs/18/transaction-iso.html), [gestione degli errori di serializzazione](https://www.postgresql.org/docs/18/mvcc-serialization-failure-handling.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/MVCC|MVCC]]
- [[Programmazione/PostgreSQL/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
- [[Programmazione/PostgreSQL/Pagine/Proprietà ACID|Proprietà ACID]]

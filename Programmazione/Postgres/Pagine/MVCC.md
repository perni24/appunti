---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [MVCC (Multi-Version Concurrency Control)]
prerequisites: []
related: []
---

# MVCC (Multi-Version Concurrency Control) in PostgreSQL

## Sintesi

MVCC permette a PostgreSQL di conservare più versioni logiche delle righe e scegliere quali sono visibili a ogni statement o transazione. Riduce la contesa tra letture e scritture, ma richiede vacuum, controllo delle transazioni lunghe e una corretta comprensione degli snapshot.

Il **Multi-Version Concurrency Control (MVCC)** è il meccanismo fondamentale con cui PostgreSQL gestisce l'accesso simultaneo ai dati da parte di più utenti senza compromettere l'integrità.

## Quando usarlo

Serve capire MVCC quando analizzi concorrenza, bloat, vacuum e visibilita dei dati:

- query lunghe che impediscono a `VACUUM` di ripulire tuple morte;
- tabelle che crescono molto dopo molti `UPDATE` o `DELETE`;
- differenze tra dati letti da transazioni diverse;
- scelta del livello di isolamento;
- problemi con `idle in transaction`;
- interpretazione di snapshot e visibilita.

## Come funziona

### Concetto chiave
La proprietà pratica di MVCC è che le normali letture di righe non confliggono con le normali scritture sulle stesse righe. Un `UPDATE` crea una nuova versione della tupla e lo snapshot decide quale versione è visibile. Il momento dello snapshot dipende dal livello di isolamento: per statement in `READ COMMITTED`, per transazione in `REPEATABLE READ` e `SERIALIZABLE`.

---
### Come funziona: Versionamento delle Righe
Ogni riga (tuple) in PostgreSQL contiene dei campi nascosti che gestiscono la visibilità:

- **xmin:** L'ID della transazione che ha inserito la riga.
- **xmax:** Informazione usata per eliminazioni, aggiornamenti e alcuni lock di riga. Un valore non nullo non basta da solo a stabilire che la tupla sia invisibile: bisogna considerare stato della transazione, bit di hint, eventuali MultiXact e snapshot corrente.

### UPDATE come DELETE + INSERT
Quando esegui un `UPDATE`:
1.  La riga esistente viene marcata come "scaduta" (impostando `xmax` all'ID della transazione corrente).
2.  Viene inserita una nuova riga con i dati aggiornati (impostando `xmin` all'ID corrente).

---
### Visibilità delle Transazioni (Snapshot)
Ogni statement opera rispetto a uno **snapshot**; il livello di isolamento stabilisce se gli statement successivi riusano lo stesso snapshot. In modo semplificato:
- una versione inserita da una transazione confermata può essere visibile se il commit precede lo snapshot;
- una versione inserita da una transazione ancora in corso o abortita non è visibile;
- un `xmax` confermato rende la vecchia versione invisibile solo agli snapshot successivi alla modifica.

Questo garantisce l'[[Programmazione/Postgres/Pagine/Proprietà ACID|Isolamento]] richiesto dai diversi livelli di transazione.

---
### Il problema dei "Dead Tuples" e VACUUM
Poiché gli update e i delete non eliminano fisicamente i dati ma creano nuove versioni, lo spazio su disco tende a crescere (**Bloat**). Le vecchie versioni non più visibili a nessuna transazione attiva sono chiamate "Dead Tuples".

### Il processo VACUUM
Il compito di **VACUUM** è:
1.  Identificare le Dead Tuples.
2.  Marcarne lo spazio come riutilizzabile per nuovi inserimenti.
3.  Aggiornare visibility map, free space map e alcune statistiche di tabella. Le statistiche sulla distribuzione dei valori usate dal planner vengono raccolte da `ANALYZE`.

> [!INFO] Autovacuum
> Il sottosistema autovacuum avvia worker che eseguono `VACUUM` e `ANALYZE` in base a soglie distinte, oltre a prevenire il wraparound degli ID di transazione.

---
### Logic layer: Vantaggi di MVCC
1.  **Alta Concorrenza:** Ideale per sistemi con molti lettori (es: siti web).
2.  **Minore contesa tra DML:** Le normali letture non aspettano i row lock delle normali scritture, ma possono comunque attendere lock di tabella incompatibili, per esempio durante alcuni DDL.
3.  **Rollback logico rapido:** Le versioni create da una transazione abortita diventano invisibili senza un undo fisico immediato; il recupero dello spazio resta compito di `VACUUM`.

---

## API / Sintassi

MVCC non e una API da chiamare direttamente, ma si osserva tramite comandi e viste:

```sql
SELECT xmin, xmax, *
FROM users
WHERE id = 1;
```

Controllo tuple vive e morte:

```sql
SELECT
  relname,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;
```

Vacuum manuale:

```sql
VACUUM ANALYZE users;
```

## Esempio pratico

Esempio concettuale:

```sql
-- Transazione A
BEGIN;
SELECT balance FROM accounts WHERE id = 1;

-- Transazione B
UPDATE accounts SET balance = balance + 100 WHERE id = 1;
COMMIT;

-- Transazione A, in base al livello di isolamento,
-- puo continuare a vedere lo snapshot precedente.
SELECT balance FROM accounts WHERE id = 1;
COMMIT;
```

Con MVCC, la lettura della transazione A non deve bloccare la scrittura della transazione B. PostgreSQL decide quale versione della riga e visibile in base allo snapshot.

## Varianti

- Snapshot per query in `READ COMMITTED`.
- Snapshot per transazione in `REPEATABLE READ`.
- Snapshot con controllo serializzabile in `SERIALIZABLE`.
- HOT update quando l'update non richiede nuove voci indice.
- Dead tuples ripulite da `VACUUM`.
- Freeze per evitare transaction ID wraparound.

## Errori comuni

- Lasciare transazioni aperte a lungo, impedendo la pulizia delle tuple morte.
- Confondere `DELETE` con rimozione fisica immediata.
- Ignorare bloat causato da update frequenti.
- Disattivare o sottodimensionare autovacuum senza monitoraggio.
- Fare batch enormi in una sola transazione quando possono essere spezzati.
- Pensare che MVCC elimini la necessita di lock su scritture concorrenti.

## Checklist

- Monitorare `n_dead_tup` e autovacuum.
- Evitare sessioni `idle in transaction`.
- Tenere transazioni brevi.
- Eseguire `VACUUM ANALYZE` dopo grandi modifiche se serve.
- Controllare bloat su tabelle molto aggiornate.
- Collegare anomalie di lettura al livello di isolamento usato.

## Collegamenti

- [[Programmazione/Postgres/Pagine/Livelli di Isolamento delle Transazioni|Livelli di Isolamento delle Transazioni]]
- [[Programmazione/Postgres/Pagine/Meccanismi di Locking|Meccanismi di Locking]]
- [[Programmazione/Postgres/Pagine/Manutenzione|Manutenzione]]

## Fonti

- [PostgreSQL - Introduction to MVCC](https://www.postgresql.org/docs/current/mvcc-intro.html)
- [PostgreSQL - Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL - Routine Vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html)

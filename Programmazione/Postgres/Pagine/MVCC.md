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

Nota su MVCC (Multi-Version Concurrency Control) in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

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
La filosofia di MVCC è: **"I lettori non bloccano i scrittori, e i scrittori non bloccano i lettori"**. Invece di bloccare una riga quando viene modificata, Postgres ne crea una nuova versione, permettendo a chi legge di vedere lo stato dei dati coerente al momento dell'inizio della propria transazione.

---
### Come funziona: Versionamento delle Righe
Ogni riga (tuple) in PostgreSQL contiene dei campi nascosti che gestiscono la visibilità:

- **xmin:** L'ID della transazione che ha inserito la riga.
- **xmax:** L'ID della transazione che ha eliminato o aggiornato la riga. Se è 0, la riga è attualmente valida.

### UPDATE come DELETE + INSERT
Quando esegui un `UPDATE`:
1.  La riga esistente viene marcata come "scaduta" (impostando `xmax` all'ID della transazione corrente).
2.  Viene inserita una nuova riga con i dati aggiornati (impostando `xmin` all'ID corrente).

---
### Visibilità delle Transazioni (Snapshot)
Ogni transazione opera su uno **Snapshot**. Uno snapshot definisce quali transazioni sono "visibili":
- Sono visibili le righe il cui `xmin` è una transazione già confermata (`COMMITTED`).
- Non sono visibili le righe il cui `xmin` è ancora in corso o il cui `xmax` è già stato confermato.

Questo garantisce l'[[Programmazione/Postgres/Pagine/Proprietà ACID|Isolamento]] richiesto dai diversi livelli di transazione.

---
### Il problema dei "Dead Tuples" e VACUUM
Poiché gli update e i delete non eliminano fisicamente i dati ma creano nuove versioni, lo spazio su disco tende a crescere (**Bloat**). Le vecchie versioni non più visibili a nessuna transazione attiva sono chiamate "Dead Tuples".

### Il processo VACUUM
Il compito di **VACUUM** è:
1.  Identificare le Dead Tuples.
2.  Marcarne lo spazio come riutilizzabile per nuovi inserimenti.
3.  Aggiornare le mappe di visibilità e le statistiche per il Query Planner.

> [!INFO] Autovacuum
> PostgreSQL include un demone chiamato `autovacuum` che esegue queste operazioni automaticamente in background basandosi sulla quantità di modifiche effettuate sulle tabelle.

---
### Logic layer: Vantaggi di MVCC
1.  **Alta Concorrenza:** Ideale per sistemi con molti lettori (es: siti web).
2.  **Performance Costanti:** Le letture non devono mai aspettare che un lock venga rilasciato da una scrittura.
3.  **Rollback Istantaneo:** Annullare una transazione è semplicissimo: basta ignorare tutte le righe create con quell'ID transazione (non c'è bisogno di "disfare" i dati fisici).

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

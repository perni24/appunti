---
date: 2026-03-15
tags:
  - database
  - postgres
  - concurrency
  - architecture
  - mvcc
type: #permanent-note
status: evergreen
---

# MVCC (Multi-Version Concurrency Control) in PostgreSQL

Il **Multi-Version Concurrency Control (MVCC)** è il meccanismo fondamentale con cui PostgreSQL gestisce l'accesso simultaneo ai dati da parte di più utenti senza compromettere l'integrità.

## 💡 Concetto Chiave
La filosofia di MVCC è: **"I lettori non bloccano i scrittori, e i scrittori non bloccano i lettori"**. Invece di bloccare una riga quando viene modificata, Postgres ne crea una nuova versione, permettendo a chi legge di vedere lo stato dei dati coerente al momento dell'inizio della propria transazione.

---

## 🏗️ Come funziona: Versionamento delle Righe

Ogni riga (tuple) in PostgreSQL contiene dei campi nascosti che gestiscono la visibilità:

- **xmin:** L'ID della transazione che ha inserito la riga.
- **xmax:** L'ID della transazione che ha eliminato o aggiornato la riga. Se è 0, la riga è attualmente valida.

### UPDATE come DELETE + INSERT
Quando esegui un `UPDATE`:
1.  La riga esistente viene marcata come "scaduta" (impostando `xmax` all'ID della transazione corrente).
2.  Viene inserita una nuova riga con i dati aggiornati (impostando `xmin` all'ID corrente).

---

## 🔍 Visibilità delle Transazioni (Snapshot)

Ogni transazione opera su uno **Snapshot**. Uno snapshot definisce quali transazioni sono "visibili":
- Sono visibili le righe il cui `xmin` è una transazione già confermata (`COMMITTED`).
- Non sono visibili le righe il cui `xmin` è ancora in corso o il cui `xmax` è già stato confermato.

Questo garantisce l'[[Programmazione/Postgres/Pagine/Proprietà ACID|Isolamento]] richiesto dai diversi livelli di transazione.

---

## 🧹 Il problema dei "Dead Tuples" e VACUUM

Poiché gli update e i delete non eliminano fisicamente i dati ma creano nuove versioni, lo spazio su disco tende a crescere (**Bloat**). Le vecchie versioni non più visibili a nessuna transazione attiva sono chiamate "Dead Tuples".

### Il processo VACUUM
Il compito di **VACUUM** è:
1.  Identificare le Dead Tuples.
2.  Marcarne lo spazio come riutilizzabile per nuovi inserimenti.
3.  Aggiornare le mappe di visibilità e le statistiche per il Query Planner.

> [!INFO] Autovacuum
> PostgreSQL include un demone chiamato `autovacuum` che esegue queste operazioni automaticamente in background basandosi sulla quantità di modifiche effettuate sulle tabelle.

---

## 🚀 Logic Layer: Vantaggi di MVCC

1.  **Alta Concorrenza:** Ideale per sistemi con molti lettori (es: siti web).
2.  **Performance Costanti:** Le letture non devono mai aspettare che un lock venga rilasciato da una scrittura.
3.  **Rollback Istantaneo:** Annullare una transazione è semplicissimo: basta ignorare tutte le righe create con quell'ID transazione (non c'è bisogno di "disfare" i dati fisici).

---
---
date: 2026-03-15
tags:
  - database
  - postgres
  - architettura
  - reliability
  - wal
type: #permanent-note
status: evergreen
---

# Write-Ahead Logging (WAL) in PostgreSQL

Il **Write-Ahead Logging (WAL)** è una tecnica standard per garantire l'integrità dei dati e la [[Programmazione/Postgres/Pagine/Proprietà ACID|Durabilità]] in PostgreSQL.

## 💡 Concetto Chiave
L'idea centrale del WAL è che le modifiche ai file dei dati (tabelle e indici) devono essere scritte solo **dopo** che tali modifiche sono state registrate in un log persistente e sequenziale. In caso di crash, il database può ricostruire lo stato corretto rileggendo questo log.

---

## 🏗️ Come funziona il processo WAL

1.  **Buffer Cache:** Quando una riga viene modificata, il cambiamento avviene prima in memoria (nella Shared Buffer Cache).
2.  **WAL Buffers:** Contemporaneamente, viene generato un record WAL che descrive la modifica.
3.  **Flush su Disco:** Prima che la transazione venga confermata (`COMMIT`), il record WAL viene scritto fisicamente sul disco nella cartella `pg_wal`.
4.  **Checkpointer:** Solo successivamente (e in modo asincrono), un processo chiamato `checkpointer` scriverà le pagine modificate dalla memoria ai file delle tabelle definitivi.

---

## 🚀 Vantaggi del WAL

### 1. Performance (I/O Ottimizzato)
Scrivere in modo casuale (Random I/O) nei file delle tabelle è lento. Scrivere in modo sequenziale (Sequential I/O) nel log WAL è estremamente veloce. Il WAL permette di raggruppare molte scritture casuali e eseguirle in un unico blocco durante il checkpoint.

### 2. Crash Recovery
Se il server perde corrente, i dati in memoria (non ancora scritti nei file delle tabelle) vanno persi. Al riavvio, PostgreSQL legge il log WAL dall'ultimo checkpoint e "riesegue" tutte le transazioni confermate, riportando il database in uno stato coerente.

### 3. PITR (Point-in-Time Recovery)
Archiviando i file WAL (WAL Archiving), è possibile ripristinare un backup di base e poi "applicare" i log fino a un secondo specifico nel passato.

---

## 🔄 WAL e Replicazione

Il WAL è il cuore della **Streaming Replication**. Il server primario invia il flusso di record WAL ai server standby. Questi ultimi ricevono i record e li applicano ai propri file dei dati, mantenendosi sincronizzati quasi in tempo reale.

---

## ⚙️ Parametri Critici

- `wal_level`: Definisce quante informazioni scrivere (minimal, replica, logical).
- `max_wal_size`: Dimensione massima prima di forzare un checkpoint.
- `archive_mode`: Abilita il salvataggio dei vecchi file WAL per il backup.

> [!INFO] Logic Layer: Sync vs Async
> Di default, Postgres garantisce che il WAL sia su disco prima del `COMMIT` (`synchronous_commit = on`). Disabilitandolo, si ottengono performance altissime sacrificando la durabilità dell'ultima transazione in caso di crash fisico del server.

---
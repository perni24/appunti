---
date: 2026-03-05
tags:
  - database
  - postgres
  - architettura
  - processi
type: #permanent-note
status: evergreen
---

# Architettura dei Processi in PostgreSQL

## 💡 Concetto Chiave
L'architettura di PostgreSQL non è limitata alla sola comunicazione client-server. Dietro le quinte, una serie di processi ausiliari lavorano in armonia con il **Postmaster** e i **Backend Processes** per garantire la persistenza dei dati, la manutenzione automatica e l'efficienza del sistema.

---

## 🏗️ I Processi Principali

### 1. Il Processo Genitore (Postmaster/Postgres)
È il primo processo ad essere avviato. Le sue responsabilità sono fondamentali:
- Inizializzazione della **Shared Memory**.
- Gestione del ciclo di vita di tutti gli altri processi.
- Ascolto di nuove connessioni e autenticazione.

### 2. Backend Processes
Per ogni client connesso, viene creato un processo backend dedicato che interpreta le query SQL ed esegue l'accesso ai dati.

---

## 🛠️ Background Workers (Processi Ausiliari)

Questi processi vengono avviati dal Postmaster al boot del database e rimangono attivi per svolgere compiti di sistema critici:

| Processo | Funzione Principale |
| :--- | :--- |
| **Checkpointer** | Crea punti di controllo (Checkpoints) per ridurre i tempi di recovery forzando la scrittura dei dati sporchi su disco. |
| **Background Writer** | Svuota progressivamente i "dirty buffers" (pagine modificate in RAM) sul disco per liberare spazio nei Shared Buffers. |
| **WAL Writer** | Scrive il contenuto dei WAL Buffers nel log delle transazioni (`pg_wal`) in modo asincrono. |
| **Autovacuum Launcher** | Monitora le tabelle e avvia processi **Autovacuum Worker** per ripulire i dati obsoleti (tuples morte). |
| **Stats Collector** | Raccoglie informazioni statistiche sull'utilizzo del DB (conteggio righe, indici usati) per aiutare il Query Planner. |
| **Archiver** | Copia i file WAL pieni in una locazione sicura di archiviazione per il Point-In-Time Recovery (PITR). |
| **Logger** | Cattura tutti i messaggi di errore e di sistema e li scrive nei file di log definiti nella configurazione. |

---

## ⚙️ Logic Layer: Monitoraggio e Segnali

Tutti i processi comunicano attraverso la **Shared Memory** e segnali di sistema. Se un processo ausiliario o un backend termina in modo anomalo (crash), il Postmaster reagisce immediatamente:
- Ferma tutti i processi backend attivi.
- Svuota e reinizializza la shared memory.
- Avvia la procedura di **Crash Recovery** leggendo i file WAL.

> [!INFO] Visualizzazione Processi
> In ambiente Linux o Windows, è possibile identificare questi processi guardando il nome del comando (es. `postgres: checkpointer`, `postgres: autovacuum launcher`).

---
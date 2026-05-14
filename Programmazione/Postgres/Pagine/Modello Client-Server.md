---
date: 2026-05-14
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Modello Client-Server]
prerequisites: []
related: []
---
# Modello Client-Server in PostgreSQL

## Sintesi

Nota su Modello Client-Server in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

## Concetto chiave
PostgreSQL utilizza un modello **Client-Server** basato su processi multipli. In questo paradigma, le applicazioni (Client) non accedono direttamente ai file del database, ma inviano richieste a un processo centrale (Server) che gestisce i dati, garantendo integrità, sicurezza e concorrenza.

---

##  Architettura dei Processi

L'architettura di Postgres è di tipo **Process-per-Connection**. Questo significa che per ogni nuova connessione instaurata, il server crea un processo dedicato per gestirla.

### 1. Il Processo Supervisore (Postmaster)
Il processo principale del server è chiamato spesso `postmaster`. Le sue responsabilità includono:
- Inizializzare il server e allocare la **Shared Memory**.
- Restare in ascolto (Listening) per nuove connessioni su una porta TCP (default `5432`) o socket Unix.
- Autenticare i client tramite il file `pg_hba.conf`.
- Eseguire il **Fork** di un nuovo processo figlio per ogni client connesso.

### 2. Backend Processes (Postgres Backend)
Quando un client si connette con successo, il Supervisore crea un processo **Backend**.
- Ogni backend gestisce una singola connessione.
- Esegue le query SQL inviate dal client.
- Comunica con la memoria condivisa per leggere o scrivere dati.
- Termina quando il client chiude la connessione.

---

##  Il Flusso di una Query

> [!INFO] Workflow di Connessione
> 1.  **Client:** Invia una richiesta di connessione.
> 2.  **Server (Postmaster):** Verifica le credenziali.
> 3.  **Server (Postmaster):** Crea un processo **Backend** dedicato.
> 4.  **Client/Backend:** Inizia lo scambio di dati tramite il protocollo **libpq**.

---

## Logic layer: Isolamento e Shared Memory

Sebbene ogni connessione abbia il suo processo isolato, tutti i processi devono accedere agli stessi dati. Ciò avviene tramite la **Shared Memory**:

- **Shared Buffers:** Cache comune dove risiedono i blocchi di dati letti dal disco.
- **WAL Buffers:** Buffer per i log delle transazioni prima della scrittura su disco.
- **Lock Management:** Strutture dati condivise per gestire la concorrenza tra i diversi processi backend.

---

## Considerazioni sulle performance

A causa del modello "un processo per connessione", Postgres può risultare pesante in termini di risorse se ci sono migliaia di connessioni simultanee (overhead di creazione processo e consumo RAM).

- **Best Practice:** Per applicazioni web ad alto traffico, è essenziale utilizzare un **Connection Pooler** come **PgBouncer** o **pgcat** per riutilizzare i processi backend esistenti.

---

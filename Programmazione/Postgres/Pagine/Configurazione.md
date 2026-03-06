---
date: 2026-03-06
tags:
  - database
  - postgres
  - setup
  - configurazione
type: #permanent-note
status: evergreen
---

# Configurazione di PostgreSQL

## 💡 Concetto Chiave
La configurazione di PostgreSQL si basa principalmente su due file di testo situati nella [[Pagine/File System Layout e Data Directory|Data Directory]]: `postgresql.conf` per il comportamento del server e `pg_hba.conf` per il controllo degli accessi. Una corretta configurazione è l'ago della bilancia tra un database lento/insicuro e uno ottimizzato.

---

## 🏗️ I File di Configurazione Principali

### 1. `postgresql.conf` (Server Configuration)
Contiene i parametri che regolano l'utilizzo delle risorse, il networking, il logging e il comportamento del Query Planner.

| Categoria | Parametro | Descrizione |
| :--- | :--- | :--- |
| **Connessioni** | `listen_addresses` | Definisce su quali interfacce di rete il server accetta connessioni (es. `'*'` per tutte). |
| **Risorse** | `shared_buffers` | La quantità di memoria dedicata al caching dei dati (Shared Memory). |
| **Risorse** | `work_mem` | Memoria per operazioni di sort e join (Local Memory). |
| **Logging** | `log_statement` | Definisce quali query loggare (es. `'all'`, `'mod'`, `'none'`). |
| **Checkpointer** | `checkpoint_timeout` | Tempo massimo tra due checkpoint automatici. |

### 2. `pg_hba.conf` (Host-Based Authentication)
Gestisce la sicurezza a livello di rete. Ogni riga definisce un set di regole: chi può connettersi a quale database, da dove e con quale metodo di autenticazione.

**Sintassi di una regola:**
`TYPE  DATABASE  USER  ADDRESS  METHOD`

```text
# Esempio: Ammetti connessioni locali via socket Unix
local   all             all                                     trust

# Esempio: Ammetti connessioni da una subnet specifica con password cifrata
host    mio_db          utente_app      192.168.1.0/24          scram-sha-256
```

---

## 🔄 Applicare i Cambiamenti

Non tutti i parametri possono essere cambiati "al volo". Esistono due tipi di modifiche:

1.  **SIGHUP (Reload):** Parametri che possono essere aggiornati senza riavviare il server (es. `log_statement`).
    ```bash
    # Usando pg_ctl
    pg_ctl reload -D /path/to/data
    
    # Usando SQL
    SELECT pg_reload_conf();
    ```
2.  **Postmaster Restart:** Parametri critici che richiedono il riavvio completo (es. `shared_buffers`, `port`, `max_connections`).

---

## ⚙️ Logic Layer: Gerarchia della Configurazione

In Postgres la configurazione segue una gerarchia di precedenza. Un valore impostato a livello di sessione sovrascrive quello globale:

1.  **Parametri di sessione**: `SET work_mem = '64MB';` (Valido solo per la connessione corrente).
2.  **Parametri per utente/db**: `ALTER ROLE developer SET search_path = 'schema_test';`.
3.  **`postgresql.auto.conf`**: Creato dal comando `ALTER SYSTEM`. Ha la precedenza sul file manuale.
4.  **`postgresql.conf`**: Il file di testo standard (Priorità minima).

> [!IMPORTANT] ALTER SYSTEM
> Il comando `ALTER SYSTEM SET param = value;` è il modo raccomandato per cambiare configurazioni globali da SQL. Scrive i cambiamenti in `postgresql.auto.conf`, che viene letto dopo `postgresql.conf`.

---

## ⚠️ Best Practices
- **Backup dei file**: Fai sempre una copia dei file `.conf` prima di modificarli pesantemente.
- **Commenti**: Documenta *perché* hai cambiato un parametro, specialmente se per risolvere un problema di performance.
- **Specificità**: In `pg_hba.conf`, sii il più restrittivo possibile per evitare accessi indesiderati.

---

---
date: 2026-03-15
tags:
  - database
  - postgres
  - amministrazione
  - estensioni
type: #permanent-note
status: evergreen
---

# Gestione delle Estensioni in PostgreSQL

PostgreSQL è celebre per la sua estensibilità. Le **Estensioni** permettono di aggiungere nuove funzionalità al database (nuovi tipi di dato, funzioni, indici o linguaggi procedurali) come se fossero nativi.

## 💡 Concetto Chiave
Un'estensione è un pacchetto di oggetti SQL che possono essere caricati nel database con un singolo comando. Questo meccanismo previene la frammentazione e facilita la manutenzione, permettendo di aggiornare o rimuovere interi set di funzionalità in modo pulito.

---

## 🛠️ Comandi Principali

### 1. Caricare un'estensione
Per abilitare un'estensione in un database specifico, si usa il comando `CREATE EXTENSION`.
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
> [!WARNING] Privilegi
> Solo i **Superuser** possono installare estensioni, a meno che l'estensione non sia stata esplicitamente marcata come "trusted" dal server.

### 2. Elencare le estensioni
- **Da psql:** `\dx`
- **Via SQL:** `SELECT * FROM pg_extension;`

### 3. Rimuovere un'estensione
```sql
DROP EXTENSION "uuid-ossp";
```

---

## 🌟 Estensioni Indispensabili

PostgreSQL include nella distribuzione ufficiale il modulo **"contrib"**, che contiene estensioni testate e supportate:

| Estensione | Descrizione | Caso d'uso |
| :--- | :--- | :--- |
| **pg_stat_statements** | Traccia le statistiche di esecuzione di tutte le query. | Fondamentale per il [[Programmazione/Postgres/Pagine/Analisi delle Query|Query Tuning]]. |
| **PostGIS** | Aggiunge il supporto per oggetti geografici e spaziali. | GIS e mappe. |
| **uuid-ossp** | Genera identificatori univoci universali (UUID). | Chiavi primarie non sequenziali. |
| **pg_trgm** | Funzioni per la ricerca di testo basata su trigrammi. | Ricerca "fuzzy" e suggerimenti. |
| **pgaudit** | Logging dettagliato per scopi di audit e sicurezza. | Compliance normativa. |

---

## ⚙️ Configurazione (Shared Preload Libraries)

Alcune estensioni (come `pg_stat_statements`) richiedono di essere caricate all'avvio del server perché devono allocare memoria condivisa.

> [!INFO] Modifica del postgresql.conf
> In questi casi, non basta il comando SQL; bisogna aggiungere l'estensione al parametro:
> `shared_preload_libraries = 'pg_stat_statements'`
> **Richiede il riavvio del server.**

---

## 🚀 Logic Layer: Perché usare le estensioni?

1.  **Modularità:** Mantieni il core del database leggero, aggiungendo solo ciò che serve.
2.  **Specializzazione:** Trasforma Postgres in un database vettoriale (es: `pgvector`), spaziale (`PostGIS`) o per serie temporali (`TimescaleDB`).
3.  **Standardizzazione:** Le estensioni gestiscono internamente le dipendenze tra oggetti SQL, evitando errori manuali durante le migrazioni.

---
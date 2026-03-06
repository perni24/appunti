---
date: 2026-03-06
tags:
  - database
  - postgres
  - sicurezza
  - amministrazione
type: #permanent-note
status: evergreen
---

# Gestione Utenti e Ruoli in PostgreSQL

## 💡 Concetto Chiave
In PostgreSQL, il concetto di "utente" e "gruppo" è unificato sotto l'entità chiamata **Role** (Ruolo). Un ruolo può essere pensato come un utente (se ha il permesso di login) o come un gruppo (se serve ad aggregare permessi da assegnare ad altri ruoli). Tutti i ruoli sono globali a livello di cluster.

---

## 🏗️ Creazione e Gestione dei Ruoli

### 1. Creare un Ruolo
Il comando `CREATE ROLE` definisce una nuova entità. Per rendere il ruolo un vero "utente", occorre aggiungere l'attributo `LOGIN`.

```sql
# Creazione di un utente con password
CREATE ROLE luca WITH LOGIN PASSWORD 'strong_password';

# Creazione di un ruolo "gruppo" (senza login)
CREATE ROLE developers;
```

### 2. Attributi del Ruolo
Gli attributi definiscono i poteri amministrativi del ruolo:
- **`SUPERUSER`**: Può fare tutto, ignorando ogni controllo di permesso.
- **`CREATEDB`**: Può creare nuovi database.
- **`CREATEROLE`**: Può creare, modificare o eliminare altri ruoli.
- **`REPLICATION`**: Necessario per compiti di replicazione fisica.

```sql
# Modifica di un ruolo esistente
ALTER ROLE luca CREATEDB;
```

---

## 🔐 Gestione dei Permessi (Privileges)

Postgres utilizza i comandi `GRANT` e `REVOKE` per gestire l'accesso agli oggetti (tabelle, schemi, sequenze).

### 1. Assegnare permessi su una tabella
```sql
# Permessi di lettura e scrittura
GRANT SELECT, INSERT, UPDATE ON TABLE vendite TO developers;

# Revocare permessi
REVOKE UPDATE ON TABLE vendite FROM developers;
```

### 2. Ereditarietà dei Ruoli
È possibile assegnare un ruolo a un altro ruolo. Il ruolo "membro" eredita i permessi del ruolo "padre".

```sql
# L'utente 'luca' diventa membro del gruppo 'developers'
GRANT developers TO luca;
```

---

## ⚙️ Logic Layer: Public Schema e Default Privileges

Per impostazione predefinita, molti database hanno lo schema `public` dove il ruolo speciale `PUBLIC` (tutti gli utenti) ha permessi di creazione. È una buona pratica di sicurezza revocare questi permessi per implementare un controllo granulare.

> [!IMPORTANT] Default Privileges
> Se vuoi che i nuovi oggetti creati in futuro abbiano automaticamente certi permessi, usa `ALTER DEFAULT PRIVILEGES`:
> ```sql
> ALTER DEFAULT PRIVILEGES IN SCHEMA sales 
> GRANT SELECT ON TABLES TO report_user;
> ```

---

## ⚠️ Best Practices
- **Least Privilege**: Assegna solo i permessi strettamente necessari. Non usare `SUPERUSER` per le applicazioni.
- **Usa i Gruppi**: Invece di assegnare permessi a ogni singolo utente, crea dei ruoli di gruppo (es. `readonly`, `readwrite`) e assegna gli utenti a questi gruppi.
- **Password**: Assicurati che `pg_hba.conf` richieda metodi di autenticazione sicuri come `scram-sha-256`.

---

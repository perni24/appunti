---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: operational-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - sicurezza
  - secrets
aliases: []
prerequisites: []
related: []
---

# Secret management

## Sintesi

Il **secret management** riguarda gestione, rotazione e protezione di password, connection string, certificati e token usati per accedere a PostgreSQL.

## Quando usarlo

Usa questa nota quando devi gestire credenziali database in modo sicuro:

- configurazione di applicazioni;
- rotazione password;
- separazione tra ambienti;
- certificati TLS;
- backup cifrati;
- revoca di accessi non piu validi.

## Come funziona

I segreti non devono stare nel codice sorgente. Devono essere conservati in un secret manager, in variabili d'ambiente controllate o in file protetti fuori dal repository.

Ogni ambiente deve avere credenziali separate. Ogni servizio dovrebbe avere un ruolo dedicato, con privilegi minimi e rotazione pianificata.

## API / Sintassi

Esempio variabile d'ambiente:

```text
DATABASE_URL=postgresql://app_user:${DB_PASSWORD}@db.internal:5432/app_db?sslmode=verify-full
```

Rotazione password:

```sql
ALTER ROLE app_user PASSWORD 'new_strong_password';
```

Revoca connessioni esistenti:

```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename = 'app_user'
  AND pid <> pg_backend_pid();
```

## Esempio pratico

Procedura minima di rotazione:

1. Creare o recuperare una nuova password dal secret manager.
2. Aggiornare il ruolo PostgreSQL con `ALTER ROLE`.
3. Aggiornare il secret usato dall'applicazione.
4. Riavviare o ricaricare i servizi che leggono il secret.
5. Terminare vecchie connessioni se necessario.
6. Verificare login e metriche applicative.

## Varianti

- Secret manager cloud.
- Vault self-hosted.
- Variabili d'ambiente protette.
- File `.pgpass` con permessi stretti.
- Certificati TLS client.
- Credenziali temporanee o ruotate automaticamente.

## Errori comuni

- Mettere credenziali in file `.env` versionati.
- Condividere lo stesso utente tra app, migrazioni e operatori.
- Non revocare credenziali vecchie.
- Loggare connection string complete.
- Usare password uguali tra dev, staging e produzione.
- Non documentare proprietario e scadenza dei segreti.

## Checklist

- I segreti sono fuori dal repository?
- Ogni ambiente ha credenziali separate?
- Ogni servizio ha un ruolo dedicato?
- Esiste una procedura di rotazione testata?
- I log mascherano password e URL completi?
- Certificati e chiavi hanno scadenza monitorata?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/Postgres/Pagine/SSL e TLS|SSL/TLS]]

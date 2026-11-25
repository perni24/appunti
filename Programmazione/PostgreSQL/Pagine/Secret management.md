---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: operational-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - sicurezza
  - secrets
aliases: []
prerequisites: []
related: []
title: Secret management
---

# Secret management

## Sintesi

Un servizio deve poter aprire una connessione senza portare la password nel repository, nella riga di comando o nei log. Separa **come raggiungere il database** (host, porta, nome, CA) da **come autenticarsi** (password, token o chiave privata). Assegna credenziali distinte a runtime, migrazioni e operatori, e separa gli ambienti.

## Esempio: un profilo libpq senza password

Nel file servizi dell'account applicativo, oppure nel file indicato da `PGSERVICEFILE`, configura i parametri non segreti. Esempio per un client con il percorso CA indicato:

```ini
[app_prod]
host=db.example.test
port=5432
dbname=app_db
user=app_user
sslmode=verify-full
sslrootcert=/etc/postgresql/app-ca.pem
```

Distribuisci il passfile separatamente, per esempio da un secret manager, indicando il percorso con `PGPASSFILE`. Ogni riga usa il formato `host:porta:database:utente:password`; vince la **prima** riga corrispondente. Evita wildcard non necessarie. Su Unix il file deve escludere accessi di gruppo e altri (tipicamente `0600`), altrimenti libpq lo ignora. Su Windows il percorso predefinito è `%APPDATA%\postgresql\pgpass.conf`; limita gli accessi tramite ACL. Non versionare il file.

Prova con una **nuova** connessione. `-w` vieta il prompt: il comando fallisce se non è disponibile una credenziale valida e il server la richiede.

```bash
psql -X -w -d "service=app_prod" -c "SELECT session_user, current_database();"
```

Un `.env` ignorato da Git non è di per sé un secret manager; anche backup, output CI e log dell'app possono conservare segreti. Non dare per scontato che libpq espanda `${DB_PASSWORD}` in una URI. Preferisci un'integrazione del driver o il passfile anziché concatenare stringhe o affidare a `PGPASSWORD` la distribuzione del segreto.

## Ruotare senza confondere accessi nuovi ed esistenti

1. Identifica chi gestisce il login, quali app o pool lo usano e come si aggiornano. Conserva il nuovo valore nel gestore autorizzato; non inserirlo in SQL nel terminale o nella cronologia.
2. Per un singolo ruolo password, coordina cambio e distribuzione: PostgreSQL non mantiene due password utilizzabili contemporaneamente per lo stesso ruolo. Da una sessione `psql` autorizzata puoi cambiare la password con un prompt che non mette il testo in chiaro nel comando:

```psql
\password app_user
```

3. Aggiorna il passfile o il provider e ricarica i processi che memorizzano il segreto. Verifica che una connessione **nuova** con la credenziale corrente riesca e che la precedente non autentichi più. Non usare una query da una sessione già aperta come prova di rotazione.
4. Il cambio di password o `NOLOGIN` non chiude le sessioni già autenticate. Pianifica il drenaggio del pool; un'eventuale terminazione forzata interrompe anche le transazioni in corso. Se serve sovrapposizione senza interruzioni, valuta due login temporaneamente distinti con lo stesso ruolo di permessi, poi ritira il vecchio dopo il passaggio.
5. Registra proprietario, data di rotazione e risultato, **mai il segreto**. In caso di esposizione, rimuovere il valore dall'ultimo commit non lo revoca: ruotalo e verifica dove è stato distribuito.

## Fonti

[PostgreSQL 18: password file](https://www.postgresql.org/docs/18/libpq-pgpass.html) · [File servizi](https://www.postgresql.org/docs/18/libpq-pgservice.html) · [psql e comando password](https://www.postgresql.org/docs/18/app-psql.html) · [Autenticazione password](https://www.postgresql.org/docs/18/auth-password.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/PostgreSQL/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/PostgreSQL/Pagine/SSL e TLS|SSL/TLS]]

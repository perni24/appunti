---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Installazione e Inizializzazione]
prerequisites: []
related: []
---

# Installazione e Inizializzazione

## Sintesi

Installare PostgreSQL significa aggiungere server e client. Inizializzare un cluster significa creare la data directory, i cataloghi di sistema e la configurazione iniziale.

## Quando usarlo

Serve quando configuri un nuovo ambiente locale, server, container o cluster di test.

## Come funziona

Un cluster PostgreSQL contiene uno o piu database e viene rappresentato da una data directory. Il comando `initdb` crea la struttura iniziale. Il servizio PostgreSQL poi avvia il server usando quella directory.

## API / Sintassi

Inizializzazione manuale:

```bash
initdb -D /var/lib/postgresql/data
pg_ctl -D /var/lib/postgresql/data start
```

Creazione database:

```bash
createdb app_db
psql -d app_db
```

Verifica versione:

```bash
psql --version
```

## Esempio pratico

Primo accesso:

```sql
CREATE ROLE app_user WITH LOGIN PASSWORD 'change_me';
CREATE DATABASE app_db OWNER app_user;
```

Poi si configura `pg_hba.conf` per il metodo di autenticazione desiderato.

## Varianti

- Installazione da pacchetti del sistema.
- Installazione in container.
- Cluster gestito da cloud provider.
- Inizializzazione manuale con `initdb`.
- Creazione database con `createdb`.

## Errori comuni

- Confondere cluster, database e schema.
- Usare `trust` in ambienti non locali.
- Non salvare credenziali iniziali.
- Non configurare locale/encoding corretti.
- Non verificare servizio e porta.

## Checklist

- Versione PostgreSQL scelta e documentata?
- Data directory corretta?
- Autenticazione configurata?
- Database e ruolo applicativo creati?
- Backup previsto prima dell'uso reale?

## Collegamenti

- [[Programmazione/Postgres/Pagine/File System Layout e Data Directory|File System Layout e Data Directory]]
- [[Programmazione/Postgres/Pagine/Configurazione|Configurazione]]
- [[Programmazione/Postgres/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]

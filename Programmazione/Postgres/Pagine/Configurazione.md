---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Configurazione di]
prerequisites: []
related: []
---

# Configurazione di PostgreSQL

## Sintesi

La configurazione di PostgreSQL controlla risorse, connessioni, logging, sicurezza e comportamento del server. I file principali sono `postgresql.conf` e `pg_hba.conf`.

## Quando usarlo

Usa questa nota quando devi modificare o verificare il comportamento del server:

- abilitare connessioni remote;
- configurare memoria, logging o timeout;
- cambiare metodi di autenticazione;
- applicare parametri per database o ruolo;
- capire se serve reload o restart;
- documentare tuning e scelte operative.

## Come funziona

`postgresql.conf` contiene parametri del server: memoria, connessioni, logging, WAL, planner e autovacuum.

`pg_hba.conf` controlla chi puo connettersi, da dove, a quale database e con quale metodo di autenticazione.

Alcuni parametri si applicano con reload, altri richiedono restart. I parametri possono anche essere impostati a livello di sessione, ruolo, database o tramite `ALTER SYSTEM`.

## API / Sintassi

Reload:

```sql
SELECT pg_reload_conf();
```

Controllare un parametro:

```sql
SHOW shared_buffers;
SELECT name, setting, unit, context
FROM pg_settings
WHERE name = 'shared_buffers';
```

Impostare a livello sessione:

```sql
SET work_mem = '64MB';
```

Impostare a livello ruolo:

```sql
ALTER ROLE app_user SET statement_timeout = '30s';
```

Regole `pg_hba.conf`:

```text
local   all      all                         scram-sha-256
host    app_db   app_user   10.0.0.0/24      scram-sha-256
hostssl app_db   app_user   10.0.0.0/24      scram-sha-256
```

## Esempio pratico

Abilitare connessioni applicative da una rete privata:

```conf
# postgresql.conf
listen_addresses = '10.0.1.10'
```

```text
# pg_hba.conf
hostssl app_db app_user 10.0.0.0/24 scram-sha-256
```

Poi applicare:

```sql
SELECT pg_reload_conf();
```

Se il parametro richiede restart, `pg_settings.context` lo indica come `postmaster`.

## Varianti

- `postgresql.conf`: configurazione principale.
- `postgresql.auto.conf`: scritto da `ALTER SYSTEM`.
- `pg_hba.conf`: autenticazione client.
- `ALTER ROLE SET`: default per ruolo.
- `ALTER DATABASE SET`: default per database.
- `SET`: valore solo per sessione o transazione.

## Errori comuni

- Usare `trust` fuori da ambienti locali controllati.
- Mettere regole troppo permissive in `pg_hba.conf`.
- Cambiare `max_connections` senza considerare memoria e pooling.
- Aumentare `work_mem` globalmente senza calcolare il numero di operazioni concorrenti.
- Non documentare perche un parametro e stato cambiato.
- Aspettarsi che ogni modifica basti con reload.

## Checklist

- Le regole `pg_hba.conf` sono specifiche e sicure?
- Le modifiche richiedono reload o restart?
- I parametri sono documentati?
- Esistono timeout per sessioni e query applicative?
- La memoria e coerente con carico e connessioni?
- Le credenziali usano `scram-sha-256` o metodo adeguato?

## Collegamenti

- [[Programmazione/Postgres/Pagine/File System Layout e Data Directory|File System Layout e Data Directory]]
- [[Programmazione/Postgres/Pagine/Connection Pooling|Connection Pooling]]
- [[Programmazione/Postgres/Pagine/SSL e TLS|SSL/TLS]]

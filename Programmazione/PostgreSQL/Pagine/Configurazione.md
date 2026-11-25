---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - postgresql
  - database
aliases:
  - Configurazione di
prerequisites: []
related: []
title: Configurazione di PostgreSQL
---

# Configurazione di PostgreSQL

## Sintesi

Prima di cambiare un parametro identifica **da dove arriva il valore della tua sessione** e **quando la modifica può avere effetto**. Le impostazioni del server e le regole di autenticazione non sono la stessa cosa: `postgresql.conf` regola il comportamento dell'istanza, `pg_hba.conf` seleziona il metodo di autenticazione delle nuove connessioni.

## Leggere prima di modificare

```sql
SELECT name, setting, unit, source, context, pending_restart
FROM pg_settings
WHERE name IN ('listen_addresses', 'shared_buffers', 'work_mem', 'statement_timeout')
ORDER BY name;
```

`source` indica la provenienza del valore effettivo, non sempre il file principale. `context = 'postmaster'` richiede riavvio; `sighup` indica che il server può rileggere il valore con un reload. `pending_restart` segnala una modifica del file già rilevata ma non applicabile senza riavvio; `false` non prova che ogni modifica sul disco sia già stata riletta.

## Scegliere l'ambito

| Ambito | Effetto |
|---|---|
| `SET` / `RESET` | Cambia o ripristina un parametro della sessione. `SET LOCAL` vale solo nella transazione corrente. |
| `ALTER ROLE … SET` / `ALTER DATABASE … SET` | Definisce il default per nuove sessioni del ruolo o del database. Non aggiorna le connessioni già aperte; `SET ROLE` non simula un nuovo login. |
| `postgresql.conf` / `ALTER SYSTEM` | Default di istanza. `ALTER SYSTEM` scrive `postgresql.auto.conf`, che prevale sul file principale; non implica reload o riavvio automatici. |

Prova reversibile, in una singola sessione senza transazioni aperte. Confronta il valore prima, durante e dopo:

```sql
SHOW statement_timeout;
BEGIN;
SET LOCAL statement_timeout = '2s';
SHOW statement_timeout;
ROLLBACK;
SHOW statement_timeout;
```

Un default persistente come `ALTER ROLE app_user SET statement_timeout = '30s'` presuppone un ruolo esistente e privilegi adeguati. Per verificarlo riconnettiti come quel ruolo; per rimuoverlo usa `ALTER ROLE app_user RESET statement_timeout`.

## Modificare l'accesso remoto

Per aprire un endpoint servono tre condizioni indipendenti: il server ascolta sull'interfaccia desiderata, la rete permette il traffico e una regola HBA ammette quella connessione. Un `GRANT CONNECT` sul database non sostituisce l'autenticazione. Non cambiare questi file per provare una normale connessione al laboratorio locale.

- **Indirizzi:** `listen_addresses` si legge all'avvio. Cambiarlo nel file e chiamare solo `pg_reload_conf()` **non** apre una nuova interfaccia: serve un riavvio pianificato.
- **Autenticazione:** PostgreSQL usa la **prima** regola HBA corrispondente; se l'autenticazione fallisce non prova quelle successive. `local` riguarda socket Unix, `host` TCP con o senza TLS, `hostssl` solo TCP con TLS già configurato. SCRAM autentica, non cifra la connessione.
- **TLS obbligatorio:** un esempio mirato è `hostssl app_db app_user 10.0.0.0/24 scram-sha-256`. Questa riga da sola non esclude accessi non cifrati ammessi da altre regole: verifica ordine e fallback. Il client deve anche verificare il certificato del server.

Dopo una modifica amministrativa ai file, cerca errori di parsing con un ruolo autorizzato (nessuna riga significa nessun errore segnalato dalla vista):

```sql
SELECT line_number, error
FROM pg_hba_file_rules
WHERE error IS NOT NULL;
```

Un amministratore può richiedere la rilettura con `SELECT pg_reload_conf();`. Un risultato `true` attesta l'invio del segnale, **non** che tutte le modifiche siano valide o già attive. Controlla log, `pg_settings` e una **nuova** connessione, conservando la sessione amministrativa fino alla verifica. Su Windows le modifiche HBA interessano direttamente le nuove connessioni, senza richiedere il reload per quel file.

**Fonti:** [impostazione dei parametri](https://www.postgresql.org/docs/18/config-setting.html), [pg_settings](https://www.postgresql.org/docs/18/view-pg-settings.html) e [regole HBA](https://www.postgresql.org/docs/18/auth-pg-hba-conf.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/File System Layout e Data Directory|File System Layout e Data Directory]]
- [[Programmazione/PostgreSQL/Pagine/Connection Pooling|Connection Pooling]]
- [[Programmazione/PostgreSQL/Pagine/SSL e TLS|SSL/TLS]]

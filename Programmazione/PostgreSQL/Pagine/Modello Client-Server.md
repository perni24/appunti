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
  - Modello Client-Server
prerequisites: []
related: []
title: Modello Client-Server in PostgreSQL
---

# Modello Client-Server in PostgreSQL

## Sintesi

`psql`, un driver o un'applicazione inviano comandi a PostgreSQL; è il **server** a leggere i file del database e a eseguire le query. Una connessione diretta aperta corrisponde a una sessione gestita da un processo *backend*. Non viene creato un processo per ogni query o richiesta HTTP.

## Come funziona una connessione

Il client sceglie un endpoint, un database e un ruolo. Il processo principale `postgres` accetta la connessione; il backend applica l'autenticazione e, se consentito l'accesso, gestisce i comandi della sessione. **Cluster** qui indica l'insieme dei database amministrati dalla stessa istanza, non necessariamente più macchine. Una connessione opera in un solo database.

Il trasporto può essere TCP (anche verso `localhost`) oppure, dove supportato, un socket di dominio Unix. TCP non implica automaticamente TLS verificato. Un endpoint di replica per le letture è una scelta dell'applicazione o dell'infrastruttura: il protocollo non smista da sé le query tra primario e repliche.

## Esempio: identificare la sessione

Da terminale, con `psql` installato, sostituisci host, database e ruolo con quelli dell'ambiente. Non inserire password nell'URI o nella cronologia della shell. Se usi TLS remoto, configura la convalida del certificato secondo le regole del servizio.

```sh
psql "postgresql://app_user@db.example.org:5432/app_db?application_name=appunti-demo"
```

Esegui questa query nella connessione appena aperta. Senza tabelle applicative o privilegi amministrativi, mostra quale processo ha **questa** sessione:

```sql
SELECT pg_backend_pid() AS pid, current_database() AS db, current_user AS ruolo,
       current_setting('application_name') AS applicazione,
       inet_client_addr() AS indirizzo_client;
```

In due connessioni **dirette e contemporanee** i PID sono diversi; nella stessa connessione diretta il PID resta uguale tra due query. L'indirizzo è quello visto dal server (può essere quello del pooler); con un socket Unix è `NULL`.

## Esempio: connessioni aperte o query attive?

Da una seconda sessione, dopo aver lasciato la prima al prompt, cerca il nome dell'applicazione. Usa lo stesso ruolo per poter vedere i dettagli; `application_name` è un'etichetta scelta dal client, non un'identità autenticata.

```sql
SELECT pid, usename, application_name, client_addr, state
FROM pg_stat_activity
WHERE backend_type = 'client backend'
  AND application_name = 'appunti-demo'
  AND pid <> pg_backend_pid();
```

Con autocommit e nessuna transazione lasciata aperta ti aspetti `idle`: il backend esiste ma non esegue SQL. `idle in transaction` indica invece che il client ha sospeso l'invio di comandi **prima** di chiudere una transazione; può trattenere lock e ostacolare la manutenzione.

## Quando usare un pool

Nel percorso `app → PgBouncer → PostgreSQL` le connessioni al pooler e quelle al server non sono la stessa popolazione. In *session pooling* il backend rimane assegnato finché il client non si scollega; in *transaction pooling* viene restituito al pool al termine di ogni transazione. Non fare affidamento sullo stesso PID o su impostazioni di sessione arbitrarie tra due transazioni.

Prima di aumentare `max_connections`, controlla quante connessioni al server sono realmente attive, quante attendono e se i pool delle diverse istanze applicative hanno limiti coerenti. Un pool può ridurre il numero dei backend, non il lavoro richiesto da una query lenta.

**Fonti:** [architettura di PostgreSQL 18](https://www.postgresql.org/docs/18/tutorial-arch.html) e [modalità di pooling di PgBouncer](https://www.pgbouncer.org/features.html).

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Connection Pooling|Connection Pooling]]
- [[Programmazione/PostgreSQL/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/PostgreSQL/Pagine/Architettura dei Processi|Architettura dei Processi]]

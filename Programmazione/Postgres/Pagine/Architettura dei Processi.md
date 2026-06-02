---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Architettura dei Processi]
prerequisites: []
related: []
---

# Architettura dei Processi in PostgreSQL

## Sintesi

PostgreSQL e composto da un processo principale e vari processi di supporto: backend client, checkpointer, background writer, WAL writer, autovacuum, archiver e processi di replica.

## Quando usarlo

Serve quando devi interpretare processi nel sistema operativo, diagnosticare carico, capire checkpoint, autovacuum, replica o consumo di memoria.

## Come funziona

Il postmaster accetta connessioni e coordina il cluster. Ogni connessione client usa un backend. I processi di background gestiscono scritture, manutenzione e replica.

I processi principali:

- backend process: esegue query del client;
- checkpointer: forza checkpoint periodici;
- background writer: scrive pagine dirty in anticipo;
- WAL writer: scrive record WAL;
- autovacuum launcher/worker: pulizia e statistiche;
- archiver: archivia file WAL;
- wal sender/receiver: replica.

## API / Sintassi

Vista attivita:

```sql
SELECT pid, backend_type, state, wait_event_type, wait_event
FROM pg_stat_activity
ORDER BY backend_type;
```

Processi di background:

```sql
SELECT backend_type, count(*)
FROM pg_stat_activity
GROUP BY backend_type;
```

## Esempio pratico

Se molte sessioni attendono `ClientRead`, il database sta aspettando il client. Se attendono `Lock`, il problema e concorrenza. Se attendono I/O, il collo di bottiglia puo essere storage.

## Varianti

- Processi backend per client.
- Processi autovacuum.
- Processi WAL e checkpoint.
- Processi replication.
- Worker paralleli per query.

## Errori comuni

- Interpretare ogni processo PostgreSQL come una query attiva.
- Ignorare `backend_type`.
- Uccidere processi senza verificare transazioni.
- Non distinguere CPU, lock e I/O.
- Disabilitare autovacuum per ridurre processi.

## Checklist

- Quanti backend sono attivi?
- Quali processi stanno aspettando?
- Autovacuum sta lavorando?
- Ci sono worker paralleli inattesi?
- Replica e archiver sono attivi se richiesti?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Modello Client-Server|Modello Client-Server]]
- [[Programmazione/Postgres/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
- [[Programmazione/Postgres/Pagine/Manutenzione|Manutenzione]]

---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermediate
tags: [postgresql, database]
aliases: [Failover e Load Balancing]
prerequisites: []
related: []
---

# Failover e Load Balancing in PostgreSQL

## Sintesi

Il **failover** promuove una replica a primario quando il primario fallisce. Il **load balancing** distribuisce traffico, di solito letture, tra piu nodi. In PostgreSQL richiedono replica, monitoring e routing affidabile.

## Quando usarlo

Usalo quando servono:

- alta disponibilita;
- riduzione del downtime;
- distribuzione delle letture;
- manutenzione con interruzioni minime;
- replica geografica;
- routing automatico verso il primario corrente.

## Come funziona

La replica mantiene uno o piu standby aggiornati. Il sistema di HA monitora il primario e, se necessario, promuove uno standby. Il routing deve poi indirizzare le scritture al nuovo primario.

Il load balancing in PostgreSQL e quasi sempre read-oriented: le scritture devono andare al primario, mentre query read-only possono andare alle repliche se l'applicazione tollera dati leggermente in ritardo.

Strumenti comuni includono Patroni, repmgr, HAProxy, PgBouncer, pgcat e meccanismi di service discovery.

## API / Sintassi

Promozione manuale:

```bash
pg_ctl promote -D /var/lib/postgresql/data
```

Oppure via SQL su standby:

```sql
SELECT pg_promote();
```

Controllare se un nodo e in recovery:

```sql
SELECT pg_is_in_recovery();
```

Misurare lag su replica:

```sql
SELECT now() - pg_last_xact_replay_timestamp() AS replica_lag;
```

## Esempio pratico

Schema tipico:

```text
app -> HAProxy/PgBouncer -> primary
                       \-> read replica 1
                       \-> read replica 2
```

L'applicazione puo usare due endpoint:

- endpoint write: sempre verso il primario corrente;
- endpoint read: verso repliche, con controllo del lag.

## Varianti

- Failover manuale.
- Failover automatico con Patroni o repmgr.
- Virtual IP.
- DNS dinamico.
- Service discovery con etcd/Consul.
- Read/write split applicativo.
- Proxy layer con health check.

## Errori comuni

- Non prevenire split brain.
- Promuovere una replica troppo indietro senza valutare perdita dati.
- Non aggiornare routing dopo failover.
- Mandare scritture a repliche read-only.
- Ignorare replica lag nelle letture.
- Non testare failover periodicamente.

## Checklist

- Esiste un solo primario alla volta?
- Il failover e testato?
- Il routing viene aggiornato automaticamente?
- Le app distinguono letture e scritture?
- Il lag delle repliche e monitorato?
- Esiste una procedura per reintegrare il vecchio primario?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Replicazione Fisica|Replicazione Fisica]]
- [[Programmazione/Postgres/Pagine/Read replicas|Read replicas]]
- [[Programmazione/Postgres/Pagine/Connection Pooling|Connection Pooling]]

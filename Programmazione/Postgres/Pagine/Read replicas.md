---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - replica
  - scalabilita
aliases: []
prerequisites: []
related: []
---

# Read replicas

## Sintesi

Le **read replicas** sono repliche usate per servire traffico di lettura, isolare query pesanti e ridurre carico sul primario. Di solito sono basate su replica fisica.

## Quando usarlo

Usale quando:

- il primario e saturo da query di lettura;
- report e dashboard interferiscono con scritture;
- vuoi eseguire backup senza caricare il primario;
- serve un nodo caldo per failover;
- l'applicazione tollera letture leggermente stale.

## Come funziona

Il primario riceve scritture. Le repliche applicano WAL o eventi logici e rispondono a query read-only. Poiche la replica puo essere asincrona, le letture possono essere in ritardo rispetto al primario.

L'applicazione deve sapere quali query possono andare in replica. Le query che devono leggere subito una scrittura appena fatta dovrebbero restare sul primario o verificare il lag.

## API / Sintassi

Verificare se il nodo e una replica:

```sql
SELECT pg_is_in_recovery();
```

Lag sulla replica:

```sql
SELECT now() - pg_last_xact_replay_timestamp() AS replica_lag;
```

Bloccare scritture applicative su replica e naturale: lo standby accetta solo query read-only.

## Esempio pratico

Routing applicativo:

```text
POST /orders       -> primary
GET /orders/123    -> primary se serve read-after-write
GET /reports/sales -> read replica
```

Se il report e lungo, conviene mandarlo su replica per non competere con transazioni del primario.

## Varianti

- Replica asincrona.
- Replica sincrona.
- Replica geografica.
- Replica dedicata a reportistica.
- Replica dedicata a backup.
- Replica candidata al failover.

## Errori comuni

- Ignorare replica lag.
- Usare replica per letture che richiedono consistenza immediata.
- Lasciare query lunghissime sulla replica senza limiti.
- Pensare che la replica sostituisca un backup.
- Non distinguere endpoint read e write.
- Non monitorare conflitti o replay ritardato.

## Checklist

- L'applicazione tollera dati stale?
- Il lag massimo accettabile e definito?
- Esistono timeout per query analitiche?
- Le scritture vanno sempre al primario?
- La replica e monitorata?
- I backup sono indipendenti dalla replica?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Replicazione Fisica|Replicazione Fisica]]
- [[Programmazione/Postgres/Pagine/Replicazione Logica|Replicazione Logica]]
- [[Programmazione/Postgres/Pagine/Failover e Load Balancing|Failover e Load Balancing]]

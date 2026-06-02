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
  - scalabilita
aliases: []
prerequisites: []
related: []
---

# Sharding

## Sintesi

Lo sharding divide dati su piu nodi indipendenti usando una shard key. Serve quando un singolo cluster non basta piu per volume, throughput o isolamento.

## Quando usarlo

Usalo solo dopo aver esaurito opzioni piu semplici: indici, partizionamento, read replicas, tuning e archiviazione.

## Come funziona

I dati vengono assegnati a shard diversi in base a una chiave, per esempio `tenant_id` o `account_id`. L'applicazione o un middleware indirizza query allo shard corretto.

## API / Sintassi

Non esiste un comando PostgreSQL standard per sharding generale. Approcci comuni:

```text
tenant_id -> shard_01
tenant_id -> shard_02
tenant_id -> shard_03
```

## Esempio pratico

Multi-tenant:

- ogni tenant appartiene a uno shard;
- query con `tenant_id` vanno a un solo shard;
- query globali devono aggregare risultati da piu shard.

## Varianti

- Sharding applicativo.
- Sharding per tenant.
- Sharding per hash.
- Sharding per range.
- Estensioni/sistemi distribuiti.
- Federazione con FDW.

## Errori comuni

- Shardare troppo presto.
- Scegliere shard key sbagliata.
- Ignorare query cross-shard.
- Non pianificare rebalancing.
- Sottovalutare complessita operativa.

## Checklist

- Il problema non si risolve con partizionamento o replica?
- La shard key e presente in quasi tutte le query?
- Le query cross-shard sono rare?
- Esiste piano di rebalancing?
- Backup e restore sono pensati per piu shard?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Partitioning|Partitioning]]
- [[Programmazione/Postgres/Pagine/Read replicas|Read replicas]]
- [[Programmazione/Postgres/Pagine/FDW|FDW]]

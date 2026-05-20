---
date: 2026-05-20
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - scalabilita
  - architettura
aliases: []
prerequisites: []
related: []
---

# Sharding

## Sintesi

Lo **sharding** divide i dati su piu database o nodi in base a una chiave di partizionamento.

## Concetto chiave

Quando un singolo database non basta piu per volume, throughput o isolamento, lo sharding distribuisce il carico. In cambio introduce complessita applicativa e operativa.

## Scelte importanti

- Shard key.
- Strategia di routing.
- Query cross-shard.
- Bilanciamento e resharding.
- Backup e restore per shard.

## Limiti

PostgreSQL non rende lo sharding trasparente come funzionalita core general-purpose. Spesso si usano soluzioni applicative, estensioni o sistemi esterni.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Errori comuni

Da completare durante revisione.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Postgres/Pagine/Partitioning|Partitioning]]
- [[Programmazione/Postgres/Pagine/Replicazione Logica|Replicazione Logica]]
- [[Programmazione/Postgres/Pagine/Failover e Load Balancing|Failover e Load Balancing]]



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
  - replica
  - scalabilita
aliases: []
prerequisites: []
related: []
---

# Read replicas

## Sintesi

Le **read replicas** sono repliche usate per servire traffico di lettura, alleggerendo il nodo primario.

## Concetto chiave

Il primario gestisce scritture. Le repliche ricevono cambiamenti tramite replicazione e possono rispondere a query read-only.

## Vantaggi

- Scalare letture.
- Isolare query analitiche.
- Migliorare disponibilita.
- Supportare backup senza caricare il primario.

## Limiti

- Replica lag.
- Letture potenzialmente stale.
- Query lunghe sulle repliche possono interferire con cleanup.
- Le scritture devono andare al primario.

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
- [[Programmazione/Postgres/Pagine/Replicazione Fisica|Replicazione Fisica]]
- [[Programmazione/Postgres/Pagine/Replicazione Logica|Replicazione Logica]]
- [[Programmazione/Postgres/Pagine/Failover e Load Balancing|Failover e Load Balancing]]



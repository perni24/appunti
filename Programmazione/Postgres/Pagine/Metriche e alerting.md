---
date: 2026-05-20
area: Programmazione
topic: Postgres
type: operational-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - osservabilita
  - metriche
aliases: []
prerequisites: []
related: []
---

# Metriche e alerting

## Sintesi

Metriche e alerting servono a capire lo stato del database prima che un problema diventi incidente.

## Metriche importanti

- Connessioni attive.
- Cache hit ratio.
- Query lente.
- Lock e deadlock.
- Replica lag.
- Checkpoint e WAL.
- Bloat e autovacuum.
- Spazio disco.

## Alert utili

- Disco quasi pieno.
- Replica lag elevato.
- Troppi errori di connessione.
- Autovacuum bloccato.
- Aumento improvviso di query lente.

## Errori comuni

- Alertare su metriche rumorose.
- Non collegare metriche a runbook.
- Monitorare solo CPU e RAM, ignorando lock, WAL e query.

## Obiettivo

Da completare: descrivere cosa ottenere in pratica.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Procedura

1. Da completare.
2. Da completare.
3. Da completare.

## Snippet

```text
Da completare con codice o comando riutilizzabile.
```

## Adattamenti comuni

- Da completare: varianti per casi frequenti.

## Debug rapido

- Da completare: controlli rapidi in caso di errore.

## Checklist finale

- Da completare: verifiche finali.

## Collegamenti
- [[Programmazione/Postgres/Pagine/Slow query log|Slow query log]]
- [[Programmazione/Postgres/Pagine/Lock monitoring|Lock monitoring]]
- [[Programmazione/Postgres/Pagine/Write-Ahead Logging|Write-Ahead Logging]]



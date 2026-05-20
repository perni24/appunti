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
  - performance
  - osservabilita
aliases: []
prerequisites: []
related: []
---

# Slow query log

## Sintesi

Lo **slow query log** registra query che superano una certa durata. Serve a individuare query costose o regressioni di performance.

## Configurazione

```conf
log_min_duration_statement = 500ms
```

Con questa soglia PostgreSQL logga query piu lente di 500 ms.

## Uso pratico

- Trovare query lente ricorrenti.
- Correlare lentezza con deploy o carico.
- Identificare query senza indici.
- Capire quali query analizzare con `EXPLAIN`.

## Errori comuni

- Soglia troppo bassa in produzione, generando log ingestibili.
- Guardare solo query singole e ignorare frequenza.
- Non normalizzare query simili.

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
- [[Programmazione/Postgres/Pagine/Analisi delle Query|Analisi delle Query]]
- [[Programmazione/Postgres/Pagine/Statistiche e Query Planner|Statistiche e Query Planner]]
- [[Programmazione/Postgres/Pagine/Metriche e alerting|Metriche e alerting]]



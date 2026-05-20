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
  - wal
  - replicazione
aliases: []
prerequisites: []
related: []
---

# Logical decoding

## Sintesi

Il **logical decoding** trasforma modifiche registrate nel WAL in un flusso logico leggibile da sistemi esterni.

## Concetto chiave

Invece di replicare blocchi fisici, PostgreSQL puo esporre eventi come insert, update e delete.

## Usi comuni

- Change Data Capture.
- Integrazione con code o stream.
- Replicazione logica.
- Audit e sincronizzazione.

## Componenti

- Replication slot.
- Output plugin.
- WAL.
- Consumer esterno.

## Errori comuni

- Dimenticare che slot non consumati trattengono WAL.
- Non monitorare lag.
- Trattare eventi come se fossero esattamente-once senza progettazione.

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

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Postgres/Pagine/Write-Ahead Logging|Write-Ahead Logging]]
- [[Programmazione/Postgres/Pagine/Replicazione Logica|Replicazione Logica]]
- [[Programmazione/Postgres/Pagine/Pattern outbox|Pattern outbox]]



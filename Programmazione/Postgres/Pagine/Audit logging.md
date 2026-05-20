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
  - sicurezza
  - auditing
aliases: []
prerequisites: []
related: []
---

# Audit logging

## Sintesi

L'**audit logging** registra eventi rilevanti per sicurezza, compliance e investigazione: accessi, modifiche, query sensibili e cambi di privilegi.

## Concetto chiave

I log normali aiutano il troubleshooting. Gli audit log rispondono a domande come "chi ha letto o modificato questo dato?".

## Cosa registrare

- Login falliti.
- Cambi di ruolo o privilegi.
- DDL.
- Accesso a tabelle sensibili.
- Query amministrative.

## Strumenti

- Logging PostgreSQL nativo.
- Estensioni come `pgaudit`.
- Log collector esterni.

## Errori comuni

- Loggare troppi dati sensibili.
- Non proteggere i log.
- Non avere retention e ricerca.

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
- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/Postgres/Pagine/Slow query log|Slow query log]]
- [[Programmazione/Postgres/Pagine/Metriche e alerting|Metriche e alerting]]



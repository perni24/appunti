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
  - migrazioni
  - versionamento
aliases: []
prerequisites: []
related: []
---

# Versionamento database

## Sintesi

Il **versionamento database** mantiene una storia ordinata delle modifiche allo schema e, a volte, dei dati di riferimento.

## Concetto chiave

Il database deve evolvere insieme al codice. Le migrazioni sono il contratto tra versione applicativa e schema.

## Strumenti comuni

- Flyway.
- Liquibase.
- Sqitch.
- Migrazioni ORM.
- Tool custom in CI/CD.

## Cosa versionare

- DDL.
- Indici.
- Vincoli.
- Funzioni e trigger.
- Seed data controllati.

## Errori comuni

- Modificare schema manualmente in produzione.
- Non applicare migrazioni in ambiente di test.
- Avere ambienti con storie divergenti.

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
- [[Programmazione/Postgres/Pagine/Migrazioni schema|Migrazioni schema]]
- [[Programmazione/Postgres/Pagine/Backup e Ripristino|Backup e Ripristino]]
- [[Programmazione/Postgres/Pagine/Strategie zero-downtime|Strategie zero-downtime]]



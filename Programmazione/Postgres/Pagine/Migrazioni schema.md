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
  - schema
aliases: []
prerequisites: []
related: []
---

# Migrazioni schema

## Sintesi

Le **migrazioni schema** modificano struttura del database in modo versionato e ripetibile.

## Concetto chiave

Ogni modifica a tabelle, indici, vincoli o funzioni dovrebbe essere tracciata come migrazione applicabile in ordine.

```sql
ALTER TABLE users
ADD COLUMN last_login_at timestamptz;
```

## Buone pratiche

- Migrazioni piccole.
- Script idempotenti quando possibile.
- Separare deploy applicativo e migrazione rischiosa.
- Testare su copia realistica.
- Avere strategia di rollback o forward-fix.

## Errori comuni

- Aggiungere colonne `NOT NULL` con default pesante senza pianificazione.
- Creare indici bloccanti su tabelle grandi.
- Rinominare colonne senza compatibilita applicativa.

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
- [[Programmazione/Postgres/Pagine/Versionamento database|Versionamento database]]
- [[Programmazione/Postgres/Pagine/Strategie zero-downtime|Strategie zero-downtime]]
- [[Programmazione/Postgres/Pagine/Indici Parziali e Coprenti|Indici Parziali e Coprenti]]



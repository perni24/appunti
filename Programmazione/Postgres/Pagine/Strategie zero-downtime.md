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
  - deploy
  - migrazioni
aliases: []
prerequisites: []
related: []
---

# Strategie zero-downtime

## Sintesi

Le **strategie zero-downtime** permettono di modificare schema e applicazione senza interrompere il servizio.

## Principio expand-contract

1. Aggiungi nuovo schema compatibile.
2. Rilascia codice che legge/scrive entrambi i formati.
3. Backfill dei dati.
4. Sposta il traffico sul nuovo formato.
5. Rimuovi il vecchio schema.

## Esempi

- Aggiungere colonna nullable, poi popolarla, poi renderla `NOT NULL`.
- Creare indici con `CONCURRENTLY`.
- Evitare lock lunghi durante orari di traffico.

## Errori comuni

- Rinominare o rimuovere colonne usate dal codice ancora in esecuzione.
- Eseguire DDL bloccante su tabelle grandi.
- Non monitorare lock durante la migrazione.

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
- [[Programmazione/Postgres/Pagine/Lock monitoring|Lock monitoring]]
- [[Programmazione/Postgres/Pagine/Versionamento database|Versionamento database]]



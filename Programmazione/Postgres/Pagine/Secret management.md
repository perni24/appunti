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
  - secrets
aliases: []
prerequisites: []
related: []
---

# Secret management

## Sintesi

Il **secret management** riguarda gestione, rotazione e protezione di password, connection string, certificati e token usati per accedere a PostgreSQL.

## Principi

- Non committare segreti.
- Usare secret manager o variabili d'ambiente controllate.
- Ruotare credenziali.
- Limitare privilegi dell'utente applicativo.
- Separare segreti per ambiente.

## Esempi di segreti

- Password database.
- URL di connessione.
- Certificati TLS.
- Chiavi per backup cifrati.

## Errori comuni

- Mettere credenziali in file `.env` versionati.
- Condividere lo stesso utente tra app, migrazioni e operatori.
- Non revocare credenziali vecchie.

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
- [[Programmazione/Postgres/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/Postgres/Pagine/Ruoli e privilegi avanzati|Ruoli e privilegi avanzati]]
- [[Programmazione/Postgres/Pagine/SSL e TLS|SSL/TLS]]


